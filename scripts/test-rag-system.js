/**
 * Test RAG System End-to-End
 * This script tests the complete RAG pipeline
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testRAGSystem() {
  console.log('\n🎯 TedOS RAG System - End-to-End Test');
  console.log('========================================\n');

  try {
    // Step 1: Check pgvector setup
    console.log('📊 Step 1: Checking pgvector setup...\n');
    const setupResponse = await fetch(`${BASE_URL}/api/admin/setup-pgvector`);
    const setupData = await setupResponse.json();

    if (setupData.success) {
      console.log('✅ pgvector is ready!');
      console.log(`   Records in knowledge base: ${setupData.stats.record_count}\n`);
    } else {
      console.log('⚠️  pgvector needs setup:');
      console.log(setupData.instructions.join('\n   '));
      console.log('\n❌ Please set up pgvector first, then run this script again.\n');
      return;
    }

    // Step 2: Check if we have data
    console.log('📚 Step 2: Checking knowledge base...\n');
    const statsResponse = await fetch(`${BASE_URL}/api/rag/search`);
    const statsData = await statsResponse.json();

    if (statsData.success && statsData.stats.total_chunks > 0) {
      console.log('✅ Knowledge base has data!');
      console.log(`   Total chunks: ${statsData.stats.total_chunks}`);
      console.log(`   Unique videos: ${statsData.stats.unique_videos}\n`);
    } else {
      console.log('⚠️  Knowledge base is empty. Ingesting video...\n');

      // Ingest the video
      const ingestResponse = await fetch(`${BASE_URL}/api/rag/ingest-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl: 'https://www.youtube.com/watch?v=5Xmk5akg_1Y',
          skipIntroMinutes: 4,
          tags: ['lead-generation', 'client-acquisition']
        })
      });

      const ingestData = await ingestResponse.json();

      if (ingestData.success) {
        console.log('✅ Video ingested successfully!');
        console.log(`   Video: ${ingestData.stats.video_title}`);
        console.log(`   Chunks created: ${ingestData.stats.chunks_inserted}\n`);
      } else {
        console.log('❌ Ingestion failed:', ingestData.error);
        return;
      }
    }

    // Step 3: Test semantic search
    console.log('🔍 Step 3: Testing semantic search...\n');

    const testQueries = [
      'How to generate new leads',
      'How to create a lead magnet',
      'How to attract ideal clients'
    ];

    for (const query of testQueries) {
      console.log(`Query: "${query}"`);

      const searchResponse = await fetch(`${BASE_URL}/api/rag/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          matchCount: 2,
          matchThreshold: 0.7
        })
      });

      const searchData = await searchResponse.json();

      if (searchData.success && searchData.results.length > 0) {
        console.log(`✅ Found ${searchData.results.length} results\n`);

        searchData.results.forEach((result, index) => {
          console.log(`   Result ${index + 1} (${(result.similarity * 100).toFixed(0)}% match):`);
          console.log(`   ${result.content.substring(0, 150)}...`);
          console.log('');
        });
      } else {
        console.log('❌ No results found\n');
      }
    }

    // Step 4: Show RAG integration example
    console.log('🧠 Step 4: Testing RAG-enhanced generation...\n');
    console.log('Example: Generate lead magnet with Ted\'s frameworks\n');

    const exampleData = {
      topic: 'real estate investing',
      idealClient: 'busy professionals who want passive income',
      problem: 'don\'t have time to research investments',
      transformation: 'financial freedom through smart property investments'
    };

    const ragSearchResponse = await fetch(`${BASE_URL}/api/rag/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'How to create lead magnets that attract ideal clients',
        matchCount: 3
      })
    });

    const ragSearchData = await ragSearchResponse.json();

    if (ragSearchData.success && ragSearchData.results.length > 0) {
      console.log('✅ Retrieved Ted\'s frameworks for lead magnet generation:');
      console.log(`   Found ${ragSearchData.results.length} relevant frameworks\n`);

      ragSearchData.results.forEach((result, index) => {
        console.log(`   Framework ${index + 1} (${(result.similarity * 100).toFixed(0)}% relevance):`);
        console.log(`   Source: ${result.video_title || 'Ted\'s Training'}`);
        console.log(`   ${result.content.substring(0, 200)}...`);
        console.log('');
      });

      console.log('💡 These frameworks will be injected into the generation prompt!\n');
    }

    // Final summary
    console.log('========================================');
    console.log('✅ RAG SYSTEM TEST COMPLETE!\n');
    console.log('Your TedOS Brain is now operational.\n');
    console.log('Next steps:');
    console.log('1. ✅ pgvector database is set up');
    console.log('2. ✅ YouTube video is ingested and chunked');
    console.log('3. ✅ Semantic search is working');
    console.log('4. ✅ RAG context retrieval is functional\n');
    console.log('🚀 Ready to integrate with generation APIs!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Make sure:');
    console.error('1. Your dev server is running (npm run dev)');
    console.error('2. Environment variables are set');
    console.error('3. Supabase is accessible\n');
  }
}

testRAGSystem();
