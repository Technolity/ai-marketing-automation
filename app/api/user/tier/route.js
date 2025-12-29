import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth, currentUser } from '@clerk/nextjs';

// Force dynamic rendering - this route uses auth headers
export const dynamic = 'force-dynamic';

// Service Role client to create profiles
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

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

export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get user profile from DB
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('subscription_tier, tier_expires_at, generation_count, last_generation_at')
            .eq('id', userId)
            .single();

        // 2. If profile missing, create it (Auto-Sync) - but NEVER overwrite is_admin
        if (profileError || !profile) {
            const user = await currentUser(); // Fetch details from Clerk
            if (user) {
                const email = user.emailAddresses[0]?.emailAddress || `${userId}@no-email.com`;
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                const avatarUrl = user.imageUrl;

                // First check if profile actually exists (might have been error for other reason)
                const { data: checkProfile } = await supabase
                    .from('user_profiles')
                    .select('id, is_admin, subscription_tier')
                    .eq('id', userId)
                    .maybeSingle();

                // Only insert if profile truly doesn't exist
                if (!checkProfile) {
                    await supabase.from('user_profiles').insert({
                        id: userId,
                        email: email,
                        full_name: fullName,
                        avatar_url: avatarUrl,
                        subscription_tier: 'basic',
                        is_admin: false
                    });

                    return NextResponse.json({
                        tier: 'basic',
                        features: TIER_FEATURES.basic,
                        usage: {
                            generationsThisMonth: 0,
                            remainingGenerations: TIER_FEATURES.basic.maxGenerationsPerMonth
                        }
                    });
                }

                // Profile exists - return actual data (preserving admin status)
                return NextResponse.json({
                    tier: checkProfile.subscription_tier || 'basic',
                    features: TIER_FEATURES[checkProfile.subscription_tier] || TIER_FEATURES.basic,
                    usage: {
                        generationsThisMonth: 0,
                        remainingGenerations: TIER_FEATURES[checkProfile.subscription_tier]?.maxGenerationsPerMonth || 10
                    }
                });
            }
        }

        // 3. Return existing profile data
        const tier = profile?.subscription_tier || 'basic';
        const features = TIER_FEATURES[tier] || TIER_FEATURES.basic;

        // Check expiration
        if (profile?.tier_expires_at && new Date(profile.tier_expires_at) < new Date()) {
            await supabase
                .from('user_profiles')
                .update({ subscription_tier: 'basic', tier_expires_at: null })
                .eq('id', userId);

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

        const generationsUsed = profile?.generation_count || 0;
        const maxGenerations = features.maxGenerationsPerMonth;
        const remainingGenerations = maxGenerations === -1 ? -1 : Math.max(0, maxGenerations - generationsUsed);

        return NextResponse.json({
            tier,
            features,
            expiresAt: profile?.tier_expires_at,
            usage: {
                generationsThisMonth: generationsUsed,
                remainingGenerations,
                lastGeneration: profile?.last_generation_at
            }
        });

    } catch (error) {
        console.error('User tier API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
