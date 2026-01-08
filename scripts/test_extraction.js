
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Mock browser environment for Next.js imports if needed? 
// Actually fieldMapper imports 'supabaseServiceRole'. That might fail in node script if not handled.
// I will copy the extractFields logic manually to test it against the JSON.
// This isolates the logic test from import issues.

// Load environment variables
try {
    const envFile = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf8');
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/"/g, '');
            process.env[key] = value;
        }
    });
} catch (e) {
    console.log('Could not load .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// THE EXTRACT LOGIC TO TEST (Copy-pasted from fieldMapper.js)
const vslExtractor = {
    extractFields: (content) => {
        const vsl = content?.vslScript || content?.vsl || content;

        // Helper to transform tip object
        const transformTip = (tip) => ({
            title: tip?.tipTitle || '',
            description: tip?.tipContent || '',
            action: tip?.actionStep || ''
        });

        const tips = Array.isArray(vsl?.threeTips) ? vsl.threeTips : [];
        const objections = Array.isArray(vsl?.objectionHandlers) ? vsl.objectionHandlers : [];
        const closing = vsl?.closingSequence || {};

        return {
            opening_story: vsl?.openingStory || '',
            problem_agitation: vsl?.problemAgitation || '',
            core_tip_1: tips[0] ? transformTip(tips[0]) : { title: '', description: '', action: '' },
            core_tip_2: tips[1] ? transformTip(tips[1]) : { title: '', description: '', action: '' },
            core_tip_3: tips[2] ? transformTip(tips[2]) : { title: '', description: '', action: '' },
            method_reveal: vsl?.methodReveal || '',
            social_proof: vsl?.socialProof || '',
            the_offer: vsl?.offerPresentation || '',
            objection_1_question: objections[0]?.objection || '',
            objection_1_response: objections[0]?.response || '',
            guarantee: vsl?.guarantee || '',
            closing_urgency: closing?.urgencyClose || '',
        };
    }
};

async function testExtraction() {
    console.log('Fetching latest VSL content...');
    const { data: section } = await supabase
        .from('vault_content')
        .select('content')
        .eq('section_id', 'vsl')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!section) return console.log('No content');

    console.log('Running extraction...');
    const extracted = vslExtractor.extractFields(section.content);

    console.log('--- EXTRACTED FIELDS ---');
    console.log('opening_story:', extracted.opening_story ? (String(extracted.opening_story).substring(0, 30) + '...') : 'EMPTY');
    console.log('core_tip_1:', JSON.stringify(extracted.core_tip_1));
    console.log('objection_1_question:', extracted.objection_1_question);

    // Verify emptiness
    if (!extracted.opening_story) console.log('FAILURE: opening_story is empty');
    else console.log('SUCCESS: opening_story has content');
}

testExtraction();
