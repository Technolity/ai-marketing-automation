/**
 * Dependency Resolver
 * 
 * Fetches approved content from vault_content for dependent sections.
 * Ensures AI generations use consistent context from upstream sections.
 * 
 * DEBUG LOGGING: All operations are extensively logged for debugging.
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// Section key to content name mapping
const CONTENT_NAMES = {
    1: 'idealClient',
    2: 'message',
    3: 'story',
    4: 'offer',
    5: 'salesScripts',
    6: 'leadMagnet',
    7: 'vsl',
    8: 'emails',
    9: 'facebookAds',
    10: 'funnelCopy',
    15: 'bio',
    16: 'appointmentReminders',
    17: 'setterScript',
    19: 'sms'
};

// Dependency definitions: which sections each section depends on
export const SECTION_DEPENDENCIES = {
    // Phase 1 - Foundations (depend on core only)
    4: ['idealClient', 'message'],              // Offer
    6: ['idealClient', 'message'],              // Free Gift

    // Phase 2 - Marketing Assets
    7: ['idealClient', 'message', 'story', 'freeGiftName'],  // VSL
    10: ['idealClient', 'message', 'story', 'freeGiftName'], // Funnel Copy (Opt-In)
    9: ['idealClient', 'message', 'freeGiftName', 'optInHeadline'], // Ads
    8: ['idealClient', 'message', 'freeGiftName'],  // Emails
    19: ['idealClient', 'message', 'freeGiftName'], // SMS
    16: ['idealClient', 'message'],  // Appointment Reminders
    15: ['idealClient', 'message', 'story'],  // Bio

    // Phase 3 - Scripts
    17: ['idealClient', 'message', 'freeGiftName'], // Setter Script
    5: ['idealClient', 'message', 'offer'],   // Closer Script
};

/**
 * Fetch a specific section's content from vault_content
 */
async function fetchSectionContent(funnelId, sectionName) {
    console.log(`[DependencyResolver] Fetching content for ${sectionName} (funnel: ${funnelId})`);

    try {
        const { data, error } = await supabaseAdmin
            .from('vault_content')
            .select('content')
            .eq('funnel_id', funnelId)
            .eq('content_type', sectionName)
            .single();

        if (error) {
            console.log(`[DependencyResolver] No content found for ${sectionName}: ${error.message}`);
            return null;
        }

        if (data) {
            console.log(`[DependencyResolver] ✓ Found ${sectionName} content in vault`);
            return data.content;
        }

        return null;
    } catch (err) {
        console.error(`[DependencyResolver] Error fetching ${sectionName}:`, err);
        return null;
    }
}

/**
 * Extract specific field from nested content
 */
function extractField(content, path) {
    if (!content || !path) return null;

    const parts = path.split('.');
    let value = content;

    for (const part of parts) {
        if (value && typeof value === 'object') {
            value = value[part];
        } else {
            return null;
        }
    }

    return value;
}

/**
 * Extract Free Gift name from leadMagnet content
 */
function extractFreeGiftName(leadMagnetContent) {
    console.log('[DependencyResolver] Extracting Free Gift name...');

    if (!leadMagnetContent) {
        console.log('[DependencyResolver] No leadMagnet content available');
        return null;
    }

    // Try multiple paths to find the title
    const possiblePaths = [
        'leadMagnet.titleAndHook.mainTitle',
        'titleAndHook.mainTitle',
        'leadMagnet.mainTitle',
        'mainTitle',
        'title'
    ];

    for (const path of possiblePaths) {
        const value = extractField(leadMagnetContent, path);
        if (value && typeof value === 'string' && value.trim()) {
            console.log(`[DependencyResolver] Found Free Gift name via ${path}: "${value.substring(0, 50)}..."`);
            return value.trim();
        }
    }

    console.log('[DependencyResolver] Could not extract Free Gift name from any path');
    return null;
}

/**
 * Extract Opt-In headline from funnelCopy content
 */
function extractOptInHeadline(funnelCopyContent) {
    console.log('[DependencyResolver] Extracting Opt-In headline...');

    if (!funnelCopyContent) {
        console.log('[DependencyResolver] No funnelCopy content available');
        return null;
    }

    // Try multiple paths to find the headline
    const possiblePaths = [
        'funnelCopy.optInPageCopy.headline',
        'optInPageCopy.headline',
        'funnelCopy.optInHeadlines.primary',
        'optInHeadlines.primary',
        'funnelCopy.optInHeadlines[0]',
        'optInHeadlines[0]'
    ];

    for (const path of possiblePaths) {
        const value = extractField(funnelCopyContent, path);
        if (value && typeof value === 'string' && value.trim()) {
            console.log(`[DependencyResolver] Found Opt-In headline via ${path}: "${value.substring(0, 50)}..."`);
            return value.trim();
        }
    }

    // Also check if optInHeadlines is an array
    const headlines = funnelCopyContent?.funnelCopy?.optInHeadlines || funnelCopyContent?.optInHeadlines;
    if (Array.isArray(headlines) && headlines.length > 0) {
        console.log(`[DependencyResolver] Found Opt-In headline from array: "${headlines[0].substring(0, 50)}..."`);
        return headlines[0];
    }

    console.log('[DependencyResolver] Could not extract Opt-In headline from any path');
    return null;
}

/**
 * Extract Offer details for Closer Script
 */
function extractOfferDetails(offerContent) {
    console.log('[DependencyResolver] Extracting Offer details...');

    if (!offerContent) {
        console.log('[DependencyResolver] No offer content available');
        return { pricing: null, blueprint: null, offerName: null };
    }

    const offer = offerContent?.signatureOffer || offerContent?.offer || offerContent;

    const result = {
        pricing: offer?.tier1Investment || offer?.pricing || offer?.investment || null,
        blueprint: offer?.sevenStepBlueprint || offer?.blueprint || null,
        offerName: offer?.offerName || offer?.name || null,
        tier1Promise: offer?.tier1Promise || offer?.promise || null,
        tier1WhoItsFor: offer?.tier1WhoItsFor || offer?.whoItsFor || null
    };

    console.log('[DependencyResolver] Extracted Offer details:', {
        hasPricing: !!result.pricing,
        hasBlueprint: !!result.blueprint,
        hasOfferName: !!result.offerName
    });

    return result;
}

/**
 * Extract Story summary for context
 */
function extractStorySummary(storyContent) {
    console.log('[DependencyResolver] Extracting Story summary...');

    if (!storyContent) {
        console.log('[DependencyResolver] No story content available');
        return null;
    }

    const story = storyContent?.signatureStory || storyContent?.story || storyContent;

    // Prefer one-liner story for context
    const summary = story?.oneLinerStory || story?.networkingStory || story?.bigIdea || null;

    if (summary) {
        console.log(`[DependencyResolver] Found Story summary (${summary.length} chars)`);
    }

    return summary;
}

/**
 * Main resolver function - fetches all dependencies for a section
 * 
 * @param {string} funnelId - The funnel ID
 * @param {number} sectionKey - The numeric section key (e.g., 7 for VSL)
 * @param {object} fallbackData - Fallback data from intake form if vault content not available
 * @returns {object} Resolved dependencies to inject into prompts
 */
export async function resolveDependencies(funnelId, sectionKey, fallbackData = {}) {
    const sectionName = CONTENT_NAMES[sectionKey];
    console.log(`\n[DependencyResolver] ========================================`);
    console.log(`[DependencyResolver] Resolving dependencies for ${sectionName} (key: ${sectionKey})`);
    console.log(`[DependencyResolver] Funnel ID: ${funnelId}`);

    const dependencies = SECTION_DEPENDENCIES[sectionKey] || [];
    console.log(`[DependencyResolver] Required dependencies:`, dependencies);

    if (dependencies.length === 0) {
        console.log(`[DependencyResolver] No dependencies required for ${sectionName}`);
        return {};
    }

    const resolved = {};
    const missing = [];

    // Fetch core sections if needed
    if (dependencies.includes('idealClient')) {
        const content = await fetchSectionContent(funnelId, 'idealClient');
        if (content) {
            const ic = content?.idealClientSnapshot || content?.idealClient || content;
            resolved.idealClientContext = {
                bestIdealClient: ic?.bestIdealClient || fallbackData.idealClient || '',
                topChallenges: ic?.topChallenges || ic?.top3Challenges || [],
                topDesires: ic?.topDesires || ic?.whatTheyWant || [],
                wordsTheyUse: ic?.wordsTheyUse || ic?.howToTalkToThem || ''
            };
            console.log('[DependencyResolver] ✓ Resolved idealClient from vault');
        } else {
            resolved.idealClientContext = { summary: fallbackData.idealClient || '' };
            missing.push('idealClient');
            console.log('[DependencyResolver] ⚠ Using fallback for idealClient');
        }
    }

    if (dependencies.includes('message')) {
        const content = await fetchSectionContent(funnelId, 'message');
        if (content) {
            const msg = content?.signatureMessage || content?.message || content;
            resolved.messageContext = {
                oneLiner: msg?.oneLiner || msg?.oneLineMessage || '',
                powerPositioning: msg?.powerPositioningLines || [],
                topOutcomes: msg?.topThreeOutcomes || msg?.topOutcomes || []
            };
            console.log('[DependencyResolver] ✓ Resolved message from vault');
        } else {
            resolved.messageContext = { oneLiner: fallbackData.message || '' };
            missing.push('message');
            console.log('[DependencyResolver] ⚠ Using fallback for message');
        }
    }

    if (dependencies.includes('story')) {
        const content = await fetchSectionContent(funnelId, 'story');
        resolved.storySummary = extractStorySummary(content) || fallbackData.story || '';
        if (!content) missing.push('story');
        console.log(`[DependencyResolver] ${content ? '✓' : '⚠'} Story: ${resolved.storySummary ? 'available' : 'missing'}`);
    }

    if (dependencies.includes('freeGiftName')) {
        const content = await fetchSectionContent(funnelId, 'leadMagnet');
        resolved.freeGiftName = extractFreeGiftName(content) || fallbackData.leadMagnetTitle || '[Free Gift Name]';
        if (!content) missing.push('freeGiftName');
        console.log(`[DependencyResolver] ${content ? '✓' : '⚠'} Free Gift Name: "${resolved.freeGiftName}"`);
    }

    if (dependencies.includes('optInHeadline')) {
        const content = await fetchSectionContent(funnelId, 'funnelCopy');
        resolved.optInHeadline = extractOptInHeadline(content) || null;
        if (!resolved.optInHeadline) missing.push('optInHeadline');
        console.log(`[DependencyResolver] ${resolved.optInHeadline ? '✓' : '⚠'} Opt-In Headline: ${resolved.optInHeadline ? 'available' : 'not yet generated'}`);
    }

    if (dependencies.includes('offer')) {
        const content = await fetchSectionContent(funnelId, 'offer');
        const offerDetails = extractOfferDetails(content);
        resolved.offerContext = offerDetails;
        if (!content) missing.push('offer');
        console.log(`[DependencyResolver] ${content ? '✓' : '⚠'} Offer context: ${content ? 'available' : 'missing'}`);
    }

    console.log(`[DependencyResolver] ----------------------------------------`);
    console.log(`[DependencyResolver] Resolution complete for ${sectionName}`);
    console.log(`[DependencyResolver] Resolved: ${Object.keys(resolved).length} dependencies`);
    if (missing.length > 0) {
        console.log(`[DependencyResolver] Missing (using fallback): ${missing.join(', ')}`);
    }
    console.log(`[DependencyResolver] ========================================\n`);

    return resolved;
}

/**
 * Build enriched data object with resolved dependencies
 * Merges intake form data with vault-fetched context
 */
export function buildEnrichedData(baseData, resolvedDeps) {
    console.log('[DependencyResolver] Building enriched data object...');

    const enriched = { ...baseData };

    // Inject idealClient context
    if (resolvedDeps.idealClientContext) {
        enriched.idealClientContext = resolvedDeps.idealClientContext;
        // Also set top-level fields for backward compatibility
        if (resolvedDeps.idealClientContext.bestIdealClient) {
            enriched.idealClient = typeof resolvedDeps.idealClientContext.bestIdealClient === 'object'
                ? JSON.stringify(resolvedDeps.idealClientContext.bestIdealClient)
                : resolvedDeps.idealClientContext.bestIdealClient;
        }
    }

    // Inject message context
    if (resolvedDeps.messageContext) {
        enriched.messageContext = resolvedDeps.messageContext;
        if (resolvedDeps.messageContext.oneLiner) {
            enriched.message = resolvedDeps.messageContext.oneLiner;
        }
    }

    // Inject story summary
    if (resolvedDeps.storySummary) {
        enriched.storySummary = resolvedDeps.storySummary;
    }

    // Inject Free Gift name (key dependency for many sections)
    if (resolvedDeps.freeGiftName) {
        enriched.freeGiftName = resolvedDeps.freeGiftName;
        enriched.leadMagnetTitle = resolvedDeps.freeGiftName; // Backward compat
    }

    // Inject Opt-In headline (for Ads)
    if (resolvedDeps.optInHeadline) {
        enriched.optInHeadline = resolvedDeps.optInHeadline;
    }

    // Inject Offer context (for Closer Script)
    if (resolvedDeps.offerContext) {
        enriched.offerContext = resolvedDeps.offerContext;
        if (resolvedDeps.offerContext.pricing) {
            enriched.pricing = resolvedDeps.offerContext.pricing;
        }
        if (resolvedDeps.offerContext.offerName) {
            enriched.offerName = resolvedDeps.offerContext.offerName;
        }
    }

    console.log('[DependencyResolver] Enriched data keys:', Object.keys(enriched).filter(k =>
        ['idealClientContext', 'messageContext', 'storySummary', 'freeGiftName', 'optInHeadline', 'offerContext'].includes(k)
    ));

    return enriched;
}

export default {
    resolveDependencies,
    buildEnrichedData,
    SECTION_DEPENDENCIES
};
