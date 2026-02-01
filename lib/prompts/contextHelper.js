/**
 * Context Helper for AI Prompts
 * 
 * Centralizes the logic for extracting and formatting business context 
 * to ensure consistency across all Generation and Feedback/Refinement prompts.
 * 
 * Aligned with dependencyResolver.js patterns from generate-stream.
 */

/**
 * Build global context from various data sources.
 * Works with both:
 * - enrichedData from generate-stream (has idealClientContext, messageContext, etc.)
 * - vault content fetched during refinement (raw section data)
 * - legacy intake form data (flat structure)
 * 
 * @param {Object} data - The data object (can be enriched or raw)
 * @returns {Object} Normalized context object
 */
export function buildGlobalContext(data) {
    // Handle enrichedData format from generate-stream (dependencyResolver output)
    const idealClientContext = data.idealClientContext || {};
    const messageContext = data.messageContext || {};
    const offerContext = data.offerContext || {};

    // Handle raw vault content format (from refine-section-stream intakeData)
    const intakeForm = data.intakeForm || data.intake_form || {};
    const rawMessage = data.message || {};
    const rawIdealClient = data.idealClient || {};
    const rawStory = data.story || {};
    const rawOffer = data.offer || {};
    const rawLeadMagnet = data.leadMagnet || {};
    const rawVsl = data.vsl || {};
    const rawBio = data.bio || {};

    // ============================================
    // BUSINESS IDENTITY
    // ============================================
    const businessName = data.businessName || data.business_name ||
        intakeForm.businessName || intakeForm.business_name ||
        rawBio?.businessName || 'your company';

    const founderName = rawBio?.name || rawBio?.founderName ||
        intakeForm.founderName || intakeForm.name || 'the founder';

    const niche = data.niche || data.industry || intakeForm.niche || intakeForm.industry || '';

    // ============================================
    // TARGET AUDIENCE (from idealClient)
    // ============================================
    // Priority: enrichedData > raw vault content > intake form
    let targetAudience = '';
    if (idealClientContext.bestIdealClient) {
        targetAudience = typeof idealClientContext.bestIdealClient === 'object'
            ? JSON.stringify(idealClientContext.bestIdealClient)
            : idealClientContext.bestIdealClient;
    } else if (rawIdealClient.idealClientSnapshot?.bestIdealClient) {
        const ic = rawIdealClient.idealClientSnapshot.bestIdealClient;
        targetAudience = typeof ic === 'object' ? JSON.stringify(ic) : ic;
    } else if (rawIdealClient.bestIdealClient) {
        const ic = rawIdealClient.bestIdealClient;
        targetAudience = typeof ic === 'object' ? JSON.stringify(ic) : ic;
    } else {
        targetAudience = data.idealClient || intakeForm.idealClient || 'Not specified';
    }

    // Pain points / Challenges (array or string)
    let painPoints = [];
    if (idealClientContext.topChallenges?.length > 0) {
        painPoints = idealClientContext.topChallenges;
    } else if (rawIdealClient.top3Challenges?.length > 0) {
        painPoints = rawIdealClient.top3Challenges;
    } else if (rawIdealClient.idealClientSnapshot?.top3Challenges?.length > 0) {
        painPoints = rawIdealClient.idealClientSnapshot.top3Challenges;
    } else if (data.coreProblem) {
        painPoints = [data.coreProblem];
    } else if (intakeForm.coreProblem) {
        painPoints = [intakeForm.coreProblem];
    }

    // Desires / What They Want
    let desires = [];
    if (idealClientContext.topDesires?.length > 0) {
        desires = idealClientContext.topDesires;
    } else if (rawIdealClient.top3Desires?.length > 0) {
        desires = rawIdealClient.top3Desires;
    } else if (rawIdealClient.idealClientSnapshot?.top3Desires?.length > 0) {
        desires = rawIdealClient.idealClientSnapshot.top3Desires;
    } else if (data.outcomes) {
        desires = [data.outcomes];
    } else if (intakeForm.outcomes) {
        desires = [intakeForm.outcomes];
    }

    // Objections
    let objections = [];
    if (idealClientContext.topObjections?.length > 0) {
        objections = idealClientContext.topObjections;
    } else if (rawIdealClient.topObjections?.length > 0) {
        objections = rawIdealClient.topObjections;
    } else if (rawIdealClient.idealClientSnapshot?.topObjections?.length > 0) {
        objections = rawIdealClient.idealClientSnapshot.topObjections;
    }

    // Words They Use
    const wordsTheyUse = idealClientContext.wordsTheyUse ||
        rawIdealClient.wordsTheyUse ||
        rawIdealClient.idealClientSnapshot?.wordsTheyUse || '';

    // ============================================
    // MESSAGING (from message section)
    // ============================================
    const coreMessage = messageContext.oneLiner ||
        rawMessage.oneLineMessage || rawMessage.oneLiner ||
        data.message || intakeForm.message || '';

    const powerLines = messageContext.powerPositioning ||
        rawMessage.powerPositioningLines || [];

    const topOutcomes = messageContext.topOutcomes ||
        rawMessage.topThreeOutcomes || [];

    const uniqueMechanism = rawMessage.uniqueMechanism ||
        data.uniqueAdvantage || intakeForm.uniqueAdvantage || '';

    const bigPromise = rawMessage.bigPromise ||
        data.outcomes || intakeForm.outcomes || '';

    // ============================================
    // STORY (from story section)
    // ============================================
    const storySummary = data.storySummary ||
        rawStory.networkingStory || rawStory.oneLinerStory || '';

    const bigIdea = rawStory.bigIdea || '';

    const storyLow = rawStory.pit || data.storyLowMoment || intakeForm.storyLowMoment || '';
    const storyBreakthrough = rawStory.breakthrough || data.storyBreakthrough || intakeForm.storyBreakthrough || '';

    // ============================================
    // OFFER (from offer section)
    // ============================================
    const offerName = offerContext.offerName ||
        rawOffer.offerName || data.offerName ||
        data.offerProgram || intakeForm.offerProgram || '';

    const offerType = rawOffer.offerMode || 'Coaching/Consulting';

    const pricing = offerContext.pricing ||
        rawOffer.tier1RecommendedPrice || rawOffer.tier1Investment ||
        data.pricing || intakeForm.pricing || '';

    const offerBlueprint = offerContext.blueprint ||
        rawOffer.sevenStepBlueprint || '';

    const offerPromise = offerContext.tier1Promise ||
        rawOffer.tier1Promise || '';

    // ============================================
    // LEAD MAGNET / FREE GIFT
    // ============================================
    const freeGiftName = data.freeGiftName || data.leadMagnetTitle ||
        rawLeadMagnet.concept?.title ||
        rawLeadMagnet.titleAndHook?.mainTitle ||
        rawLeadMagnet.mainTitle ||
        intakeForm.leadMagnetTitle || '[Free Gift Name]';

    // ============================================
    // BIO / AUTHORITY
    // ============================================
    const bioSummary = rawBio.fullBio || rawBio.shortBio || '';
    const bioCredentials = Array.isArray(rawBio.keyAchievements)
        ? rawBio.keyAchievements.join(', ')
        : rawBio.credentials || '';

    // ============================================
    // VSL CONTEXT (for funnel copy, etc.)
    // ============================================
    const vslPatternInterrupt = rawVsl.step1_patternInterrupt || '';
    const vslBenefits = rawVsl.step2_benefitsHighlight || '';

    // Return normalized context object
    return {
        // Business identity
        businessName,
        founderName,
        niche,

        // Target audience
        targetAudience,
        painPoints,
        desires,
        objections,
        wordsTheyUse,

        // Messaging
        coreMessage,
        powerLines,
        topOutcomes,
        uniqueMechanism,
        bigPromise,

        // Story
        storySummary,
        bigIdea,
        storyLow,
        storyBreakthrough,

        // Offer
        offerName,
        offerType,
        pricing,
        offerBlueprint,
        offerPromise,

        // Lead Magnet
        freeGiftName,

        // Bio/Authority
        bioSummary,
        bioCredentials,

        // VSL excerpts (for downstream sections)
        vslPatternInterrupt,
        vslBenefits
    };
}

/**
 * Format context object as a string for AI prompt injection.
 * Aligned with dependencyResolver.formatContextForPrompt() output format.
 * 
 * @param {Object} ctx - Context object from buildGlobalContext
 * @returns {string} Formatted context string for prompt injection
 */
export function getContextString(ctx) {
    const lines = [];

    lines.push('=== BUSINESS CONTEXT (Use these exact details for consistency) ===');

    // Business Identity
    if (ctx.businessName && ctx.businessName !== 'your company') {
        lines.push(`Business Name: ${ctx.businessName}`);
    }
    if (ctx.founderName && ctx.founderName !== 'the founder') {
        lines.push(`Founder Name: ${ctx.founderName}`);
    }
    if (ctx.niche) {
        lines.push(`Industry/Niche: ${ctx.niche}`);
    }

    // Target Audience
    if (ctx.targetAudience && ctx.targetAudience !== 'Not specified') {
        lines.push(`\nTarget Audience: ${typeof ctx.targetAudience === 'string' ? ctx.targetAudience : JSON.stringify(ctx.targetAudience)}`);
    }

    // Pain Points / Challenges
    if (ctx.painPoints?.length > 0) {
        lines.push('\nTop Challenges:');
        ctx.painPoints.slice(0, 3).forEach((c, i) => {
            const text = typeof c === 'string' ? c : (c.challenge || c.text || JSON.stringify(c));
            lines.push(`  ${i + 1}. ${text}`);
        });
    }

    // Desires
    if (ctx.desires?.length > 0) {
        lines.push('\nTop Desires:');
        ctx.desires.slice(0, 3).forEach((d, i) => {
            const text = typeof d === 'string' ? d : (d.desire || d.text || JSON.stringify(d));
            lines.push(`  ${i + 1}. ${text}`);
        });
    }

    // Objections
    if (ctx.objections?.length > 0) {
        lines.push('\nTop Objections:');
        ctx.objections.slice(0, 3).forEach((o, i) => {
            const text = typeof o === 'string' ? o : (o.objection || o.text || JSON.stringify(o));
            lines.push(`  ${i + 1}. ${text}`);
        });
    }

    // Core Message
    if (ctx.coreMessage) {
        lines.push(`\nOne-Liner Message: "${ctx.coreMessage}"`);
    }
    if (ctx.uniqueMechanism) {
        lines.push(`Unique Mechanism: ${ctx.uniqueMechanism}`);
    }
    if (ctx.bigPromise) {
        lines.push(`Big Promise: ${ctx.bigPromise}`);
    }

    // Story
    if (ctx.storySummary) {
        lines.push(`\nStory Summary: "${ctx.storySummary.substring(0, 200)}${ctx.storySummary.length > 200 ? '...' : ''}"`);
    }
    if (ctx.bigIdea) {
        lines.push(`Big Idea: ${ctx.bigIdea}`);
    }

    // Offer
    if (ctx.offerName) {
        lines.push(`\nOffer/Program Name: "${ctx.offerName}"`);
    }
    if (ctx.pricing) {
        lines.push(`Pricing: ${ctx.pricing}`);
    }

    // Free Gift
    if (ctx.freeGiftName && ctx.freeGiftName !== '[Free Gift Name]') {
        lines.push(`\nFree Gift Name: "${ctx.freeGiftName}"`);
    }

    // Bio/Authority
    if (ctx.bioCredentials) {
        lines.push(`\nCredentials: ${ctx.bioCredentials}`);
    }

    lines.push('\n=== END CONTEXT ===');

    return lines.join('\n');
}

/**
 * Build context for a specific section type.
 * This provides section-specific context extraction for prompt files.
 * 
 * @param {Object} data - The enriched data object
 * @param {string} sectionType - Type of section (emails, vsl, setter, closer, funnel, etc.)
 * @returns {Object} Section-specific context object
 */
export function buildSectionContext(data, sectionType) {
    const globalCtx = buildGlobalContext(data);

    // Section-specific additions
    const sectionCtx = {
        // Always include these
        idealClient: globalCtx.targetAudience,
        coreProblem: Array.isArray(globalCtx.painPoints) ? globalCtx.painPoints[0] || '' : globalCtx.painPoints,
        outcomes: globalCtx.bigPromise || (Array.isArray(globalCtx.desires) ? globalCtx.desires[0] || '' : globalCtx.desires),
        uniqueAdvantage: globalCtx.uniqueMechanism,
        leadMagnetTitle: globalCtx.freeGiftName,
        offerProgram: globalCtx.offerName,
        callToAction: data.callToAction || 'Book a free consultation'
    };

    // Add section-specific context
    switch (sectionType) {
        case 'emails':
        case 'sms':
            sectionCtx.testimonials = data.testimonials || data.proofPoints || '';
            break;

        case 'setter':
        case 'setterScript':
            sectionCtx.offerName = globalCtx.offerName;
            sectionCtx.callToAction = data.callToAction || 'Book a strategy call';
            break;

        case 'closer':
        case 'salesScripts':
            sectionCtx.industry = globalCtx.niche;
            sectionCtx.offerName = globalCtx.offerName;
            sectionCtx.pricing = globalCtx.pricing;
            sectionCtx.brandVoice = data.brandVoice || 'Professional but friendly';
            sectionCtx.offerBlueprint = globalCtx.offerBlueprint;
            sectionCtx.offerPromise = globalCtx.offerPromise;
            break;

        case 'vsl':
            sectionCtx.storyLowMoment = globalCtx.storyLow;
            sectionCtx.storyDiscovery = globalCtx.storySummary;
            sectionCtx.storyBreakthrough = globalCtx.storyBreakthrough;
            sectionCtx.testimonials = data.testimonials || '';
            sectionCtx.deliverables = data.deliverables || '';
            break;

        case 'funnel':
        case 'funnelCopy':
            sectionCtx.businessName = globalCtx.businessName;
            sectionCtx.founderName = globalCtx.founderName;
            sectionCtx.bigIdea = globalCtx.bigIdea;
            sectionCtx.storySummary = globalCtx.storySummary;
            sectionCtx.bioSummary = globalCtx.bioSummary;
            sectionCtx.vslPatternInterrupt = globalCtx.vslPatternInterrupt;
            sectionCtx.vslBenefits = globalCtx.vslBenefits;
            break;

        case 'ads':
        case 'facebookAds':
            sectionCtx.optInHeadline = data.optInHeadline || '';
            break;
    }

    return sectionCtx;
}

export default {
    buildGlobalContext,
    getContextString,
    buildSectionContext
};
