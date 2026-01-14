/**
 * GHL Debug Route - Check environment variables
 * GET /api/integrations/oauth/debug
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        hasClientId: !!process.env.GHL_CLIENT_ID,
        hasClientSecret: !!process.env.GHL_CLIENT_SECRET,
        hasAgencyId: !!process.env.GHL_AGENCY_ID,
        hasRedirectUri: !!process.env.GHL_REDIRECT_URI,
        // Show first 10 chars only (for security)
        clientIdPreview: process.env.GHL_CLIENT_ID?.substring(0, 10) + '...' || 'NOT SET',
        redirectUriPreview: process.env.GHL_REDIRECT_URI || 'NOT SET'
    });
}
