
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Key:', supabaseServiceKey ? 'Set' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVslContent() {
    console.log('Fetching latest VSL content...');

    // Get the most recent VSL section (section_id = 'vsl')
    const { data: section, error } = await supabase
        .from('vault_content')
        .select('*')
        .eq('section_id', 'vsl')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching VSL content:', error);
        return;
    }

    if (!section) {
        console.log('No VSL content found.');
        return;
    }

    console.log('--- FOUND VSL CONTENT ---');
    console.log('ID:', section.id);
    console.log('Funnel ID:', section.funnel_id);
    console.log('Version:', section.version);
    console.log('Is Current:', section.is_current_version);
    console.log('Created At:', section.created_at);
    console.log('\n--- CONTENT JSON KEYS ---');
    const content = section.content;

    if (!content) {
        console.log('Content is null/empty');
        return;
    }

    console.log(Object.keys(content));

    if (content.vslScript) {
        console.log('\n--- vslScript Keys ---');
        console.log(Object.keys(content.vslScript));
        const vsl = content.vslScript;
        console.log('\n--- SAMPLE VALUES ---');
        console.log('openingStory:', vsl.openingStory ? (String(vsl.openingStory).substring(0, 50) + '...') : 'MISSING/EMPTY');
        console.log('problemAgitation:', vsl.problemAgitation ? 'Present' : 'MISSING/EMPTY');

        if (vsl.threeTips) {
            console.log('threeTips:', Array.isArray(vsl.threeTips) ? `Array[${vsl.threeTips.length}]` : 'Not Array');
            if (Array.isArray(vsl.threeTips) && vsl.threeTips.length > 0) {
                console.log('Tip 1 keys:', Object.keys(vsl.threeTips[0]));
            }
        } else {
            console.log('threeTips: MISSING/EMPTY');
        }
    } else {
        // Check if keys are at root
        console.log('\n--- ROOT KEYS (Fallback?) ---');
        console.log('openingStory:', content.openingStory ? 'Present' : 'NO');
        console.log('keys:', Object.keys(content));
    }
}

checkVslContent();
