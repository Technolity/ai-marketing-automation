import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

// GET - Load user's wizard progress from user_funnels
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch active funnel for this user
        // We use is_active=true (and optionally is_deleted=false logic if needed, 
        // but idx_unique_active_funnel handles uniqueness)
        const { data: funnel, error } = await supabaseAdmin
            .from('user_funnels')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .eq('is_deleted', false)
            .single();

        if (error) {
            // No active funnel found - this is okay, standard for new users
            if (error.code === 'PGRST116') {
                return NextResponse.json({
                    exists: false,
                    useLocalStorage: false, // Don't force localStorage fallback, let client decide
                    currentStep: 1,
                    completedSteps: [],
                    answers: {},
                    generatedContent: {},
                    isComplete: false
                });
            }
            console.error('[API] Progress fetch error:', error);
            // Fallback to empty if DB error
            return NextResponse.json({ exists: false, error: 'Database error' });
        }

        if (funnel) {
            return NextResponse.json({
                exists: true,
                useLocalStorage: false,
                currentStep: funnel.current_step || 1,
                completedSteps: funnel.completed_steps || [],
                answers: funnel.wizard_answers || {},
                generatedContent: {}, // content is stored in vault_content now, not here
                isComplete: funnel.questionnaire_completed || false,
                updatedAt: funnel.updated_at
            });
        }

        return NextResponse.json({ exists: false });

    } catch (error) {
        console.error('[API] Load progress error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Save user's wizard progress to user_funnels
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { currentStep, completedSteps, answers, isComplete } = body;

        // Verify if user has an active funnel, if not create one?
        // Usually funnel is created on startup or by this call. 
        // Let's first try to find active funnel.
        let { data: existingFunnel } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .eq('is_deleted', false)
            .single();

        let funnelId = existingFunnel?.id;
        let error;

        if (funnelId) {
            // Update existing funnel
            const { error: updateError } = await supabaseAdmin
                .from('user_funnels')
                .update({
                    current_step: currentStep,
                    completed_steps: completedSteps,
                    wizard_answers: answers, // JSONB
                    questionnaire_completed: isComplete,
                    questionnaire_completed_at: isComplete ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', funnelId);
            error = updateError;
        } else {
            // Create new funnel if none exists
            // This happens if user goes straight to wizard without creating one explicitly?
            // Usually we want to ensure one exists.
            const { data: newFunnel, error: insertError } = await supabaseAdmin
                .from('user_funnels')
                .insert({
                    user_id: userId,
                    funnel_name: answers.businessName || 'My Marketing Engine',
                    current_step: currentStep,
                    completed_steps: completedSteps,
                    wizard_answers: answers,
                    questionnaire_completed: isComplete,
                    is_active: true,
                    is_deleted: false
                })
                .select()
                .single();

            error = insertError;
            funnelId = newFunnel?.id;
        }

        if (error) {
            console.error('[API] Save progress error (DB):', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            useLocalStorage: false,
            savedAt: new Date().toISOString(),
            funnelId: funnelId
        });

    } catch (error) {
        console.error('[API] Save progress error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT - Update a specific step
export async function PUT(req) {
    return NextResponse.json({ success: true, message: 'Use POST to sync full state' });
}
