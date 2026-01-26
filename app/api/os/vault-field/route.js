import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getFieldDefinition, validateFieldValue } from '@/lib/vault/fieldStructures';
import { generateWithProvider } from '@/lib/ai/sharedAiUtils';
import { parseJsonSafe } from '@/lib/utils/jsonParser';


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
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 🔥 FIX: Handle nested field paths (e.g., "optinPage.headline_text")
    const isNestedField = field_id.includes('.');
    const parentFieldId = isNestedField ? field_id.split('.')[0] : field_id;
    const childFieldId = isNestedField ? field_id.split('.')[1] : null;

    console.log('[VaultField PATCH] Updating field:', {
        userId,
        funnel_id,
        section_id,
        field_id,
        isNestedField,
        parentFieldId,
        childFieldId,
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

        // 🔥 FIX: Fetch the PARENT field when dealing with nested paths
        const dbFieldId = isNestedField ? parentFieldId : field_id;

        const { data: currentField, error: fetchError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('*')
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .eq('field_id', dbFieldId)  // Use parent field ID for database lookup
            .eq('is_current_version', true)
            .single();

        // 🔥 FIX: Merge nested field value into parent object
        let finalFieldValue = field_value;

        if (isNestedField && currentField) {
            // Parse parent object value
            let parentObject = {};
            if (typeof currentField.field_value === 'string') {
                try {
                    parentObject = JSON.parse(currentField.field_value);
                } catch (e) {
                    console.warn('[VaultField PATCH] Failed to parse parent object, using empty object');
                }
            } else if (typeof currentField.field_value === 'object' && currentField.field_value !== null) {
                parentObject = { ...currentField.field_value };
            }

            // Update the child field within parent object
            parentObject[childFieldId] = field_value;
            finalFieldValue = parentObject;

            console.log('[VaultField PATCH] Merged nested field into parent:', {
                parentFieldId,
                childFieldId,
                mergedObject: Object.keys(parentObject)
            });
        }

        // Validate field value if field definition exists
        const fieldDef = getFieldDefinition(section_id, dbFieldId);
        if (fieldDef) {
            const validation = validateFieldValue(fieldDef, finalFieldValue);
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

        // Serialize field_value for storage (arrays to JSON strings)
        const serializedValue = Array.isArray(finalFieldValue)
            ? JSON.stringify(finalFieldValue)
            : (typeof finalFieldValue === 'object' && finalFieldValue !== null)
                ? JSON.stringify(finalFieldValue)
                : finalFieldValue;

        let newVersion;

        // UPSERT LOGIC: Handle both new fields and existing fields
        if (!currentField || fetchError) {
            // Field doesn't exist yet - CREATE IT
            console.log('[VaultField PATCH] Creating new field (first save):', { field_id: dbFieldId });

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
                    field_id: dbFieldId,  // 🔥 FIX: Use parent field_id
                    field_label: fieldStructure.field_label || dbFieldId,
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
                console.error('[VaultField PATCH] Insert error:', insertError);
                throw insertError;
            }

            newVersion = insertedField;
            console.log('[VaultField PATCH] New field created:', { field_id: dbFieldId, version: 1 });

        } else {
            // Field exists - VERSION IT
            console.log('[VaultField PATCH] Versioning existing field:', { field_id: dbFieldId, currentVersion: currentField.version });

            // Mark current version as old
            await supabaseAdmin
                .from('vault_content_fields')
                .update({ is_current_version: false })
                .eq('id', currentField.id);

            // Insert new version
            const { data: insertedField, error: insertError } = await supabaseAdmin
                .from('vault_content_fields')
                .insert({
                    funnel_id,
                    user_id: userId,
                    section_id,
                    field_id: dbFieldId,  // 🔥 FIX: Use parent field_id
                    field_label: currentField.field_label,
                    field_value: serializedValue,
                    field_type: currentField.field_type,
                    field_metadata: currentField.field_metadata,
                    is_custom: currentField.is_custom,
                    is_approved: false, // Reset approval on edit
                    display_order: currentField.display_order,
                    version: currentField.version + 1,
                    is_current_version: true
                })
                .select()
                .single();

            if (insertError) {
                console.error('[VaultField PATCH] Insert error:', insertError);
                throw insertError;
            }

            newVersion = insertedField;
            console.log('[VaultField PATCH] Field updated successfully:', {
                field_id: dbFieldId,
                oldVersion: currentField.version,
                newVersion: newVersion.version
            });
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

