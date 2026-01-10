/**
 * Test Database Connection Script
 *
 * Run this to verify your Supabase connection and pooler setup
 * Usage: node scripts/test-database-connection.js
 */

require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('\n🔍 Testing Supabase Database Connection...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  USE_SUPABASE_POOLER: ${process.env.USE_SUPABASE_POOLER || 'false'}`);
  console.log(`  SUPABASE_POOLER_URL: ${process.env.SUPABASE_POOLER_URL ? '✅ Set' : '⚠️  Not set (using direct connection)'}`);
  console.log('');

  // Import Supabase client
  const { createClient } = require('@supabase/supabase-js');

  // Determine URL
  const usePooler = process.env.USE_SUPABASE_POOLER === 'true';
  const url = usePooler && process.env.SUPABASE_POOLER_URL
    ? process.env.SUPABASE_POOLER_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL;

  console.log(`🔗 Connecting to: ${url}`);
  console.log(`   Connection Type: ${usePooler ? 'Pooler (Recommended)' : 'Direct'}`);
  console.log('');

  // Create client
  const supabase = createClient(
    url,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Test 1: Simple query
    console.log('📊 Test 1: Querying database...');
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    const duration = Date.now() - startTime;

    if (error) {
      console.log(`   ❌ Query failed: ${error.message}`);
      console.log(`   Error code: ${error.code}`);
      console.log(`   Details: ${error.details}`);
      return false;
    }

    console.log(`   ✅ Query successful!`);
    console.log(`   Response time: ${duration}ms`);
    console.log('');

    // Test 2: Multiple concurrent queries (stress test)
    console.log('📊 Test 2: Testing concurrent connections...');
    const concurrentQueries = 10;
    console.log(`   Running ${concurrentQueries} concurrent queries...`);

    const concurrentStart = Date.now();
    const queries = Array(concurrentQueries).fill(0).map(() =>
      supabase.from('user_profiles').select('id').limit(1)
    );

    const results = await Promise.all(queries);
    const concurrentDuration = Date.now() - concurrentStart;

    const failures = results.filter(r => r.error).length;
    const successes = results.filter(r => !r.error).length;

    console.log(`   ✅ ${successes}/${concurrentQueries} queries succeeded`);
    if (failures > 0) {
      console.log(`   ⚠️  ${failures} queries failed`);
    }
    console.log(`   Total time: ${concurrentDuration}ms`);
    console.log(`   Average time per query: ${(concurrentDuration / concurrentQueries).toFixed(2)}ms`);
    console.log('');

    // Test 3: Connection info
    console.log('📊 Test 3: Connection information...');
    console.log(`   Database: rtsxasujxzbkeogkqlhp`);
    console.log(`   Region: US East 1`);
    console.log(`   Pooling: ${usePooler ? 'Enabled ✅' : 'Disabled (Direct connection)'}`);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ Database Connection Test PASSED');
    console.log('═══════════════════════════════════════');

    if (!usePooler) {
      console.log('');
      console.log('⚠️  RECOMMENDATION:');
      console.log('   Enable connection pooling for production:');
      console.log('   1. Set USE_SUPABASE_POOLER=true');
      console.log('   2. Add your pooler URL to SUPABASE_POOLER_URL');
      console.log('   See SUPABASE_POOLING_GUIDE.md for instructions');
    }
    console.log('');

    return true;

  } catch (error) {
    console.log('');
    console.log('❌ Connection test failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    console.log('');
    return false;
  }
}

// Run the test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
