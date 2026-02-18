import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { validateVaultContent, VAULT_SCHEMAS } from '@/lib/schemas/vaultSchemas';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { reconcileFromSection } from '@/lib/vault/reconcileVault';

export const dynamic = 'force-dynamic';

/**
 * POST /api/os/vault-field-update
 *
 * Update a single field in vault content and save to Supabase
 * This allows inline editing without regenerating entire sections
 * Team members can edit their owner's vault content
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

        // Resolve workspace (Team Member support)
        const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);

        if (workspaceError) {
            return NextResponse.json({ error: workspaceError }, { status: 403 });
        }

        console.log(`[VaultFieldUpdate] Updating for target user ${targetUserId} (Auth: ${userId})`);

        const { sessionId, sectionId, fieldPath, newValue } = await req.json();

        console.log(`[VaultFieldUpdate] User: ${targetUserId}, Section: ${sectionId}, Path: ${fieldPath}`);

        if (!sessionId || !sectionId || !fieldPath || newValue === undefined) {
            return NextResponse.json({
                error: 'Missing required fields',
                required: ['sessionId', 'sectionId', 'fieldPath', 'newValue']
            }, { status: 400 });
        }

        // 1. Verify funnel ownership
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', sessionId)
            .eq('user_id', targetUserId)
            .single();

        if (funnelError || !funnel) {
            return NextResponse.json({
                error: 'Funnel not found or access denied'
            }, { status: 404 });
        }

        // 2. Fetch current vault section content
        const { data: currentSection, error: fetchError } = await supabaseAdmin
            .from('vault_content')
            .select('id, content')
            .eq('funnel_id', sessionId)
            .eq('user_id', targetUserId)
            .eq('section_id', sectionId)
            .eq('is_current_version', true)
            .single();

        if (fetchError || !currentSection) {
            console.error('[VaultFieldUpdate] Failed to fetch section:', fetchError);
            return NextResponse.json({
                error: 'Section not found or access denied'
            }, { status: 404 });
        }

        const sectionContent = currentSection.content || {};

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
        const updatedContent = validation.success ? validation.data : updatedSection;

        const { error: updateError } = await supabaseAdmin
            .from('vault_content')
            .update({
                content: updatedContent,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentSection.id)
            .eq('user_id', targetUserId);

        if (updateError) {
            console.error('[VaultFieldUpdate] Update failed:', updateError);
            throw new Error('Failed to save to database');
        }

        // Note: content_edit_history table was removed; logging is handled by feedback_logs

        console.log('[VaultFieldUpdate] Success');

        // Reconcile granular fields from updated JSONB
        try {
            const reconcileResult = await reconcileFromSection(sessionId, sectionId, updatedContent, targetUserId);
            if (!reconcileResult?.success) {
                console.warn('[VaultFieldUpdate] Reconcile failed:', reconcileResult?.error);
            }
        } catch (reconcileError) {
            console.warn('[VaultFieldUpdate] Reconcile error:', reconcileError.message);
        }

        return NextResponse.json({
            success: true,
            message: 'Field updated successfully',
            updatedSection: updatedContent,
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

