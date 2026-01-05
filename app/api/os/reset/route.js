import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// POST - Reset/clear all user's generated content
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete all slide_results for this user
        const { error: deleteError } = await supabaseAdmin
            .from('slide_results')
            .delete()
            .eq('user_id', userId);

        if (deleteError) {
            // Quiet fail if table doesn't exist
            console.error('Error deleting slide_results:', deleteError);
        }

        // Delete all intake_answers for this user
        const { error: intakeError } = await supabaseAdmin
            .from('intake_answers')
            .delete()
            .eq('user_id', userId);

        if (intakeError) {
            console.error('Error deleting intake_answers:', intakeError);
        }

        // Delete wizard_progress for this user
        const { error: progressError } = await supabaseAdmin
            .from('wizard_progress')
            .delete()
            .eq('user_id', userId);

        if (progressError) {
            console.error('Error deleting wizard_progress:', progressError);
        }

        return NextResponse.json({ success: true, message: 'All progress cleared' });

    } catch (error) {
        console.error('Reset error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

