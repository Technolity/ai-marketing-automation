// app/api/ai/generate/route.js
import { generateMockResults } from '@/lib/mockData';
import { buildMarketingPrompt, buildSystemPrompt } from '@/lib/prompts';


export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.json();
    
    if (!formData.businessName || !formData.productName) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // MOCK MODE: Use mock data for testing
    const results = await generateMockResults(formData);
    
    /* 
    // OPENAI MODE: Uncomment when ready for production
    const prompt = buildMarketingPrompt(formData);
    const systemPrompt = buildSystemPrompt();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    const results = JSON.parse(data.choices[0].message.content);
    */

    return Response.json({ success: true, results }, { status: 200 });

  } catch (error) {
    console.error('Generation error:', error);
    return Response.json(
      { error: 'Failed to generate results' },
      { status: 500 }
    );
  }
}

