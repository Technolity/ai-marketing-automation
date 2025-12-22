/**
 * Setup pgvector database for TedOS RAG system
 * Run this once to initialize the knowledge base
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPgvector() {
  console.log('\n🚀 Setting up pgvector database for TedOS RAG...\n');

  try {
    // Step 1: Check if table already exists
    console.log('📋 Step 1: Checking if ted_knowledge_base exists...');
    const { data: tables } = await supabase
      .from('ted_knowledge_base')
      .select('id')
      .limit(1);

    console.log('✅ ted_knowledge_base table exists!\n');
    console.log('📊 Current state:');

    // Count existing records
    const { count } = await supabase
      .from('ted_knowledge_base')
      .select('*', { count: 'exact', head: true });

    console.log(`   - Records in knowledge base: ${count || 0}`);

    return true;

  } catch (error) {
    console.error('⚠️  Table does not exist yet. You need to run the migration manually.');
    console.error('\n📝 To set up pgvector:');
    console.error('1. Go to your Supabase Dashboard');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Copy and paste the contents of:');
    console.error('   database/migrations/012_pgvector_setup.sql');
    console.error('4. Click "Run"\n');
    return false;
  }
}

setupPgvector().then(success => {
  if (success) {
    console.log('\n✅ pgvector is ready!\n');
  } else {
    console.log('\n⚠️  Please run the migration manually first.\n');
  }
  process.exit(success ? 0 : 1);
});
