/**
 * Prompts Index
 * Central export for all prompt files
 */

export { idealClientPrompt } from './idealClient';
export { messagePrompt } from './message';
export { storyPrompt } from './story';
export { offerPrompt } from './offer';
export { salesScriptsPrompt } from './salesScripts';
export { leadMagnetPrompt } from './leadMagnet';
export { vslPrompt } from './vsl';
export { emailsPrompt } from './emails';
export { facebookAdsPrompt } from './facebookAds';
export { funnelCopyPrompt } from './funnelCopy';
export { contentIdeasPrompt } from './contentIdeas';
export { program12MonthPrompt } from './program12Month';
export { youtubeShowPrompt } from './youtubeShow';
export { contentPillarsPrompt } from './contentPillars';

// Prompt mapping by key for API use
export const PROMPTS = {
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
    11: 'contentIdeas',
    12: 'program12Month',
    13: 'youtubeShow',
    14: 'contentPillars'
};

export const getPromptByKey = (key) => {
    const promptMap = {
        1: require('./idealClient').default,
        2: require('./message').default,
        3: require('./story').default,
        4: require('./offer').default,
        5: require('./salesScripts').default,
        6: require('./leadMagnet').default,
        7: require('./vsl').default,
        8: require('./emails').default,
        9: require('./facebookAds').default,
        10: require('./funnelCopy').default,
        11: require('./contentIdeas').default,
        12: require('./program12Month').default,
        13: require('./youtubeShow').default,
        14: require('./contentPillars').default
    };

    return promptMap[key];
};
