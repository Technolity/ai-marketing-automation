/**
 * Vault Reconciliation Helpers
 *
 * Keeps vault_content (JSONB) and vault_content_fields (granular) in sync.
 * - reconcileFromFields: merge granular fields into JSONB content
 * - reconcileFromSection: populate granular fields from JSONB content
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { populateVaultFields } from '@/lib/vault/fieldMapper';

const SECTION_WRAPPERS = {
    facebookAds: 'facebookAds',
    emails: 'emailSequence',
    sms: 'smsSequence',
    appointmentReminders: 'appointmentReminders'
};

const FIELD_PATHS = {
    idealClient: {
        bestIdealClient: [['idealClientSnapshot', 'bestIdealClient']],
        top3Challenges: [['idealClientSnapshot', 'topChallenges'], ['idealClientSnapshot', 'top3Challenges']],
        whatTheyWant: [['idealClientSnapshot', 'whatTheyWant'], ['idealClientSnapshot', 'top3Desires']],
        whatMakesThemPay: [['idealClientSnapshot', 'whatMakesThemPay'], ['idealClientSnapshot', 'topTriggers']],
        howToTalkToThem: [['idealClientSnapshot', 'howToTalkToThem'], ['idealClientSnapshot', 'wordsTheyUse']]
    },
    message: {
        oneLineMessage: [['oneLineMessage'], ['signatureMessage', 'oneLiner'], ['signatureMessage', 'oneLineMessage']],
        spokenIntroduction: [['spokenIntroduction'], ['signatureMessage', 'spokenVersion'], ['signatureMessage', 'spokenIntroduction']],
        powerPositioningLines: [['powerPositioningLines'], ['signatureMessage', 'powerPositioningLines']]
    },
    story: {
        bigIdea: [['bigIdea'], ['signatureStory', 'bigIdea'], ['signatureStory', 'coreConcept']],
        networkingStory: [['networkingStory'], ['signatureStory', 'networkingStory']],
        stageStory: [['stageStory'], ['signatureStory', 'stageStory'], ['signatureStory', 'fullStory']],
        oneLinerStory: [['oneLinerStory'], ['signatureStory', 'oneLinerStory']],
        socialPostVersion: [['socialPostVersion'], ['signatureStory', 'socialPostVersion']],
        pullQuotes: [['pullQuotes'], ['signatureStory', 'pullQuotes']],
        emailStory: [['emailStory'], ['signatureStory', 'emailStory']]
    },
    offer: {
        offerMode: [['offerMode'], ['signatureOffer', 'offerMode']],
        offerName: [['offerName'], ['signatureOffer', 'offerName']],
        sevenStepBlueprint: [['sevenStepBlueprint'], ['signatureOffer', 'sevenStepBlueprint']],
        tier1WhoItsFor: [['tier1WhoItsFor'], ['signatureOffer', 'tier1WhoItsFor'], ['signatureOffer', 'whoItsFor']],
        tier1Promise: [['tier1Promise'], ['signatureOffer', 'tier1Promise'], ['signatureOffer', 'thePromise']],
        tier1Timeframe: [['tier1Timeframe'], ['signatureOffer', 'tier1Timeframe']],
        tier1Deliverables: [['tier1Deliverables'], ['signatureOffer', 'tier1Deliverables'], ['signatureOffer', 'whatTheyGet']],
        tier1RecommendedPrice: [['tier1RecommendedPrice'], ['signatureOffer', 'tier1RecommendedPrice'], ['signatureOffer', 'recommendedPrice']],
        tier2WhoItsFor: [['tier2WhoItsFor'], ['signatureOffer', 'tier2WhoItsFor']],
        tier2Promise: [['tier2Promise'], ['signatureOffer', 'tier2Promise']],
        tier2Timeframe: [['tier2Timeframe'], ['signatureOffer', 'tier2Timeframe']],
        tier2Deliverables: [['tier2Deliverables'], ['signatureOffer', 'tier2Deliverables']],
        tier2RecommendedPrice: [['tier2RecommendedPrice'], ['signatureOffer', 'tier2RecommendedPrice']],
        offerPromise: [['offerPromise'], ['signatureOffer', 'offerPromise']]
    },
    leadMagnet: {
        mainTitle: [['leadMagnet', 'concept', 'title'], ['leadMagnet', 'titleAndHook', 'mainTitle'], ['leadMagnet', 'mainTitle']],
        subtitle: [['leadMagnet', 'concept', 'subtitle'], ['leadMagnet', 'titleAndHook', 'subtitle'], ['leadMagnet', 'subtitle']],
        coreDeliverables: [['leadMagnet', 'coreDeliverables']],
        optInHeadline: [['leadMagnet', 'landingPageCopy', 'headline'], ['leadMagnet', 'leadMagnetCopy', 'headline']],
        bullets: [['leadMagnet', 'landingPageCopy', 'bulletPoints'], ['leadMagnet', 'leadMagnetCopy', 'bulletPoints']],
        ctaButtonText: [['leadMagnet', 'landingPageCopy', 'ctaButton'], ['leadMagnet', 'leadMagnetCopy', 'ctaButton']]
    },
    colors: {
        colorPalette: [['colorPalette']]
    }
};

function hasPath(obj, path) {
    let current = obj;
    for (const key of path) {
        if (!current || typeof current !== 'object' || !(key in current)) {
            return false;
        }
        current = current[key];
    }
    return true;
}

function setNestedValue(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    current[path[path.length - 1]] = value;
}

function pickPath(existingContent, paths) {
    for (const path of paths) {
        if (hasPath(existingContent, path)) {
            return path;
        }
    }
    return paths[0];
}

function parseFieldValue(field) {
    const raw = field.field_value;
    if (raw === null || raw === undefined) return raw;

    if (typeof raw !== 'string') {
        return raw;
    }

    const trimmed = raw.trim();
    const shouldParse = field.field_type === 'array' || field.field_type === 'object' || trimmed.startsWith('{') || trimmed.startsWith('[');

    if (!shouldParse) {
        return raw;
    }

    try {
        return JSON.parse(trimmed);
    } catch {
        return raw;
    }
}

function normalizeLeadMagnetDeliverables(value) {
    if (!Array.isArray(value)) return value;

    // If already objects, keep as-is
    if (value.length > 0 && typeof value[0] === 'object') {
        return value;
    }

    // Convert strings into objects best-effort
    return value.map((item) => {
        if (typeof item !== 'string') return item;
        const parts = item.split(':');
        const title = parts.shift()?.trim() || item.trim();
        let description = parts.join(':').trim();
        let valueText = '';
        const valueMatch = description.match(/\(Value:\s*(.*?)\)$/i);
        if (valueMatch) {
            valueText = valueMatch[1].trim();
            description = description.replace(valueMatch[0], '').trim();
        }
        return {
            title,
            description,
            value: valueText
        };
    });
}

function applyFieldToContent(existingContent, sectionId, fieldId, value) {
    const content = existingContent || {};
    const sectionPaths = FIELD_PATHS[sectionId]?.[fieldId];

    if (sectionId === 'leadMagnet' && fieldId === 'coreDeliverables') {
        const normalized = normalizeLeadMagnetDeliverables(value);
        const path = pickPath(content, FIELD_PATHS.leadMagnet.coreDeliverables);
        setNestedValue(content, path, normalized);
        return content;
    }

    if (sectionPaths && sectionPaths.length > 0) {
        const path = pickPath(content, sectionPaths);
        setNestedValue(content, path, value);
        return content;
    }

    const wrapperKey = SECTION_WRAPPERS[sectionId];
    if (wrapperKey) {
        if (!content[wrapperKey] || typeof content[wrapperKey] !== 'object') {
            content[wrapperKey] = {};
        }
        content[wrapperKey][fieldId] = value;
        return content;
    }

    content[fieldId] = value;
    return content;
}

export async function reconcileFromFields(funnelId, sectionId, userId) {
    if (!funnelId || !sectionId) {
        return { success: false, error: 'Missing funnelId or sectionId' };
    }

    const { data: fields, error: fieldsError } = await supabaseAdmin
        .from('vault_content_fields')
        .select('field_id, field_value, field_type')
        .eq('funnel_id', funnelId)
        .eq('section_id', sectionId)
        .eq('is_current_version', true);

    if (fieldsError) {
        return { success: false, error: fieldsError.message };
    }

    if (!fields || fields.length === 0) {
        return { success: true, skipped: true, reason: 'No fields to reconcile' };
    }

    const { data: existing } = await supabaseAdmin
        .from('vault_content')
        .select('id, content, version, status, phase')
        .eq('funnel_id', funnelId)
        .eq('section_id', sectionId)
        .eq('is_current_version', true)
        .single();

    // Handle content that may be stored as a JSON string (double-serialized)
    let rawContent = existing?.content;
    if (typeof rawContent === 'string') {
        try {
            rawContent = JSON.parse(rawContent);
        } catch {
            console.warn('[Reconcile] Content is a non-parseable string, starting fresh');
            rawContent = {};
        }
    }
    let updatedContent = rawContent ? JSON.parse(JSON.stringify(rawContent)) : {};

    for (const field of fields) {
        const parsedValue = parseFieldValue(field);
        updatedContent = applyFieldToContent(updatedContent, sectionId, field.field_id, parsedValue);
    }

    if (existing) {
        const { error: updateError } = await supabaseAdmin
            .from('vault_content')
            .update({
                content: updatedContent,
                updated_at: new Date().toISOString(),
                version: (existing.version || 1) + 1
            })
            .eq('id', existing.id);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true, action: 'updated', sectionId };
    }

    const { error: insertError } = await supabaseAdmin
        .from('vault_content')
        .insert({
            funnel_id: funnelId,
            user_id: userId,
            section_id: sectionId,
            section_title: sectionId,
            content: updatedContent,
            phase: existing?.phase || 1,
            status: existing?.status || 'generated',
            is_current_version: true
        });

    if (insertError) {
        return { success: false, error: insertError.message };
    }

    return { success: true, action: 'inserted', sectionId };
}

export async function reconcileFromSection(funnelId, sectionId, content, userId) {
    if (!funnelId || !sectionId || !content) {
        return { success: false, error: 'Missing funnelId, sectionId, or content' };
    }

    const result = await populateVaultFields(funnelId, sectionId, content, userId, { forceOverwrite: true });

    if (!result?.success) {
        return { success: false, error: result?.error || 'Failed to populate fields' };
    }

    return { success: true, action: 'fields_populated', details: result };
}

export default {
    reconcileFromFields,
    reconcileFromSection
};
