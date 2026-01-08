
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env
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
} catch (e) { }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFields() {
    console.log('Checking vault_content_fields for VSL...');

    // Get fields for vsl section
    const { data: fields, error } = await supabase
        .from('vault_content_fields')
        .select('field_id, field_value')
        .eq('section_id', 'vsl')
        .eq('is_current_version', true);

    if (error) return console.log('Error:', error);

    console.log(`Found ${fields.length} fields.`);
    if (fields.length > 0) {
        const sample = fields.find(f => f.field_id === 'opening_story');
        console.log('opening_story value:', sample ? sample.field_value.substring(0, 50) : 'NOT FOUND');
    } else {
        console.log('Table is empty for VSL section.');
    }
}

checkFields();
