import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// GET - Load user's wizard progress
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to get existing progress from wizard_progress table
        const { data: progress, error } = await supabaseAdmin
            .from('wizard_progress')
            .select('*')
            .eq('user_id', userId)
            .single();

        // If table doesn't exist, return empty state (localStorage will be used as fallback)
        if (error) {
            if (error.code === 'PGRST205' || error.code === '42P01') {
                return NextResponse.json({
                    exists: false,
                    useLocalStorage: true,
                    currentStep: 1,
                    completedSteps: [],
                    answers: {},
                    generatedContent: {},
                    isComplete: false
                });
            }
            // PGRST116 = no rows found
            if (error.code !== 'PGRST116') {
                console.error('Progress fetch error:', error);
            }
        }

        if (progress) {
            return NextResponse.json({
                exists: true,
                useLocalStorage: false,
                currentStep: progress.current_step,
                completedSteps: progress.completed_steps || [],
                answers: progress.answers || {},
                generatedContent: progress.generated_content || {},
                isComplete: progress.is_complete || false,
                updatedAt: progress.updated_at
            });
        }

        return NextResponse.json({
            exists: false,
            useLocalStorage: false,
            currentStep: 1,
            completedSteps: [],
            answers: {},
            generatedContent: {},
            isComplete: false
        });

    } catch (error) {
        console.error('Load progress error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Save user's wizard progress
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { currentStep, completedSteps, answers, generatedContent, isComplete } = await req.json();

        // Try to upsert progress
        const { data, error } = await supabaseAdmin
            .from('wizard_progress')
            .upsert({
                user_id: userId,
                current_step: currentStep,
                completed_steps: completedSteps,
                answers: answers,
                generated_content: generatedContent,
                is_complete: isComplete || false,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST205' || error.code === '42P01') {
                return NextResponse.json({
                    success: false,
                    useLocalStorage: true,
                    message: 'Table not found, use localStorage'
                });
            }
            throw error;
        }

        return NextResponse.json({
            success: true,
            useLocalStorage: false,
            savedAt: data?.updated_at || new Date().toISOString()
        });

    } catch (error) {
        console.error('Save progress error:', error);
        return NextResponse.json({ success: false, error: error.message });
    }
}

// PUT - Update a specific step (for "Changed my mind" feature)
export async function PUT(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ success: true, message: 'Use client-side update' });
    } catch (error) {
        console.error('Update step error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
