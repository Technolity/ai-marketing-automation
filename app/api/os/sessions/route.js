import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// GET - List all saved sessions for the user (excluding soft-deleted ones)
export async function GET(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch ALL session data, excluding soft-deleted sessions
        const { data: sessions, error } = await supabaseAdmin
            .from('saved_sessions')
            .select('*')
            .eq('user_id', user.id)
            .or('deleted_at.is.null,deleted_at.eq.false')  // Only show non-deleted sessions
            .order('updated_at', { ascending: false });

        if (error) {
            // If table doesn't exist or column doesn't exist, try without filter
            if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('deleted_at')) {
                // Fallback: fetch without deleted_at filter
                const { data: fallbackSessions, error: fallbackError } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                if (fallbackError) {
                    return NextResponse.json({ sessions: [] });
                }

                // Filter out deleted sessions client-side if deleted_at exists
                const activeSessions = (fallbackSessions || []).filter(s => !s.deleted_at);
                return NextResponse.json({ sessions: activeSessions });
            }
            throw error;
        }

        return NextResponse.json({ sessions: sessions || [] });

    } catch (error) {
        console.error('List sessions error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Save current progress as a new named session
export async function POST(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionName, currentStep, completedSteps, answers, generatedContent, isComplete } = await req.json();

        if (!sessionName) {
            return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
        }

        // Insert new session with all data
        const { data, error } = await supabaseAdmin
            .from('saved_sessions')
            .insert({
                user_id: user.id,
                session_name: sessionName,
                current_step: currentStep || 1,
                completed_steps: completedSteps || [],
                answers: answers || {},
                generated_content: generatedContent || {},
                results_data: generatedContent || {},
                onboarding_data: answers || {},
                is_complete: isComplete || (completedSteps?.length >= 12),
                status: (completedSteps?.length >= 12) ? 'completed' : 'in_progress',
                deleted_at: null,  // Not deleted
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, session: data });

    } catch (error) {
        console.error('Save session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Soft delete a saved session (keeps data for admin, hides from user)
export async function DELETE(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('id');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // SOFT DELETE: Mark as deleted instead of actually deleting
        // This keeps the data for admin but hides it from the user
        const { error } = await supabaseAdmin
            .from('saved_sessions')
            .update({
                deleted_at: new Date().toISOString(),
                status: 'deleted'
            })
            .eq('id', sessionId)
            .eq('user_id', user.id);

        if (error) {
            // If deleted_at column doesn't exist, try adding it or do hard delete as fallback
            console.error('Soft delete error, attempting fallback:', error);

            // Fallback: hard delete if soft delete fails
            const { error: hardDeleteError } = await supabaseAdmin
                .from('saved_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', user.id);

            if (hardDeleteError) throw hardDeleteError;
        }

        return NextResponse.json({ success: true, message: 'Session deleted for user' });

    } catch (error) {
        console.error('Delete session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
