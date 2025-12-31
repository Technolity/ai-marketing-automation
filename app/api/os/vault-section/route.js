import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { validateVaultContent, stripExtraFields } from '@/lib/schemas/vaultSchemas';

/**
 * PATCH /api/os/vault-section
 * Update a specific vault section's content
 * Used by AI Feedback Chat to persist refined content
 */
export async function PATCH(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sectionId, content, funnelId, sessionId } = body;

        // Support both funnelId and sessionId
        const providedId = funnelId || sessionId;

        console.log(`[VaultSection] Updating section: ${sectionId} for user: ${userId}, providedId: ${providedId}`);

        if (!sectionId || !content) {
            return NextResponse.json({
                error: 'Missing required fields: sectionId and content'
            }, { status: 400 });
        }

        // CRITICAL: Validate top-level keys for schema-specific sections BEFORE Zod validation
        const topLevelKeys = Object.keys(content);

        if (sectionId === 'setterScript') {
            if (!content.setterCallScript) {
                console.error('[VaultSection] WRONG SCHEMA: Missing setterCallScript, got:', topLevelKeys);
                return NextResponse.json({
                    error: 'Schema validation failed: Missing required "setterCallScript" key for Setter Script section',
                    details: `Found keys: ${topLevelKeys.join(', ')}`,
                    hint: 'The AI generated the wrong schema structure. Please regenerate this content.'
                }, { status: 422 });
            }
            if (content.closerCallScript) {
                console.error('[VaultSection] WRONG SCHEMA: Found closerCallScript in setterScript section!');
                return NextResponse.json({
                    error: 'Schema validation failed: Found "closerCallScript" in Setter Script section',
                    details: 'This section should only contain "setterCallScript", not "closerCallScript"',
                    hint: 'The AI mixed up Setter Script with Closer Script. Please regenerate this content.'
                }, { status: 422 });
            }
        }

        if (sectionId === 'salesScripts') {
            if (!content.closerCallScript) {
                console.error('[VaultSection] WRONG SCHEMA: Missing closerCallScript, got:', topLevelKeys);
                return NextResponse.json({
                    error: 'Schema validation failed: Missing required "closerCallScript" key for Sales/Closer Scripts section',
                    details: `Found keys: ${topLevelKeys.join(', ')}`,
                    hint: 'The AI generated the wrong schema structure. Please regenerate this content.'
                }, { status: 422 });
            }
            if (content.setterCallScript) {
                console.error('[VaultSection] WRONG SCHEMA: Found setterCallScript in salesScripts section!');
                return NextResponse.json({
                    error: 'Schema validation failed: Found "setterCallScript" in Sales/Closer Scripts section',
                    details: 'This section should only contain "closerCallScript", not "setterCallScript"',
                    hint: 'The AI mixed up Closer Script with Setter Script. Please regenerate this content.'
                }, { status: 422 });
            }
        }

        // SCHEMA VALIDATION: Validate content against schema
        let validatedContent = content;
        const validation = validateVaultContent(sectionId, content);

        if (!validation.success) {
            console.warn(`[VaultSection] Schema validation failed for ${sectionId}:`, validation.errors);
            // For non-critical errors, strip extra fields
            validatedContent = stripExtraFields(sectionId, content);
            console.log(`[VaultSection] Stripped extra fields from section ${sectionId}`);
        } else {
            console.log(`[VaultSection] Schema validation passed for ${sectionId}`);
            validatedContent = validation.data; // Use validated/sanitized data
        }

        // Find the target funnel (use provided ID or get active funnel)
        let targetFunnelId = providedId;

        if (!targetFunnelId) {
            const { data: activeFunnel } = await supabaseAdmin
                .from('user_funnels')
                .select('id')
                .eq('user_id', userId)
                .eq('is_active', true)
                .eq('is_deleted', false)
                .single();

            if (activeFunnel) {
                targetFunnelId = activeFunnel.id;
            } else {
                // Fallback: get latest funnel
                const { data: latestFunnel } = await supabaseAdmin
                    .from('user_funnels')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('is_deleted', false)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                if (latestFunnel) {
                    targetFunnelId = latestFunnel.id;
                }
            }
        }

        // If still no funnel, try to update saved_sessions instead
        if (!targetFunnelId) {
            console.log(`[VaultSection] No funnel found, trying saved_sessions`);
            
            // Try to find saved session
            const { data: session } = await supabaseAdmin
                .from('saved_sessions')
                .select('id, results_data')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();
            
            if (session) {
                // Update the results_data in saved_sessions
                const existingData = session.results_data || {};
                const updatedData = {
                    ...existingData,
                    [sectionId]: { data: validatedContent }
                };
                
                const { error: updateError } = await supabaseAdmin
                    .from('saved_sessions')
                    .update({ 
                        results_data: updatedData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', session.id);
                
                if (updateError) {
                    console.error('[VaultSection] Session update error:', updateError);
                    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
                }
                
                console.log(`[VaultSection] Updated section ${sectionId} in session ${session.id}`);
                return NextResponse.json({
                    success: true,
                    sectionId,
                    sessionId: session.id,
                    source: 'saved_sessions'
                });
            }
            
            return NextResponse.json({
                error: 'No funnel or session found for user'
            }, { status: 404 });
        }

        // Update the vault_content table
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from('vault_content')
            .select('id, content, version')
            .eq('funnel_id', targetFunnelId)
            .eq('section_id', sectionId)
            .eq('is_current_version', true)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[VaultSection] Fetch error:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 });
        }

        if (existing) {
            // Update existing record
            const { error: updateError } = await supabaseAdmin
                .from('vault_content')
                .update({
                    content: validatedContent,
                    updated_at: new Date().toISOString(),
                    version: (existing.version || 1) + 1
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('[VaultSection] Update error:', updateError);
                return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
            }

            console.log(`[VaultSection] Updated section ${sectionId} in funnel ${targetFunnelId}`);
        } else {
            // Insert new record (shouldn't happen often, but handle gracefully)
            const { error: insertError } = await supabaseAdmin
                .from('vault_content')
                .insert({
                    funnel_id: targetFunnelId,
                    user_id: userId,
                    section_id: sectionId,
                    section_title: sectionId,
                    content: validatedContent,
                    phase: 1,
                    status: 'generated',
                    is_current_version: true
                });

            if (insertError) {
                console.error('[VaultSection] Insert error:', insertError);
                return NextResponse.json({ error: 'Failed to create section' }, { status: 500 });
            }

            console.log(`[VaultSection] Created section ${sectionId} in funnel ${targetFunnelId}`);
        }

        return NextResponse.json({
            success: true,
            sectionId,
            funnelId: targetFunnelId
        });

    } catch (error) {
        console.error('[VaultSection] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
