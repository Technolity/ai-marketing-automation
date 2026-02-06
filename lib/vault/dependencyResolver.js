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
    10: ['idealClient', 'message', 'story', 'offer', 'leadMagnet', 'vsl', 'bio'], // Funnel Copy
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
            .eq('section_id', sectionName)
            .eq('is_current_version', true)
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
 * Fetch a specific field value from vault_content_fields table
 * This provides granular access to user-edited field values
 */
async function fetchFieldValue(funnelId, sectionId, fieldId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .eq('field_id', fieldId)
            .eq('is_current_version', true)
            .single();

        if (error || !data) {
            return null;
        }

        // Parse JSON if it's a stringified array/object
        let value = data.field_value;
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
            try {
                value = JSON.parse(value);
            } catch (e) {
                // Keep as string
            }
        }

        return value;
    } catch (err) {
        console.error(`[DependencyResolver] Error fetching field ${sectionId}.${fieldId}:`, err);
        return null;
    }
}

/**
 * Check if core sections are approved/generated
 * Returns validation result with missing sections
 */
export async function validateCoreSections(funnelId) {
    console.log('[DependencyResolver] Validating core sections for funnel:', funnelId);

    const coreSections = ['idealClient', 'message'];
    const missing = [];
    const available = [];

    for (const sectionId of coreSections) {
        const { data, error } = await supabaseAdmin
            .from('vault_content')
            .select('id, section_id')
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .eq('is_current_version', true)
            .single();

        if (error || !data) {
            missing.push(sectionId);
        } else {
            available.push(sectionId);
        }
    }

    const isValid = missing.length === 0;
    console.log(`[DependencyResolver] Core validation: ${isValid ? '✓ PASS' : '✗ FAIL'} - Available: ${available.join(', ')} | Missing: ${missing.join(', ') || 'none'}`);

    return {
        isValid,
        available,
        missing,
        message: isValid
            ? 'All core sections available'
            : `Please generate these sections first: ${missing.map(s => s === 'idealClient' ? 'Ideal Client' : 'Message').join(', ')}`
    };
}

/**
 * Build comprehensive core context from approved vault fields
 * This provides field-level data for AI prompt injection
 */
export async function buildCoreContext(funnelId) {
    console.log('[DependencyResolver] Building core context for funnel:', funnelId);

    const context = {
        // Demographics from Ideal Client
        demographics: {},
        // Challenges and desires
        challenges: [],
        desires: [],
        buyingTriggers: [],
        // Message components
        oneLiner: '',
        powerLines: [],
        topOutcomes: [],
        // Story elements
        storySummary: '',
        bigIdea: '',
        // Free Gift
        freeGiftName: '',
        // Offer details
        offerName: '',
        pricing: ''
        // NOTE: optInHeadline removed - Funnel Copy is a dependent section, not core
    };

    // Fetch Ideal Client fields
    const icContent = await fetchSectionContent(funnelId, 'idealClient');
    if (icContent) {
        const ic = icContent?.idealClientSnapshot || icContent?.idealClient || icContent;

        // Extract demographics (nested object)
        const demo = ic?.bestIdealClient || ic?.demographics || {};
        context.demographics = {
            age: demo?.age || demo?.ageRange || '',
            gender: demo?.gender || '',
            location: demo?.location || demo?.geography || '',
            income: demo?.income || demo?.incomeLevel || '',
            occupation: demo?.occupation || demo?.role || ''
        };

        // Extract arrays
        context.challenges = ic?.top3Challenges || ic?.topChallenges || [];
        context.desires = ic?.whatTheyWant || ic?.topDesires || [];
        context.buyingTriggers = ic?.whatMakesThemPay || ic?.buyingTriggers || [];

        console.log('[DependencyResolver] ✓ Loaded Ideal Client context - Demographics:', Object.keys(context.demographics).filter(k => context.demographics[k]).length, 'fields');
    }

    // Also try to get from granular fields (user-edited values take precedence)
    const demographicsField = await fetchFieldValue(funnelId, 'idealClient', 'demographics');
    if (demographicsField && typeof demographicsField === 'object') {
        context.demographics = { ...context.demographics, ...demographicsField };
    }

    // Fetch Message fields
    const msgContent = await fetchSectionContent(funnelId, 'message');
    if (msgContent) {
        const msg = msgContent?.signatureMessage || msgContent?.message || msgContent;
        context.oneLiner = msg?.oneLiner || msg?.oneLineMessage || '';
        context.powerLines = msg?.powerPositioningLines || msg?.powerLines || [];
        context.topOutcomes = msg?.topThreeOutcomes || msg?.topOutcomes || [];

        console.log('[DependencyResolver] ✓ Loaded Message context - OneLiner:', context.oneLiner ? 'yes' : 'no');
    }

    // Fetch Story
    const storyContent = await fetchSectionContent(funnelId, 'story');
    if (storyContent) {
        const story = storyContent?.signatureStory || storyContent?.story || storyContent;
        context.storySummary = story?.oneLinerStory || story?.networkingStory || '';
        context.bigIdea = story?.bigIdea || '';

        console.log('[DependencyResolver] ✓ Loaded Story context');
    }

    // Fetch Free Gift name (try both vault_content and vault_content_fields)
    const lmContent = await fetchSectionContent(funnelId, 'leadMagnet');
    context.freeGiftName = extractFreeGiftName(lmContent) || '';

    // Fallback to granular field if not found in vault_content
    if (!context.freeGiftName) {
        const mainTitleField = await fetchFieldValue(funnelId, 'leadMagnet', 'mainTitle');
        if (mainTitleField) {
            context.freeGiftName = mainTitleField;
            console.log('[DependencyResolver] ✓ Loaded Free Gift name from granular field: mainTitle');
        }
    }
    if (context.freeGiftName) {
        console.log('[DependencyResolver] ✓ Loaded Free Gift name:', context.freeGiftName.substring(0, 40) + '...');
    }

    // Fetch Offer details
    const offerContent = await fetchSectionContent(funnelId, 'offer');
    if (offerContent) {
        const offer = offerContent?.signatureOffer || offerContent?.offer || offerContent;
        context.offerName = offer?.offerName || offer?.name || '';
        context.pricing = offer?.tier1Investment || offer?.pricing || '';

        console.log('[DependencyResolver] ✓ Loaded Offer context - Name:', context.offerName ? 'yes' : 'no');
    }

    // NOTE: Funnel Copy is NOT a core section - it's generated conditionally AFTER approval
    // Do not fetch it here to avoid unnecessary queries and errors

    console.log('[DependencyResolver] Core context built with', Object.keys(context).filter(k => {
        const v = context[k];
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return Object.keys(v).length > 0;
        return !!v;
    }).length, 'populated fields');

    return context;
}

/**
 * Format core context as a string for AI prompt injection
 */
export function formatContextForPrompt(coreContext) {
    const lines = [];

    lines.push('=== BUSINESS CONTEXT (Use these exact details for consistency) ===');

    // Demographics
    if (coreContext.demographics) {
        const d = coreContext.demographics;
        if (d.age) lines.push(`Target Age: ${d.age}`);
        if (d.gender) lines.push(`Target Gender: ${d.gender}`);
        if (d.location) lines.push(`Location: ${d.location}`);
        if (d.occupation) lines.push(`Occupation/Role: ${d.occupation}`);
    }

    // Core message
    if (coreContext.oneLiner) {
        lines.push(`\nOne-Liner Message: "${coreContext.oneLiner}"`);
    }

    // Challenges
    if (coreContext.challenges?.length > 0) {
        lines.push('\nTop Challenges:');
        coreContext.challenges.slice(0, 3).forEach((c, i) => {
            lines.push(`  ${i + 1}. ${typeof c === 'string' ? c : c.challenge || c.text || JSON.stringify(c)}`);
        });
    }

    // Desires
    if (coreContext.desires?.length > 0) {
        lines.push('\nTop Desires:');
        coreContext.desires.slice(0, 3).forEach((d, i) => {
            lines.push(`  ${i + 1}. ${typeof d === 'string' ? d : d.desire || d.text || JSON.stringify(d)}`);
        });
    }

    // Story
    if (coreContext.storySummary) {
        lines.push(`\nStory Summary: "${coreContext.storySummary.substring(0, 200)}..."`);
    }

    // Free Gift
    if (coreContext.freeGiftName) {
        lines.push(`\nFree Gift Name: "${coreContext.freeGiftName}"`);
    }

    // Offer
    if (coreContext.offerName) {
        lines.push(`\nOffer/Program Name: "${coreContext.offerName}"`);
    }
    if (coreContext.pricing) {
        lines.push(`Pricing: ${coreContext.pricing}`);
    }

    // Opt-in headline (for Ads)
    if (coreContext.optInHeadline) {
        lines.push(`\nOpt-In Page Headline: "${coreContext.optInHeadline}"`);
    }

    lines.push('\n=== END CONTEXT ===\n');

    return lines.join('\n');
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
                whatTheyWant: ic?.whatTheyWant || ic?.topDesires || ic?.top3Desires || [],
                whatMakesThemPay: ic?.whatMakesThemPay || ic?.topTriggers || [],
                howToTalkToThem: ic?.howToTalkToThem || ic?.wordsTheyUse || [],
                // Legacy compatibility
                topDesires: ic?.whatTheyWant || ic?.topDesires || ic?.top3Desires || [],
                wordsTheyUse: Array.isArray(ic?.howToTalkToThem) ? ic.howToTalkToThem.join('; ') : (ic?.wordsTheyUse || '')
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
        let freeGiftName = extractFreeGiftName(content);

        // If not found in vault_content, try vault_content_fields (granular fields)
        if (!freeGiftName) {
            freeGiftName = await fetchFieldValue(funnelId, 'leadMagnet', 'mainTitle');
            if (freeGiftName) {
                console.log('[DependencyResolver] Found Free Gift name from granular field: mainTitle');
            }
        }

        resolved.freeGiftName = freeGiftName || fallbackData.leadMagnetTitle || '[Free Gift Name]';
        if (!content && !freeGiftName) missing.push('freeGiftName');
        console.log(`[DependencyResolver] ${freeGiftName ? '✓' : '⚠'} Free Gift Name: "${resolved.freeGiftName}"`);
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

    if (dependencies.includes('leadMagnet')) {
        const content = await fetchSectionContent(funnelId, 'leadMagnet');
        resolved.leadMagnet = content || null;
        if (!content) missing.push('leadMagnet');
        console.log(`[DependencyResolver] ${content ? '✓' : '⚠'} Lead Magnet: ${content ? 'available' : 'missing'}`);
    }

    if (dependencies.includes('vsl')) {
        const content = await fetchSectionContent(funnelId, 'vsl');
        resolved.vsl = content || null;
        if (!content) missing.push('vsl');
        console.log(`[DependencyResolver] ${content ? '✓' : '⚠'} VSL: ${content ? 'available' : 'missing'}`);
    }

    if (dependencies.includes('bio')) {
        const content = await fetchSectionContent(funnelId, 'bio');
        resolved.bio = content || null;
        if (!content) missing.push('bio');
        console.log(`[DependencyResolver] ${content ? '✓' : '⚠'} Bio: ${content ? 'available' : 'missing'}`);
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
    buildCoreContext,
    validateCoreSections,
    formatContextForPrompt,
    SECTION_DEPENDENCIES
};
