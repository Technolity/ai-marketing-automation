import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * GET /api/admin/database/data
 * Fetch data from a specific table
 */
export async function GET(req) {
    const startTime = Date.now();

    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const table = searchParams.get('table');
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        if (!table) {
            return NextResponse.json({ error: 'Table name required' }, { status: 400 });
        }

        // Validate table name to prevent SQL injection
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
            adminLogger.warn(LOG_CATEGORIES.DATABASE, 'Invalid table name attempted', {
                adminUserId: userId,
                table
            });
            return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
        }

        adminLogger.info(LOG_CATEGORIES.DATABASE, 'Fetching table data', {
            adminUserId: userId,
            table,
            limit,
            offset
        });

        // Get column names first
        const { data: columnData, error: columnError } = await supabase
            .rpc('list_columns_for_table', {
                p_schema: 'public',
                p_table: table,
                p_mode: 'select'
            });

        if (columnError) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to fetch columns', {
                error: columnError.message,
                table
            });
            throw columnError;
        }

        const columns = (columnData || []).map(c => c.column_name);

        if (columns.length === 0) {
            return NextResponse.json({
                rows: [],
                columns: [],
                message: 'Table has no columns or does not exist'
            });
        }

        // Fetch table data
        const { data: rows, error: dataError, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false, nullsFirst: false })
            .limit(limit);

        if (dataError) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to fetch table data', {
                error: dataError.message,
                table
            });
            throw dataError;
        }

        const duration = Date.now() - startTime;
        adminLogger.info(LOG_CATEGORIES.DATABASE, 'Table data fetched successfully', {
            table,
            rowCount: rows?.length || 0,
            totalCount: count,
            duration: `${duration}ms`
        });

        return NextResponse.json({
            rows: rows || [],
            columns,
            total: count || 0,
            limit,
            offset
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Database data fetch failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
