/**
 * Data Migration: vault_content → vault_content_fields
 *
 * Migrates existing JSON blob content from vault_content table
 * to granular field-level storage in vault_content_fields
 *
 * IMPORTANT: Run this after creating the vault_content_fields table
 *
 * Usage:
 * node migrations/migrate_to_granular_fields.js
 */

import { createClient } from '@supabase/supabase-js';
import { VAULT_FIELD_STRUCTURES } from '../lib/vault/fieldStructures.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Extract individual fields from JSON content based on section structure
 */
function extractFieldsFromContent(sectionId, content) {
    const structure = VAULT_FIELD_STRUCTURES[sectionId];
    if (!structure) {
        console.warn(`No field structure defined for section: ${sectionId}`);
        return [];
    }

    const fields = [];

    for (const fieldDef of structure.fields) {
        const { field_id, field_label, field_type, field_metadata, display_order } = fieldDef;

        // Extract value from content
        let field_value = content[field_id];

        // Skip if field doesn't exist in content
        if (field_value === undefined || field_value === null) {
            console.log(`  [SKIP] Field "${field_id}" not found in content`);
            continue;
        }

        fields.push({
            field_id,
            field_label,
            field_value,
            field_type,
            field_metadata: field_metadata || {},
            is_custom: false,
            display_order
        });
    }

    return fields;
}

/**
 * Migrate a single section
 */
async function migrateSection(funnelId, userId, sectionId, content) {
    console.log(`\n📦 Migrating section: ${sectionId} for funnel: ${funnelId}`);

    // Extract fields
    const fields = extractFieldsFromContent(sectionId, content);

    if (fields.length === 0) {
        console.log(`  ⚠️  No fields extracted (section might not be configured yet)`);
        return { success: false, reason: 'no_fields' };
    }

    console.log(`  ✓ Extracted ${fields.length} fields`);

    // Check if fields already exist
    const { data: existingFields } = await supabase
        .from('vault_content_fields')
        .select('field_id')
        .eq('funnel_id', funnelId)
        .eq('section_id', sectionId);

    if (existingFields && existingFields.length > 0) {
        console.log(`  ⚠️  Fields already exist (${existingFields.length} found) - skipping`);
        return { success: false, reason: 'already_exists' };
    }

    // Insert fields
    const fieldsToInsert = fields.map(field => ({
        funnel_id: funnelId,
        user_id: userId,
        section_id: sectionId,
        ...field,
        is_approved: false,
        version: 1,
        is_current_version: true
    }));

    const { data, error } = await supabase
        .from('vault_content_fields')
        .insert(fieldsToInsert)
        .select();

    if (error) {
        console.error(`  ❌ Error inserting fields:`, error.message);
        return { success: false, reason: 'insert_error', error };
    }

    console.log(`  ✅ Successfully migrated ${data.length} fields`);
    return { success: true, count: data.length };
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('🚀 Starting migration: vault_content → vault_content_fields\n');
    console.log('━'.repeat(60));

    // Fetch all vault content that is current version
    const { data: vaultContent, error: fetchError } = await supabase
        .from('vault_content')
        .select('funnel_id, user_id, section_id, content')
        .eq('is_current_version', true)
        .order('funnel_id', { ascending: true });

    if (fetchError) {
        console.error('❌ Failed to fetch vault content:', fetchError.message);
        process.exit(1);
    }

    console.log(`\n📊 Found ${vaultContent.length} vault sections to process\n`);

    const stats = {
        total: vaultContent.length,
        migrated: 0,
        skipped: 0,
        errors: 0,
        fieldCount: 0
    };

    // Process each section
    for (const record of vaultContent) {
        const { funnel_id, user_id, section_id, content } = record;

        // Only migrate sections we have structures for (currently just idealClient)
        if (!VAULT_FIELD_STRUCTURES[section_id]) {
            console.log(`\n⏩ Skipping section "${section_id}" (no structure defined yet)`);
            stats.skipped++;
            continue;
        }

        const result = await migrateSection(funnel_id, user_id, section_id, content);

        if (result.success) {
            stats.migrated++;
            stats.fieldCount += result.count;
        } else if (result.reason === 'already_exists') {
            stats.skipped++;
        } else {
            stats.errors++;
        }

        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n' + '━'.repeat(60));
    console.log('\n📈 MIGRATION SUMMARY');
    console.log('━'.repeat(60));
    console.log(`Total sections:     ${stats.total}`);
    console.log(`✅ Migrated:        ${stats.migrated} sections (${stats.fieldCount} fields)`);
    console.log(`⏩ Skipped:         ${stats.skipped}`);
    console.log(`❌ Errors:          ${stats.errors}`);
    console.log('━'.repeat(60));

    if (stats.errors === 0) {
        console.log('\n✨ Migration completed successfully!\n');
    } else {
        console.log('\n⚠️  Migration completed with errors. Check logs above.\n');
    }
}

// Run migration
migrate().catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
});
