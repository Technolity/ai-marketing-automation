import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Define tier features
const TIER_FEATURES = {
    basic: {
        name: 'Basic',
        aiGeneration: true,
        ragAccess: false,
        tedGuidance: false,
        maxGenerationsPerMonth: 10,
        maxBusinesses: 1,
        priority: 'standard'
    },
    premium: {
        name: 'Premium',
        aiGeneration: true,
        ragAccess: true,
        tedGuidance: false,
        maxGenerationsPerMonth: 100,
        maxBusinesses: 5,
        priority: 'high'
    },
    enterprise: {
        name: 'Enterprise',
        aiGeneration: true,
        ragAccess: true,
        tedGuidance: true,
        maxGenerationsPerMonth: -1, // unlimited
        maxBusinesses: -1, // unlimited
        priority: 'priority'
    }
};

/**
 * GET /api/user/tier - Get current user's tier and features
 */
export async function GET(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('subscription_tier, tier_expires_at, generation_count, last_generation_at')
            .eq('id', user.id)
            .single();

        if (profileError) {
            // Create default profile if doesn't exist
            const { data: newProfile } = await supabase
                .from('user_profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    subscription_tier: 'basic'
                })
                .select()
                .single();

            return NextResponse.json({
                tier: 'basic',
                features: TIER_FEATURES.basic,
                usage: {
                    generationsThisMonth: 0,
                    remainingGenerations: TIER_FEATURES.basic.maxGenerationsPerMonth
                }
            });
        }

        const tier = profile.subscription_tier || 'basic';
        const features = TIER_FEATURES[tier] || TIER_FEATURES.basic;

        // Check if tier has expired
        if (profile.tier_expires_at && new Date(profile.tier_expires_at) < new Date()) {
            // Tier expired, downgrade to basic
            await supabase
                .from('user_profiles')
                .update({ subscription_tier: 'basic', tier_expires_at: null })
                .eq('id', user.id);

            return NextResponse.json({
                tier: 'basic',
                features: TIER_FEATURES.basic,
                expired: true,
                usage: {
                    generationsThisMonth: profile.generation_count || 0,
                    remainingGenerations: Math.max(0, TIER_FEATURES.basic.maxGenerationsPerMonth - (profile.generation_count || 0))
                }
            });
        }

        // Calculate remaining generations
        const generationsUsed = profile.generation_count || 0;
        const maxGenerations = features.maxGenerationsPerMonth;
        const remainingGenerations = maxGenerations === -1 ? -1 : Math.max(0, maxGenerations - generationsUsed);

        return NextResponse.json({
            tier,
            features,
            expiresAt: profile.tier_expires_at,
            usage: {
                generationsThisMonth: generationsUsed,
                remainingGenerations,
                lastGeneration: profile.last_generation_at
            }
        });

    } catch (error) {
        console.error('User tier API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
