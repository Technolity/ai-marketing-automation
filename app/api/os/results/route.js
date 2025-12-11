import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');

        console.log(`[Results API] Fetching results for user ${userId} ${sessionId ? `(session: ${sessionId})` : ''}`);

        // 1. If session_id provided, fetch specific session
        if (sessionId) {
            const { data: sessionData, error: sessionError } = await supabaseAdmin
                .from('saved_sessions')
                .select('*')
                .eq('id', sessionId)
                .eq('user_id', userId)
                .eq('is_deleted', false)
                .single();

            if (sessionError) throw sessionError;

            if (sessionData) {
                return NextResponse.json({
                    source: { type: 'loaded', name: sessionData.session_name, id: sessionData.id },
                    data: sessionData.results_data || sessionData.generated_content || {}
                });
            }
        }

        // 2. Try fetching Approved Results (slide_id 99)
        const { data: slideData, error: slideError } = await supabaseAdmin
            .from('slide_results')
            .select('*')
            .eq('user_id', userId)
            .eq('slide_id', 99)
            .eq('approved', true)
            .order('created_at', { ascending: false })
            .limit(1);

        if (slideError) {
            console.error('[Results API] Slide results error:', slideError);
        }

        if (slideData && slideData.length > 0) {
            // Return approved results
            const aiOutput = slideData[0].ai_output;
            return NextResponse.json({
                source: { type: 'approved', name: 'Approved Results' },
                data: aiOutput
            });
        }

        // 3. Fallback: Fetch latest Saved Session
        console.log('[Results API] No approved results, falling back to latest session');
        const { data: latestSession, error: fallbackError } = await supabaseAdmin
            .from('saved_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (fallbackError && fallbackError.code !== 'PGRST116') { // Ignore "no rows" error
            console.error('[Results API] Fallback error:', fallbackError);
        }

        if (latestSession) {
            return NextResponse.json({
                source: { type: 'latest_session', name: latestSession.session_name, id: latestSession.id },
                data: latestSession.results_data || latestSession.generated_content || {}
            });
        }

        // 4. No data found
        return NextResponse.json({
            source: null,
            data: {}
        });

    } catch (error) {
        console.error('[Results API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
