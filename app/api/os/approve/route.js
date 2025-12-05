import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export async function POST(req) {
  try {
    // Get token from Authorization header
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step, content } = await req.json();

    // First check if a record exists
    const { data: existingRecord } = await supabaseAdmin
      .from('slide_results')
      .select('id')
      .eq('user_id', user.id)
      .eq('slide_id', step)
      .single();

    if (existingRecord) {
      // Update existing record
      const { error } = await supabaseAdmin
        .from('slide_results')
        .update({
          approved: true,
          ai_output: content,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('slide_id', step);

      if (error) throw error;
    } else {
      // Insert new record
      const { error } = await supabaseAdmin
        .from('slide_results')
        .insert({
          user_id: user.id,
          slide_id: step,
          ai_output: content,
          approved: true
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Approve Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
