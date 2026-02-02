import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';


export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

/**
 * GET /api/admin/users - List all users
 */
export async function GET(req) {
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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || 'all'; // 'admin', 'user'

        const offset = (page - 1) * limit;

        // Query user_profiles
        let query = supabase
            .from('user_profiles')
            .select('*', { count: 'exact' });

        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        if (role === 'admin') {
            query = query.eq('is_admin', true);
        } else if (role === 'user') {
            query = query.eq('is_admin', false);
        }

        query = query.range(offset, offset + limit - 1);

        const { data: users, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            users: users || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        console.error('Admin users API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/users - Update user (e.g., ban, upgrade tier)
 */
export async function PUT(req) {
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
        const { userId: targetUserId, action, tier } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
        }

        // Handle specific actions
        if (action === 'update_tier') {
            const { data, error } = await supabase
                .from('user_profiles')
                .update({ subscription_tier: tier })
                .eq('id', targetUserId)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, user: data });
        }

        // Update profile action - for admin editing user profiles
        if (action === 'update_profile') {
            const { profileData } = body;
            if (!profileData) {
                return NextResponse.json({ error: 'Profile data required' }, { status: 400 });
            }

            // Allowed fields for admin to update
            const allowedFields = [
                'first_name', 'last_name', 'full_name', 'email',
                'business_name', 'address', 'city', 'state',
                'postal_code', 'country', 'phone', 'timezone'
            ];

            // Filter only allowed fields
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
            return NextResponse.json({ success: true, user: data });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Admin users PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

