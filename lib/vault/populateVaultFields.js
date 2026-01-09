/**
 * Populate Vault Fields
 * 
 * Utility to extract granular fields from vault_content and populate vault_content_fields table.
 * Uses fieldMapper extractors to convert AI-generated content into editable fields.
 */

import { FIELD_EXTRACTORS } from './fieldMapper';

/**
 * Populate vault_content_fields from vault_content raw data
 * 
 * @param {Object} supabase - Supabase client (service role)
 * @param {string} funnelId - Funnel ID
 * @param {string} sectionId - Section ID (e.g., 'facebookAds', 'offer')
 * @param {Object} rawContent - Raw content from vault_content table
 * @returns {Object} Result with success status and populated fields count
 */
export async function populateFieldsFromContent(supabase, funnelId, sectionId, rawContent) {
    console.log(`[PopulateFields] Starting for section: ${sectionId}, funnel: ${funnelId}`);

    const extractor = FIELD_EXTRACTORS[sectionId];
    if (!extractor || !extractor.extractFields) {
        console.warn(`[PopulateFields] No extractor found for section: ${sectionId}`);
        return { success: false, error: 'No extractor for section', fieldsPopulated: 0 };
    }

    try {
        // Extract fields using fieldMapper
        const extractedFields = extractor.extractFields(rawContent);

        if (!extractedFields || Object.keys(extractedFields).length === 0) {
            console.warn(`[PopulateFields] No fields extracted for section: ${sectionId}`);
            return { success: false, error: 'No fields extracted', fieldsPopulated: 0 };
        }

        console.log(`[PopulateFields] Extracted ${Object.keys(extractedFields).length} fields:`, Object.keys(extractedFields));

        const insertedFields = [];
        const errors = [];

        // Insert each field into vault_content_fields
        for (const [fieldId, fieldValue] of Object.entries(extractedFields)) {
            // Skip empty/null values
            if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
                continue;
            }

            try {
                // Serialize value - arrays and objects need JSON stringify
                const serializedValue = typeof fieldValue === 'object'
                    ? JSON.stringify(fieldValue)
                    : fieldValue;

                // Check if field already exists
                const { data: existing } = await supabase
                    .from('vault_content_fields')
                    .select('id')
                    .eq('funnel_id', funnelId)
                    .eq('section_id', sectionId)
                    .eq('field_id', fieldId)
                    .eq('is_current_version', true)
                    .single();

                if (existing) {
                    // Skip if already exists
                    console.log(`[PopulateFields] Field ${fieldId} already exists, skipping`);
                    continue;
                }

                // Insert new field
                const { error: insertError } = await supabase
                    .from('vault_content_fields')
                    .insert({
                        funnel_id: funnelId,
                        section_id: sectionId,
                        field_id: fieldId,
                        field_value: serializedValue,
                        field_type: Array.isArray(fieldValue) ? 'array' : typeof fieldValue === 'object' ? 'object' : 'text',
                        is_current_version: true,
                        is_approved: false,
                        is_custom: false,
                        version: 1,
                        display_order: insertedFields.length
                    });

                if (insertError) {
                    console.error(`[PopulateFields] Insert error for ${fieldId}:`, insertError);
                    errors.push({ fieldId, error: insertError.message });
                } else {
                    insertedFields.push(fieldId);
                }

            } catch (fieldError) {
                console.error(`[PopulateFields] Error processing field ${fieldId}:`, fieldError);
                errors.push({ fieldId, error: fieldError.message });
            }
        }

        console.log(`[PopulateFields] Completed: ${insertedFields.length} fields inserted, ${errors.length} errors`);

        return {
            success: insertedFields.length > 0,
            fieldsPopulated: insertedFields.length,
            insertedFields,
            errors: errors.length > 0 ? errors : undefined
        };

    } catch (error) {
        console.error(`[PopulateFields] Fatal error:`, error);
        return { success: false, error: error.message, fieldsPopulated: 0 };
    }
}

/**
 * Get all sections that have extractors available
 */
export function getPopulatableSections() {
    return Object.keys(FIELD_EXTRACTORS);
}
