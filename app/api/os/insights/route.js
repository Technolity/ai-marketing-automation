import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// Ted Insights Layer™ - $997 Value
// Currently placeholder - Ted's content will be added later

const TED_INSIGHTS_ACTIONS = {
    evaluate: 'Evaluate',
    improve: 'Improve',
    rewrite: 'Rewrite',
    explain: 'Explain Why',
    next: 'Next Steps'
};

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

        const { action, content, contentType } = await req.json();

        // Validate action
        if (!TED_INSIGHTS_ACTIONS[action]) {
            return NextResponse.json({
                error: 'Invalid action. Use: evaluate, improve, rewrite, explain, or next'
            }, { status: 400 });
        }

        // For now, return "Coming Soon" message
        // Ted's content and prompts will be added later
        return NextResponse.json({
            success: true,
            action: TED_INSIGHTS_ACTIONS[action],
            message: `🚀 Ted Insights "${TED_INSIGHTS_ACTIONS[action]}" is coming soon! This premium feature will be available with Ted's exclusive content and methodologies.`,
            comingSoon: true,
            contentType: contentType || 'unknown'
        });

    } catch (error) {
        console.error('Ted Insights Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
