import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// GET - List all saved sessions for the user (excluding soft-deleted ones)
export async function GET(req) {
    try {
        console.log('[Sessions API GET] Request received');
        const { userId } = auth();
        console.log('[Sessions API GET] User ID:', userId);

        if (!userId) {
            console.log('[Sessions API GET] No user ID, returning 401');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Sessions API GET] Fetching sessions from database...');
        // Fetch ALL session data, excluding soft-deleted sessions
        const { data: sessions, error } = await supabaseAdmin
            .from('saved_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[Sessions API GET] Database error:', error);
            // If table doesn't exist or column doesn't exist, try without filter
            if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('is_deleted')) {
                console.log('[Sessions API GET] Table/column not found, trying fallback...');
                // Fallback: fetch without is_deleted filter
                const { data: fallbackSessions, error: fallbackError } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('updated_at', { ascending: false });

                if (fallbackError) {
                    console.error('[Sessions API GET] Fallback error:', fallbackError);
                    return NextResponse.json({ sessions: [] });
                }

                // Filter out deleted sessions client-side
                const activeSessions = (fallbackSessions || []).filter(s => !s.is_deleted);
                console.log('[Sessions API GET] Fallback success, found', activeSessions.length, 'sessions');
                return NextResponse.json({ sessions: activeSessions });
            }
            throw error;
        }

        console.log('[Sessions API GET] Success, found', sessions?.length || 0, 'sessions');
        return NextResponse.json({ sessions: sessions || [] });

    } catch (error) {
        console.error('[Sessions API GET] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Save current progress as a new named session
export async function POST(req) {
    try {
        console.log('[Sessions API POST] Request received');
        const { userId } = auth();
        console.log('[Sessions API POST] User ID:', userId);

        if (!userId) {
            console.log('[Sessions API POST] No user ID, returning 401');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionName, currentStep, completedSteps, answers, generatedContent, isComplete } = await req.json();
        console.log('[Sessions API POST] Session name:', sessionName);
        console.log('[Sessions API POST] Completed steps:', completedSteps?.length || 0);
        console.log('[Sessions API POST] Has answers:', !!answers, 'keys:', Object.keys(answers || {}).length);
        console.log('[Sessions API POST] Has generated content:', !!generatedContent, 'keys:', Object.keys(generatedContent || {}).length);

        if (!sessionName) {
            console.log('[Sessions API POST] No session name provided');
            return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
        }

        // Insert new session with all data
        console.log('[Sessions API POST] Inserting session to database...');
        const { data, error } = await supabaseAdmin
            .from('saved_sessions')
            .insert({
                user_id: userId,
                session_name: sessionName,
                current_step: currentStep || 1,
                completed_steps: completedSteps || [],
                answers: answers || {},
                generated_content: generatedContent || {},
                results_data: generatedContent || {},
                onboarding_data: answers || {},
                is_complete: isComplete || (completedSteps?.length >= 20),
                status: (completedSteps?.length >= 20) ? 'completed' : 'in_progress',
                is_deleted: false,  // Not deleted
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('[Sessions API POST] Database insert error:', error);
            throw error;
        }

        console.log('[Sessions API POST] Session saved successfully, ID:', data.id);
        return NextResponse.json({ success: true, session: data });

    } catch (error) {
        console.error('[Sessions API POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH - Update an existing session's content or status
export async function PATCH(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, sessionName, currentStep, completedSteps, answers, generatedContent, isComplete, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // Prepare update object
        const updateData = {
            updated_at: new Date().toISOString()
        };

        if (sessionName) updateData.session_name = sessionName;
        if (currentStep !== undefined) updateData.current_step = currentStep;
        if (completedSteps) updateData.completed_steps = completedSteps;
        if (answers) {
            updateData.answers = answers;
            updateData.onboarding_data = answers;
        }
        if (generatedContent) {
            updateData.generated_content = generatedContent;
            updateData.results_data = generatedContent;
        }
        if (isComplete !== undefined) updateData.is_complete = isComplete;
        if (status) updateData.status = status;

        const { data, error } = await supabaseAdmin
            .from('saved_sessions')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('[Sessions API PATCH] Error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, session: data });

    } catch (error) {
        console.error('[Sessions API PATCH] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Soft delete a saved session (keeps data for admin, hides from user)
export async function DELETE(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('id');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // SOFT DELETE: Mark as deleted
        const { error } = await supabaseAdmin
            .from('saved_sessions')
            .update({
                is_deleted: true,
                status: 'deleted',
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .eq('user_id', userId);

        if (error) {
            // Fallback: hard delete if soft delete fails (e.g. column missing)
            const { error: hardDeleteError } = await supabaseAdmin
                .from('saved_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', userId);

            if (hardDeleteError) throw hardDeleteError;
        }

        return NextResponse.json({ success: true, message: 'Session deleted for user' });

    } catch (error) {
        console.error('Delete session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
