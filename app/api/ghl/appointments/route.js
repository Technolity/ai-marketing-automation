import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { getLocationToken } from '@/lib/ghl/tokenHelper';

// Force dynamic rendering for auth-protected routes
export const dynamic = 'force-dynamic';

// Base API URL for GHL V2
const GHL_API_URL = 'https://services.leadconnectorhq.com';

// In-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/ghl/appointments
 * Fetches calendar/appointment data from GHL for the dashboard
 * Team members will see their owner's GHL appointments
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Resolve workspace (Team Member support)
        const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);

        if (workspaceError) {
            return NextResponse.json({ error: workspaceError }, { status: 403 });
        }

        console.log(`[GHL Appointments] Fetching appointments for target user ${targetUserId} (Auth: ${userId})`);

        // Check cache first (use targetUserId for cache key)
        const cacheKey = `ghl_appointments_${targetUserId}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('[GHL Appointments] Serving from cache');
            return NextResponse.json(cached.data);
        }

        // Get location token using helper (handles token exchange and refresh)
        const tokenResult = await getLocationToken(targetUserId);

        if (!tokenResult.success) {
            console.log('[GHL Appointments] No valid token:', tokenResult.error);
            return NextResponse.json({
                connected: false,
                metrics: {
                    upcomingCount: 0,
                    todayCount: 0,
                    thisMonth: 0,
                    upcomingAppointments: [],
                    bookingTrend: []
                }
            });
        }

        const access_token = tokenResult.access_token;
        const location_id = tokenResult.location_id;

        // Fetch Appointments Metrics
        const metrics = await fetchAppointmentsMetrics(access_token, location_id);

        const response = { connected: true, metrics };

        // Store in cache
        cache.set(cacheKey, { data: response, timestamp: Date.now() });

        return NextResponse.json(response);

    } catch (error) {
        console.error('[GHL Appointments] Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch appointments',
            details: error.message
        }, { status: 500 });
    }
}

async function fetchAppointmentsMetrics(accessToken, locationId) {
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
    };

    try {
        // Calculate date ranges
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Fetch calendar events from GHL
        // Note: GHL API may use /calendars/events or /appointments - trying /calendars/events first
        // If this fails, we'll handle gracefully and return empty data
        let appointments = [];

        try {
            const eventsRes = await fetch(
                `${GHL_API_URL}/calendars/events?locationId=${locationId}&startTime=${thirtyDaysAgo.toISOString()}&endTime=${sevenDaysFromNow.toISOString()}`,
                { headers }
            );

            if (eventsRes.ok) {
                const eventsData = await eventsRes.json();
                appointments = eventsData.events || [];
            } else {
                console.warn('[GHL Appointments] Calendar API returned:', eventsRes.status);

                // Specific handling for scope/authorization errors
                if (eventsRes.status === 401) {
                    const errorText = await eventsRes.clone().text();
                    console.error('[GHL Appointments] SCOPE ERROR: Token not authorized for this scope');
                    console.error('[GHL Appointments] Required scope: calendars.readonly');
                    console.error('[GHL Appointments] Error response:', errorText);
                    console.error('[GHL Appointments] Troubleshooting steps:');
                    console.error('[GHL Appointments] 1. Delete all rows from ghl_tokens table in Supabase');
                    console.error('[GHL Appointments] 2. Visit /api/oauth/authorize?user_type=Company to re-authorize');
                    console.error('[GHL Appointments] 3. Ensure calendars.readonly scope is included in authorization');
                }

                // Try alternative endpoint if primary fails
                const altRes = await fetch(
                    `${GHL_API_URL}/appointments/?locationId=${locationId}`,
                    { headers }
                );
                if (altRes.ok) {
                    const altData = await altRes.json();
                    appointments = altData.appointments || [];
                } else if (altRes.status === 401) {
                    const altErrorText = await altRes.clone().text();
                    console.error('[GHL Appointments] Alternative endpoint also returned 401:', altErrorText);
                }
            }
        } catch (apiError) {
            console.warn('[GHL Appointments] API not available:', apiError.message);
            // Return empty data if appointments API not available
            return {
                upcomingCount: 0,
                todayCount: 0,
                thisMonth: 0,
                upcomingAppointments: [],
                bookingTrend: [],
                error: 'APPOINTMENTS_API_UNAVAILABLE'
            };
        }

        // --- AGGREGATIONS ---

        let upcomingCount = 0;
        let todayCount = 0;
        let thisMonth = 0;

        const upcomingAppointments = [];
        const trendMap = {};

        appointments.forEach(appt => {
            const startTime = new Date(appt.startTime || appt.appointmentStartTime);
            const status = appt.status || appt.appointmentStatus || 'unknown';

            // Skip cancelled appointments
            if (status.toLowerCase() === 'cancelled') return;

            // Count upcoming (next 7 days)
            if (startTime >= now && startTime <= sevenDaysFromNow) {
                upcomingCount++;

                // Add to upcoming list (limit to 10 most recent)
                if (upcomingAppointments.length < 10) {
                    upcomingAppointments.push({
                        id: appt.id,
                        title: appt.title || appt.calendarName || 'Appointment',
                        startTime: startTime.toISOString(),
                        contactName: appt.contactName || appt.contact?.name || 'Unknown',
                        status: status
                    });
                }
            }

            // Count today's appointments
            if (startTime >= todayStart && startTime < todayEnd) {
                todayCount++;
            }

            // Count this month
            if (startTime >= monthStart) {
                thisMonth++;
            }

            // Booking trend (last 30 days)
            if (startTime >= thirtyDaysAgo && startTime <= now) {
                const dateKey = startTime.toISOString().split('T')[0];
                trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
            }
        });

        // Sort upcoming appointments by start time
        upcomingAppointments.sort((a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        // --- FORMAT FOR FRONTEND ---

        // Booking trend (last 30 days)
        const bookingTrend = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split('T')[0];
            bookingTrend.push({
                date: dateKey,
                bookings: trendMap[dateKey] || 0
            });
        }

        return {
            upcomingCount,
            todayCount,
            thisMonth,
            upcomingAppointments,
            bookingTrend
        };

    } catch (error) {
        console.error('[GHL Appointments] Fetch error:', error);
        return {
            upcomingCount: 0,
            todayCount: 0,
            thisMonth: 0,
            upcomingAppointments: [],
            bookingTrend: [],
            error: 'API_ERROR'
        };
    }
}

