/**
 * Run Database Migration Script
 * Usage: node scripts/run-migration.js 012_pgvector_setup.sql
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(migrationFile) {
  try {
    console.log(`\n🚀 Running migration: ${migrationFile}\n`);

    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', migrationFile);

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Migration file not found: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct query (works for some Supabase setups)
      console.log('⚠️  exec_sql not available, using direct query...');

      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);

        const { error: stmtError } = await supabase.rpc('query', {
          query_text: statement + ';'
        }).single();

        if (stmtError) {
          console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
          console.error('Statement:', statement.substring(0, 200));
          throw stmtError;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!\n');
    return true;

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    return false;
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Please provide a migration file name');
  console.error('Usage: node scripts/run-migration.js 012_pgvector_setup.sql');
  process.exit(1);
}

runMigration(migrationFile).then(success => {
  process.exit(success ? 0 : 1);
});
