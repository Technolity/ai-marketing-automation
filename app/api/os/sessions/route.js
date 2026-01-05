import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';


export const dynamic = 'force-dynamic';

/**
 * Sessions API - DEPRECATED
 * 
 * The old saved_sessions table has been removed in the new schema.
 * Sessions are now tied to user_funnels.
 * 
 * This API returns empty arrays to prevent frontend errors
 * while maintaining backward compatibility.
 */

// GET - List all saved sessions (returns empty - deprecated)
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return empty sessions - this feature is deprecated
        console.log('[Sessions API] GET - Returning empty (deprecated)');
        return NextResponse.json({ sessions: [] });

    } catch (error) {
        console.error('[Sessions API GET] Error:', error);
        return NextResponse.json({ sessions: [] });
    }
}

// POST - Save session (no-op - deprecated)
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return success but don't save - deprecated
        console.log('[Sessions API] POST - No-op (deprecated)');
        return NextResponse.json({
            success: true,
            message: 'Sessions are now managed through funnels',
            session: null
        });

    } catch (error) {
        console.error('[Sessions API POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH - Update session (no-op - deprecated)
export async function PATCH(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Sessions API] PATCH - No-op (deprecated)');
        return NextResponse.json({
            success: true,
            message: 'Sessions are now managed through funnels'
        });

    } catch (error) {
        console.error('[Sessions API PATCH] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete session (no-op - deprecated)
export async function DELETE(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Sessions API] DELETE - No-op (deprecated)');
        return NextResponse.json({
            success: true,
            message: 'Session deleted'
        });

    } catch (error) {
        console.error('[Sessions API DELETE] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

