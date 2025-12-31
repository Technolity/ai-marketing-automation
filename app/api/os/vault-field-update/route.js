import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { validateVaultContent, VAULT_SCHEMAS } from '@/lib/schemas/vaultSchemas';

/**
 * POST /api/os/vault-field-update
 *
 * Update a single field in vault content and save to Supabase
 * This allows inline editing without regenerating entire sections
 *
 * Request:
 * {
 *   sessionId: string,
 *   sectionId: string,
 *   fieldPath: string,  // e.g., "setterCallScript.quickOutline.callGoal"
 *   newValue: string | array | object
 * }
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId, sectionId, fieldPath, newValue } = await req.json();

        console.log(`[VaultFieldUpdate] User: ${userId}, Section: ${sectionId}, Path: ${fieldPath}`);

        if (!sessionId || !sectionId || !fieldPath || newValue === undefined) {
            return NextResponse.json({
                error: 'Missing required fields',
                required: ['sessionId', 'sectionId', 'fieldPath', 'newValue']
            }, { status: 400 });
        }

        // 1. Fetch current vault content
        const { data: currentSession, error: fetchError } = await supabaseAdmin
            .from('saved_sessions')
            .select('vault_content')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !currentSession) {
            console.error('[VaultFieldUpdate] Failed to fetch session:', fetchError);
            return NextResponse.json({
                error: 'Session not found or access denied'
            }, { status: 404 });
        }

        const vaultContent = currentSession.vault_content || {};
        const sectionContent = vaultContent[sectionId] || {};

        // 2. Update the specific field using path
        const updatedSection = setNestedValue(sectionContent, fieldPath, newValue);

        console.log('[VaultFieldUpdate] Updated section:', JSON.stringify(updatedSection).substring(0, 200));

        // 3. Validate updated section against schema
        const validation = validateVaultContent(sectionId, updatedSection);

        if (!validation.success) {
            console.warn('[VaultFieldUpdate] Schema validation failed:', validation.errors);
            // Allow save but warn user
            // return NextResponse.json({
            //     error: 'Schema validation failed',
            //     details: validation.errors,
            //     warning: 'Field updated but may not match expected schema'
            // }, { status: 422 });
        }

        // 4. Save to Supabase
        const newVaultContent = {
            ...vaultContent,
            [sectionId]: validation.success ? validation.data : updatedSection
        };

        const { error: updateError } = await supabaseAdmin
            .from('saved_sessions')
            .update({
                vault_content: newVaultContent,
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .eq('user_id', userId);

        if (updateError) {
            console.error('[VaultFieldUpdate] Update failed:', updateError);
            throw new Error('Failed to save to database');
        }

        // 5. Log to content_edit_history
        try {
            await supabaseAdmin.from('content_edit_history').insert({
                user_id: userId,
                vault_content_id: sessionId,
                funnel_id: sessionId,
                user_feedback_type: 'direct_edit',
                user_feedback_text: `Edited ${fieldPath}`,
                content_before: getNestedValue(sectionContent, fieldPath),
                content_after: newValue,
                sections_modified: [fieldPath],
                edit_applied: true
            });
        } catch (historyError) {
            console.log('[VaultFieldUpdate] Could not log to history:', historyError.message);
            // Non-blocking
        }

        console.log('[VaultFieldUpdate] Success');

        return NextResponse.json({
            success: true,
            message: 'Field updated successfully',
            updatedSection: validation.success ? validation.data : updatedSection,
            validationWarning: !validation.success ? 'Field may not match schema requirements' : null
        });

    } catch (error) {
        console.error('[VaultFieldUpdate] Error:', error);
        return NextResponse.json({
            error: 'Failed to update field',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Get nested value from object using dot notation path
 * e.g., "setterCallScript.quickOutline.callGoal"
 */
function getNestedValue(obj, path) {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current === undefined || current === null) return undefined;
        current = current[key];
    }

    return current;
}

/**
 * Set nested value in object using dot notation path
 * Returns a new object with the updated value (immutable)
 */
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const result = JSON.parse(JSON.stringify(obj)); // Deep clone

    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }

    // Set the final value
    current[keys[keys.length - 1]] = value;

    return result;
}

// GET endpoint for documentation
export async function GET() {
    return NextResponse.json({
        endpoint: '/api/os/vault-field-update',
        method: 'POST',
        description: 'Update a single field in vault content with inline editing',
        body: {
            sessionId: 'string (required) - Session ID',
            sectionId: 'string (required) - Vault section ID',
            fieldPath: 'string (required) - Dot notation path to field (e.g., "setterCallScript.quickOutline.callGoal")',
            newValue: 'any (required) - New value for the field'
        }
    });
}
