import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// This endpoint initializes the required database tables if they don't exist
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

        // Create wizard_progress table - stores the user's current progress
        const createProgressTable = `
      CREATE TABLE IF NOT EXISTS wizard_progress (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        current_step INTEGER DEFAULT 1,
        completed_steps INTEGER[] DEFAULT '{}',
        answers JSONB DEFAULT '{}',
        generated_content JSONB DEFAULT '{}',
        is_complete BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;

        // Create wizard_history table - stores version history of answers
        const createHistoryTable = `
      CREATE TABLE IF NOT EXISTS wizard_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL,
        answers JSONB NOT NULL,
        generated_content JSONB,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

        // Create rag_data table - stores all generated content as RAG data
        const createRagTable = `
      CREATE TABLE IF NOT EXISTS rag_data (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        content_type VARCHAR(100) NOT NULL,
        content JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        embedding VECTOR(1536),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

        // Execute table creation
        const { error: progressError } = await supabaseAdmin.rpc('exec_sql', {
            sql: createProgressTable
        }).catch(() => ({ error: null }));

        const { error: historyError } = await supabaseAdmin.rpc('exec_sql', {
            sql: createHistoryTable
        }).catch(() => ({ error: null }));

        const { error: ragError } = await supabaseAdmin.rpc('exec_sql', {
            sql: createRagTable
        }).catch(() => ({ error: null }));

        // Alternative: Try direct table operations if RPC doesn't work
        // Check if tables exist by trying to select from them
        const tables = ['wizard_progress', 'wizard_history', 'rag_data'];
        const tableStatus = {};

        for (const table of tables) {
            const { error } = await supabaseAdmin.from(table).select('id').limit(1);
            tableStatus[table] = !error;
        }

        return NextResponse.json({
            success: true,
            message: 'Database schema verified',
            tables: tableStatus
        });

    } catch (error) {
        console.error('Schema init error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET - Check current schema status
export async function GET(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check which tables exist
        const tables = ['wizard_progress', 'wizard_history', 'rag_data', 'intake_answers', 'slide_results'];
        const tableStatus = {};

        for (const table of tables) {
            const { error } = await supabaseAdmin.from(table).select('id').limit(1);
            tableStatus[table] = !error;
        }

        return NextResponse.json({ tables: tableStatus });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

