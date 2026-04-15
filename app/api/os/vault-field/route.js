import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getFieldDefinition, validateFieldValue } from '@/lib/vault/fieldStructures';
import { parseJsonSafe } from '@/lib/utils/jsonParser';
import { performFieldAtomicUpdate } from '@/lib/vault/atomicUpdater';
import { isAtomicField } from '@/lib/vault/dependencyGraph';
import { reconcileFromFields } from '@/lib/vault/reconcileVault';


/**
 * Extract a URL from HTML embed code (iframe, embed, video, img, script tags).
 * If the input is already a plain URL or doesn't contain recognisable embed markup,
 * the original value is returned unchanged.
 */
function extractUrlFromEmbed(value) {
    if (typeof value !== 'string') return value;

    const trimmed = value.trim();

    // Quick check: if it doesn't look like HTML, return as-is
    if (!trimmed.includes('<')) return trimmed;

    // Match src="..." or src='...' inside common embed tags
    const srcMatch = trimmed.match(/<(?:iframe|embed|video|img|source|script)[^>]*\ssrc=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
        console.log('[VaultField] Extracted URL from embed code:', srcMatch[1]);
        return srcMatch[1];
    }

    // Fallback: try to find any URL-like string inside the markup
    const urlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
    if (urlMatch && urlMatch[0]) {
        console.log('[VaultField] Extracted URL via fallback regex:', urlMatch[0]);
        return urlMatch[0];
    }

    return trimmed;
}

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
        field_value: rawFieldValue
    } = body;

    // Auto-extract URL from embed code if user pasted full HTML (e.g. <iframe src="...">)
    const field_value = (typeof rawFieldValue === 'string') ? extractUrlFromEmbed(rawFieldValue) : rawFieldValue;

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

        // NESTED FIELD DETECTION: Handle fields like \"optinPage.headline_text\"
        let actualFieldId = field_id;
        let actualFieldValue = field_value;
        const directFieldDef = getFieldDefinition(section_id, field_id);
        let isNestedField = field_id.includes('.') && !directFieldDef;

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
            // Safety: unwrap if field_value is a wrapper object containing childId
            // e.g., field_value = {body: "<p>..."} for childId "body" → extract just the string
            let childValue = field_value;
            if (childValue && typeof childValue === 'object' && !Array.isArray(childValue)) {
                if (childId in childValue && Object.keys(childValue).length === 1) {
                    console.log('[VaultField PATCH] Unwrapping nested value wrapper:', { childId, wrappedType: typeof childValue[childId] });
                    childValue = childValue[childId];
                }
            }
            parentObject[childId] = childValue;

            // Update variables to save the merged parent object
            actualFieldId = parentId;
            actualFieldValue = parentObject;

            console.log('[VaultField PATCH] Merged parent object:', {
                parentId,
                childId,
                updatedValue: JSON.stringify(parentObject).substring(0, 200)
            });
        }

        // Validate field value if field definition exists (use actualFieldValue for validation)
        const fieldDef = getFieldDefinition(section_id, actualFieldId);
        if (fieldDef) {
            // IMPORTANT: If the value is a JSON string (e.g. sent as serialized array/object
            // from the frontend), parse it back before validation so array/object type checks
            // work correctly. Without this, a stringified array fails Array.isArray() and
            // triggers spurious "needs more items" validation errors.
            let valueForValidation = actualFieldValue;
            if (
                typeof actualFieldValue === 'string' &&
                (fieldDef.field_type === 'array' || fieldDef.field_type === 'object')
            ) {
                try {
                    valueForValidation = JSON.parse(actualFieldValue);
                } catch (e) {
                    // Keep original string if JSON parsing fails — validator will flag type error
                }
            }

            const validation = validateFieldValue(fieldDef, valueForValidation);
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


        // Fetch old field value BEFORE the upsert (needed for atomic dependency propagation)
        let currentField = null;
        const { data: preUpdateField } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_value')
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .eq('field_id', actualFieldId)
            .eq('is_current_version', true)
            .maybeSingle();

        if (preUpdateField) {
            currentField = preUpdateField;
        }

        // ATOMIC UPSERT via Postgres RPC — handles both new and existing fields
        // in a single transaction with row-level locking to prevent race conditions.
        console.log('[VaultField PATCH] Calling atomic upsert RPC:', { field_id: actualFieldId, isNested: isNestedField });

        // ─── SKIP UNCHANGED FIELDS ───────────────────────────
        // Prevent unnecessary version bumps if the value hasn't changed.
        if (currentField && currentField.field_value !== undefined) {
            const normalizeValue = (val) => {
                if (typeof val === 'string') {
                    try { return JSON.parse(val); } catch (e) { return val; }
                }
                return val;
            };

            const normalizedExisting = normalizeValue(currentField.field_value);
            const normalizedIncoming = normalizeValue(actualFieldValue);

            const existingValueNormalized = typeof normalizedExisting === 'object' && normalizedExisting !== null
                ? JSON.stringify(normalizedExisting)
                : String(normalizedExisting);

            const incomingValueNormalized = typeof normalizedIncoming === 'object' && normalizedIncoming !== null
                ? JSON.stringify(normalizedIncoming)
                : String(normalizedIncoming);

            if (existingValueNormalized === incomingValueNormalized) {
                console.log('[VaultField PATCH] Skipping unchanged field:', actualFieldId, '(version preserved)');
                return new Response(JSON.stringify({
                    success: true,
                    skipped: true,
                    message: "Value unchanged",
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        // ─────────────────────────────────────────────────────

        const rpcArgs = {
            p_funnel_id: funnel_id,
            p_user_id: userId,
            p_section_id: section_id,
            p_field_id: actualFieldId,
            p_field_value: typeof serializedValue === 'string' ? serializedValue : JSON.stringify(serializedValue),
        };

        // Pass field metadata for new fields
        if (fieldDef) {
            rpcArgs.p_field_label = fieldDef.field_label || actualFieldId;
            rpcArgs.p_field_type = fieldDef.field_type || 'text';
            rpcArgs.p_field_metadata = fieldDef.field_metadata || {};
            rpcArgs.p_is_custom = fieldDef.is_custom || false;
        }

        const { data: rpcResult, error: rpcError } = await supabaseAdmin
            .rpc('upsert_vault_field_version', rpcArgs);

        if (rpcError) {
            console.error('[VaultField PATCH] Atomic upsert RPC failed:', rpcError);
            throw new Error(`Atomic upsert failed: ${rpcError.message}`);
        }

        console.log('[VaultField PATCH] Atomic upsert succeeded:', rpcResult);

        // Build a newVersion-like object for the response and downstream logic
        const newVersion = {
            id: rpcResult.id,
            version: rpcResult.version,
            field_id: rpcResult.field_id,
            field_value: actualFieldValue,
        };

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
