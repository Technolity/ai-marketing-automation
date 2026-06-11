import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * DELETE /api/admin/database/delete
 * Delete a record from any table
 */
export async function DELETE(req) {
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
        const { table, id } = body;

        if (!table || !id) {
            return NextResponse.json({
                error: 'Table name and id are required'
            }, { status: 400 });
        }

        // Validate table name
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
            adminLogger.warn(LOG_CATEGORIES.DATABASE, 'Invalid table name in delete', {
                adminUserId: userId,
                table
            });
            return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
        }

        // Protected tables that should not be deleted from
        const protectedTables = [
            'user_profiles',
            'admin_settings',
            'ghl_tokens',
            'ghl_agency_credentials',
            'ghl_subaccounts',
            'ghl_slot_custom_value_ids',
            'funnel_slot_assignments',
            'admin_logs',
            'ghl_custom_values_log'
        ];
        if (protectedTables.includes(table)) {
            adminLogger.warn(LOG_CATEGORIES.DATABASE, 'Attempted deletion from protected table', {
                adminUserId: userId,
                table,
                id
            });
            return NextResponse.json({
                error: `Cannot delete from protected table: ${table}. Use soft delete or update instead.`
            }, { status: 403 });
        }

        adminLogger.info(LOG_CATEGORIES.DATABASE, 'Deleting table record', {
            adminUserId: userId,
            table,
            id
        });

        // Perform delete
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to delete record', {
                error: error.message,
                table,
                id
            });
            throw error;
        }

        const duration = Date.now() - startTime;
        adminLogger.info(LOG_CATEGORIES.DATABASE, 'Record deleted successfully', {
            table,
            id,
            duration: `${duration}ms`
        });

        // Log the admin action
        adminLogger.logUserAction(userId, 'database_delete', id, { table });

        return NextResponse.json({ success: true, message: 'Record deleted' });

    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Database delete failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
