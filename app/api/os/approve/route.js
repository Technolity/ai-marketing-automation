import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step, content } = await req.json();

    // First check if a record exists
    const { data: existingRecord } = await supabaseAdmin
      .from('slide_results')
      .select('id')
      .eq('user_id', userId)
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
        .eq('user_id', userId)
        .eq('slide_id', step);

      if (error) throw error;
    } else {
      // Insert new record
      const { error } = await supabaseAdmin
        .from('slide_results')
        .insert({
          user_id: userId,
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
