// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions
export async function saveGeneratedContent(userId, formData, results) {
  const { data, error } = await supabase
    .from('generated_content')
    .insert([
      {
        user_id: userId,
        business_name: formData.businessName,
        form_data: formData,
        results: results,
        created_at: new Date().toISOString()
      }
    ]);

  if (error) throw error;
  return data;
}

export async function getUserContent(userId) {
  const { data, error } = await supabase
    .from('generated_content')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Database schema (run in Supabase SQL editor):
/*
create table generated_content (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  business_name text,
  form_data jsonb,
  results jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table generated_content enable row level security;

-- Policy: Users can only see their own content
create policy "Users can view own content"
  on generated_content for select
  using (auth.uid() = user_id);

create policy "Users can insert own content"
  on generated_content for insert
  with check (auth.uid() = user_id);
*/
