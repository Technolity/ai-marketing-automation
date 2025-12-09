import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// In-memory cache for stats (expires after 2 minutes)
let statsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Helper to verify admin (optimized with faster query)
async function verifyAdmin(token) {
    if (!token) return null;

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return null;

        // Use maybeSingle() for better performance
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle();

        return profile?.is_admin ? user : null;
    } catch (error) {
        console.error('Admin verification error:', error);
        return null;
    }
}

/**
 * GET /api/admin/stats - Dashboard statistics (optimized with caching and DB aggregation)
 */
export async function GET(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const admin = await verifyAdmin(token);

        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check cache first
        const now = Date.now();
        if (statsCache && (now - cacheTimestamp) < CACHE_DURATION) {
            return NextResponse.json({
                ...statsCache,
                cached: true,
                cacheAge: Math.floor((now - cacheTimestamp) / 1000)
            });
        }

        // Calculate date boundaries
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Parallel queries for better performance
        const [
            userStats,
            userTierStats,
            weeklyUsers,
            monthlyUsers,
            totalSessions,
            weeklySessions,
            totalContent,
            weeklyContent,
            weeklyActivity
        ] = await Promise.all([
            // Total users count
            supabase.from('user_profiles').select('id', { count: 'exact', head: true }),

            // Users by tier
            supabase.from('user_profiles').select('subscription_tier'),

            // Users created this week
            supabase.from('user_profiles')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', weekAgo),

            // Users created this month
            supabase.from('user_profiles')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', monthAgo),

            // Total sessions
            supabase.from('saved_sessions').select('id', { count: 'exact', head: true }),

            // Sessions this week
            supabase.from('saved_sessions')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', weekAgo),

            // Total content
            supabase.from('slide_results').select('id', { count: 'exact', head: true }),

            // Content this week
            supabase.from('slide_results')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', weekAgo),

            // Weekly activity data (last 7 days only)
            generateWeeklyActivityOptimized(weekAgo)
        ]);

        // Count tiers
        const tierCounts = { basic: 0, premium: 0, enterprise: 0 };
        userTierStats.data?.forEach(user => {
            const tier = user.subscription_tier || 'basic';
            if (tierCounts.hasOwnProperty(tier)) {
                tierCounts[tier]++;
            }
        });

        const stats = {
            users: {
                total: userStats.count || 0,
                thisWeek: weeklyUsers.count || 0,
                thisMonth: monthlyUsers.count || 0,
                byTier: tierCounts
            },
            businesses: {
                total: totalSessions.count || 0,
                thisWeek: weeklySessions.count || 0,
                completed: 0 // Can be calculated separately if needed
            },
            content: {
                total: totalContent.count || 0,
                thisWeek: weeklyContent.count || 0,
            },
            weeklyActivity: weeklyActivity
        };

        // Cache the result
        statsCache = stats;
        cacheTimestamp = now;

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Admin stats API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Generate weekly activity data using database queries (optimized)
async function generateWeeklyActivityOptimized(weekAgo) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activity = [];
    const now = new Date();

    // Query for recent users and content (last 7 days only)
    const [recentUsers, recentContent] = await Promise.all([
        supabase
            .from('user_profiles')
            .select('created_at')
            .gte('created_at', weekAgo)
            .order('created_at', { ascending: true }),
        supabase
            .from('slide_results')
            .select('created_at')
            .gte('created_at', weekAgo)
            .order('created_at', { ascending: true })
    ]);

    // Group by day
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayUsers = recentUsers.data?.filter(u => {
            const created = new Date(u.created_at);
            return created >= dayStart && created <= dayEnd;
        }).length || 0;

        const dayContent = recentContent.data?.filter(r => {
            const created = new Date(r.created_at);
            return created >= dayStart && created <= dayEnd;
        }).length || 0;

        activity.push({
            name: days[dayStart.getDay()],
            users: dayUsers,
            content: dayContent
        });
    }

    return activity;
}
