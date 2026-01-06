import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// Force dynamic rendering for auth-protected routes
export const dynamic = 'force-dynamic';

// Base API URL for GHL V2
const GHL_API_URL = 'https://services.leadconnectorhq.com';

// In-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/ghl/contacts
 * Fetches contact data from GHL for the dashboard
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check cache first
        const cacheKey = `ghl_contacts_${userId}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('[GHL Contacts] Serving from cache');
            return NextResponse.json(cached.data);
        }

        // Get GHL Credentials
        const { data: credentials, error } = await supabaseAdmin
            .from('ghl_credentials')
            .select('access_token, location_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (error || !credentials) {
            return NextResponse.json({
                connected: false,
                metrics: {
                    totalContacts: 0,
                    newThisWeek: 0,
                    newThisMonth: 0,
                    sourceBreakdown: [],
                    growthTrend: []
                }
            });
        }

        const { access_token, location_id } = credentials;

        // Fetch Contacts Metrics
        const metrics = await fetchContactsMetrics(access_token, location_id);

        const response = { connected: true, metrics };

        // Store in cache
        cache.set(cacheKey, { data: response, timestamp: Date.now() });

        return NextResponse.json(response);

    } catch (error) {
        console.error('[GHL Contacts] Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch contacts',
            details: error.message
        }, { status: 500 });
    }
}

async function fetchContactsMetrics(accessToken, locationId) {
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
    };

    try {
        // Fetch contacts from GHL
        // Note: Using limit and pagination for performance
        console.log('[GHL Contacts] Fetching contacts for location:', locationId);

        // GHL max limit is 100 per request
        const contactsRes = await fetch(
            `${GHL_API_URL}/contacts/?locationId=${locationId}&limit=100`,
            { headers }
        );

        console.log('[GHL Contacts] Response status:', contactsRes.status);

        if (!contactsRes.ok) {
            console.error('[GHL Contacts] API error:', contactsRes.status, contactsRes.statusText);
            // Clone response to read body twice
            const errorText = await contactsRes.clone().text();
            console.error('[GHL Contacts] Error response:', errorText);
            throw new Error(`GHL API returned ${contactsRes.status}`);
        }

        const contactsData = await contactsRes.json();
        console.log('[GHL Contacts] Data structure:', {
            hasContacts: !!contactsData.contacts,
            count: contactsData.contacts?.length || 0,
            total: contactsData.total || 'N/A',
            keys: Object.keys(contactsData)
        });

        const contacts = contactsData.contacts || [];

        // --- AGGREGATIONS ---

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        let totalContacts = contacts.length;
        let newThisWeek = 0;
        let newThisMonth = 0;

        // Source breakdown map
        const sourceMap = {};

        // Growth trend map (daily counts for last 30 days)
        const trendMap = {};

        contacts.forEach(contact => {
            const dateAdded = new Date(contact.dateAdded || contact.createdAt);

            // Count new contacts
            if (dateAdded >= oneWeekAgo) newThisWeek++;
            if (dateAdded >= oneMonthAgo) newThisMonth++;

            // Source breakdown
            const source = contact.source || 'Direct Traffic';
            sourceMap[source] = (sourceMap[source] || 0) + 1;

            // Growth trend (daily)
            if (dateAdded >= thirtyDaysAgo) {
                const dateKey = dateAdded.toISOString().split('T')[0]; // YYYY-MM-DD
                trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
            }
        });

        // --- FORMAT FOR FRONTEND ---

        // Source breakdown (sorted by count, top 10)
        const sourceBreakdown = Object.entries(sourceMap)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Growth trend (last 30 days, sorted by date)
        const growthTrend = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split('T')[0];
            growthTrend.push({
                date: dateKey,
                count: trendMap[dateKey] || 0
            });
        }

        return {
            totalContacts,
            newThisWeek,
            newThisMonth,
            sourceBreakdown,
            growthTrend
        };

    } catch (error) {
        console.error('[GHL Contacts] Fetch error:', error);
        return {
            totalContacts: 0,
            newThisWeek: 0,
            newThisMonth: 0,
            sourceBreakdown: [],
            growthTrend: [],
            error: 'API_ERROR'
        };
    }
}

