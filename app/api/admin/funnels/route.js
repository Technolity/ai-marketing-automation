import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * GET /api/admin/funnels - List funnels with filters
 */
export async function GET(req) {
    const startTime = Date.now();

    try {
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Unauthorized access to admin funnels API');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin attempted to access funnels API', { adminUserId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId'); // Filter by user
        const status = searchParams.get('status'); // Filter by vault_generation_status
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Fetching funnels list', {
            adminUserId,
            userId,
            status,
            page,
            limit
        });

        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
            .from('user_funnels')
            .select(`
                *,
                user_profiles!inner(
                    id,
                    full_name,
                    email,
                    subscription_tier
                )
            `, { count: 'exact' });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (status) {
            query = query.eq('vault_generation_status', status);
        }

        query = query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        const { data: funnels, error, count } = await query;

        if (error) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to fetch funnels', { error: error.message });
            throw error;
        }

        // Get vault content for each funnel
        const funnelsWithVault = await Promise.all(
            (funnels || []).map(async (funnel) => {
                const { data: vaultContent } = await supabase
                    .from('vault_content')
                    .select('id, phase_name, status, created_at')
                    .eq('funnel_id', funnel.id);

                return {
                    ...funnel,
                    vault_items_count: vaultContent?.length || 0,
                    vault_items: vaultContent || []
                };
            })
        );

        // Calculate status stats
        const statusStats = funnelsWithVault.reduce((acc, funnel) => {
            const status = funnel.vault_generation_status || 'not_started';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const duration = Date.now() - startTime;
        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Funnels fetched successfully', {
            count: funnelsWithVault.length,
            total: count,
            duration: `${duration}ms`
        });

        return NextResponse.json({
            funnels: funnelsWithVault,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            },
            statusStats
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Admin funnels GET failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/funnels - Update/manage funnels
 */
export async function PUT(req) {
    const startTime = Date.now();

    try {
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Unauthorized PUT to admin funnels API');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin PUT attempt to funnels API', { adminUserId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { funnelId, action } = body;

        if (!funnelId) {
            return NextResponse.json({ error: 'Funnel ID required' }, { status: 400 });
        }

        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, `Admin funnel action: ${action}`, {
            adminUserId,
            funnelId,
            action
        });

        // Get funnel details for logging
        const { data: funnel } = await supabase
            .from('user_funnels')
            .select('user_id, business_name, vault_generation_status')
            .eq('id', funnelId)
            .single();

        if (!funnel) {
            adminLogger.warn(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Funnel not found', { funnelId });
            return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
        }

        // Action: Reset vault generation status
        if (action === 'reset_status') {
            const { data, error } = await supabase
                .from('user_funnels')
                .update({
                    vault_generation_status: 'not_started',
                    updated_at: new Date().toISOString()
                })
                .eq('id', funnelId)
                .select()
                .single();

            if (error) {
                adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to reset funnel status', {
                    error: error.message,
                    funnelId
                });
                throw error;
            }

            adminLogger.logFunnelOperation('reset_status', funnelId, funnel.user_id, {
                oldStatus: funnel.vault_generation_status,
                newStatus: 'not_started'
            });

            return NextResponse.json({ success: true, funnel: data });
        }

        // Action: Delete funnel (hard delete with cascading)
        if (action === 'delete') {
            // Delete vault content first
            const { error: vaultError } = await supabase
                .from('vault_content')
                .delete()
                .eq('funnel_id', funnelId);

            if (vaultError) {
                adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to delete vault content', {
                    error: vaultError.message,
                    funnelId
                });
                throw vaultError;
            }

            // Delete funnel
            const { error: funnelError } = await supabase
                .from('user_funnels')
                .delete()
                .eq('id', funnelId);

            if (funnelError) {
                adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to delete funnel', {
                    error: funnelError.message,
                    funnelId
                });
                throw funnelError;
            }

            adminLogger.logFunnelOperation('delete', funnelId, funnel.user_id, {
                businessName: funnel.business_name,
                status: funnel.vault_generation_status
            });

            return NextResponse.json({ success: true, message: 'Funnel deleted' });
        }

        // Action: Force complete vault generation (mark as completed)
        if (action === 'force_complete') {
            const { data, error } = await supabase
                .from('user_funnels')
                .update({
                    vault_generation_status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', funnelId)
                .select()
                .single();

            if (error) {
                adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to force complete funnel', {
                    error: error.message,
                    funnelId
                });
                throw error;
            }

            adminLogger.logFunnelOperation('force_complete', funnelId, funnel.user_id, {
                oldStatus: funnel.vault_generation_status,
                newStatus: 'completed'
            });

            return NextResponse.json({ success: true, funnel: data });
        }

        // Action: Retry failed generation
        if (action === 'retry_generation') {
            const { data, error } = await supabase
                .from('user_funnels')
                .update({
                    vault_generation_status: 'pending',
                    updated_at: new Date().toISOString()
                })
                .eq('id', funnelId)
                .select()
                .single();

            if (error) {
                adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to retry funnel generation', {
                    error: error.message,
                    funnelId
                });
                throw error;
            }

            adminLogger.logFunnelOperation('retry_generation', funnelId, funnel.user_id, {
                oldStatus: funnel.vault_generation_status,
                newStatus: 'pending'
            });

            return NextResponse.json({ success: true, funnel: data });
        }

        adminLogger.warn(LOG_CATEGORIES.FUNNEL_MANAGEMENT, 'Invalid action in PUT request', {
            adminUserId,
            action
        });
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Admin funnels PUT failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET /api/admin/funnels/[id] - Get detailed funnel info with vault content
 */
export async function GET_DETAILS(funnelId) {
    try {
        const { userId: adminUserId } = auth();
        if (!adminUserId) return null;

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) return null;

        // Get funnel with all vault content
        const { data: funnel, error } = await supabase
            .from('user_funnels')
            .select(`
                *,
                user_profiles!inner(
                    id,
                    full_name,
                    email,
                    subscription_tier
                ),
                vault_content(*)
            `)
            .eq('id', funnelId)
            .single();

        if (error) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to fetch funnel details', {
                error: error.message,
                funnelId
            });
            return null;
        }

        return funnel;
    } catch (error) {
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Failed to get funnel details', {
            error: error.message,
            funnelId
        });
        return null;
    }
}
