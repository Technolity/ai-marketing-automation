import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getFieldDefinition, validateFieldValue } from '@/lib/vault/fieldStructures';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

/**
 * POST /api/os/vault-section-save
 *
 * Batch save multiple fields at once from Feedback Chat refinement.
 * Used when AI generates content for entire section or multiple fields.
 * Team members can save to their owner's vault
 *
 * Body: {
 *   funnel_id: string,
 *   section_id: string,
 *   fields: { [field_id]: field_value, ... }
 * }
 */
export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Resolve workspace (Team Member support)
    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);

    if (workspaceError) {
        return new Response(JSON.stringify({ error: workspaceError }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log(`[VaultSectionSave] Batch save for target user ${targetUserId} (Auth: ${userId})`);

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { funnel_id, section_id, fields } = body;

    // Validation
    if (!funnel_id || !section_id || !fields || typeof fields !== 'object') {
        return new Response(JSON.stringify({
            error: 'Missing required fields',
            required: ['funnel_id', 'section_id', 'fields (object)']
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const fieldIds = Object.keys(fields);
    if (fieldIds.length === 0) {
        return new Response(JSON.stringify({ error: 'No fields to save' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[VaultSectionSave] Batch save request:', {
        targetUserId,
        funnel_id,
        section_id,
        fieldCount: fieldIds.length,
        fieldIds
    });

    try {
        // Verify funnel ownership
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', funnel_id)
            .eq('user_id', targetUserId)
            .single();

        if (funnelError || !funnel) {
            return new Response(JSON.stringify({ error: 'Funnel not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get existing fields for this section
        const { data: existingFields } = await supabaseAdmin
            .from('vault_content_fields')
            .select('*')
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .eq('is_current_version', true);

        const existingFieldMap = {};
        (existingFields || []).forEach(f => {
            existingFieldMap[f.field_id] = f;
        });

        const savedFields = [];
        const errors = [];

        // Process each field
        for (const field_id of fieldIds) {
            let field_value = fields[field_id];

            // Skip null/undefined values
            if (field_value === null || field_value === undefined) {
                console.log('[VaultSectionSave] Skipping null field:', field_id);
                continue;
            }

            try {
                // Get field definition for validation
                const fieldDef = getFieldDefinition(section_id, field_id);

                // Validate if definition exists
                if (fieldDef) {
                    const validation = validateFieldValue(fieldDef, field_value);
                    if (!validation.valid) {
                        console.warn('[VaultSectionSave] Validation failed for', field_id, ':', validation.errors);
                        // Continue anyway - log warning but don't block save
                    }
                }

                // Serialize value for storage
                const serializedValue = Array.isArray(field_value)
                    ? JSON.stringify(field_value)
                    : (typeof field_value === 'object' && field_value !== null)
                        ? JSON.stringify(field_value)
                        : field_value;

                const currentField = existingFieldMap[field_id];

                if (!currentField) {
                    // CREATE new field
                    console.log('[VaultSectionSave] Creating new field:', field_id);

                    // Get next display_order
                    const maxOrder = Math.max(
                        0,
                        ...(existingFields || []).map(f => f.display_order || 0)
                    );

                    const { data: insertedField, error: insertError } = await supabaseAdmin
                        .from('vault_content_fields')
                        .insert({
                            funnel_id,
                            user_id: targetUserId,
                            section_id,
                            field_id,
                            field_label: fieldDef?.field_label || field_id,
                            field_value: serializedValue,
                            field_type: fieldDef?.field_type || 'text',
                            field_metadata: fieldDef?.field_metadata || {},
                            is_custom: false,
                            is_approved: false,
                            display_order: maxOrder + savedFields.length + 1,
                            version: 1,
                            is_current_version: true
                        })
                        .select()
                        .single();

                    if (insertError) {
                        errors.push({ field_id, error: insertError.message });
                        continue;
                    }

                    savedFields.push({ field_id, action: 'created', version: 1 });

                } else {
                    // UPDATE existing field (create new version)
                    console.log('[VaultSectionSave] Updating field:', field_id, 'version:', currentField.version);

                    // Mark current version as old
                    await supabaseAdmin
                        .from('vault_content_fields')
                        .update({ is_current_version: false })
                        .eq('id', currentField.id);

                    // Insert new version
                    const { data: newVersion, error: updateError } = await supabaseAdmin
                        .from('vault_content_fields')
                        .insert({
                            funnel_id,
                            user_id: targetUserId,
                            section_id,
                            field_id,
                            field_label: currentField.field_label,
                            field_value: serializedValue,
                            field_type: currentField.field_type,
                            field_metadata: currentField.field_metadata,
                            is_custom: currentField.is_custom,
                            is_approved: false, // Reset approval
                            display_order: currentField.display_order,
                            version: currentField.version + 1,
                            is_current_version: true
                        })
                        .select()
                        .single();

                    if (updateError) {
                        errors.push({ field_id, error: updateError.message });
                        continue;
                    }

                    savedFields.push({
                        field_id,
                        action: 'updated',
                        oldVersion: currentField.version,
                        newVersion: newVersion.version
                    });
                }

            } catch (fieldError) {
                console.error('[VaultSectionSave] Error processing field', field_id, ':', fieldError);
                errors.push({ field_id, error: fieldError.message });
            }
        }

        console.log('[VaultSectionSave] Batch save complete:', {
            saved: savedFields.length,
            errors: errors.length,
            savedFields: savedFields.map(f => f.field_id)
        });

        return new Response(JSON.stringify({
            success: true,
            saved: savedFields,
            errors: errors.length > 0 ? errors : undefined,
            summary: {
                total: fieldIds.length,
                saved: savedFields.length,
                failed: errors.length
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[VaultSectionSave] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
