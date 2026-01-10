/**
 * Prompts Index
 * Central export for all prompt files
 * 
 * Updated for Phase 2 Output Flow:
 * - salesScripts is used for setterScript (appointment booking)
 * - closerScript is for closing sales calls
 */

export { idealClientPrompt } from './idealClient';
export { messagePrompt } from './message';
export { storyPrompt } from './story';
export { offerPrompt } from './offer';
// export { salesScriptsPrompt } from './salesScripts'; // Removed as file is missing and closerScript is used
export { closerScriptPrompt } from './closerScript'; // Closer script (sales calls)
export { leadMagnetPrompt } from './leadMagnet';
export { vslPrompt } from './vsl';
export { emailsPrompt } from './emails';
export { facebookAdsPrompt } from './facebookAds';
export { funnelCopyPrompt } from './funnelCopy';
export { contentIdeasPrompt } from './contentIdeas';
export { program12MonthPrompt } from './program12Month';
export { youtubeShowPrompt } from './youtubeShow';
export { contentPillarsPrompt } from './contentPillars';
export { bioPrompt } from './bio';
export { appointmentRemindersPrompt } from './appointmentReminders';
export { setterScriptPrompt } from './setterScript'; // Setter script (appointment booking)
export { smsPrompt } from './sms'; // SMS Sequences

// Prompt mapping by key for API use
// Keys match vault section numericKey values
export const PROMPTS = {
    1: 'idealClient',
    2: 'message',
    3: 'story',
    4: 'offer',
    5: 'salesScripts',      // Closer script (sales calls)
    6: 'leadMagnet',        // Free Gift
    7: 'vsl',               // Video Script
    8: 'emails',            // Email Sequences
    9: 'facebookAds',       // Ad Copy
    10: 'funnelCopy',       // Funnel Page Copy
    11: 'contentIdeas',
    12: 'program12Month',
    13: 'youtubeShow',
    14: 'contentPillars',
    15: 'bio',              // Professional Bio
    16: 'appointmentReminders',
    17: 'setterScript',     // Setter Script
    19: 'sms'               // SMS Sequences
};

export const getPromptByKey = (key) => {
    const promptMap = {
        1: require('./idealClient').default,
        2: require('./message').default,
        3: require('./story').default,
        4: require('./offer').default,
        5: require('./closerScript').default,  // Closer script for sales calls (mapped to salesScripts section)
        6: require('./leadMagnet').default,
        7: require('./vsl').default,
        8: require('./emails').default,
        9: require('./facebookAds').default,
        10: require('./funnelCopy').default,
        11: require('./contentIdeas').default,
        12: require('./program12Month').default,
        13: require('./youtubeShow').default,
        14: require('./contentPillars').default,
        15: require('./bio').default,
        16: require('./appointmentReminders').default,
        17: require('./setterScript').default,
        19: require('./sms').default
    };

    return promptMap[key];
};
