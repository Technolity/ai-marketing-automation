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

    // Use slide_id 99 for "all" content (full generation)
    const slideId = step === 'all' ? 99 : (typeof step === 'number' ? step : parseInt(step));

    // First check if a record exists
    const { data: existingRecord } = await supabaseAdmin
      .from('slide_results')
      .select('id')
      .eq('user_id', userId)
      .eq('slide_id', slideId)
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
        .eq('slide_id', slideId);

      if (error) throw error;
    } else {
      // Insert new record
      const { error } = await supabaseAdmin
        .from('slide_results')
        .insert({
          user_id: userId,
          slide_id: slideId,
          ai_output: content,
          approved: true
        });

      if (error) throw error;
    }

    console.log(`[Approve API] Successfully saved content for user ${userId}, slide_id: ${slideId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Approve Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
