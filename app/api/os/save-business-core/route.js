import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

/**
 * POST /api/os/save-business-core
 * Saves business core data and approvals to database
 * Ensures data persists across page refreshes
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId, phaseId, content, businessCore, approvals } = body;

        console.log('[SaveBusinessCore] Request:', { userId, sessionId, phaseId, hasContent: !!content, hasBusinessCore: !!businessCore });

        // If no sessionId provided, find the most recent session
        let targetSessionId = sessionId;

        // If saving a single phase
        if (phaseId && content) {
            // Find session - try provided ID first, then most recent
            let session;
            
            if (targetSessionId) {
                const { data: existingSession } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('*')
                    .eq('id', targetSessionId)
                    .eq('user_id', userId)
                    .single();
                
                session = existingSession;
                console.log('[SaveBusinessCore] Found session by ID:', session?.id);
            }

            if (!session) {
                // Get most recent session
                const { data: recentSession, error: sessionError } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle(); // Use maybeSingle - doesn't error on no rows
                
                if (sessionError) {
                    console.error('[SaveBusinessCore] Error finding recent session:', sessionError);
                }
                
                session = recentSession;
                
                if (session) {
                    console.log('[SaveBusinessCore] Found most recent session:', session.id);
                } else {
                    // ✅ AUTO-CREATE SESSION if none exists
                    console.log('[SaveBusinessCore] No session found, auto-creating...');
                    
                    // Try to get wizard_progress for context
                    const { data: wizardProgress } = await supabaseAdmin
                        .from('wizard_progress')
                        .select('answers, generated_content, completed_steps')
                        .eq('user_id', userId)
                        .maybeSingle();

                    const { data: newSession, error: createError } = await supabaseAdmin
                        .from('saved_sessions')
                        .insert({
                            user_id: userId,
                            session_name: `Auto-saved - ${new Date().toLocaleDateString()}`,
                            current_step: wizardProgress?.completed_steps?.length || 20,
                            completed_steps: wizardProgress?.completed_steps || [],
                            answers: wizardProgress?.answers || {},
                            generated_content: wizardProgress?.generated_content || {},
                            results_data: {},
                            onboarding_data: wizardProgress?.answers || {},
                            is_complete: true,
                            status: 'in_progress',
                            is_deleted: false
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('[SaveBusinessCore] Failed to auto-create session:', createError);
                    } else {
                        session = newSession;
                        console.log('[SaveBusinessCore] Auto-created session:', session.id);
                    }
                }
            }

            if (session) {
                // Update results_data with new content
                const currentResults = session.results_data || session.generated_content || {};
                
                // Map phaseId to numeric key
                const phaseKeyMap = {
                    'idealClient': '1',
                    'message': '2',
                    'story': '3',
                    'offer': '4',
                    'salesScripts': '5',
                    'leadMagnet': '6'
                };
                
                const numericKey = phaseKeyMap[phaseId] || phaseId;
                
                // Update the specific phase
                currentResults[numericKey] = {
                    name: content._contentName || phaseId,
                    data: content
                };

                // Save back to database
                const { error: updateError } = await supabaseAdmin
                    .from('saved_sessions')
                    .update({
                        results_data: currentResults,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', session.id)
                    .eq('user_id', userId);

                if (updateError) {
                    console.error('[SaveBusinessCore] Update error:', updateError);
                    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
                }

                console.log('[SaveBusinessCore] Saved phase:', phaseId, 'to session:', session.id);
                return NextResponse.json({ success: true, sessionId: session.id });
            }
        }

        // If saving entire business core
        if (businessCore) {
            let session;
            
            if (targetSessionId) {
                const { data: existingSession } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('*')
                    .eq('id', targetSessionId)
                    .eq('user_id', userId)
                    .single();
                
                session = existingSession;
            }

            if (!session) {
                const { data: recentSession, error: sessionError } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                session = recentSession;
                
                if (!session) {
                    // ✅ AUTO-CREATE SESSION if none exists
                    console.log('[SaveBusinessCore] No session for businessCore, auto-creating...');
                    
                    const { data: wizardProgress } = await supabaseAdmin
                        .from('wizard_progress')
                        .select('answers, generated_content, completed_steps')
                        .eq('user_id', userId)
                        .maybeSingle();

                    const { data: newSession, error: createError } = await supabaseAdmin
                        .from('saved_sessions')
                        .insert({
                            user_id: userId,
                            session_name: `Auto-saved - ${new Date().toLocaleDateString()}`,
                            current_step: wizardProgress?.completed_steps?.length || 20,
                            completed_steps: wizardProgress?.completed_steps || [],
                            answers: wizardProgress?.answers || {},
                            generated_content: wizardProgress?.generated_content || {},
                            results_data: {},
                            onboarding_data: wizardProgress?.answers || {},
                            is_complete: true,
                            status: 'in_progress',
                            is_deleted: false
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('[SaveBusinessCore] Failed to auto-create session:', createError);
                    } else {
                        session = newSession;
                        console.log('[SaveBusinessCore] Auto-created session:', session.id);
                    }
                }
            }

            if (session) {
                const currentResults = session.results_data || session.generated_content || {};
                
                // Map named keys to numeric keys
                const phaseKeyMap = {
                    'idealClient': '1',
                    'message': '2',
                    'story': '3',
                    'offer': '4',
                    'salesScripts': '5',
                    'leadMagnet': '6'
                };

                // Update all phases
                Object.entries(businessCore).forEach(([key, value]) => {
                    const numericKey = phaseKeyMap[key] || key;
                    if (value) {
                        currentResults[numericKey] = {
                            name: value._contentName || key,
                            data: value
                        };
                    }
                });

                const { error: updateError } = await supabaseAdmin
                    .from('saved_sessions')
                    .update({
                        results_data: currentResults,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', session.id)
                    .eq('user_id', userId);

                if (updateError) {
                    console.error('[SaveBusinessCore] Update error:', updateError);
                    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
                }

                console.log('[SaveBusinessCore] Saved entire business core to session:', session.id);
                return NextResponse.json({ success: true, sessionId: session.id });
            }
        }

        console.error('[SaveBusinessCore] No session found for user:', userId);
        return NextResponse.json({ 
            error: 'No session found', 
            details: 'Please complete the intake form first or generate content' 
        }, { status: 404 });

    } catch (error) {
        console.error('[SaveBusinessCore] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


