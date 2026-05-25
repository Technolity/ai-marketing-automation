import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * PUT /api/admin/database/update
 * Update a record in any table
 */
export async function PUT(req) {
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

        const body = await req.json();
        const { table, data, id } = body;

        if (!table || !data || !id) {
            return NextResponse.json({
                error: 'Table name, data, and id are required'
            }, { status: 400 });
        }

        // Validate table name
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
            adminLogger.warn(LOG_CATEGORIES.DATABASE, 'Invalid table name in update', {
                adminUserId: userId,
                table
            });
            return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
        }

        adminLogger.info(LOG_CATEGORIES.DATABASE, 'Updating table record', {
            adminUserId: userId,
            table,
            id
        });

        // Add updated_at if table has that column
        const updateData = {
            ...data,
            updated_at: new Date().toISOString()
        };

        // Perform update
        const { data: result, error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to update record', {
                error: error.message,
                table,
                id
            });
            throw error;
        }

        const duration = Date.now() - startTime;
        adminLogger.info(LOG_CATEGORIES.DATABASE, 'Record updated successfully', {
            table,
            id,
            duration: `${duration}ms`
        });

        // Log the admin action
        adminLogger.logUserAction(userId, 'database_update', id, {
            table,
            changes: Object.keys(data)
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Database update failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
