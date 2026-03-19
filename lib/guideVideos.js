/**
 * TedOS Guide Video Registry
 * Central source of truth for all tutorial video mappings.
 * YouTube watch URLs are converted to embed IDs at use time.
 */

export const GUIDE_VIDEOS = {
    // --- Introduction ---
    welcomeToTedos: {
        id: 'BeoQjnwRA3g',
        title: 'Welcome to TedOS',
        description: 'Get a full overview of the TedOS platform and what you\'re about to build.',
    },
    createMarketingEngine: {
        id: 'sK6Zegk4itQ',
        title: 'Create a New Marketing Engine',
        description: 'Learn how to create and set up your first marketing engine.',
    },
    howToBuild: {
        id: 'nNp_gUwnM00',
        title: 'How to Build (The 20 Questions)',
        description: 'Walk through the 20-question process before you start answering.',
    },

    // --- Intake Form (Question Slides) ---
    uniqueAdvantage: {
        id: 'wSGftVUjVtQ',
        title: 'Unique Advantage',
        description: 'How to identify and articulate what makes your approach different.',
    },
    storyFramework: {
        id: '39JOsZn48rE',
        title: 'Your Story Framework',
        description: 'How to tell your personal story and mission in a compelling way.',
    },
    testimonialsGuide: {
        id: '2f-NmiDK3Ug',
        title: 'Testimonials Questions Guide',
        description: 'How to share client results and social proof effectively.',
    },
    programService: {
        id: '_SXy0DQq_4E',
        title: 'Program or Service Offered',
        description: 'How to describe your program or service for maximum clarity.',
    },

    // --- Vault: Phase Overview ---
    phaseOne: {
        id: 'mVxuBWVTNYc',
        title: 'Welcome to Phase One',
        description: 'An overview of your Phase 1 business core assets and how to use them.',
    },
    phaseTwo: {
        id: 'mHivMfb_JSY',
        title: 'Welcome to Phase Two',
        description: 'An overview of your Phase 2 funnel assets and how to deploy them.',
    },

    // --- Vault: Section Guides ---
    idealClient: {
        id: 'TBHbTXB9j_Q',
        title: 'Ideal Client Vault',
        description: 'How to review, edit, and use your Ideal Client profile.',
    },
    message: {
        id: 'UQUnkvSXDek',
        title: 'Message Vault',
        description: 'How to use your Million-Dollar Message across all platforms.',
    },
    story: {
        id: '8UstYYc-s4s',
        title: 'Story Section',
        description: 'How to use your Signature Story in networking, podcasts, and stages.',
    },
    offerPricing: {
        id: 'oCp8hB9UP3M',
        title: 'Offer + Pricing Section',
        description: 'How to understand and use your Signature Offer and pricing architecture.',
    },
    freeGift: {
        id: 'sJNuVN0TuEo',
        title: 'Free Gift Section',
        description: 'How to use your free gift asset to capture leads.',
    },
    vsl: {
        id: 'qDdgbf0Kqqg',
        title: 'VSL & Appointment Booking Script',
        description: 'How to record and use your video sales letter script.',
    },
    bio: {
        id: 'COvJhOKJ0BU',
        title: 'Bio Section',
        description: 'How to use your Professional Bio for authority positioning.',
    },
    ads: {
        id: 'kuT2NnuuVZ8',
        title: 'Ads Section',
        description: 'How to run your ad copy on Facebook and Instagram.',
    },
    emailCampaigns: {
        id: 'h9ZTGGwJiGE',
        title: 'Email Campaigns Section',
        description: 'How to load and use your 15-day email nurture series.',
    },
    smsFollowUp: {
        id: 'BkBSFQcxSzM',
        title: 'Text Message Follow-Up Section',
        description: 'How to set up automated SMS follow-up sequences.',
    },
    appointmentReminders: {
        id: 'RflIKf52DOY',
        title: 'Appointment Reminders',
        description: 'How to add appointment reminder sequences to your booking system.',
    },
};

/**
 * Returns the YouTube embed URL for a given video key.
 * @param {string} videoKey - Key from GUIDE_VIDEOS
 */
export function getEmbedUrl(videoKey) {
    const video = GUIDE_VIDEOS[videoKey];
    if (!video) return null;
    return `https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1`;
}
