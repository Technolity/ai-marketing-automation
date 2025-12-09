import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Cache for admin verification (expires after 5 minutes)
const adminVerifyCache = new Map();
const VERIFY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to verify admin (optimized with caching)
async function verifyAdmin(token) {
    if (!token) return null;

    // Check cache first
    const cached = adminVerifyCache.get(token);
    if (cached && Date.now() - cached.timestamp < VERIFY_CACHE_DURATION) {
        return cached.user;
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return null;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle();

        const isAdmin = profile?.is_admin ? user : null;

        // Cache the result
        if (isAdmin) {
            adminVerifyCache.set(token, {
                user: isAdmin,
                timestamp: Date.now()
            });
        }

        return isAdmin;
    } catch (error) {
        console.error('Admin verification error:', error);
        return null;
    }
}

/**
 * GET /api/admin/knowledge-base - List knowledge base entries
 */
export async function GET(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const admin = await verifyAdmin(token);

        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const industry = searchParams.get('industry') || '';

        const offset = (page - 1) * limit;

        let query = supabase
            .from('knowledge_base')
            .select('*', { count: 'exact' });

        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }
        if (industry) {
            query = query.eq('industry', industry);
        }

        query = query
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            items: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        console.error('Admin knowledge-base GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/knowledge-base - Create new knowledge base entry
 */
export async function POST(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const admin = await verifyAdmin(token);

        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, industry, contentType, content, tags } = body;

        if (!title || !industry || !contentType || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('knowledge_base')
            .insert({
                title,
                industry,
                content_type: contentType,
                content,
                tags: tags || [],
                created_by: admin.id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ item: data }, { status: 201 });

    } catch (error) {
        console.error('Admin knowledge-base POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/knowledge-base - Update knowledge base entry
 */
export async function PUT(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const admin = await verifyAdmin(token);

        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, title, industry, contentType, content, tags, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const updates = {};
        if (title !== undefined) updates.title = title;
        if (industry !== undefined) updates.industry = industry;
        if (contentType !== undefined) updates.content_type = contentType;
        if (content !== undefined) updates.content = content;
        if (tags !== undefined) updates.tags = tags;
        if (isActive !== undefined) updates.is_active = isActive;

        const { data, error } = await supabase
            .from('knowledge_base')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ item: data });

    } catch (error) {
        console.error('Admin knowledge-base PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/knowledge-base - Delete knowledge base entry
 */
export async function DELETE(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const admin = await verifyAdmin(token);

        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('knowledge_base')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin knowledge-base DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
