/**
 * VSL Chunk Merger
 *
 * Combines the 2 chunk results into a single vsl object
 * that matches the vault schema (flat structure with step1_*, step2_*, etc.).
 */

/**
 * Merge 2 VSL chunk results into final vsl
 * @param {Object} chunk1 - Steps 1-4 (Hook/Problem/Credibility/Product)
 * @param {Object} chunk2 - Steps 5-10 (Value/Engagement/CTA/Close)
 * @returns {Object} Merged vsl object
 */
export function mergeVslChunks(chunk1, chunk2) {
    console.log('[VslMerger] Merging 2 chunks of VSL script...');

    const merged = {
        vsl: {
            // Chunk 1: Steps 1-4 (Hook/Problem Phase)
            step1_patternInterrupt: chunk1?.step1_patternInterrupt || '',
            step1_characterIntro: chunk1?.step1_characterIntro || '',
            step1_problemStatement: chunk1?.step1_problemStatement || '',
            step1_emotionalConnection: chunk1?.step1_emotionalConnection || '',

            step2_benefitLead: chunk1?.step2_benefitLead || '',
            step2_uniqueSolution: chunk1?.step2_uniqueSolution || '',
            step2_benefitsHighlight: chunk1?.step2_benefitsHighlight || '',
            step2_problemAgitation: chunk1?.step2_problemAgitation || '',

            step3_nightmareStory: chunk1?.step3_nightmareStory || '',
            step3_clientTestimonials: chunk1?.step3_clientTestimonials || '',
            step3_dataPoints: chunk1?.step3_dataPoints || '',
            step3_expertEndorsements: chunk1?.step3_expertEndorsements || '',

            step4_detailedDescription: chunk1?.step4_detailedDescription || '',
            step4_demonstration: chunk1?.step4_demonstration || '',
            step4_psychologicalTriggers: chunk1?.step4_psychologicalTriggers || '',

            // Chunk 2: Steps 5-10 (Solution/Offer Phase)
            step5_intro: chunk2?.step5_intro || '',
            step5_tips: Array.isArray(chunk2?.step5_tips) ? chunk2.step5_tips : [],
            step5_transition: chunk2?.step5_transition || '',

            step6_directEngagement: chunk2?.step6_directEngagement || '',
            step6_urgencyCreation: chunk2?.step6_urgencyCreation || '',
            step6_clearOffer: chunk2?.step6_clearOffer || '',
            step6_stepsToSuccess: Array.isArray(chunk2?.step6_stepsToSuccess) ? chunk2.step6_stepsToSuccess : [],

            step7_recap: chunk2?.step7_recap || '',
            step7_primaryCTA: chunk2?.step7_primaryCTA || '',
            step7_offerFeaturesAndPrice: chunk2?.step7_offerFeaturesAndPrice || '',
            step7_bonuses: chunk2?.step7_bonuses || '',
            step7_secondaryCTA: chunk2?.step7_secondaryCTA || '',
            step7_guarantee: chunk2?.step7_guarantee || '',

            step8_theClose: chunk2?.step8_theClose || '',
            step8_addressObjections: chunk2?.step8_addressObjections || '',
            step8_reiterateValue: chunk2?.step8_reiterateValue || '',

            step9_followUpStrategy: chunk2?.step9_followUpStrategy || '',
            step9_finalPersuasion: chunk2?.step9_finalPersuasion || '',

            step10_hardClose: chunk2?.step10_hardClose || '',
            step10_handleObjectionsAgain: chunk2?.step10_handleObjectionsAgain || '',
            step10_scarcityClose: chunk2?.step10_scarcityClose || '',
            step10_inspirationClose: chunk2?.step10_inspirationClose || '',
            step10_speedUpAction: chunk2?.step10_speedUpAction || ''
        }
    };

    const fieldCount = Object.keys(merged.vsl).filter(k => {
        const val = merged.vsl[k];
        if (typeof val === 'string') return val.length > 0;
        if (Array.isArray(val)) return val.length > 0;
        return false;
    }).length;

    console.log(`[VslMerger] Total fields merged: ${fieldCount}/38`);

    return merged;
}

/**
 * Validate merged VSL script
 */
export function validateMergedVsl(mergedResult) {
    const vsl = mergedResult?.vsl;
    if (!vsl) {
        return { valid: false, error: 'Missing vsl wrapper' };
    }

    const expectedFields = [
        // Step 1
        'step1_patternInterrupt', 'step1_characterIntro', 'step1_problemStatement', 'step1_emotionalConnection',
        // Step 2
        'step2_benefitLead', 'step2_uniqueSolution', 'step2_benefitsHighlight', 'step2_problemAgitation',
        // Step 3
        'step3_nightmareStory', 'step3_clientTestimonials', 'step3_dataPoints', 'step3_expertEndorsements',
        // Step 4
        'step4_detailedDescription', 'step4_demonstration', 'step4_psychologicalTriggers',
        // Step 5
        'step5_intro', 'step5_tips', 'step5_transition',
        // Step 6
        'step6_directEngagement', 'step6_urgencyCreation', 'step6_clearOffer', 'step6_stepsToSuccess',
        // Step 7
        'step7_recap', 'step7_primaryCTA', 'step7_offerFeaturesAndPrice', 'step7_bonuses',
        'step7_secondaryCTA', 'step7_guarantee',
        // Step 8
        'step8_theClose', 'step8_addressObjections', 'step8_reiterateValue',
        // Step 9
        'step9_followUpStrategy', 'step9_finalPersuasion',
        // Step 10
        'step10_hardClose', 'step10_handleObjectionsAgain', 'step10_scarcityClose',
        'step10_inspirationClose', 'step10_speedUpAction'
    ];

    const missing = [];
    const incomplete = [];

    for (const field of expectedFields) {
        const value = vsl[field];
        if (value === undefined || value === null) {
            missing.push(field);
        } else if (typeof value === 'string' && value.trim() === '') {
            incomplete.push(field);
        } else if (Array.isArray(value) && value.length === 0) {
            incomplete.push(field);
        }
    }

    if (missing.length > 0 || incomplete.length > 0) {
        return {
            valid: false,
            error: `Missing: ${missing.length}, Incomplete: ${incomplete.length}`,
            missing,
            incomplete
        };
    }

    return {
        valid: true,
        fieldCount: expectedFields.length
    };
}

export default { mergeVslChunks, validateMergedVsl };
