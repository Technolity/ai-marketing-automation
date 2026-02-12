import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getFieldDefinition, validateFieldValue } from '@/lib/vault/fieldStructures';
import { generateWithProvider } from '@/lib/ai/sharedAiUtils';
import { parseJsonSafe } from '@/lib/utils/jsonParser';
import { performFieldAtomicUpdate } from '@/lib/vault/atomicUpdater';
import { isAtomicField } from '@/lib/vault/dependencyGraph';
import { reconcileFromFields } from '@/lib/vault/reconcileVault';


export const dynamic = 'force-dynamic';

/**
 * POST /api/os/vault-field
 * Create a new custom field (user-added) with optional AI generation
 */
export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const {
        funnel_id,
        section_id,
        field_id,
        field_label,
        field_value,
        field_type,
        field_metadata,
        is_custom = true,
        use_ai = false
    } = body;

    // Validation
    if (!funnel_id || !section_id || !field_id || !field_label || !field_type) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[VaultField POST] Creating custom field:', {
        userId,
        funnel_id,
        section_id,
        field_id,
        field_label,
        field_type,
        is_custom,
        use_ai
    });

    try {
        // Verify funnel ownership
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', funnel_id)
            .eq('user_id', userId)
            .single();

        if (funnelError || !funnel) {
            return new Response(JSON.stringify({ error: 'Funnel not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let finalFieldValue = field_value;

        // AI Generation if requested
        if (use_ai && is_custom) {
            console.log('[VaultField POST] AI generation requested for custom field');

            // Fetch existing section content for context
            const { data: existingFields } = await supabaseAdmin
                .from('vault_content_fields')
                .select('field_id, field_label, field_value')
                .eq('funnel_id', funnel_id)
                .eq('section_id', section_id)
                .eq('is_current_version', true);

            // Build context from existing fields
            const contextLines = (existingFields || []).map(f =>
                `${f.field_label}: ${JSON.stringify(f.field_value)}`
            ).join('\n');

            const prompt = `You are helping create a new custom field for a business marketing document.

SECTION: ${section_id}
NEW FIELD LABEL: ${field_label}
FIELD TYPE: ${field_type}

EXISTING CONTENT IN THIS SECTION:
${contextLines || 'No existing content yet'}

Based on the existing content, generate appropriate content for this new field.

RULES:
- Return ONLY valid JSON
- For text/textarea fields: return a string
- For array fields: return an array of strings (at least 1 item)
- Content should be relevant and consistent with existing content
- Be specific and actionable

OUTPUT FORMAT:
{
  "field_value": <your generated content>
}`;

            try {
                const aiResponse = await generateWithProvider(
                    "You are an elite business strategist. Return ONLY valid JSON.",
                    prompt,
                    {
                        jsonMode: true,
                        maxTokens: 1000,
                        timeout: 30000
                    }
                );

                const parsed = parseJsonSafe(aiResponse);
                if (parsed && parsed.field_value) {
                    finalFieldValue = parsed.field_value;
                    console.log('[VaultField POST] AI generated content:', { field_value: finalFieldValue });
                }
            } catch (aiError) {
                console.error('[VaultField POST] AI generation failed:', aiError.message);
                // Continue with user-provided value if AI fails
            }
        }

        // Get next display_order
        const { data: maxOrderField } = await supabaseAdmin
            .from('vault_content_fields')
            .select('display_order')
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

        const display_order = (maxOrderField?.display_order || 0) + 1;

        // Insert new field
        const { data: newField, error: insertError } = await supabaseAdmin
            .from('vault_content_fields')
            .insert({
                funnel_id,
                user_id: userId,
                section_id,
                field_id,
                field_label,
                field_value: finalFieldValue,
                field_type,
                field_metadata: field_metadata || {},
                is_custom,
                is_approved: false,
                display_order,
                version: 1,
                is_current_version: true
            })
            .select()
            .single();

        if (insertError) {
            console.error('[VaultField POST] Insert error:', insertError);
            throw insertError;
        }

        console.log('[VaultField POST] Custom field created successfully:', newField.id);

        return new Response(JSON.stringify({
            success: true,
            field: newField
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[VaultField POST] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * PATCH /api/os/vault-field
 * Update an existing field value (auto-save from frontend)
 */
export async function PATCH(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        console.error('[VaultField PATCH] Invalid JSON body:', e.message);
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const {
        funnel_id,
        section_id,
        field_id,
        field_value
    } = body;

    // Validation
    if (!funnel_id || !section_id || !field_id || field_value === undefined) {
        console.error('[VaultField PATCH] Missing required fields:', {
            has_funnel_id: !!funnel_id,
            has_section_id: !!section_id,
            has_field_id: !!field_id,
            has_field_value: field_value !== undefined,
            body_keys: Object.keys(body)
        });
        return new Response(JSON.stringify({ error: 'Missing required fields', details: { funnel_id: !!funnel_id, section_id: !!section_id, field_id: !!field_id, field_value: field_value !== undefined } }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[VaultField PATCH] Updating field:', {
        userId,
        funnel_id,
        section_id,
        field_id,
        valueType: typeof field_value,
        valuePreview: JSON.stringify(field_value).substring(0, 100)
    });

    try {
        // Verify funnel ownership
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', funnel_id)
            .eq('user_id', userId)
            .single();

        if (funnelError || !funnel) {
            return new Response(JSON.stringify({ error: 'Funnel not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // NESTED FIELD DETECTION: Handle fields like "optinPage.headline_text"
        let actualFieldId = field_id;
        let actualFieldValue = field_value;
        let isNestedField = field_id.includes('.');

        if (isNestedField) {
            // Split into parent and child (e.g., "optinPage.headline_text" -> "optinPage" + "headline_text")
            const [parentId, childId] = field_id.split('.');
            console.log('[VaultField PATCH] Nested field detected:', { parentId, childId });

            // Fetch the parent field
            const { data: parentField, error: parentError } = await supabaseAdmin
                .from('vault_content_fields')
                .select('*')
                .eq('funnel_id', funnel_id)
                .eq('section_id', section_id)
                .eq('field_id', parentId)
                .eq('is_current_version', true)
                .single();

            if (parentError || !parentField) {
                console.error('[VaultField PATCH] Parent field not found:', { parentId, error: parentError });
                return new Response(JSON.stringify({
                    error: `Parent field '${parentId}' not found. Cannot update nested field.`
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Parse parent object value
            let parentObject = {};
            if (typeof parentField.field_value === 'string') {
                try {
                    parentObject = JSON.parse(parentField.field_value);
                } catch (e) {
                    console.error('[VaultField PATCH] Failed to parse parent value:', e);
                }
            } else if (typeof parentField.field_value === 'object' && parentField.field_value !== null) {
                parentObject = { ...parentField.field_value };
            }

            // Update the child property
            parentObject[childId] = field_value;

            // Update variables to save the merged parent object
            actualFieldId = parentId;
            actualFieldValue = parentObject;

            console.log('[VaultField PATCH] Merged parent object:', {
                parentId,
                childId,
                updatedValue: JSON.stringify(parentObject).substring(0, 200)
            });
        }

        // Get current field for validation and versioning (using actual field ID)
        let currentField = null;
        let fetchError = null;

        // First try: find current active version
        const { data: activeField, error: activeError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('*')
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .eq('field_id', actualFieldId)
            .eq('is_current_version', true)
            .single();

        if (activeField) {
            currentField = activeField;
        } else {
            // Fallback: find highest version (handles orphaned fields where is_current_version was set to false but new version never created)
            const { data: latestField } = await supabaseAdmin
                .from('vault_content_fields')
                .select('*')
                .eq('funnel_id', funnel_id)
                .eq('section_id', section_id)
                .eq('field_id', actualFieldId)
                .order('version', { ascending: false })
                .limit(1)
                .single();

            if (latestField) {
                console.warn('[VaultField PATCH] No current version found, using highest version as base:', { field_id: actualFieldId, version: latestField.version, is_current_version: latestField.is_current_version });
                currentField = latestField;
            } else {
                fetchError = activeError;
            }
        }

        // Validate field value if field definition exists (use actualFieldValue for validation)
        const fieldDef = getFieldDefinition(section_id, actualFieldId);
        if (fieldDef) {
            const validation = validateFieldValue(fieldDef, actualFieldValue);
            if (!validation.valid) {
                console.warn('[VaultField PATCH] Validation failed:', validation.errors);
                return new Response(JSON.stringify({
                    error: 'Validation failed',
                    validationErrors: validation.errors
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Serialize field_value for storage (arrays to JSON strings) - use actualFieldValue
        const serializedValue = Array.isArray(actualFieldValue)
            ? JSON.stringify(actualFieldValue)
            : (typeof actualFieldValue === 'object' && actualFieldValue !== null)
                ? JSON.stringify(actualFieldValue)
                : actualFieldValue;

        let newVersion;

        // UPSERT LOGIC: Handle both new fields and existing fields
        if (!currentField || fetchError) {
            // Field doesn't exist yet - CREATE IT
            console.log('[VaultField PATCH] Creating new field (first save):', { field_id: actualFieldId, isNested: isNestedField });

            // Get field definition for defaults
            const fieldStructure = fieldDef || {};

            // Get next display_order
            const { data: maxOrderField } = await supabaseAdmin
                .from('vault_content_fields')
                .select('display_order')
                .eq('funnel_id', funnel_id)
                .eq('section_id', section_id)
                .order('display_order', { ascending: false })
                .limit(1)
                .single();

            const display_order = (maxOrderField?.display_order || 0) + 1;

            const { data: insertedField, error: insertError } = await supabaseAdmin
                .from('vault_content_fields')
                .insert({
                    funnel_id,
                    user_id: userId,
                    section_id,
                    field_id: actualFieldId,
                    field_label: fieldStructure.field_label || actualFieldId,
                    field_value: serializedValue,
                    field_type: fieldStructure.field_type || 'text',
                    field_metadata: fieldStructure.field_metadata || {},
                    is_custom: fieldStructure.is_custom || false,
                    is_approved: false,
                    display_order,
                    version: 1,
                    is_current_version: true
                })
                .select()
                .single();

            if (insertError) {
                if (insertError.code === '23505') {
                    // Field already exists (orphaned or stale) - find highest version and version it
                    console.warn('[VaultField PATCH] New field insert hit 23505, falling back to versioning:', { field_id: actualFieldId });

                    const { data: existingField } = await supabaseAdmin
                        .from('vault_content_fields')
                        .select('*')
                        .eq('funnel_id', funnel_id)
                        .eq('section_id', section_id)
                        .eq('field_id', actualFieldId)
                        .order('version', { ascending: false })
                        .limit(1)
                        .single();

                    if (existingField) {
                        // Mark existing as old
                        await supabaseAdmin
                            .from('vault_content_fields')
                            .update({ is_current_version: false })
                            .eq('id', existingField.id);

                        // Insert new version
                        const { data: versionedField, error: versionError } = await supabaseAdmin
                            .from('vault_content_fields')
                            .insert({
                                funnel_id,
                                user_id: userId,
                                section_id,
                                field_id: actualFieldId,
                                field_label: existingField.field_label || fieldStructure.field_label || actualFieldId,
                                field_value: serializedValue,
                                field_type: existingField.field_type || fieldStructure.field_type || 'text',
                                field_metadata: existingField.field_metadata || fieldStructure.field_metadata || {},
                                is_custom: existingField.is_custom || false,
                                is_approved: false,
                                display_order: existingField.display_order || display_order,
                                version: existingField.version + 1,
                                is_current_version: true
                            })
                            .select()
                            .single();

                        if (versionError) {
                            console.error('[VaultField PATCH] Fallback versioning also failed:', versionError);
                            throw versionError;
                        }

                        newVersion = versionedField;
                        console.log('[VaultField PATCH] Fallback versioning succeeded:', { field_id: actualFieldId, version: versionedField.version });
                    } else {
                        console.error('[VaultField PATCH] 23505 but cannot find existing field:', actualFieldId);
                        throw insertError;
                    }
                } else {
                    console.error('[VaultField PATCH] Insert error:', insertError);
                    throw insertError;
                }
            } else {
                newVersion = insertedField;
                console.log('[VaultField PATCH] New field created:', { field_id: actualFieldId, version: 1, isNested: isNestedField });
            }

        } else {
            // Field exists - VERSION IT (with retry for concurrent requests)
            const MAX_RETRIES = 3;
            let retries = 0;
            let latestField = currentField;

            while (retries < MAX_RETRIES) {
                console.log('[VaultField PATCH] Versioning existing field:', { field_id: actualFieldId, currentVersion: latestField.version, isNested: isNestedField, attempt: retries + 1 });

                // Mark current version as old
                await supabaseAdmin
                    .from('vault_content_fields')
                    .update({ is_current_version: false })
                    .eq('id', latestField.id);

                // Insert new version
                const { data: insertedField, error: insertError } = await supabaseAdmin
                    .from('vault_content_fields')
                    .insert({
                        funnel_id,
                        user_id: userId,
                        section_id,
                        field_id: actualFieldId,
                        field_label: latestField.field_label,
                        field_value: serializedValue,
                        field_type: latestField.field_type,
                        field_metadata: latestField.field_metadata,
                        is_custom: latestField.is_custom,
                        is_approved: false, // Reset approval on edit
                        display_order: latestField.display_order,
                        version: latestField.version + 1,
                        is_current_version: true
                    })
                    .select()
                    .single();

                if (insertError) {
                    if (insertError.code === '23505' && retries < MAX_RETRIES - 1) {
                        // Duplicate key - concurrent request already versioned this field
                        console.warn('[VaultField PATCH] Duplicate version detected, retrying...', { field_id: actualFieldId, attemptedVersion: latestField.version + 1 });
                        retries++;

                        // Re-fetch the latest version
                        const { data: refetched } = await supabaseAdmin
                            .from('vault_content_fields')
                            .select('*')
                            .eq('funnel_id', funnel_id)
                            .eq('section_id', section_id)
                            .eq('field_id', actualFieldId)
                            .eq('is_current_version', true)
                            .single();

                        if (refetched) {
                            latestField = refetched;
                        } else {
                            // No current version found — find the highest version
                            const { data: maxVersion } = await supabaseAdmin
                                .from('vault_content_fields')
                                .select('*')
                                .eq('funnel_id', funnel_id)
                                .eq('section_id', section_id)
                                .eq('field_id', actualFieldId)
                                .order('version', { ascending: false })
                                .limit(1)
                                .single();

                            if (maxVersion) {
                                latestField = maxVersion;
                            } else {
                                console.error('[VaultField PATCH] Cannot find any version of field:', actualFieldId);
                                throw insertError;
                            }
                        }
                        continue;
                    }
                    console.error('[VaultField PATCH] Insert error:', insertError);
                    throw insertError;
                }

                newVersion = insertedField;
                console.log('[VaultField PATCH] Field updated successfully:', {
                    field_id: actualFieldId,
                    originalFieldId: field_id,
                    oldVersion: latestField.version,
                    newVersion: newVersion.version,
                    isNested: isNestedField
                });
                break; // Success - exit retry loop
            }
        }

        // ATOMIC UPDATE: Check if this is an atomic field and trigger propagation (fire-and-forget)
        if (currentField && currentField.field_value !== undefined) {
            const oldFieldValue = typeof currentField.field_value === 'string'
                ? currentField.field_value
                : JSON.stringify(currentField.field_value);
            const newFieldValue = typeof actualFieldValue === 'string'
                ? actualFieldValue
                : JSON.stringify(actualFieldValue);

            if (isAtomicField(section_id, actualFieldId) && oldFieldValue !== newFieldValue) {
                console.log('[VaultField PATCH] Triggering atomic dependency update for:', section_id, actualFieldId);

                // Fire and forget - don't await
                performFieldAtomicUpdate(funnel_id, section_id, actualFieldId, oldFieldValue, newFieldValue)
                    .then(result => {
                        if (result.updatedFields?.length > 0) {
                            console.log('[VaultField PATCH] Atomic update completed:', {
                                updated: result.updatedFields.length,
                                duration: result.duration + 'ms'
                            });
                        } else {
                            console.log('[VaultField PATCH] No downstream fields needed atomic update');
                        }
                    })
                    .catch(err => {
                        console.error('[VaultField PATCH] Atomic update failed:', err);
                    });
            }
        }

        // Reconcile JSONB content with latest field edits
        try {
            const reconcileResult = await reconcileFromFields(funnel_id, section_id, userId);
            if (!reconcileResult?.success) {
                console.warn('[VaultField PATCH] Reconcile failed:', reconcileResult?.error);
            }
        } catch (reconcileError) {
            console.warn('[VaultField PATCH] Reconcile error:', reconcileError.message);
        }

        return new Response(JSON.stringify({
            success: true,
            field: newVersion,
            version: newVersion.version
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[VaultField PATCH] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
