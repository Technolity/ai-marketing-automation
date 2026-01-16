import { NextResponse } from 'next/server';

/**
 * GET /api/oauth/authorize
 * 
 * Redirects the user to GHL's OAuth authorization page.
 * The user will be prompted to log into GHL and approve the requested scopes.
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        // Optional: pass user_type preference (Company or Location)
        const userType = searchParams.get('user_type') || 'Location';

        const clientId = process.env.GHL_CLIENT_ID;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`;

        if (!clientId) {
            return NextResponse.json(
                { error: 'GHL OAuth not configured. Missing GHL_CLIENT_ID.' },
                { status: 500 }
            );
        }

        // Scopes required for our use case
        const scopes = [
            'businesses.write',           // Create sub-accounts
            'businesses.readonly',        // Read business info
            'locations.write',            // Manage locations
            'locations.readonly',         // Read location data
            'locations/customValues.write', // Update custom values
            'locations/customValues.readonly', //Read custom values
            'snapshots.write',            // Import snapshots (if available)
            'oauth.write',                // Generate location tokens from agency token
        ].join(' ');

        // Build GHL authorization URL
        const authUrl = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', scopes);

        // Optional: Pass state for CSRF protection
        // TODO: Implement state verification in callback
        // const state = crypto.randomUUID();
        // authUrl.searchParams.set('state', state);

        return NextResponse.redirect(authUrl.toString());
    } catch (error) {
        console.error('[OAuth Authorize] Error:', error);
        return NextResponse.json(
            { error: 'Failed to initiate OAuth flow' },
            { status: 500 }
        );
    }
}
