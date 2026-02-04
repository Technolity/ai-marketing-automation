import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * POST /api/admin/ghl-accounts/refresh-token
 * Manually trigger OAuth token refresh for a company account
 * Useful when tokens are expired or stuck
 */
export async function POST(req) {
    const startTime = Date.now();

    try {
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Unauthorized refresh token request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin refresh token attempt', { adminUserId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, companyId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        adminLogger.info(LOG_CATEGORIES.GHL_INTEGRATION, 'Initiating manual token refresh', {
            adminUserId,
            userId,
            companyId
        });

        // Fetch GHL credentials for the user
        const { data: credentials, error: fetchError } = await supabase
            .from('ghl_credentials')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (fetchError) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to fetch GHL credentials', {
                error: fetchError.message,
                userId
            });
            throw fetchError;
        }

        if (!credentials) {
            adminLogger.warn(LOG_CATEGORIES.GHL_INTEGRATION, 'No GHL credentials found for user', { userId });
            return NextResponse.json({ error: 'No GHL credentials found for this user' }, { status: 404 });
        }

        // Check if refresh token exists
        if (!credentials.refresh_token) {
            adminLogger.warn(LOG_CATEGORIES.GHL_INTEGRATION, 'No refresh token available', {
                userId,
                companyId: credentials.company_id
            });
            return NextResponse.json({
                error: 'No refresh token available. User needs to re-authorize.',
                reauthorizeRequired: true
            }, { status: 400 });
        }

        // Check token expiration
        const tokenExpiresAt = credentials.token_expires_at ? new Date(credentials.token_expires_at) : null;
        const isExpired = tokenExpiresAt ? tokenExpiresAt < new Date() : false;

        adminLogger.debug(LOG_CATEGORIES.GHL_INTEGRATION, 'Token status', {
            userId,
            tokenExpiresAt: tokenExpiresAt?.toISOString(),
            isExpired,
            hasRefreshToken: !!credentials.refresh_token
        });

        // Prepare refresh token request
        const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID;
        const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

        if (!GHL_CLIENT_ID || !GHL_CLIENT_SECRET) {
            adminLogger.error(LOG_CATEGORIES.GHL_INTEGRATION, 'GHL OAuth credentials not configured');
            return NextResponse.json({ error: 'GHL OAuth not configured' }, { status: 500 });
        }

        // Call GHL OAuth refresh endpoint
        const refreshResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GHL_CLIENT_ID,
                client_secret: GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: credentials.refresh_token,
                ...(credentials.user_type === 'Company' && { user_type: 'Company' })
            })
        });

        if (!refreshResponse.ok) {
            const errorText = await refreshResponse.text();
            adminLogger.error(LOG_CATEGORIES.GHL_INTEGRATION, 'GHL token refresh failed', {
                userId,
                status: refreshResponse.status,
                error: errorText
            });

            // Check if it's an invalid grant error (refresh token expired/revoked)
            if (refreshResponse.status === 400 || refreshResponse.status === 401) {
                return NextResponse.json({
                    error: 'Refresh token is invalid or expired. User needs to re-authorize.',
                    reauthorizeRequired: true,
                    ghlError: errorText
                }, { status: 400 });
            }

            throw new Error(`GHL refresh failed: ${errorText}`);
        }

        const tokenData = await refreshResponse.json();

        // Calculate new expiration time
        const expiresIn = tokenData.expires_in || 86400; // Default 24 hours
        const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

        // Update credentials in database
        const { data: updatedCredentials, error: updateError } = await supabase
            .from('ghl_credentials')
            .update({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token || credentials.refresh_token, // GHL may not always return new refresh token
                token_expires_at: newExpiresAt.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (updateError) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to update refreshed credentials', {
                error: updateError.message,
                userId
            });
            throw updateError;
        }

        const duration = Date.now() - startTime;
        adminLogger.info(LOG_CATEGORIES.GHL_INTEGRATION, 'Token refreshed successfully', {
            adminUserId,
            userId,
            companyId: credentials.company_id,
            newExpiresAt: newExpiresAt.toISOString(),
            duration: `${duration}ms`
        });

        return NextResponse.json({
            success: true,
            message: 'Token refreshed successfully',
            expiresAt: newExpiresAt.toISOString(),
            wasExpired: isExpired
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Token refresh failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        return NextResponse.json({
            error: error.message || 'Failed to refresh token'
        }, { status: 500 });
    }
}
