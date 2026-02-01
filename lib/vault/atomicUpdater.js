/**
 * Atomic Updater - String Replacement for Dependent Sections
 * 
 * Performs "Find & Replace" operations on dependent sections when
 * atomic fields (names, prices) change in source sections.
 * 
 * DEBUG LOGGING: All operations are extensively logged for debugging.
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getAffectedSections, detectChangeType } from './dependencyGraph';

/**
 * Perform atomic string replacement across all affected sections
 * 
 * @param {string} funnelId - The funnel ID
 * @param {string} sourceSectionId - The section that changed
 * @param {Object} oldContent - Previous content object
 * @param {Object} newContent - New content object
 * @returns {Object} Result with updated sections and any errors
 */
export async function performAtomicUpdate(funnelId, sourceSectionId, oldContent, newContent) {
    console.log('[AtomicUpdater] ========================================');
    console.log('[AtomicUpdater] Starting atomic update');
    console.log('[AtomicUpdater] Funnel ID:', funnelId);
    console.log('[AtomicUpdater] Source Section:', sourceSectionId);

    const result = {
        success: true,
        updatedSections: [],
        skippedSections: [],
        errors: [],
        startTime: Date.now()
    };

    try {
        // Step 1: Detect what changed
        const changeResult = detectChangeType(sourceSectionId, oldContent, newContent);

        if (!changeResult.hasChanges || changeResult.atomicChanges.length === 0) {
            console.log('[AtomicUpdater] No atomic changes detected, skipping update');
            result.success = true;
            result.message = 'No atomic changes to propagate';
            return result;
        }

        console.log('[AtomicUpdater] Atomic changes to propagate:', changeResult.atomicChanges);
        console.log('[AtomicUpdater] Affected sections:', changeResult.affectedSections);

        // Step 2: Fetch all affected section contents
        const { data: affectedContents, error: fetchError } = await supabaseAdmin
            .from('vault_content')
            .select('id, section_id, content, metadata')
            .eq('funnel_id', funnelId)
            .eq('is_current_version', true)
            .in('section_id', changeResult.affectedSections);

        if (fetchError) {
            console.error('[AtomicUpdater] Error fetching affected sections:', fetchError);
            result.success = false;
            result.errors.push({ step: 'fetch', error: fetchError.message });
            return result;
        }

        console.log('[AtomicUpdater] Found', affectedContents?.length || 0, 'affected sections to update');

        if (!affectedContents || affectedContents.length === 0) {
            console.log('[AtomicUpdater] No affected content found in vault');
            result.message = 'No dependent sections generated yet';
            return result;
        }

        // Step 3: Apply replacements to each section
        for (const section of affectedContents) {
            const updateResult = await updateSectionContent(
                section,
                changeResult.atomicChanges,
                sourceSectionId
            );

            if (updateResult.updated) {
                result.updatedSections.push({
                    sectionId: section.section_id,
                    replacementsCount: updateResult.replacementsCount
                });
            } else if (updateResult.skipped) {
                result.skippedSections.push(section.section_id);
            } else if (updateResult.error) {
                result.errors.push({
                    sectionId: section.section_id,
                    error: updateResult.error
                });
            }
        }

        result.duration = Date.now() - result.startTime;
        console.log('[AtomicUpdater] ========================================');
        console.log('[AtomicUpdater] Update complete in', result.duration, 'ms');
        console.log('[AtomicUpdater] Updated:', result.updatedSections.length, 'sections');
        console.log('[AtomicUpdater] Skipped:', result.skippedSections.length, 'sections');
        console.log('[AtomicUpdater] Errors:', result.errors.length);

        return result;

    } catch (err) {
        console.error('[AtomicUpdater] Unexpected error:', err);
        result.success = false;
        result.errors.push({ step: 'unexpected', error: err.message });
        result.duration = Date.now() - result.startTime;
        return result;
    }
}

/**
 * Update a single section's content with string replacements
 */
async function updateSectionContent(section, atomicChanges, sourceSectionId) {
    console.log(`[AtomicUpdater] Processing section: ${section.section_id}`);

    const result = {
        updated: false,
        skipped: false,
        replacementsCount: 0,
        error: null
    };

    try {
        let contentStr = JSON.stringify(section.content);
        let totalReplacements = 0;

        // Apply each atomic change
        for (const change of atomicChanges) {
            const { oldValue, newValue } = change;

            if (!oldValue || !newValue || oldValue === newValue) {
                continue;
            }

            // Count occurrences before replacement
            const regex = new RegExp(escapeRegex(oldValue), 'g');
            const matches = contentStr.match(regex);
            const matchCount = matches ? matches.length : 0;

            if (matchCount > 0) {
                console.log(`[AtomicUpdater]   Replacing "${oldValue}" -> "${newValue}" (${matchCount} occurrences)`);
                contentStr = contentStr.replace(regex, newValue);
                totalReplacements += matchCount;
            }
        }

        if (totalReplacements === 0) {
            console.log(`[AtomicUpdater]   No replacements needed for ${section.section_id}`);
            result.skipped = true;
            return result;
        }

        // Parse updated content
        const updatedContent = JSON.parse(contentStr);

        // Update metadata to track the auto-update
        const updatedMetadata = {
            ...section.metadata,
            lastAutoUpdate: {
                timestamp: new Date().toISOString(),
                source: sourceSectionId,
                replacementsCount: totalReplacements
            }
        };

        // Save to database
        const { error: updateError } = await supabaseAdmin
            .from('vault_content')
            .update({
                content: updatedContent,
                metadata: updatedMetadata,
                updated_at: new Date().toISOString()
            })
            .eq('id', section.id);

        if (updateError) {
            console.error(`[AtomicUpdater]   Error saving ${section.section_id}:`, updateError);
            result.error = updateError.message;
            return result;
        }

        console.log(`[AtomicUpdater]   ✓ Updated ${section.section_id} with ${totalReplacements} replacements`);
        result.updated = true;
        result.replacementsCount = totalReplacements;
        return result;

    } catch (err) {
        console.error(`[AtomicUpdater]   Error processing ${section.section_id}:`, err);
        result.error = err.message;
        return result;
    }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get the update status for a funnel (for UI polling)
 * 
 * @param {string} funnelId - The funnel ID
 * @returns {Object} Status of any pending/recent updates
 */
export async function getUpdateStatus(funnelId) {
    console.log('[AtomicUpdater] Getting update status for funnel:', funnelId);

    try {
        // Only check vault_content_fields table for recent updates
        // (vault_content table doesn't have a metadata column)
        const { data: fieldsData, error: fieldsError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('section_id, field_id, field_metadata')
            .eq('funnel_id', funnelId)
            .eq('is_current_version', true)
            .not('field_metadata->lastAutoUpdate', 'is', null);

        if (fieldsError) {
            console.error('[AtomicUpdater] Error getting status:', fieldsError);
            return { error: fieldsError.message };
        }

        const recentUpdates = [];

        // Add field updates
        (fieldsData || []).forEach(row => {
            recentUpdates.push({
                sectionId: row.section_id,
                fieldId: row.field_id,
                lastUpdate: row.field_metadata?.lastAutoUpdate,
                type: 'field'
            });
        });

        return {
            hasRecentUpdates: recentUpdates.length > 0,
            updates: recentUpdates
        };

    } catch (err) {
        console.error('[AtomicUpdater] Unexpected error getting status:', err);
        return { error: err.message };
    }
}


/**
 * Perform atomic string replacement across FIELD-LEVEL data in vault_content_fields
 * 
 * This is called when a user edits a specific field (like Lead Magnet Title)
 * and we need to find/replace that value in other sections' fields.
 * 
 * @param {string} funnelId - The funnel ID
 * @param {string} sourceSectionId - The section that changed (e.g., 'leadMagnet')
 * @param {string} fieldId - The specific field that changed (e.g., 'mainTitle')
 * @param {string} oldValue - Previous value of the field
 * @param {string} newValue - New value of the field
 * @returns {Object} Result with updated sections and any errors
 */
export async function performFieldAtomicUpdate(funnelId, sourceSectionId, fieldId, oldValue, newValue) {
    console.log('[AtomicUpdater] ========================================');
    console.log('[AtomicUpdater] Starting FIELD-LEVEL atomic update');
    console.log('[AtomicUpdater] Funnel ID:', funnelId);
    console.log('[AtomicUpdater] Source Section:', sourceSectionId);
    console.log('[AtomicUpdater] Field ID:', fieldId);
    console.log('[AtomicUpdater] Old Value:', oldValue);
    console.log('[AtomicUpdater] New Value:', newValue);

    const result = {
        success: true,
        updatedFields: [],
        skippedFields: [],
        errors: [],
        startTime: Date.now()
    };

    // Quick validation
    if (!oldValue || !newValue || oldValue === newValue) {
        console.log('[AtomicUpdater] No change detected or values are same, skipping');
        result.message = 'No change to propagate';
        return result;
    }

    try {
        // Get affected sections from dependency graph
        const affectedSections = getAffectedSections(sourceSectionId);

        if (affectedSections.length === 0) {
            console.log('[AtomicUpdater] No dependent sections for:', sourceSectionId);
            result.message = 'No dependent sections';
            return result;
        }

        console.log('[AtomicUpdater] Affected sections:', affectedSections);

        // Fetch all fields from affected sections
        const { data: affectedFields, error: fetchError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('id, section_id, field_id, field_value, field_metadata')
            .eq('funnel_id', funnelId)
            .eq('is_current_version', true)
            .in('section_id', affectedSections);

        if (fetchError) {
            console.error('[AtomicUpdater] Error fetching affected fields:', fetchError);
            result.success = false;
            result.errors.push({ step: 'fetch', error: fetchError.message });
            return result;
        }

        console.log('[AtomicUpdater] Found', affectedFields?.length || 0, 'fields to check');

        if (!affectedFields || affectedFields.length === 0) {
            console.log('[AtomicUpdater] No fields found in affected sections');
            result.message = 'No dependent fields generated yet';
            return result;
        }

        // Process each field
        for (const field of affectedFields) {
            const updateResult = await updateFieldContent(field, oldValue, newValue, sourceSectionId, fieldId);

            if (updateResult.updated) {
                result.updatedFields.push({
                    sectionId: field.section_id,
                    fieldId: field.field_id,
                    replacementsCount: updateResult.replacementsCount
                });
            } else if (updateResult.skipped) {
                result.skippedFields.push(`${field.section_id}.${field.field_id}`);
            } else if (updateResult.error) {
                result.errors.push({
                    sectionId: field.section_id,
                    fieldId: field.field_id,
                    error: updateResult.error
                });
            }
        }

        result.duration = Date.now() - result.startTime;
        console.log('[AtomicUpdater] ========================================');
        console.log('[AtomicUpdater] Field update complete in', result.duration, 'ms');
        console.log('[AtomicUpdater] Updated:', result.updatedFields.length, 'fields');
        console.log('[AtomicUpdater] Skipped:', result.skippedFields.length, 'fields');
        console.log('[AtomicUpdater] Errors:', result.errors.length);

        return result;

    } catch (err) {
        console.error('[AtomicUpdater] Unexpected error:', err);
        result.success = false;
        result.errors.push({ step: 'unexpected', error: err.message });
        result.duration = Date.now() - result.startTime;
        return result;
    }
}

/**
 * Update a single field's value with string replacement
 */
async function updateFieldContent(field, oldValue, newValue, sourceSectionId, sourceFieldId) {
    const result = {
        updated: false,
        skipped: false,
        replacementsCount: 0,
        error: null
    };

    try {
        let fieldValueStr = '';

        // Handle different field_value types
        if (typeof field.field_value === 'string') {
            fieldValueStr = field.field_value;
        } else if (field.field_value !== null && field.field_value !== undefined) {
            fieldValueStr = JSON.stringify(field.field_value);
        } else {
            result.skipped = true;
            return result;
        }

        // Count occurrences before replacement
        const regex = new RegExp(escapeRegex(oldValue), 'gi'); // Case insensitive
        const matches = fieldValueStr.match(regex);
        const matchCount = matches ? matches.length : 0;

        if (matchCount === 0) {
            result.skipped = true;
            return result;
        }

        console.log(`[AtomicUpdater]   Field ${field.section_id}.${field.field_id}: ${matchCount} occurrences`);

        // Perform replacement
        const updatedValueStr = fieldValueStr.replace(regex, newValue);

        // Parse back if it was JSON
        let updatedValue;
        if (typeof field.field_value === 'string') {
            updatedValue = updatedValueStr;
        } else {
            try {
                updatedValue = JSON.parse(updatedValueStr);
            } catch {
                updatedValue = updatedValueStr;
            }
        }

        // Update metadata to track the auto-update
        const updatedMetadata = {
            ...field.field_metadata,
            lastAutoUpdate: {
                timestamp: new Date().toISOString(),
                source: `${sourceSectionId}.${sourceFieldId}`,
                replacedValue: oldValue,
                newValue: newValue,
                replacementsCount: matchCount
            }
        };

        // Save to database
        const { error: updateError } = await supabaseAdmin
            .from('vault_content_fields')
            .update({
                field_value: updatedValue,
                field_metadata: updatedMetadata,
                updated_at: new Date().toISOString()
            })
            .eq('id', field.id);

        if (updateError) {
            console.error(`[AtomicUpdater]   Error saving ${field.section_id}.${field.field_id}:`, updateError);
            result.error = updateError.message;
            return result;
        }

        console.log(`[AtomicUpdater]   ✓ Updated ${field.section_id}.${field.field_id} with ${matchCount} replacements`);
        result.updated = true;
        result.replacementsCount = matchCount;
        return result;

    } catch (err) {
        console.error(`[AtomicUpdater]   Error processing field:`, err);
        result.error = err.message;
        return result;
    }
}

export default {
    performAtomicUpdate,
    performFieldAtomicUpdate,
    getUpdateStatus
};
