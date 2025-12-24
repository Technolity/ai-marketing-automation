import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

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

        // If saving a single phase
        if (phaseId && content) {
            // Find or create session
            let session;
            if (sessionId) {
                const { data: existingSession } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('*')
                    .eq('id', sessionId)
                    .eq('user_id', userId)
                    .single();
                
                session = existingSession;
            }

            if (!session) {
                // Get most recent session
                const { data: recentSession } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                session = recentSession;
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
            if (sessionId) {
                const { data: existingSession } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('*')
                    .eq('id', sessionId)
                    .eq('user_id', userId)
                    .single();
                
                session = existingSession;
            }

            if (!session) {
                const { data: recentSession } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                session = recentSession;
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

        return NextResponse.json({ error: 'No session found' }, { status: 404 });

    } catch (error) {
        console.error('[SaveBusinessCore] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

