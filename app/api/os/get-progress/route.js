import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET(req) {
    // const supabase = createRouteHandlerClient({ cookies });

    try {
        // TEMPORARY: Bypass Auth for testing
        /*
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    
        const { data: results, error } = await supabase
          .from('slide_results')
          .select('slide_id, approved')
          .eq('user_id', session.user.id)
          .eq('approved', true);
    
        if (error) throw error;
    
        const progress = {};
        results.forEach(row => {
            progress[row.slide_id] = true;
        });
        */

        // Mock progress for testing
        const progress = {
            1: true,
            2: false
        };

        return NextResponse.json({ progress });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

