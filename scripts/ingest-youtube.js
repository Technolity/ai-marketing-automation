/**
 * Ingest YouTube Video into RAG Knowledge Base
 * Usage: node scripts/ingest-youtube.js
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function ingestVideo() {
  const videoUrl = 'https://www.youtube.com/watch?v=5Xmk5akg_1Y';
  const skipIntroMinutes = 4; // Skip first 4 minutes as user requested

  console.log('\n🎬 TedOS RAG Video Ingestion');
  console.log('================================\n');
  console.log('Video:', videoUrl);
  console.log('Skipping first:', skipIntroMinutes, 'minutes\n');

  try {
    // Call our API endpoint
    const response = await fetch('http://localhost:3000/api/rag/ingest-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        youtubeUrl: videoUrl,
        skipIntroMinutes: skipIntroMinutes,
        tags: ['lead-generation', 'client-acquisition']
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ SUCCESS!\n');
      console.log('Video Title:', result.stats.video_title);
      console.log('Total Chunks:', result.stats.total_chunks);
      console.log('Chunks Inserted:', result.stats.chunks_inserted);
      console.log('\n📦 Sample Chunks:\n');

      result.chunks.slice(0, 3).forEach((chunk, index) => {
        console.log(`Chunk ${index + 1}:`);
        console.log(chunk.content_preview);
        console.log('---\n');
      });
    } else {
      console.error('❌ ERROR:', result.error);
      console.error('Details:', result.details);
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('1. Your dev server is running (npm run dev)');
    console.error('2. Environment variables are set in .env.local');
    console.error('3. pgvector migration has been run in Supabase');
  }
}

ingestVideo();
