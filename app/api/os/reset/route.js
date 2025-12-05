import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// POST - Reset/clear all user's generated content
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

        // Delete all slide_results for this user
        const { error: deleteError } = await supabaseAdmin
            .from('slide_results')
            .delete()
            .eq('user_id', user.id);

        if (deleteError) {
            console.error('Error deleting slide_results:', deleteError);
            // Don't throw - table might not exist yet
        }

        // Delete all intake_answers for this user
        const { error: intakeError } = await supabaseAdmin
            .from('intake_answers')
            .delete()
            .eq('user_id', user.id);

        if (intakeError) {
            console.error('Error deleting intake_answers:', intakeError);
            // Don't throw - table might not exist yet
        }

        return NextResponse.json({ success: true, message: 'All progress cleared' });

    } catch (error) {
        console.error('Reset error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
