/**
 * Admin API: Setup pgvector database
 * GET /api/admin/setup-pgvector
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    console.log('🚀 Setting up pgvector...');

    // Step 1: Enable pgvector extension
    const { error: extError } = await supabase.rpc('exec', {
      sql: 'CREATE EXTENSION IF NOT EXISTS vector;'
    });

    // Step 2: Create table (using Supabase client's built-in methods)
    // We'll check if table exists first
    const { data: existingTable, error: checkError } = await supabase
      .from('ted_knowledge_base')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating ted_knowledge_base table...');

      // We need to use raw SQL for this
      // For now, return instructions
      return NextResponse.json({
        success: false,
        message: 'Please run migration manually in Supabase SQL Editor',
        instructions: [
          '1. Go to Supabase Dashboard → SQL Editor',
          '2. Open database/migrations/012_pgvector_setup.sql',
          '3. Copy and paste the SQL',
          '4. Click "Run"',
          '5. Then run this endpoint again to verify'
        ],
        sql_file: 'database/migrations/012_pgvector_setup.sql'
      });
    }

    // Table exists, check its structure
    const { count, error: countError } = await supabase
      .from('ted_knowledge_base')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: 'pgvector is set up and ready!',
      stats: {
        table_exists: true,
        record_count: count || 0
      }
    });

  } catch (error) {
    console.error('Setup error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      instructions: [
        'Run the migration manually in Supabase:',
        '1. Go to SQL Editor in Supabase Dashboard',
        '2. Copy contents from database/migrations/012_pgvector_setup.sql',
        '3. Execute the SQL',
        '4. Try this endpoint again'
      ]
    }, { status: 500 });
  }
}

