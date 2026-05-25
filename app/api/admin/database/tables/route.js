import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * GET /api/admin/database/tables
 * List all tables in the public schema
 */
export async function GET(req) {
    const startTime = Date.now();

    try {
        const { userId } = auth();
        if (!userId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Unauthorized database access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin database access attempt', { userId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        adminLogger.info(LOG_CATEGORIES.DATABASE, 'Fetching database tables list', { adminUserId: userId });

        // Get all tables in public schema
        const { data: tables, error } = await supabase
            .rpc('list_tables_for_schema', { p_schema: 'public' });

        if (error) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to fetch tables', { error: error.message });
            throw error;
        }

        // Filter out internal/system tables
        const userTables = (tables || [])
            .map(t => t.table_name)
            .filter(name =>
                !name.startsWith('pg_') &&
                !name.startsWith('_') &&
                name !== 'schema_migrations'
            )
            .sort();

        const duration = Date.now() - startTime;
        adminLogger.info(LOG_CATEGORIES.DATABASE, 'Tables list fetched', {
            count: userTables.length,
            duration: `${duration}ms`
        });

        return NextResponse.json({ tables: userTables });

    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Database tables fetch failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
