import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

const TIER_SEAT_LIMITS = {
    starter: 1,
    growth: 3,
    scale: 10
};

/**
 * GET /api/admin/users - List all users with enhanced logging
 */
export async function GET(req) {
    const startTime = Date.now();

    try {
        const { userId } = auth();
        if (!userId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Unauthorized access attempt to admin users API');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin user attempted to access admin users API', { userId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || 'all';

        adminLogger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'Fetching users list', {
            adminUserId: userId,
            page,
            limit,
            search,
            role
        });

        const offset = (page - 1) * limit;

        // Query user_profiles with funnel counts
        let query = supabase
            .from('user_profiles')
            .select('*, user_funnels!left(id)', { count: 'exact' });

        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        if (role === 'admin') {
            query = query.eq('is_admin', true);
        } else if (role === 'user') {
            query = query.eq('is_admin', false);
        }

        query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

        const { data: users, error, count } = await query;

        if (error) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to fetch users', { error: error.message });
            throw error;
        }

        // Process users to add funnel count
        const processedUsers = users?.map(user => ({
            ...user,
            current_funnel_count: user.user_funnels?.length || 0,
            user_funnels: undefined // Remove the join data
        })) || [];

        // Calculate tier stats
        const tierStats = processedUsers.reduce((acc, user) => {
            const tier = user.subscription_tier || 'starter';
            acc[tier] = (acc[tier] || 0) + 1;
            return acc;
        }, { starter: 0, growth: 0, scale: 0 });

        const duration = Date.now() - startTime;
        adminLogger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'Users list fetched successfully', {
            count: processedUsers.length,
            total: count,
            duration: `${duration}ms`
        });

        return NextResponse.json({
            users: processedUsers,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            },
            tierStats
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Admin users GET failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/users - Update user with enhanced field control and logging
 */
export async function PUT(req) {
    const startTime = Date.now();

    try {
        const { userId } = auth();
        if (!userId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Unauthorized PUT request to admin users API');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin PUT attempt', { userId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { userId: targetUserId, action, tier, field, value } = body;

        if (!targetUserId) {
            adminLogger.warn(LOG_CATEGORIES.USER_MANAGEMENT, 'PUT request missing target user ID', { adminUserId: userId });
            return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
        }

        adminLogger.info(LOG_CATEGORIES.USER_MANAGEMENT, `Admin action: ${action}`, {
            adminUserId: userId,
            targetUserId,
            action,
            field,
            value: typeof value === 'string' && value.length > 50 ? `${value.substring(0, 50)}...` : value
        });

        // NEW: Dynamic field update action
        if (action === 'update_field') {
            if (!field) {
                return NextResponse.json({ error: 'Field name required' }, { status: 400 });
            }

            // Define allowed fields for inline editing
            const allowedFields = {
                // Subscription & limits
                'subscription_tier': { type: 'string', validate: (val) => ['starter', 'growth', 'scale'].includes(val) },
                'max_funnels': { type: 'number', validate: (val) => val >= 0 && val <= 1000 },

                // User info
                'full_name': { type: 'string', validate: (val) => val.length <= 255 },
                'first_name': { type: 'string', validate: (val) => val.length <= 100 },
                'last_name': { type: 'string', validate: (val) => val.length <= 100 },
                'business_name': { type: 'string', validate: (val) => val.length <= 255 },

                // Contact
                'email': { type: 'string', validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) },
                'phone': { type: 'string', validate: (val) => val.length <= 20 },

                // Location
                'address': { type: 'string', validate: (val) => val.length <= 500 },
                'city': { type: 'string', validate: (val) => val.length <= 100 },
                'state': { type: 'string', validate: (val) => val.length <= 100 },
                'postal_code': { type: 'string', validate: (val) => val.length <= 20 },
                'country': { type: 'string', validate: (val) => val.length <= 100 },
                'timezone': { type: 'string', validate: (val) => val.length <= 100 },

                // Admin controls
                'is_admin': { type: 'boolean', validate: (val) => typeof val === 'boolean' }
            };

            if (!allowedFields[field]) {
                adminLogger.warn(LOG_CATEGORIES.USER_MANAGEMENT, 'Attempted to update disallowed field', {
                    adminUserId: userId,
                    targetUserId,
                    field
                });
                return NextResponse.json({ error: `Field '${field}' is not allowed to be updated` }, { status: 400 });
            }

            const fieldConfig = allowedFields[field];

            // Type validation
            let processedValue = value;
            if (fieldConfig.type === 'number') {
                processedValue = Number(value);
                if (isNaN(processedValue)) {
                    return NextResponse.json({ error: `Field '${field}' must be a number` }, { status: 400 });
                }
            } else if (fieldConfig.type === 'boolean') {
                processedValue = Boolean(value);
            }

            // Custom validation
            if (fieldConfig.validate && !fieldConfig.validate(processedValue)) {
                adminLogger.warn(LOG_CATEGORIES.USER_MANAGEMENT, 'Field validation failed', {
                    adminUserId: userId,
                    targetUserId,
                    field,
                    value: processedValue
                });
                return NextResponse.json({ error: `Invalid value for field '${field}'` }, { status: 400 });
            }

            // Additional validation: max_funnels should be >= current_funnel_count
            if (field === 'max_funnels') {
                const { data: currentProfile } = await supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('id', targetUserId)
                    .single();

                if (!currentProfile) {
                    return NextResponse.json({ error: 'User not found' }, { status: 404 });
                }

                // Count current funnels
                const { count: funnelCount } = await supabase
                    .from('user_funnels')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', targetUserId);

                if (processedValue < (funnelCount || 0)) {
                    adminLogger.warn(LOG_CATEGORIES.USER_MANAGEMENT, 'max_funnels less than current count', {
                        adminUserId: userId,
                        targetUserId,
                        newMaxFunnels: processedValue,
                        currentFunnelCount: funnelCount
                    });
                    return NextResponse.json({
                        error: `Cannot set max_funnels to ${processedValue}. User currently has ${funnelCount} funnels.`,
                        currentCount: funnelCount
                    }, { status: 400 });
                }
            }

            // Perform update
            const updateData = {
                [field]: processedValue,
                updated_at: new Date().toISOString()
            };

            if (field === 'subscription_tier') {
                updateData.max_seats = TIER_SEAT_LIMITS[processedValue] ?? 1;
            }

            adminLogger.logDatabaseOperation('UPDATE', 'user_profiles', {
                targetUserId,
                field,
                newValue: processedValue
            });

            const { data, error } = await supabase
                .from('user_profiles')
                .update(updateData)
                .eq('id', targetUserId)
                .select()
                .single();

            if (error) {
                adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to update user field', {
                    error: error.message,
                    targetUserId,
                    field
                });
                throw error;
            }

            adminLogger.logUserAction(userId, `update_field:${field}`, targetUserId, {
                field,
                oldValue: 'N/A',
                newValue: processedValue
            });

            const duration = Date.now() - startTime;
            adminLogger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'Field updated successfully', {
                adminUserId: userId,
                targetUserId,
                field,
                duration: `${duration}ms`
            });

            return NextResponse.json({ success: true, user: data });
        }

        // Legacy: Update tier action
        if (action === 'update_tier') {
            const { data, error } = await supabase
                .from('user_profiles')
                .update({
                    subscription_tier: tier,
                    max_seats: TIER_SEAT_LIMITS[tier] ?? 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', targetUserId)
                .select()
                .single();

            if (error) throw error;

            adminLogger.logUserAction(userId, 'update_tier', targetUserId, { tier });
            return NextResponse.json({ success: true, user: data });
        }

        // Legacy: Update profile action
        if (action === 'update_profile') {
            const { profileData } = body;
            if (!profileData) {
                return NextResponse.json({ error: 'Profile data required' }, { status: 400 });
            }

            const allowedFields = [
                'first_name', 'last_name', 'full_name', 'email',
                'business_name', 'address', 'city', 'state',
                'postal_code', 'country', 'phone', 'timezone'
            ];

            const updateData = {};
            for (const field of allowedFields) {
                if (profileData[field] !== undefined) {
                    updateData[field] = profileData[field];
                }
            }

            if (Object.keys(updateData).length === 0) {
                return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
            }

            updateData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('user_profiles')
                .update(updateData)
                .eq('id', targetUserId)
                .select()
                .single();

            if (error) throw error;

            adminLogger.logUserAction(userId, 'update_profile', targetUserId, updateData);
            return NextResponse.json({ success: true, user: data });
        }

        adminLogger.warn(LOG_CATEGORIES.USER_MANAGEMENT, 'Invalid action in PUT request', {
            adminUserId: userId,
            action
        });
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        const duration = Date.now() - startTime;
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Admin users PUT failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

