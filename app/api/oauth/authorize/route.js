import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/oauth/authorize
 * 
 * Redirects the user to GHL's OAuth authorization page.
 * The user will be prompted to log into GHL and approve the requested scopes.
 */
export async function GET(req) {
    try {
        // Check if user is authenticated
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                error: 'Please log in first',
                message: 'You must be logged into your account before connecting to GoHighLevel',
                redirectTo: '/auth/login'
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);

        // Optional: pass user_type preference (Company or Location)
        const userType = searchParams.get('user_type') || 'Location';

        const clientId = process.env.GHL_CLIENT_ID;
        const redirectUri = process.env.GHL_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            return NextResponse.json({
                error: 'GHL OAuth not configured. Missing GHL_CLIENT_ID or GHL_REDIRECT_URI.'
            }, { status: 500 });
        }

        // Scopes required for our use case (including users.write for user creation)
        const scopes = [
            'businesses.write',           // Create sub-accounts
            'businesses.readonly',        // Read business info
            'locations.write',            // Manage locations
            'locations.readonly',         // Read location data
            'locations/customValues.write', // Update custom values
            'locations/customValues.readonly', //Read custom values
            'snapshots.write',            // Import snapshots (if available)
            'oauth.write',                // Generate location tokens from agency token
            'users.write',                // Create GHL users (REQUIRED for Builder Login)
            'users.readonly',             // Read GHL user data
        ].join(' ');

        // Create state parameter with user ID (Base64 encoded for safety)
        const state = Buffer.from(JSON.stringify({
            userId,
            timestamp: Date.now()
        })).toString('base64');

        // Build GHL authorization URL
        const authUrl = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', scopes);
        authUrl.searchParams.set('state', state);

        console.log('[OAuth Authorize] Redirecting user:', userId);

        return NextResponse.redirect(authUrl.toString());
    } catch (error) {
        console.error('[OAuth Authorize] Error:', error);
        return NextResponse.json({
            error: 'Failed to initiate OAuth flow',
            message: error.message
        }, { status: 500 });
    }
}
