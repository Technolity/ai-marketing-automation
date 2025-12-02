import { NextResponse } from 'next/server';

export async function POST(req) {
    // const supabase = createRouteHandlerClient({ cookies });

    try {
        // TEMPORARY: Bypass Auth for testing
        /*
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        */

        const { step, content } = await req.json();

        // TEMPORARY: Bypass DB Update
        /*
        const { error } = await supabase
          .from('slide_results')
          .update({ 
            approved: true,
            ai_output: content // Update with any edits
          })
          .eq('user_id', session.user.id)
          .eq('slide_id', step)
          
        if (error) throw error;
        */

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
