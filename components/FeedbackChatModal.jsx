"use client";
/**
 * FeedbackChatModal - AI Feedback Chat for Vault Sections
 *
 * Enhanced with:
 * - Group-wise field selection panel with content previews
 * - Multi-field selection (checkboxes) per group
 * - FunnelCopy sub-page drill-down (optinPage / salesPage / etc.)
 * - Filtered before/after diff — only changed fields shown
 * - Improved content parser & UI
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Send, Loader2, CheckCircle, MessageSquare,
    Lightbulb, RefreshCw, Save, AlertCircle,
    ChevronDown, ChevronUp, FileImage, CheckSquare,
    Square, ChevronRight, Layers, SlidersHorizontal,
    ArrowLeft, LayoutList
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import DOMPurify from "isomorphic-dompurify";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { getFieldsForSection } from "@/lib/vault/fieldStructures";
import { calculateDependencyImpact } from "@/lib/vault/dependencyGraph";

// Sanitize AI/vault HTML before rendering — blocks stored XSS via script/event handlers
const sanitizeHtml = (html) => DOMPurify.sanitize(String(html ?? ""));

// ─── Chat openers ────────────────────────────────────────────────────────────
const CHAT_OPENERS = [
    "Let's make this even better. Select the fields you want to refine from the panel.",
    "I'm ready to help you improve this section. Pick the fields you want to change.",
    "Choose which fields to refine — you can select one or several at once."
];

// ─── Section options (sub-field list per section) ────────────────────────────
const SECTION_OPTIONS = {
    idealClient: [
        { id: 'bestIdealClient', label: 'Best Ideal Client', group: 'Demographics' },
        { id: 'top3Challenges', label: 'Top 3 Challenges', group: 'Psychographics' },
        { id: 'whatTheyWant', label: 'What They Want', group: 'Psychographics' },
        { id: 'whatMakesThemPay', label: 'What Makes Them Pay', group: 'Buying Behavior' },
        { id: 'howToTalkToThem', label: 'How to Talk to Them', group: 'Communication' },
    ],
    message: [
        { id: 'oneLineMessage', label: 'One-Liner Message', group: 'Core' },
        { id: 'spokenIntroduction', label: '30-Second Coffee Talk', group: 'Core' },
        { id: 'powerPositioningLines', label: 'Power Positioning Lines', group: 'Core' },
    ],
    story: [
        { id: 'bigIdea', label: 'Big Idea (Core Concept)', group: 'Story' },
        { id: 'networkingStory', label: 'Networking Story (60-90s)', group: 'Story' },
        { id: 'stageStory', label: 'Stage/Podcast Story (3-5 min)', group: 'Story' },
        { id: 'socialPostVersion', label: 'Social Media Version', group: 'Story' },
    ],
    offer: [
        { id: 'offerMode', label: 'Offer Mode', group: 'Basics' },
        { id: 'offerName', label: 'Branded System Name', group: 'Basics' },
        { id: 'sevenStepBlueprint', label: '7-Step Blueprint', group: 'Blueprint' },
        { id: 'tier1Promise', label: 'Tier 1: The Promise', group: 'Tier 1 (90-day)' },
        { id: 'tier1Timeframe', label: 'Tier 1: Timeframe', group: 'Tier 1 (90-day)' },
        { id: 'tier1Deliverables', label: 'Tier 1: Deliverables', group: 'Tier 1 (90-day)' },
        { id: 'tier1RecommendedPrice', label: 'Tier 1: Price', group: 'Tier 1 (90-day)' },
        { id: 'tier2Promise', label: 'Tier 2: The Promise', group: 'Tier 2 (12-month)' },
        { id: 'tier2Timeframe', label: 'Tier 2: Timeframe', group: 'Tier 2 (12-month)' },
        { id: 'tier2Deliverables', label: 'Tier 2: Deliverables', group: 'Tier 2 (12-month)' },
        { id: 'tier2RecommendedPrice', label: 'Tier 2: Price', group: 'Tier 2 (12-month)' },
        { id: 'offerPromise', label: 'Combined Offer Promise', group: 'Combined' },
    ],
    leadMagnet: [
        { id: 'mainTitle', label: 'Lead Magnet Title', group: 'Core' },
        { id: 'subtitle', label: 'Subtitle / Hook', group: 'Core' },
        { id: 'coreDeliverables', label: 'Core Deliverables', group: 'Content' },
        { id: 'optInHeadline', label: 'Opt-In Page Headline', group: 'Landing Page' },
        { id: 'bullets', label: 'Benefit Bullets', group: 'Landing Page' },
        { id: 'ctaButtonText', label: 'CTA Button Text', group: 'Landing Page' },
    ],
    vsl: [
        { id: 'step1_patternInterrupt', label: 'Pattern Interrupt', group: 'Step 1: The Hook' },
        { id: 'step1_characterIntro', label: 'Character Intro', group: 'Step 1: The Hook' },
        { id: 'step1_problemStatement', label: 'Problem Statement', group: 'Step 1: The Hook' },
        { id: 'step1_emotionalConnection', label: 'Emotional Connection', group: 'Step 1: The Hook' },
        { id: 'step2_benefitLead', label: 'Benefit Lead', group: 'Step 2: The Problem' },
        { id: 'step2_uniqueSolution', label: 'Unique Solution', group: 'Step 2: The Problem' },
        { id: 'step2_benefitsHighlight', label: 'Benefits Highlight', group: 'Step 2: The Problem' },
        { id: 'step2_problemAgitation', label: 'Problem Agitation', group: 'Step 2: The Problem' },
        { id: 'step3_nightmareStory', label: 'Nightmare Story', group: 'Step 3: The Epiphany' },
        { id: 'step3_clientTestimonials', label: 'Client Testimonials', group: 'Step 3: The Epiphany' },
        { id: 'step3_dataPoints', label: 'Data Points', group: 'Step 3: The Epiphany' },
        { id: 'step3_expertEndorsements', label: 'Expert Endorsements', group: 'Step 3: The Epiphany' },
        { id: 'step4_detailedDescription', label: 'Detailed Description', group: 'Step 4: The Solution' },
        { id: 'step4_demonstration', label: 'Demonstration', group: 'Step 4: The Solution' },
        { id: 'step4_psychologicalTriggers', label: 'Psychological Triggers', group: 'Step 4: The Solution' },
        { id: 'step5_intro', label: 'Value Intro', group: 'Step 5: The Value' },
        { id: 'step5_tips', label: '3 Core Tips', group: 'Step 5: The Value' },
        { id: 'step5_transition', label: 'Transition', group: 'Step 5: The Value' },
        { id: 'step6_directEngagement', label: 'Direct Engagement', group: 'Step 6: The Offer' },
        { id: 'step6_urgencyCreation', label: 'Urgency Creation', group: 'Step 6: The Offer' },
        { id: 'step6_clearOffer', label: 'Clear Offer', group: 'Step 6: The Offer' },
        { id: 'step6_stepsToSuccess', label: 'Steps to Success', group: 'Step 6: The Offer' },
        { id: 'step7_recap', label: 'Recap', group: 'Step 7: The Stack' },
        { id: 'step7_primaryCTA', label: 'Primary CTA', group: 'Step 7: The Stack' },
        { id: 'step7_offerFeaturesAndPrice', label: 'Features & Price', group: 'Step 7: The Stack' },
        { id: 'step7_bonuses', label: 'Bonuses', group: 'Step 7: The Stack' },
        { id: 'step7_secondaryCTA', label: 'Secondary CTA', group: 'Step 7: The Stack' },
        { id: 'step7_guarantee', label: 'Guarantee', group: 'Step 7: The Stack' },
        { id: 'step8_theClose', label: 'The Close', group: 'Step 8: The Close' },
        { id: 'step8_addressObjections', label: 'Address Objections', group: 'Step 8: The Close' },
        { id: 'step8_reiterateValue', label: 'Reiterate Value', group: 'Step 8: The Close' },
        { id: 'step9_followUpStrategy', label: 'Follow-Up Strategy', group: 'Step 9: The Future' },
        { id: 'step9_finalPersuasion', label: 'Final Persuasion', group: 'Step 9: The Future' },
        { id: 'step10_hardClose', label: 'Hard Close', group: 'Step 10: Final Push' },
        { id: 'step10_handleObjectionsAgain', label: 'Objection Handler', group: 'Step 10: Final Push' },
        { id: 'step10_scarcityClose', label: 'Scarcity Close', group: 'Step 10: Final Push' },
        { id: 'step10_inspirationClose', label: 'Inspiration Close', group: 'Step 10: Final Push' },
        { id: 'step10_speedUpAction', label: 'Speed Up Action', group: 'Step 10: Final Push' },
    ],
    facebookAds: [
        { id: 'shortAd1Headline', label: 'Short Ad #1: Headline', group: 'Short Ad 1' },
        { id: 'shortAd1PrimaryText', label: 'Short Ad #1: Body', group: 'Short Ad 1' },
        { id: 'shortAd1CTA', label: 'Short Ad #1: CTA', group: 'Short Ad 1' },
        { id: 'shortAd2Headline', label: 'Short Ad #2: Headline', group: 'Short Ad 2' },
        { id: 'shortAd2PrimaryText', label: 'Short Ad #2: Body', group: 'Short Ad 2' },
        { id: 'shortAd2CTA', label: 'Short Ad #2: CTA', group: 'Short Ad 2' },
        { id: 'longAdHeadline', label: 'Long Ad: Headline', group: 'Long Ad' },
        { id: 'longAdPrimaryText', label: 'Long Ad: Body', group: 'Long Ad' },
        { id: 'longAdCTA', label: 'Long Ad: CTA', group: 'Long Ad' },
    ],
    vslShort: [
        { id: 'patternInterruptHook', label: 'Pattern Interrupt Hook', group: 'Opening' },
        { id: 'identifyAudience', label: 'Identify Audience', group: 'Opening' },
        { id: 'amplifyCorePain', label: 'Amplify Core Pain', group: 'Opening' },
        { id: 'introduceEnemy', label: 'Introduce Enemy', group: 'Problem' },
        { id: 'revealHiddenTruth', label: 'Reveal Hidden Truth', group: 'Problem' },
        { id: 'earlyCTA', label: 'Early CTA', group: 'CTA' },
        { id: 'authorityStory', label: 'Authority Story', group: 'Authority' },
        { id: 'namedFramework', label: 'Named Framework', group: 'Solution' },
        { id: 'insightOne', label: 'Insight One', group: 'Insights' },
        { id: 'insightTwo', label: 'Insight Two', group: 'Insights' },
        { id: 'insightThree', label: 'Insight Three', group: 'Insights' },
        { id: 'microCommitment', label: 'Micro-Commitment Moment', group: 'Closing Sequence' },
        { id: 'futurePace', label: 'Future Pace the Outcome', group: 'Closing Sequence' },
        { id: 'objectionHandling', label: 'Objection Handling', group: 'Closing Sequence' },
        { id: 'riskReversal', label: 'Risk Reversal + Call Expectations', group: 'Closing Sequence' },
        { id: 'finalCTA', label: 'Final CTA', group: 'Close' },
    ],
    emails: [
        { id: 'email1', label: 'Day 1: Gift Delivery + Welcome', group: 'Week 1' },
        { id: 'email2', label: 'Day 2: Tip #1', group: 'Week 1' },
        { id: 'email3', label: 'Day 3: Tip #2', group: 'Week 1' },
        { id: 'email4', label: 'Day 4: Tip #3', group: 'Week 1' },
        { id: 'email5', label: 'Day 5: Tip #4', group: 'Week 1' },
        { id: 'email6', label: 'Day 6: Tip #5', group: 'Week 1' },
        { id: 'email7', label: 'Day 7: Tip #6', group: 'Week 1' },
        { id: 'email8a', label: 'Day 8 AM: Why a Call Helps', group: 'Week 2 Push' },
        { id: 'email8b', label: 'Day 8 PM: Success Story', group: 'Week 2 Push' },
        { id: 'email8c', label: 'Day 8 EVE: Last Chance', group: 'Week 2 Push' },
        { id: 'email9', label: 'Day 9: Mindset/Strategy', group: 'Week 2' },
        { id: 'email10', label: 'Day 10: Common Mistakes', group: 'Week 2' },
        { id: 'email11', label: 'Day 11: Hidden Obstacles', group: 'Week 2' },
        { id: 'email12', label: 'Day 12: Behind the Scenes', group: 'Week 2' },
        { id: 'email13', label: 'Day 13: Results Timeline', group: 'Week 2' },
        { id: 'email14', label: 'Day 14: Simplify', group: 'Week 2' },
        { id: 'email15a', label: 'Day 15 AM: Final Day', group: 'Final Push' },
        { id: 'email15b', label: 'Day 15 PM: FAQ/Objections', group: 'Final Push' },
        { id: 'email15c', label: 'Day 15 EVE: Final Push', group: 'Final Push' },
    ],
    sms: [
        { id: 'sms1', label: 'Day 1: Welcome + Gift Reminder', group: 'Week 1' },
        { id: 'sms2', label: 'Day 2: Value Nudge', group: 'Week 1' },
        { id: 'sms3', label: 'Day 3: Quick Tip', group: 'Week 1' },
        { id: 'sms4', label: 'Day 4: Social Proof', group: 'Week 1' },
        { id: 'sms5', label: 'Day 5: Booking Reminder', group: 'Week 1' },
        { id: 'sms6', label: 'Day 6: Final Value', group: 'Week 1' },
        { id: 'sms7a', label: 'Day 7 AM: Value Reminder', group: 'Week 1' },
        { id: 'sms7b', label: 'Day 7 PM: Final Value', group: 'Week 1' },
        { id: 'sms8a', label: 'Day 8 AM: Why a Call Helps', group: 'Week 2 Push' },
        { id: 'sms8b', label: 'Day 8 PM: Success Story', group: 'Week 2 Push' },
        { id: 'sms8c', label: 'Day 8 EVE: Last Chance', group: 'Week 2 Push' },
        { id: 'sms9', label: 'Day 9: Mindset/Strategy', group: 'Week 2' },
        { id: 'sms10', label: 'Day 10: Common Mistakes', group: 'Week 2' },
        { id: 'sms11', label: 'Day 11: Hidden Obstacles', group: 'Week 2' },
        { id: 'sms12', label: 'Day 12: Behind the Scenes', group: 'Week 2' },
        { id: 'sms13', label: 'Day 13: Results Timeline', group: 'Week 2' },
        { id: 'sms14', label: 'Day 14: Simplify', group: 'Week 2' },
        { id: 'sms15a', label: 'Day 15 AM: Final Day', group: 'Final Push' },
        { id: 'sms15b', label: 'Day 15 PM: FAQ/Objections', group: 'Final Push' },
        { id: 'sms15c', label: 'Day 15 EVE: Final Push', group: 'Final Push' },
        { id: 'smsNoShow1', label: 'No-Show: Check-In', group: 'No-Show' },
        { id: 'smsNoShow2', label: 'No-Show: Reschedule', group: 'No-Show' },
    ],
    salesScripts: [
        { id: 'agendaPermission', label: 'Box 1: Agenda + Permission', group: 'Opening' },
        { id: 'discoveryQuestions', label: 'Box 2: Discovery Questions', group: 'Discovery' },
        { id: 'stakesImpact', label: 'Box 3: Stakes + Cost of Inaction', group: 'Discovery' },
        { id: 'commitmentScale', label: 'Box 4: Commitment Scale', group: 'Qualification' },
        { id: 'decisionGate', label: 'Box 5: Decision Gate', group: 'Qualification' },
        { id: 'recapConfirmation', label: 'Box 6: Recap + Confirmation', group: 'Pitch' },
        { id: 'pitchScript', label: 'Box 7: 3-Step Plan Pitch', group: 'Pitch' },
        { id: 'proofLine', label: 'Box 8: Proof Line', group: 'Pitch' },
        { id: 'investmentClose', label: 'Box 9: Investment + Close', group: 'Close' },
        { id: 'nextSteps', label: 'Box 10: Next Steps', group: 'Close' },
        { id: 'objectionHandling', label: 'Box 11: Objection Handling', group: 'Objections' },
    ],
    setterScript: [
        { id: 'callGoal', label: 'Goal of This Call', group: 'Setup' },
        { id: 'setterMindset', label: 'Setter Mindset', group: 'Setup' },
        { id: 'openingOptIn', label: 'Opening: Free Gift Opt-In', group: 'Opening' },
        { id: 'permissionPurpose', label: 'Permission + Purpose', group: 'Opening' },
        { id: 'currentSituation', label: 'Current Situation Snapshot', group: 'Discovery' },
        { id: 'primaryGoal', label: 'Primary Goal', group: 'Discovery' },
        { id: 'primaryObstacle', label: 'Primary Obstacle + Stakes', group: 'Discovery' },
        { id: 'authorityDrop', label: 'Authority Drop', group: 'Positioning' },
        { id: 'fitReadiness', label: 'Fit + Readiness Check', group: 'Qualification' },
        { id: 'bookCall', label: 'Book Call Live', group: 'Close' },
        { id: 'confirmShowUp', label: 'Confirm Show-Up + Wrap', group: 'Close' },
        { id: 'objectionHandling', label: 'Objection Handling', group: 'Objections' },
    ],
    appointmentReminders: [
        { id: 'preCallTips', label: 'Pre-Call Tips', group: 'Email' },
        { id: 'confirmationEmail', label: 'Confirmation (Immediately)', group: 'Email' },
        { id: 'reminder48Hours', label: '48-Hour Reminder', group: 'Email' },
        { id: 'reminder24Hours', label: '24-Hour Reminder', group: 'Email' },
        { id: 'reminder1Hour', label: '1-Hour Reminder', group: 'Email' },
        { id: 'reminder10Minutes', label: '10-Minute Reminder', group: 'Email' },
        { id: 'startingNow', label: 'Starting Now', group: 'Email' },
        { id: 'noShowFollowUp', label: 'No-Show Follow-up', group: 'Email' },
        { id: 'smsReminders', label: 'SMS Reminders', group: 'SMS' },
    ],
    bio: [
        { id: 'fullBio', label: 'Full Bio (200 words)', group: 'Bios' },
        { id: 'shortBio', label: 'Short Bio (75 words)', group: 'Bios' },
        { id: 'speakerBio', label: 'Speaker Bio (150 words)', group: 'Bios' },
        { id: 'oneLiner', label: 'One-Liner', group: 'Quick Lines' },
        { id: 'keyAchievements', label: 'Key Achievements', group: 'Quick Lines' },
    ],
    colors: [
        { id: 'primary', label: 'Primary Color', group: 'Color Palette' },
        { id: 'secondary', label: 'Secondary Color', group: 'Color Palette' },
        { id: 'tertiary', label: 'Tertiary / Accent Color', group: 'Color Palette' },
        { id: 'reasoning', label: 'Color Palette Rationale', group: 'Color Palette' },
    ],
    // funnelCopy uses sub-page drill-down (handled separately)
    default: []
};

// ─── FunnelCopy sub-page definitions ─────────────────────────────────────────
const FUNNEL_SUBPAGES = [
    { id: 'optinPage', label: 'Opt-In Page', icon: '📋' },
    { id: 'salesPage', label: 'Appointment Booking Page', icon: '📅' },
    { id: 'calendarPage', label: 'Calendar Page', icon: '🗓' },
    { id: 'thankYouPage', label: 'Thank You Page', icon: '🎉' },
];

const FUNNEL_SUBPAGE_FIELDS = {
    optinPage: [
        { id: 'headline_text', label: 'Headline', group: 'Opt-In Page' },
        { id: 'subheadline_text', label: 'Subheadline', group: 'Opt-In Page' },
        { id: 'cta_button_text', label: 'CTA Button Text', group: 'Opt-In Page' },
        { id: 'popup_form_headline', label: 'Popup Form Headline', group: 'Popup' },
        { id: 'footer_text', label: 'Footer', group: 'Footer' },
    ],
    salesPage: [
        { id: 'hero_headline_text', label: 'Hero Headline', group: 'Hero Section' },
        { id: 'hero_subheadline_text', label: 'Hero Subheadline', group: 'Hero Section' },
        { id: 'hero_below_cta_sub_text', label: 'Text Below CTA', group: 'Hero Section' },
        { id: 'cta_text', label: 'Primary CTA Button', group: 'Hero Section' },
        { id: 'process_headline', label: 'Process Section Headline', group: 'Process Overview' },
        { id: 'process_subheadline', label: 'Process Subheadline', group: 'Process Overview' },
        { id: 'process_1_headline', label: 'Process 1 Headline', group: 'Process Steps' },
        { id: 'process_1_subheadline', label: 'Process 1 Description', group: 'Process Steps' },
        { id: 'process_2_headline', label: 'Process 2 Headline', group: 'Process Steps' },
        { id: 'process_2_subheadline', label: 'Process 2 Description', group: 'Process Steps' },
        { id: 'process_3_headline', label: 'Process 3 Headline', group: 'Process Steps' },
        { id: 'process_3_subheadline', label: 'Process 3 Description', group: 'Process Steps' },
        { id: 'how_it_works_headline', label: 'How It Works Headline', group: 'How It Works' },
        { id: 'audience_headline', label: 'Audience Headline', group: 'Audience' },
        { id: 'call_expectations_is_for_headline', label: 'Call Is For Headline', group: 'Call Expectations' },
        { id: 'call_expectations_is_for_bullet_1', label: 'Is-For Bullet 1', group: 'Call Expectations' },
        { id: 'call_expectations_is_for_bullet_2', label: 'Is-For Bullet 2', group: 'Call Expectations' },
        { id: 'call_expectations_is_for_bullet_3', label: 'Is-For Bullet 3', group: 'Call Expectations' },
        { id: 'call_expectations_not_for_headline', label: 'Not-For Headline', group: 'Call Expectations' },
        { id: 'call_expectations_not_for_bullet_1', label: 'Not-For Bullet 1', group: 'Call Expectations' },
        { id: 'call_expectations_not_for_bullet_2', label: 'Not-For Bullet 2', group: 'Call Expectations' },
        { id: 'call_expectations_not_for_bullet_3', label: 'Not-For Bullet 3', group: 'Call Expectations' },
        { id: 'bio_headline_text', label: 'Bio Headline', group: 'Bio Section' },
        { id: 'bio_paragraph_text', label: 'Bio Paragraph', group: 'Bio Section' },
        { id: 'testimonial_headline_text', label: 'Testimonials Headline', group: 'Testimonials' },
        { id: 'faq_headline_text', label: 'FAQ Headline', group: 'FAQ' },
        { id: 'final_cta_headline_text', label: 'Final CTA Headline', group: 'Final CTA' },
        { id: 'final_cta_button_text', label: 'Final CTA Button', group: 'Final CTA' },
        { id: 'footer_text', label: 'Footer', group: 'Footer' },
    ],
    calendarPage: [
        { id: 'headline_text', label: 'Headline', group: 'Calendar Page' },
        { id: 'subheadline_text', label: 'Subheadline', group: 'Calendar Page' },
        { id: 'footer_text', label: 'Footer', group: 'Footer' },
    ],
    thankYouPage: [
        { id: 'headline_text', label: 'Headline', group: 'Thank You Page' },
        { id: 'subheadline_text', label: 'Subheadline', group: 'Thank You Page' },
        { id: 'video_headline_text', label: 'Video Headline', group: 'Thank You Page' },
        { id: 'footer_text', label: 'Footer', group: 'Footer' },
    ],
};

// ─── Helper: get field structure ─────────────────────────────────────────────
function getFieldStructure(sectionId, fieldId) {
    try {
        const sectionFields = getFieldsForSection(sectionId);
        return sectionFields?.find(f => f.field_id === fieldId);
    } catch { return null; }
}

function isNestedField(sectionId, fieldId) {
    const fs = getFieldStructure(sectionId, fieldId);
    return fs?.field_type === 'object' && Array.isArray(fs?.field_metadata?.subfields) && fs.field_metadata.subfields.length > 0;
}

function getChildFieldOptions(sectionId, parentFieldId) {
    const fs = getFieldStructure(sectionId, parentFieldId);
    const subfields = fs?.field_metadata?.subfields || [];
    const grouped = {};
    subfields.forEach(sf => {
        const group = sf.group || 'General';
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push({ id: sf.field_id, label: sf.field_label || sf.field_id, group });
    });
    return grouped;
}

function getFieldLabel(sectionId, fieldId) {
    const fs = getFieldStructure(sectionId, fieldId);
    return fs?.field_label || fieldId;
}

// ─── Helper: extract current content snippet for a field ─────────────────────
// Normalize a key for fuzzy matching: lowercase + strip digits
// Handles mismatches like top3Challenges (field ID) ↔ topChallenges (JSON key)
function normalizeKey(s) { return s.toLowerCase().replace(/\d+/g, ''); }

// Fuzzy lookup: exact match first, then normalized key match
function fuzzyGet(obj, fieldId) {
    if (!obj || typeof obj !== 'object') return undefined;
    if (obj[fieldId] !== undefined && obj[fieldId] !== null) return obj[fieldId];
    const norm = normalizeKey(fieldId);
    for (const [k, v] of Object.entries(obj)) {
        if (!k.startsWith('_') && normalizeKey(k) === norm && v !== undefined && v !== null) return v;
    }
    return undefined;
}

function extractContentValue(currentContent, fieldId, funnelSubPage) {
    if (!currentContent) return null;
    try {
        if (funnelSubPage) {
            const pageData = currentContent?.[funnelSubPage] ?? currentContent?.funnelCopy?.[funnelSubPage];
            return fuzzyGet(pageData, fieldId) ?? null;
        }
        // Direct / fuzzy lookup at top level
        const direct = fuzzyGet(currentContent, fieldId);
        if (direct !== undefined) return direct;
        // Auto-unwrap one level of section wrappers (e.g. idealClientSnapshot, signatureOffer)
        for (const key of Object.keys(currentContent)) {
            if (key.startsWith('_')) continue;
            const nested = currentContent[key];
            if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
                const found = fuzzyGet(nested, fieldId);
                if (found !== undefined) return found;
            }
        }
        return null;
    } catch { return null; }
}

function getContentSnippet(value, maxLen = 90) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        const clean = value.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
        return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean || null;
    }
    if (Array.isArray(value)) return `${value.length} item${value.length !== 1 ? 's' : ''}`;
    if (typeof value === 'object') {
        const keys = Object.keys(value);
        return keys.length ? `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '…' : ''}}` : null;
    }
    return String(value).slice(0, maxLen) || null;
}

// ─── Helper: HTML detection ───────────────────────────────────────────────────
function isHtmlContent(str) {
    if (typeof str !== 'string') return false;
    return /<(?:p|div|strong|em|ul|ol|li|a|br|h[1-6]|span|table|tr|td|th|img)[\/\s>]/i.test(str);
}

// ─── Deep JSON parser ─────────────────────────────────────────────────────────
function deepParseJSON(content) {
    if (!content) return content;
    if (typeof content === 'string') {
        let cleaned = content.replace(/^```(?:json)?[\s\n]*/gi, '').replace(/[\s\n]*```$/gi, '').trim();
        try {
            return deepParseJSON(JSON.parse(cleaned));
        } catch {
            return cleaned.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
    }
    if (Array.isArray(content)) return content.map(deepParseJSON);
    if (typeof content === 'object' && content !== null) {
        const result = {};
        for (const [k, v] of Object.entries(content)) result[k] = deepParseJSON(v);
        return result;
    }
    return content;
}

// ─── Colors canonicalizer ─────────────────────────────────────────────────────
// Colors travel through the app in two clashing shapes: nested
// { primary, secondary, tertiary } and flat { primaryColor, secondaryColor,
// accentColor, ... } (and sometimes wrapped in `colorPalette`). The 3rd color is
// `tertiary` in one world and `accentColor`/`accent` in the other. Map any known
// alias onto the canonical { primary, secondary, tertiary, reasoning } so the diff
// shows all three cards and never silently drops the accent color.
function canonicalizeColors(raw) {
    const parsed = deepParseJSON(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return parsed;
    const src = (parsed.colorPalette && typeof parsed.colorPalette === 'object') ? parsed.colorPalette : parsed;
    const pick = (...keys) => {
        for (const k of keys) if (src[k] !== undefined && src[k] !== null) return src[k];
        return undefined;
    };
    const out = {};
    const primary = pick('primary', 'primaryColor');
    const secondary = pick('secondary', 'secondaryColor');
    const tertiary = pick('tertiary', 'accentColor', 'accent');
    const reasoning = pick('reasoning');
    if (primary !== undefined) out.primary = primary;
    if (secondary !== undefined) out.secondary = secondary;
    if (tertiary !== undefined) out.tertiary = tertiary;
    if (reasoning !== undefined) out.reasoning = reasoning;
    // If nothing matched a canonical slot, return the original so we never blank the diff.
    return Object.keys(out).length ? out : parsed;
}

// ─── Flatten parsed content into readable reference text ──────────────────────
// Used by the persistent reference panel (step 2) so the user can see the exact
// field content they're refining while typing their prompt. Phase 6B.
function contentToReferenceText(content, depth = 0) {
    const parsed = deepParseJSON(content);
    if (parsed === null || parsed === undefined || parsed === '') return '';
    if (typeof parsed === 'string') return parsed;
    if (typeof parsed === 'number' || typeof parsed === 'boolean') return String(parsed);
    const indent = '  '.repeat(depth);
    if (Array.isArray(parsed)) {
        return parsed
            .map((item) => {
                const text = contentToReferenceText(item, depth + 1);
                return text ? `${indent}• ${text.replace(/\n/g, `\n${indent}  `)}` : '';
            })
            .filter(Boolean)
            .join('\n');
    }
    if (typeof parsed === 'object') {
        return Object.entries(parsed)
            .filter(([k]) => !k.startsWith('_'))
            .map(([k, v]) => {
                const text = contentToReferenceText(v, depth + 1);
                if (!text) return '';
                const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
                // Inline scalars, block-out nested structures.
                return text.includes('\n')
                    ? `${indent}${label}:\n${text}`
                    : `${indent}${label}: ${text}`;
            })
            .filter(Boolean)
            .join('\n');
    }
    return '';
}

// ─── Collect diff paths between two structures ────────────────────────────────
function collectDiffPaths(before, after, path, diff) {
    if (before === after) return;
    const bArr = Array.isArray(before), aArr = Array.isArray(after);
    if (bArr || aArr) {
        if (JSON.stringify(before) !== JSON.stringify(after)) diff.add(path || '__all__');
        return;
    }
    const bObj = before && typeof before === 'object';
    const aObj = after && typeof after === 'object';
    if (bObj && aObj) {
        const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
        for (const key of keys) {
            if (key.startsWith('_')) continue;
            collectDiffPaths(before?.[key], after?.[key], path ? `${path}.${key}` : key, diff);
        }
        return;
    }
    diff.add(path || '__all__');
}

// ─── Format for readable display ─────────────────────────────────────────────
function formatForDisplay(content, depth = 0, options = {}) {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content.map((item, i) => {
            if (typeof item === 'object' && item !== null) return `${i + 1}. ${formatForDisplay(item, depth + 1, options)}`;
            return `${i + 1}. ${item}`;
        }).join('\n\n');
    }
    if (typeof content === 'object') {
        const lines = [];
        const indent = '  '.repeat(depth);
        const entries = options.getOrderedEntries
            ? options.getOrderedEntries(content, options.path || '')
            : Object.entries(content);
        for (const [key, value] of entries) {
            if (key.startsWith('_')) continue;
            const label = key
                .replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ')
                .replace(/part(\d+)/gi, 'Part $1').replace(/step(\d+)/gi, 'Step $1')
                .trim().split(' ')
                .map(w => /^\d+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
            if (Array.isArray(value)) {
                lines.push(`${indent}${label}:`);
                value.forEach((item, i) => {
                    lines.push(`${indent}  ${i + 1}. ${typeof item === 'object' ? formatForDisplay(item, depth + 1, options) : String(item)}`);
                });
                lines.push('');
            } else if (typeof value === 'object' && value !== null) {
                lines.push(`${indent}${label}:`);
                lines.push(formatForDisplay(value, depth + 1, { ...options, path: options.path ? `${options.path}.${key}` : key }));
            } else if (value !== null && value !== undefined) {
                lines.push(`${indent}${label}:`);
                lines.push(`${indent}${String(value).replace(/\\n/g, '\n')}`);
                lines.push('');
            }
        }
        return lines.join('\n').trim();
    }
    return String(content);
}

// ─── ContentPreviewRenderer ───────────────────────────────────────────────────
function ContentPreviewRenderer({ content, className = '', highlightMap, basePath = '', sectionId }) {
    if (!content) return null;
    let parsed = deepParseJSON(content);
    if (sectionId === 'funnelCopy' && parsed && typeof parsed === 'object' && parsed.funnelCopy) {
        parsed = parsed.funnelCopy;
    }

    const hasHighlight = (path) => {
        if (!highlightMap) return false;
        if (highlightMap.has('__all__')) return true;
        if (highlightMap.has(path)) return true;
        for (const p of highlightMap) { if (p.startsWith(path + '.')) return true; }
        return false;
    };

    const getOrderedKeys = (obj, path = '') => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return Object.keys(obj || {});
        try {
            const fieldStructure = getFieldsForSection(sectionId);
            if (!fieldStructure?.length) return Object.keys(obj);
            if (!path) {
                const ordered = fieldStructure.map(f => f.field_id).filter(k => k in obj);
                return [...ordered, ...Object.keys(obj).filter(k => !ordered.includes(k))];
            }
            const parentField = fieldStructure.find(f => f.field_id === path.split('.')[0]);
            const subfields = parentField?.field_metadata?.subfields || [];
            if (!subfields.length) return Object.keys(obj);
            const ordered = subfields.map(sf => sf.field_id).filter(k => k in obj);
            return [...ordered, ...Object.keys(obj).filter(k => !ordered.includes(k))];
        } catch { return Object.keys(obj); }
    };

    const getOrderedEntries = (obj, path = '') => getOrderedKeys(obj, path).map(key => [key, obj[key]]);

    if (typeof parsed === 'string' && isHtmlContent(parsed)) {
        return <div className={`prose prose-invert prose-sm max-w-none ${className}`} style={{ fontSize: '0.8125rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(parsed) }} />;
    }

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const hasHtmlVals = Object.values(parsed).some(v =>
            (typeof v === 'string' && isHtmlContent(v)) ||
            (typeof v === 'object' && v !== null && Object.values(v).some(sv => typeof sv === 'string' && isHtmlContent(sv)))
        );
        if (hasHtmlVals) {
            return (
                <div className={`space-y-4 ${className}`}>
                    {getOrderedEntries(parsed, basePath).map(([key, value]) => {
                        if (key.startsWith('_')) return null;
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim()
                            .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                        const fieldPath = basePath ? `${basePath}.${key}` : key;
                        const isHighlighted = hasHighlight(fieldPath);
                        if (typeof value === 'object' && value !== null) {
                            return (
                                <div key={key} className={`border border-[#2a2a2d] rounded-lg p-3 space-y-2 ${isHighlighted ? 'bg-cyan/10 border-cyan/40' : ''}`}>
                                    <div className="text-xs font-bold text-cyan uppercase tracking-wide">{label}</div>
                                    {getOrderedEntries(value, fieldPath).map(([sk, sv]) => (
                                        <div key={sk} className={hasHighlight(`${fieldPath}.${sk}`) ? 'rounded-md bg-cyan/10 p-2' : ''}>
                                            <span className="text-xs text-gray-500 font-medium">{sk.charAt(0).toUpperCase() + sk.slice(1)}:</span>
                                            {typeof sv === 'string' && isHtmlContent(sv)
                                                ? <div className="mt-1 prose prose-invert prose-sm max-w-none" style={{ fontSize: '0.75rem' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(sv) }} />
                                                : <p className="text-xs text-gray-300 mt-0.5">{String(sv)}</p>
                                            }
                                        </div>
                                    ))}
                                </div>
                            );
                        }
                        if (typeof value === 'string' && isHtmlContent(value)) {
                            return (
                                <div key={key} className={isHighlighted ? 'rounded-md bg-cyan/10 p-2' : ''}>
                                    <span className="text-xs text-gray-500 font-medium">{label}:</span>
                                    <div className="mt-1 prose prose-invert prose-sm max-w-none" style={{ fontSize: '0.75rem' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />
                                </div>
                            );
                        }
                        return (
                            <div key={key} className={isHighlighted ? 'rounded-md bg-cyan/10 p-2' : ''}>
                                <span className="text-xs text-gray-500 font-medium">{label}:</span>
                                <p className="text-xs text-gray-300 mt-0.5">{formatForDisplay(value)}</p>
                            </div>
                        );
                    })}
                </div>
            );
        }
    }

    return (
        <pre className={`text-xs whitespace-pre-wrap font-sans ${className}`}>
            {formatForDisplay(parsed, 0, { getOrderedEntries, path: basePath })}
        </pre>
    );
}

// ─── FilteredDiffPanel: Only shows changed fields ────────────────────────────
function FilteredDiffPanel({ before, after, highlightMap, sectionId, selectedFields, funnelSubPage }) {
    const beforeParsed = deepParseJSON(before);
    const afterParsed = deepParseJSON(after);

    // Helper: auto-unwrap one level when content has a single wrapper key (e.g. idealClientSnapshot)
    // Skips unwrap if a selected field is already present at the top level.
    const autoUnwrap = (raw) => {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
        const firstSelected = selectedFields && selectedFields.size > 0 ? [...selectedFields][0] : null;
        if (firstSelected && raw[firstSelected] !== undefined) return raw; // already at right level
        const keys = Object.keys(raw).filter(k => !k.startsWith('_'));
        if (keys.length === 1) {
            const inner = raw[keys[0]];
            if (inner && typeof inner === 'object' && !Array.isArray(inner) && Object.keys(inner).length > 1) {
                return inner;
            }
        }
        return raw;
    };

    // Normalise funnelCopy wrapper then auto-unwrap section wrappers
    // Colors get canonicalized (accentColor → tertiary, etc.) so all three cards render
    const canon = (v) => (sectionId === 'colors' ? canonicalizeColors(v) : v);
    const normBefore = canon(autoUnwrap((sectionId === 'funnelCopy' && beforeParsed?.funnelCopy) ? beforeParsed.funnelCopy : beforeParsed));
    const normAfter  = canon(autoUnwrap((sectionId === 'funnelCopy' && afterParsed?.funnelCopy)  ? afterParsed.funnelCopy  : afterParsed));

    // Determine which fields to show
    const fieldsToShow = useMemo(() => {
        if (!normAfter || typeof normAfter !== 'object') return [];

        // When specific fields were targeted, restrict diff to those fields only
        const targeted = selectedFields && selectedFields.size > 0 ? [...selectedFields] : null;

        if (highlightMap?.has('__all__')) {
            return targeted ?? Object.keys(normAfter).filter(k => !k.startsWith('_'));
        }

        // fuzzyInObj: fieldKey (e.g. top3Challenges) matches if exact or normalized key exists in obj
        const fuzzyInObj = (obj, fieldKey) => {
            if (!obj) return false;
            if (fieldKey in obj) return true;
            const norm = normalizeKey(fieldKey);
            return Object.keys(obj).some(k => !k.startsWith('_') && normalizeKey(k) === norm);
        };

        if (highlightMap && highlightMap.size > 0) {
            const topLevelChanged = new Set();
            for (const path of highlightMap) {
                topLevelChanged.add(path.split('.')[0]);
            }
            const changed = [...topLevelChanged].filter(k => fuzzyInObj(normAfter, k));
            return targeted ? changed.filter(k => targeted.includes(k)) : changed;
        }

        return targeted ?? Object.keys(normAfter).filter(k => !k.startsWith('_'));
    }, [normAfter, highlightMap, selectedFields]);

    if (!fieldsToShow.length) {
        return (
            <div className="text-center py-8 text-gray-500 text-sm">
                No changes detected in the content.
            </div>
        );
    }

    const renderValue = (val, depth = 0) => {
        if (!val && val !== 0) return <span className="text-gray-500 italic text-xs">—</span>;
        const parsed = deepParseJSON(val);
        if (typeof parsed === 'string') {
            if (isHtmlContent(parsed)) {
                return <div className="prose prose-invert prose-xs max-w-none text-xs" dangerouslySetInnerHTML={{ __html: sanitizeHtml(parsed) }} />;
            }
            return <p className="text-xs leading-relaxed whitespace-pre-wrap text-gray-300">{parsed}</p>;
        }
        if (Array.isArray(parsed)) {
            return (
                <ol className="space-y-1 list-decimal list-inside">
                    {parsed.map((item, i) => (
                        <li key={i} className="text-xs text-gray-300 leading-relaxed">
                            {typeof item === 'object' ? formatForDisplay(item, depth) : String(item)}
                        </li>
                    ))}
                </ol>
            );
        }
        if (typeof parsed === 'object') {
            return (
                <div className="space-y-1.5">
                    {Object.entries(parsed).filter(([k]) => !k.startsWith('_')).map(([k, v]) => (
                        <div key={k} className="text-xs">
                            <span className="text-gray-500 font-medium capitalize">
                                {k.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim()}:
                            </span>{' '}
                            <span className="text-gray-300">
                                {typeof v === 'string' ? v : typeof v === 'object' ? formatForDisplay(v) : String(v)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return <span className="text-xs text-gray-300">{String(parsed)}</span>;
    };

    const getFieldLabel = (key) => {
        // Try to find label from fieldStructures
        try {
            const fields = getFieldsForSection(sectionId);
            if (fields) {
                if (funnelSubPage) {
                    const pageField = fields.find(f => f.field_id === funnelSubPage);
                    const subfield = pageField?.field_metadata?.subfields?.find(sf => sf.field_id === key);
                    if (subfield) return subfield.field_label;
                }
                const field = fields.find(f => f.field_id === key);
                if (field) return field.field_label;
            }
        } catch {}
        return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim()
            .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };

    return (
        <div className="space-y-4">
            {fieldsToShow.map(fieldKey => {
                const beforeVal = fuzzyGet(normBefore, fieldKey);
                const afterVal  = fuzzyGet(normAfter,  fieldKey);
                const isChanged = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);

                return (
                    <div key={fieldKey} className={`rounded-xl border overflow-hidden ${isChanged ? 'border-[#2a3a3d]' : 'border-[#2a2a2d] opacity-60'}`}>
                        {/* Field label header */}
                        <div className={`px-3 py-2 flex items-center justify-between ${isChanged ? 'bg-[#0e1a1c]' : 'bg-[#111113]'}`}>
                            <span className={`text-xs font-semibold uppercase tracking-wide ${isChanged ? 'text-cyan' : 'text-gray-500'}`}>
                                {getFieldLabel(fieldKey)}
                            </span>
                            {isChanged && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan/20 text-cyan border border-cyan/30 font-medium">
                                    CHANGED
                                </span>
                            )}
                        </div>

                        {/* Before / After columns */}
                        <div className="grid grid-cols-2 divide-x divide-[#2a2a2d]">
                            <div className="p-3 bg-[#100c0c]">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500/70 inline-block" />
                                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Before</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                                    {renderValue(beforeVal)}
                                </div>
                            </div>
                            <div className={`p-3 ${isChanged ? 'bg-[#0a120e]' : 'bg-[#0e0e0f]'}`}>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className={`w-2 h-2 rounded-full inline-block ${isChanged ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isChanged ? 'text-emerald-400' : 'text-gray-500'}`}>After</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                                    {renderValue(afterVal)}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── FieldSelectorPanel ───────────────────────────────────────────────────────
function FieldSelectorPanel({
    sectionId, currentContent, selectedFields, onToggleField, onToggleGroup,
    funnelSubPage, onSetFunnelSubPage, onSelectAll, onClearAll
}) {
    const [expandedGroups, setExpandedGroups] = useState({});

    const isFunnelCopy = sectionId === 'funnelCopy';

    // Build groups — derive fields inside useMemo to keep stable deps
    const groups = useMemo(() => {
        const allFields = isFunnelCopy
            ? (funnelSubPage ? FUNNEL_SUBPAGE_FIELDS[funnelSubPage] || [] : [])
            : (SECTION_OPTIONS[sectionId] || []);
        const map = {};
        allFields.forEach(f => {
            const g = f.group || 'General';
            if (!map[g]) map[g] = [];
            map[g].push(f);
        });
        return Object.entries(map);
    }, [sectionId, funnelSubPage, isFunnelCopy]);

    const toggleGroup = (group) => {
        setExpandedGroups(prev => ({ ...prev, [group]: prev[group] === false ? true : false }));
    };

    const isGroupExpanded = (group) => expandedGroups[group] !== false;

    const groupSelected = (group, groupFields) => groupFields.filter(f => selectedFields.has(f.id)).length;
    const groupTotal = (_, groupFields) => groupFields.length;

    if (isFunnelCopy && !funnelSubPage) {
        return (
            <div className="h-full flex flex-col">
                <div className="px-4 py-3 border-b border-[#1E2A34]">
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Funnel Page Copy has multiple pages. Choose a page to see its fields.
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {FUNNEL_SUBPAGES.map(page => (
                        <button
                            key={page.id}
                            onClick={() => onSetFunnelSubPage(page.id)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#0D1217] hover:bg-[#111820] border border-[#1E2A34] hover:border-cyan/40 rounded-xl text-left transition-all group cursor-pointer"
                        >
                            <span className="text-xl leading-none">{page.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white group-hover:text-cyan transition-colors">{page.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {FUNNEL_SUBPAGE_FIELDS[page.id]?.length || 0} fields
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan transition-colors flex-shrink-0" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-[#1E2A34] space-y-2.5">
                {isFunnelCopy && funnelSubPage && (
                    <button
                        onClick={() => { onSetFunnelSubPage(null); onClearAll(); }}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to pages
                    </button>
                )}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                        {selectedFields.size > 0
                            ? <span className="text-cyan font-medium">{selectedFields.size} field{selectedFields.size !== 1 ? 's' : ''} selected</span>
                            : <span>Select fields to refine</span>
                        }
                    </span>
                    <div className="flex gap-2">
                        <button onClick={onSelectAll} className="text-[10px] text-gray-500 hover:text-cyan transition-colors cursor-pointer">
                            All
                        </button>
                        <span className="text-gray-700">·</span>
                        <button onClick={onClearAll} className="text-[10px] text-gray-500 hover:text-white transition-colors cursor-pointer">
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Field groups */}
            <div className="flex-1 overflow-y-auto">
                {groups.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-600 text-xs">No fields available</div>
                )}
                {groups.map(([group, groupFields]) => {
                    const selCount = groupSelected(group, groupFields);
                    const isOpen = isGroupExpanded(group);

                    return (
                        <div key={group} className="border-b border-[#1a2028]">
                            {/* Group header */}
                            <div
                                className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#0D1217] cursor-pointer select-none"
                                onClick={() => toggleGroup(group)}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleGroup(groupFields); }}
                                    className="flex-shrink-0 text-gray-500 hover:text-cyan transition-colors cursor-pointer"
                                    title={selCount === groupFields.length ? 'Deselect group' : 'Select group'}
                                >
                                    {selCount === groupFields.length && groupFields.length > 0
                                        ? <CheckSquare className="w-3.5 h-3.5 text-cyan" />
                                        : selCount > 0
                                            ? <div className="w-3.5 h-3.5 border border-cyan rounded-sm bg-cyan/30 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-cyan rounded-sm" />
                                              </div>
                                            : <Square className="w-3.5 h-3.5" />
                                    }
                                </button>
                                <span className="flex-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                                    {group}
                                </span>
                                {selCount > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/30 font-medium flex-shrink-0">
                                        {selCount}
                                    </span>
                                )}
                                {isOpen ? <ChevronUp className="w-3 h-3 text-gray-600 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-gray-600 flex-shrink-0" />}
                            </div>

                            {/* Field items */}
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className="overflow-hidden"
                                    >
                                        {groupFields.map(field => {
                                            const isSelected = selectedFields.has(field.id);
                                            const snippet = getContentSnippet(extractContentValue(currentContent, field.id, isFunnelCopy ? funnelSubPage : null));

                                            return (
                                                <label
                                                    key={field.id}
                                                    className={`flex items-start gap-2.5 px-4 py-2.5 cursor-pointer transition-colors select-none ${isSelected ? 'bg-cyan/5 hover:bg-cyan/8' : 'hover:bg-[#0D1217]'}`}
                                                    onClick={() => onToggleField(field.id)}
                                                >
                                                    <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-cyan border-cyan' : 'border-[#3a4a54] bg-[#0D1217]'}`}>
                                                        {isSelected && (
                                                            <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 12 12">
                                                                <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-medium leading-snug transition-colors ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                            {field.label}
                                                        </p>
                                                        {snippet && (
                                                            <p className="text-[10px] text-gray-600 mt-0.5 truncate leading-tight">
                                                                {snippet}
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── FieldValueDisplay ─────────────────────────────────────────────────────────────────────────────────
function FieldValueDisplay({ value }) {
    if (value === null || value === undefined) return <span className="text-xs text-gray-600 italic">No content</span>;
    const parsed = deepParseJSON(value);
    if (typeof parsed === 'string') {
        if (isHtmlContent(parsed)) {
            return <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(parsed) }} />;
        }
        return <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{parsed}</p>;
    }
    if (Array.isArray(parsed)) {
        return (
            <ol className="space-y-1 list-decimal list-inside">
                {parsed.map((item, i) => (
                    <li key={i} className="text-xs text-gray-300 leading-relaxed">
                        {typeof item === 'object' ? formatForDisplay(item) : String(item)}
                    </li>
                ))}
            </ol>
        );
    }
    if (typeof parsed === 'object') {
        return (
            <div className="space-y-1.5">
                {Object.entries(parsed).filter(([k]) => !k.startsWith('_')).map(([k, v]) => (
                    <div key={k} className="text-xs">
                        <span className="text-gray-500 font-medium capitalize">
                            {k.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim()}:
                        </span>{' '}
                        <span className="text-gray-300">
                            {typeof v === 'string' ? v : typeof v === 'object' ? formatForDisplay(v) : String(v)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return <span className="text-xs text-gray-300">{String(parsed)}</span>;
}

// ─── SelectedFieldsPreview ────────────────────────────────────────────────────────────────────────────
function SelectedFieldsPreview({ sectionId, selectedFields, currentContent, funnelSubPage, isFunnelCopy }) {
    if (!selectedFields || selectedFields.size === 0) return null;

    const fieldDefs = isFunnelCopy
        ? (funnelSubPage ? FUNNEL_SUBPAGE_FIELDS[funnelSubPage] || [] : [])
        : (SECTION_OPTIONS[sectionId] || []);

    const selected = fieldDefs.filter(f => selectedFields.has(f.id));
    if (selected.length === 0) return null;

    return (
        <div className="mt-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold px-1">
                <Layers className="w-3 h-3 text-cyan/60" />
                <span>Current Content — {selected.length} field{selected.length !== 1 ? 's' : ''} selected</span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {selected.map(field => {
                    const value = extractContentValue(
                        currentContent,
                        field.id,
                        isFunnelCopy ? funnelSubPage : null
                    );
                    return (
                        <div key={field.id} className="bg-[#080C10] border border-[#1E2A34] rounded-xl overflow-hidden">
                            <div className="px-3 py-2 bg-[#0A1018] border-b border-[#1E2A34] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan flex-shrink-0" />
                                <span className="text-[11px] font-semibold text-cyan">{field.label}</span>
                                <span className="text-[10px] text-gray-600 ml-auto">{field.group}</span>
                            </div>
                            <div className="p-3 max-h-40 overflow-y-auto scrollbar-thin">
                                <FieldValueDisplay value={value} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FeedbackChatModal({
    isOpen, onClose, sectionId, sectionTitle, subSection, currentContent, sessionId, onSave
}) {
    const { getToken } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedSubSection, setSelectedSubSection] = useState(null);
    const [chatStep, setChatStep] = useState(1);
    const [suggestedChanges, setSuggestedChanges] = useState(null);
    const [regenerationCount, setRegenerationCount] = useState(0);
    const [dependencyImpact, setDependencyImpact] = useState(null);
    const [selectedDependencies, setSelectedDependencies] = useState([]);
    const [isDependencyProcessing, setIsDependencyProcessing] = useState(false);
    const [lastUserFeedback, setLastUserFeedback] = useState('');
    const [previousAlternatives, setPreviousAlternatives] = useState([]);
    const messagesEndRef = useRef(null);

    // Streaming state
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState(null);
    const [partialContent, setPartialContent] = useState(null);
    const [partialError, setPartialError] = useState(null);
    const [latestContent, setLatestContent] = useState(currentContent);
    const [originalContent, setOriginalContent] = useState(null);

    // Field selection state (new)
    const [selectedFields, setSelectedFields] = useState(new Set());
    const [funnelSubPage, setFunnelSubPage] = useState(null);

    // Hierarchical / blueprint
    const [selectedParentField, setSelectedParentField] = useState(null);
    const [selectedChildField, setSelectedChildField] = useState(null);
    const [isHierarchicalSection, setIsHierarchicalSection] = useState(false);
    const [selectedBlueprintStep, setSelectedBlueprintStep] = useState(null);

    const abortControllerRef = useRef(null);
    const streamCompletedRef = useRef(false);

    const MAX_REGENERATIONS = 5;
    const USE_STREAMING = true;

    const subSectionOptions = SECTION_OPTIONS[sectionId] || SECTION_OPTIONS.default;
    const isFunnelCopy = sectionId === 'funnelCopy';

    // Compute highlight map from diff
    const highlightMap = useMemo(() => {
        if (!suggestedChanges) return null;
        // For funnelCopy sub-pages, compute the real diff between the flat sub-page objects.
        // Don't early-return — `selectedSubSection` is a page name (e.g. 'salesPage'), not a leaf key.
        const isFunnelSubPageSelection = isFunnelCopy && funnelSubPage !== null && FUNNEL_SUBPAGES.some(p => p.id === selectedSubSection);
        if (selectedSubSection && selectedSubSection !== 'all' && !isFunnelSubPageSelection) {
            return new Set([selectedSubSection]);
        }
        const diff = new Set();
        let before = deepParseJSON(originalContent || currentContent);
        let after = deepParseJSON(suggestedChanges);
        // Canonicalize colors so the diff keys on primary/secondary/tertiary (not accentColor)
        if (sectionId === 'colors') { before = canonicalizeColors(before); after = canonicalizeColors(after); }
        collectDiffPaths(before, after, '', diff);
        if (diff.size === 0) diff.add('__all__');
        return diff;
    }, [suggestedChanges, originalContent, currentContent, selectedSubSection, isFunnelCopy, funnelSubPage, sectionId]);

    // Readable text of the selected field content for the persistent reference
    // panel shown during the chat (step 2). Phase 6B.
    const referenceText = useMemo(
        () => contentToReferenceText(originalContent),
        [originalContent]
    );

    // ── Back to field selection (step 2 -> step 1) ────────────────────────────
    // Returns to field selection WITHOUT closing the modal and clears the active
    // field selection so the user can pick a different field. Phase 6B.
    const handleBackToFields = () => {
        setChatStep(1);
        setSelectedSubSection(null);
        setSelectedFields(new Set());
        setSelectedParentField(null);
        setSelectedChildField(null);
        setSelectedBlueprintStep(null);
        setIsHierarchicalSection(false);
        setOriginalContent(null);
        setSuggestedChanges(null);
        setPreviousAlternatives([]);
        setStreamingMessage(null);
        const opener = CHAT_OPENERS[Math.floor(Math.random() * CHAT_OPENERS.length)];
        setMessages([{ role: 'assistant', content: opener }]);
    };

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingMessage?.content]);

    // Cleanup on unmount
    useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

    // Initialize chat when modal opens
    useEffect(() => {
        if (isOpen) {
            const opener = CHAT_OPENERS[Math.floor(Math.random() * CHAT_OPENERS.length)];
            setMessages([{ role: 'assistant', content: opener }]);
            setChatStep(1);
            setSelectedSubSection(subSection || null);
            setSelectedBlueprintStep(null);
            setSuggestedChanges(null);
            setPreviousAlternatives([]);
            setStreamingMessage(null);
            setSelectedFields(new Set());
            setFunnelSubPage(null);
            setLatestContent(currentContent);
        }
    }, [isOpen, subSection]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Field selection handlers ───────────────────────────────────────────────
    const handleToggleField = (fieldId) => {
        setSelectedFields(prev => {
            const next = new Set(prev);
            if (next.has(fieldId)) next.delete(fieldId); else next.add(fieldId);
            return next;
        });
    };

    const handleToggleGroup = (groupFields) => {
        const allSelected = groupFields.every(f => selectedFields.has(f.id));
        setSelectedFields(prev => {
            const next = new Set(prev);
            groupFields.forEach(f => allSelected ? next.delete(f.id) : next.add(f.id));
            return next;
        });
    };

    const handleSelectAll = () => {
        const allFields = isFunnelCopy
            ? (funnelSubPage ? FUNNEL_SUBPAGE_FIELDS[funnelSubPage] || [] : [])
            : (SECTION_OPTIONS[sectionId] || []);
        setSelectedFields(new Set(allFields.map(f => f.id)));
    };

    const handleClearAll = () => setSelectedFields(new Set());

    // ── Proceed with selected fields ──────────────────────────────────────────
    const handleProceedWithFields = () => {
        if (selectedFields.size === 0) {
            toast.error('Please select at least one field to refine.');
            return;
        }

        // Determine subSection for the API
        let subSec;
        let fieldLabels = [];

        if (isFunnelCopy) {
            subSec = funnelSubPage || 'all';
            const pageFields = FUNNEL_SUBPAGE_FIELDS[funnelSubPage] || [];
            fieldLabels = pageFields.filter(f => selectedFields.has(f.id)).map(f => f.label);
        } else if (selectedFields.size === 1) {
            subSec = [...selectedFields][0];
            const opt = (SECTION_OPTIONS[sectionId] || []).find(o => o.id === subSec);
            fieldLabels = [opt?.label || subSec];
        } else {
            subSec = 'all';
            const opts = SECTION_OPTIONS[sectionId] || [];
            fieldLabels = opts.filter(o => selectedFields.has(o.id)).map(o => o.label);
        }

        setSelectedSubSection(subSec);
        setIsHierarchicalSection(false);
        setLatestContent(currentContent);

        // For funnelCopy, unwrap the funnelCopy wrapper before extracting the sub-page
        if (isFunnelCopy && funnelSubPage) {
            const raw = currentContent?.funnelCopy ?? currentContent;
            setOriginalContent(raw?.[funnelSubPage] ?? null);
        } else {
            // Always store the full section so FilteredDiffPanel can do object-level diff.
            // Single-field responses arrive as bare primitives from the API; wrapping happens at render time.
            setOriginalContent(currentContent);
        }

        const fieldList = fieldLabels.length > 0
            ? fieldLabels.map(l => `• ${l}`).join('\n')
            : subSec;

        const pageSuffix = isFunnelCopy && funnelSubPage
            ? ` on the **${FUNNEL_SUBPAGES.find(p => p.id === funnelSubPage)?.label || funnelSubPage}**`
            : '';

        setMessages(prev => [
            ...prev,
            { role: 'user', content: `Selected field${selectedFields.size !== 1 ? 's' : ''}:\n${fieldList}` },
            {
                role: 'assistant',
                content: `Got it — I'll refine ${selectedFields.size === 1 ? 'that field' : `those ${selectedFields.size} fields`}${pageSuffix}.\n\nWhat specifically would you like to change? Be as detailed as you can — for example:\n• "Make the tone more conversational"\n• "Add more urgency"\n• "Focus on the pain point of time scarcity"`
            }
        ]);
        setChatStep(2);
    };

    // ── Legacy sub-section select (for backward compat / blueprint) ───────────
    const handleSubSectionSelect = (option) => {
        if (option.id === 'sevenStepBlueprint') {
            setSelectedSubSection('sevenStepBlueprint');
            setIsHierarchicalSection(false);
            setLatestContent(currentContent);
            setMessages(prev => [
                ...prev,
                { role: 'user', content: option.label },
                { role: 'assistant', content: 'Which step of the 7-Step Blueprint would you like to refine?', showBlueprintStepPicker: true }
            ]);
            setChatStep(1.7);
            return;
        }
        if (option.id !== 'all' && isNestedField(sectionId, option.id)) {
            setSelectedParentField(option.id);
            setIsHierarchicalSection(true);
            setLatestContent(currentContent);
            setMessages(prev => [
                ...prev,
                { role: 'user', content: option.label },
                { role: 'assistant', content: `Which specific field in **${option.label}** would you like to refine?`, showChildFieldOptions: true, parentField: option.id }
            ]);
            setChatStep(1.5);
        } else {
            setSelectedSubSection(option.id);
            setIsHierarchicalSection(false);
            setLatestContent(currentContent);
            setOriginalContent(option.id === 'all' ? currentContent : currentContent?.[option.id]);
            setMessages(prev => [
                ...prev,
                { role: 'user', content: option.label },
                { role: 'assistant', content: `What specifically would you like to change about **${option.label}**?\n\nFor example:\n• "Make the language more conversational"\n• "Add urgency without being pushy"\n• "Focus on the pain point of time scarcity"` }
            ]);
            setChatStep(2);
        }
    };

    const handleBlueprintStepSelect = (stepIndex) => {
        const blueprint = Array.isArray(currentContent?.sevenStepBlueprint) ? currentContent.sevenStepBlueprint : [];
        const step = blueprint[stepIndex];
        const stepLabel = step?.stepName ? `Step ${stepIndex + 1}: ${step.stepName}` : `Step ${stepIndex + 1}`;
        setSelectedBlueprintStep(stepIndex);
        setOriginalContent(step || null);
        setMessages(prev => [
            ...prev,
            { role: 'user', content: stepLabel },
            { role: 'assistant', content: `What specifically would you like to change about **${stepLabel}**?` }
        ]);
        setChatStep(2);
    };

    const handleChildFieldSelect = (childFieldId) => {
        const combinedPath = `${selectedParentField}.${childFieldId}`;
        setSelectedChildField(childFieldId);
        setSelectedSubSection(combinedPath);
        setOriginalContent(currentContent?.[selectedParentField]?.[childFieldId]);
        setChatStep(2);
        setMessages(prev => [
            ...prev,
            { role: 'user', content: getFieldLabel(sectionId, childFieldId) },
            { role: 'assistant', content: `What specifically would you like to change about **${getFieldLabel(sectionId, childFieldId)}**?` }
        ]);
    };

    // ── Send feedback (streaming) ─────────────────────────────────────────────
    const handleSendFeedback = async () => {
        if (!inputText.trim() || isProcessing || isStreaming) return;

        const feedback = inputText.trim();
        setLastUserFeedback(feedback);

        // Prepend field targeting when multiple fields were selected
        const targetingPrefix = selectedFields.size > 1
            ? `[Target fields: ${[...selectedFields].join(', ')}]\n`
            : '';
        const effectiveFeedback = targetingPrefix + feedback;

        const userMessage = { id: `msg_${Date.now()}`, role: 'user', content: feedback, timestamp: Date.now(), isComplete: true };
        setInputText("");
        setMessages(prev => [...prev, userMessage]);
        setIsProcessing(true);

        if (USE_STREAMING) {
            setIsStreaming(true);
            const assistantMessageId = `msg_${Date.now() + 1}`;
            setStreamingMessage({ id: assistantMessageId, role: 'assistant', content: '', timestamp: Date.now(), isComplete: false, isStreaming: true });
            abortControllerRef.current = new AbortController();

            try {
                const token = await getToken();
                let parentSection = null, childField = null;
                if (selectedSubSection?.includes('.')) [parentSection, childField] = selectedSubSection.split('.');

                const requestPayload = {
                    sectionId,
                    subSection: selectedSubSection,
                    ...(parentSection && { parentSection }),
                    ...(selectedBlueprintStep !== null && selectedSubSection === 'sevenStepBlueprint' && {
                        stepIndex: selectedBlueprintStep,
                        blueprintContext: Array.isArray(currentContent?.sevenStepBlueprint) ? currentContent.sevenStepBlueprint : []
                    }),
                    // Always send targetFields for funnelCopy (even 1 field); other sections only need it for multi-select
                    ...((isFunnelCopy && funnelSubPage && selectedFields.size > 0
                        ? true
                        : selectedFields.size > 1) && { targetFields: [...selectedFields] }),
                    ...(funnelSubPage && { funnelSubPage }),
                    feedback: effectiveFeedback,
                    messageHistory: [...messages, userMessage],
                    currentContent: originalContent || latestContent,
                    sessionId
                };

                streamCompletedRef.current = false;

                const response = await fetch('/api/os/refine-section-stream', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                    body: JSON.stringify(requestPayload),
                    signal: abortControllerRef.current.signal
                });

                if (!response.ok) throw new Error('Stream failed');

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '', currentEvent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('event: ')) {
                            currentEvent = line.slice(7).trim();
                        } else if (line.startsWith('data: ') && currentEvent) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (currentEvent === 'token') {
                                    setStreamingMessage(prev => prev ? ({ ...prev, content: prev.content + data.content }) : null);
                                } else if (currentEvent === 'validated') {
                                    setSuggestedChanges(data.refinedContent);
                                    streamCompletedRef.current = true;
                                    if (data.refinedContent) { setLatestContent(data.refinedContent); setPreviousAlternatives(prev => [...prev, data.refinedContent]); }
                                    setChatStep(3);
                                    if (data.partialInfo?.isPartial) toast.warning(`${data.partialInfo.failedChunkNames.join(', ')} couldn't be regenerated. You can retry them individually.`, { duration: 8000 });
                                    setStreamingMessage(prev => prev ? ({ ...prev, isComplete: true, isStreaming: false, metadata: { validatedContent: data.refinedContent, rawText: data.rawText, validationWarning: data.validationWarning } }) : { id: `msg_${Date.now()}`, role: 'assistant', content: '', timestamp: Date.now(), isComplete: true, isStreaming: false, metadata: { validatedContent: data.refinedContent } });
                                    if (data.validationWarning) toast.warning(data.validationWarning);
                                } else if (currentEvent === 'partial') {
                                    setStreamingMessage(null);
                                    setPartialContent(data.partialContent);
                                    setPartialError({ reason: data.reason, error: data.error, canSave: data.canSave, canRetry: data.canRetry, canDiscard: data.canDiscard });
                                    setMessages(prev => [...prev, { role: 'assistant', content: `${data.reason === 'timeout' ? '⏱️ Generation timed out' : `❌ Generation failed: ${data.error || 'Unknown error'}`}\n\nReceived ${data.partialContent?.length || 0} characters. What would you like to do?`, isPartialError: true }]);
                                    setIsStreaming(false); setIsProcessing(false); setChatStep(2); return;
                                } else if (currentEvent === 'error') {
                                    setStreamingMessage(null);
                                    let errorText = data.message || 'Stream error';
                                    if (errorText.includes('wrong schema') || errorText.includes('mixed schemas')) errorText = '⚠️ Schema validation failed. Please try again.';
                                    else if (errorText.includes('timeout')) errorText = '⏱️ The request took too long. Please try a simpler refinement.';
                                    setMessages(prev => [...prev, { role: 'assistant', content: errorText, isError: true, showRetry: true }]);
                                    toast.error(data.message);
                                    setChatStep(2); setIsStreaming(false); setIsProcessing(false); return;
                                } else if (currentEvent === 'complete') {
                                    setSuggestedChanges(prev => {
                                        const contentToUse = prev || streamingMessage?.metadata?.validatedContent;
                                        if (contentToUse) setMessages(msgs => [...msgs, { role: 'assistant', content: "✓ Content generated. Review the changes below:", showPreview: true, previewContent: contentToUse }]);
                                        return contentToUse || prev;
                                    });
                                    setStreamingMessage(null);
                                    setChatStep(3); setRegenerationCount(prev => prev + 1);
                                    setIsStreaming(false); setIsProcessing(false);
                                }
                            } catch (parseError) { console.warn('[FeedbackChat] SSE parse error:', parseError); }
                            currentEvent = '';
                        }
                    }
                }

                if (!streamCompletedRef.current) {
                    setStreamingMessage(null);
                    setMessages(prev => [...prev, { role: 'assistant', content: '⏱️ Connection interrupted. Click **Try Again** to retry.', showRetry: true }]);
                    setChatStep(2); setIsStreaming(false); setIsProcessing(false);
                }
            } catch (error) {
                if (error.name === 'AbortError') return;
                setStreamingMessage(null);
                let errorMessage = error.message;
                if (errorMessage.includes('timeout')) errorMessage = '⏱️ Request timed out. Please try a simpler refinement.';
                else if (errorMessage.includes('JSON')) errorMessage = '❌ The AI returned invalid data. Please try again.';
                else errorMessage = `❌ ${errorMessage}`;
                toast.error(errorMessage);
                setMessages(prev => [...prev, { role: 'assistant', content: `${errorMessage}\n\nClick "Try Again" to retry.`, showRetry: true }]);
            } finally { setIsStreaming(false); setIsProcessing(false); }
        } else {
            // Non-streaming fallback
            try {
                setMessages(prev => [...prev, { role: 'assistant', content: '🤔 Analyzing your feedback...', isThinking: true }]);
                const response = await fetchWithAuth('/api/os/refine-section', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sectionId, subSection: selectedSubSection, feedback: effectiveFeedback, currentContent, sessionId })
                });
                if (!response.ok) throw new Error('Failed to generate refinement');
                const data = await response.json();
                setMessages(prev => [...prev.filter(m => !m.isThinking), { role: 'assistant', content: "Here's my suggested update:", showPreview: true, previewContent: data.refinedContent }]);
                setSuggestedChanges(data.refinedContent); setRegenerationCount(prev => prev + 1); setChatStep(3);
            } catch (error) {
                setMessages(prev => [...prev.filter(m => !m.isThinking), { role: 'assistant', content: `❌ ${error.message}` }]);
                toast.error("Refinement failed");
            } finally { setIsProcessing(false); }
        }
    };

    // ── Save changes ──────────────────────────────────────────────────────────
    const handleSaveChanges = () => {
        if (!suggestedChanges) return;
        const savePayload = {
            refinedContent: suggestedChanges, subSection: selectedSubSection,
            ...(selectedBlueprintStep !== null && selectedSubSection === 'sevenStepBlueprint' && { stepIndex: selectedBlueprintStep })
        };
        const impact = calculateDependencyImpact(sectionId, selectedSubSection);
        if (impact.hasImpact) {
            setDependencyImpact(impact);
            setSelectedDependencies(impact.affectedSections.map(s => s.sectionId));
            setChatStep(4);
            setMessages(prev => [...prev, { role: 'assistant', content: `🔗 **Heads up** — ${impact.affectedSections.length} other section${impact.affectedSections.length > 1 ? 's' : ''} depend on your changes to **${sectionTitle}**. Would you like to regenerate them?`, isDependencyPrompt: true }]);
        } else {
            onSave(savePayload); toast.success("Changes saved!"); onClose();
        }
    };

    const commitSave = () => {
        onSave({ refinedContent: suggestedChanges, subSection: selectedSubSection, ...(selectedBlueprintStep !== null && selectedSubSection === 'sevenStepBlueprint' && { stepIndex: selectedBlueprintStep }) });
        toast.success("Changes saved!");
    };

    const handleRegenerateDependencies = async () => {
        commitSave();
        if (selectedDependencies.length === 0) { toast.info('No sections selected.'); onClose(); return; }
        setIsDependencyProcessing(true);
        try {
            const response = await fetchWithAuth('/api/os/regenerate-dependent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, sections: selectedDependencies, sourceSection: sectionId, sourceField: selectedSubSection, userFeedback: lastUserFeedback, refinedChanges: JSON.stringify(suggestedChanges).substring(0, 1000) })
            });
            if (!response.ok) throw new Error('Failed to trigger dependency regeneration');
            const result = await response.json();
            window.dispatchEvent(new CustomEvent('regenerationTriggered', { detail: { sections: selectedDependencies, sourceSection: sectionId } }));
            toast.success(`Regenerating ${selectedDependencies.length} dependent section${selectedDependencies.length > 1 ? 's' : ''}. Check the vault for progress.`, { duration: 5000 });
        } catch (error) {
            toast.error('Failed to start dependency regeneration. You can manually regenerate from the vault.');
        } finally { setIsDependencyProcessing(false); onClose(); }
    };

    const toggleDependencySection = (id) => setSelectedDependencies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleTryAgain = async () => {
        if (regenerationCount >= MAX_REGENERATIONS) { toast.error(`Maximum refinements (${MAX_REGENERATIONS}) reached.`); return; }
        const updatedAlts = suggestedChanges ? [...previousAlternatives, suggestedChanges] : previousAlternatives;
        setPreviousAlternatives(updatedAlts);
        setIsProcessing(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '🔄 Generating a different alternative...', isThinking: true }]);
        try {
            const response = await fetchWithAuth('/api/os/refine-section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sectionId, subSection: selectedSubSection, feedback: 'Please provide a completely different alternative with different wording and structure', currentContent: latestContent, sessionId, iteration: regenerationCount + 2, previousAlternatives: updatedAlts })
            });
            if (!response.ok) throw new Error('Failed to regenerate');
            const data = await response.json();
            setMessages(prev => [...prev.filter(m => !m.isThinking), { role: 'assistant', content: `Here's alternative #${regenerationCount + 2}:`, showPreview: true, previewContent: data.refinedContent }]);
            setSuggestedChanges(data.refinedContent); setLatestContent(data.refinedContent); setRegenerationCount(prev => prev + 1);
        } catch (error) {
            toast.error("Failed to generate alternative");
            setMessages(prev => prev.filter(m => !m.isThinking));
        } finally { setIsProcessing(false); }
    };

    if (!isOpen || typeof document === 'undefined') return null;

    const showFieldPanel = chatStep === 1;
    const hasSelectedFields = selectedFields.size > 0;

    // ── Render ────────────────────────────────────────────────────────────────
    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center px-3 py-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                    className="bg-[#080C10] rounded-2xl border border-[#1E2A34] w-full max-w-7xl flex flex-col overflow-hidden shadow-2xl shadow-black/60"
                    style={{ height: 'min(92vh, 820px)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* ── Header ──────────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E2A34] flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan/20 to-purple-500/20 border border-cyan/20 flex items-center justify-center">
                                <SlidersHorizontal className="w-4 h-4 text-cyan" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm leading-tight">{sectionTitle}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {/* Step breadcrumb */}
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${chatStep === 1 ? 'bg-cyan/20 text-cyan' : 'bg-[#1E2A34] text-gray-500'}`}>1 Select</span>
                                    <ChevronRight className="w-2.5 h-2.5 text-gray-700" />
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${chatStep === 2 ? 'bg-cyan/20 text-cyan' : chatStep > 2 ? 'bg-[#1E2A34] text-gray-500' : 'bg-[#1E2A34] text-gray-700'}`}>2 Feedback</span>
                                    <ChevronRight className="w-2.5 h-2.5 text-gray-700" />
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${chatStep === 3 ? 'bg-cyan/20 text-cyan' : chatStep > 3 ? 'bg-[#1E2A34] text-gray-500' : 'bg-[#1E2A34] text-gray-700'}`}>3 Review</span>
                                    {chatStep === 4 && (
                                        <>
                                            <ChevronRight className="w-2.5 h-2.5 text-gray-700" />
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">4 Dependencies</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-600 hidden sm:inline">
                                {regenerationCount}/{MAX_REGENERATIONS} refinements
                            </span>
                            <button onClick={onClose} className="p-1.5 hover:bg-[#1E2A34] rounded-lg transition-colors cursor-pointer">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* ── Body ────────────────────────────────────────────── */}
                    <div className="flex flex-1 min-h-0 overflow-hidden">

                        {/* ── Left: Field selector panel ─────────────────── */}
                        <AnimatePresence initial={false}>
                            {showFieldPanel && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 300, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                    className="border-r border-[#1E2A34] flex-shrink-0 overflow-hidden flex flex-col bg-[#05080B]"
                                >
                                    <div className="px-4 py-3 border-b border-[#1E2A34] flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <LayoutList className="w-3.5 h-3.5 text-cyan" />
                                            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Fields</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-0 overflow-y-auto">
                                        <FieldSelectorPanel
                                            sectionId={sectionId}
                                            currentContent={currentContent}
                                            selectedFields={selectedFields}
                                            onToggleField={handleToggleField}
                                            onToggleGroup={handleToggleGroup}
                                            funnelSubPage={funnelSubPage}
                                            onSetFunnelSubPage={(p) => { setFunnelSubPage(p); setSelectedFields(new Set()); }}
                                            onSelectAll={handleSelectAll}
                                            onClearAll={handleClearAll}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Right: Chat panel ──────────────────────────── */}
                        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

                            {/* Selected fields summary bar (step 2+) */}
                            {chatStep >= 2 && selectedSubSection && (
                                <div className="px-4 py-2 bg-[#0A1018] border-b border-[#1E2A34] flex-shrink-0 flex items-center gap-2 flex-wrap">
                                    {/* Back to field selection (Phase 6B) */}
                                    {chatStep === 2 && (
                                        <button
                                            onClick={handleBackToFields}
                                            className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1E2A34] hover:bg-[#26323D] text-gray-300 hover:text-white transition-colors cursor-pointer"
                                            title="Go back to field selection"
                                        >
                                            <ArrowLeft className="w-3 h-3" /> Back
                                        </button>
                                    )}
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Refining:</span>
                                    {selectedFields.size > 1
                                        ? [...selectedFields].map(fid => {
                                            const fieldPool = isFunnelCopy ? (FUNNEL_SUBPAGE_FIELDS[funnelSubPage] || []) : (SECTION_OPTIONS[sectionId] || []);
                                            const opt = fieldPool.find(o => o.id === fid);
                                            const label = opt?.label || fid;
                                            return (
                                                <span key={fid} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/25 text-cyan font-medium">
                                                    {label}
                                                </span>
                                            );
                                        })
                                        : <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/25 text-cyan font-medium">
                                            {(SECTION_OPTIONS[sectionId] || []).find(o => o.id === selectedSubSection)?.label || selectedSubSection}
                                          </span>
                                    }
                                </div>
                            )}

                            {/* Persistent reference content panel (step 2) — read-only,
                                scrollable, so the user can reference the field content
                                while typing their prompt. Phase 6B. */}
                            {chatStep === 2 && referenceText && (
                                <div className="px-4 pt-3 flex-shrink-0">
                                    <div className="rounded-xl border border-[#1E2A34] bg-[#0A0F14] overflow-hidden">
                                        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1E2A34] bg-[#0D1217]">
                                            <LayoutList className="w-3.5 h-3.5 text-cyan" />
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Current Content</span>
                                            <span className="text-[10px] text-gray-600 ml-auto">read-only reference</span>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto px-3 py-2.5">
                                            <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{referenceText}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Chat messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`rounded-2xl px-4 py-3 max-w-[90%] ${
                                            msg.role === 'user'
                                                ? 'bg-cyan text-black font-medium'
                                                : msg.isError
                                                    ? 'bg-red-950/40 border border-red-500/30 text-white'
                                                    : 'bg-[#0D1217] border border-[#1E2A34] text-white'
                                        }`}>
                                            {msg.isThinking ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm">{msg.content}</span>
                                                </div>
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            )}

                                            {/* Blueprint step picker */}
                                            {msg.showBlueprintStepPicker && (() => {
                                                const blueprint = Array.isArray(currentContent?.sevenStepBlueprint) ? currentContent.sevenStepBlueprint : [];
                                                const steps = Array.from({ length: 7 }, (_, i) => ({ index: i, stepName: blueprint[i]?.stepName || `Step ${i + 1}` }));
                                                return (
                                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {steps.map(({ index, stepName }) => (
                                                            <button key={index} onClick={() => handleBlueprintStepSelect(index)}
                                                                className="flex items-center gap-3 px-3 py-2.5 bg-[#0A1018] hover:bg-[#111820] border border-[#1E2A34] hover:border-cyan/40 rounded-xl text-left transition-all group cursor-pointer">
                                                                <span className="w-7 h-7 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center text-xs font-bold text-cyan flex-shrink-0 group-hover:bg-cyan/20">
                                                                    {index + 1}
                                                                </span>
                                                                <span className="text-sm text-gray-300 group-hover:text-white leading-tight">{stepName}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })()}

                                            {/* Child field options */}
                                            {msg.showChildFieldOptions && msg.parentField && (
                                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {Object.entries(getChildFieldOptions(sectionId, msg.parentField)).map(([group, fields]) => (
                                                        <div key={group} className="space-y-1.5">
                                                            <div className="text-[10px] font-bold text-cyan uppercase tracking-wide px-2">{group}</div>
                                                            {fields.map(field => (
                                                                <button key={field.id} onClick={() => handleChildFieldSelect(field.id)}
                                                                    className="w-full text-left px-3 py-2 bg-[#0A1018] hover:bg-[#111820] border border-[#1E2A34] hover:border-cyan/40 text-gray-300 rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan flex-shrink-0" />
                                                                    <span>{field.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Before/After preview — filtered diff */}
                                            {(() => {
                                                const shouldShow = (msg.showPreview && msg.previewContent) || msg.metadata?.validatedContent;
                                                const content = msg.previewContent || msg.metadata?.validatedContent;
                                                if (!shouldShow || idx !== messages.length - 1) return null;
                                                return (
                                                    <div className="mt-4 space-y-3">
                                                        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2A34]">
                                                            <CheckCircle className="w-4 h-4 text-cyan" />
                                                            <span className="text-sm font-semibold text-white">Changes Preview</span>
                                                            <span className="text-xs text-gray-500 ml-auto">
                                                                {highlightMap && !highlightMap.has('__all__')
                                                                    ? `${highlightMap.size} field${highlightMap.size !== 1 ? 's' : ''} changed`
                                                                    : 'All fields updated'}
                                                            </span>
                                                        </div>
                                                        <div className="max-h-[400px] overflow-y-auto pr-1">
                                                            <FilteredDiffPanel
                                                                before={originalContent || currentContent}
                                                                after={
                                                                    // API extracts bare values for single-field sub-sections (may be
                                                                    // primitive OR object). Always wrap so FilteredDiffPanel can do
                                                                    // object-level comparison -- remove typeof guard so object fields
                                                                    // like bestIdealClient are wrapped correctly.
                                                                    selectedSubSection && selectedSubSection !== 'all' && !isFunnelCopy &&
                                                                    content !== null && content !== undefined
                                                                        ? { [selectedSubSection]: content }
                                                                        : content
                                                                }
                                                                highlightMap={highlightMap}
                                                                sectionId={sectionId}
                                                                selectedFields={selectedFields}
                                                                funnelSubPage={funnelSubPage}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Retry button */}
                                            {msg.showRetry && (
                                                <button
                                                    onClick={() => {
                                                        const last = messages.filter(m => m.role === 'user').pop();
                                                        if (last) { setInputText(last.content); setTimeout(handleSendFeedback, 100); }
                                                    }}
                                                    className="mt-3 px-4 py-2 bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 text-cyan rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" /> Try Again
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Streaming message */}
                                {streamingMessage && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                                        <div className="rounded-2xl px-4 py-3 bg-[#0D1217] border border-[#1E2A34] text-white max-w-[90%]">
                                            {streamingMessage.isStreaming && !streamingMessage.metadata?.validatedContent ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex gap-1">
                                                            {[0, 150, 300].map(d => (
                                                                <span key={d} className="w-1.5 h-1.5 bg-cyan rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-gray-400">Generating refined content…</span>
                                                    </div>
                                                    {streamingMessage.content && streamingMessage.content.length > 50 && (
                                                        <div className="p-3 bg-[#05080B] rounded-xl border border-[#1E2A34] max-h-40 overflow-y-auto">
                                                            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                                                                {streamingMessage.content.substring(0, 400)}{streamingMessage.content.length > 400 && '…'}
                                                                <span className="inline-block w-1.5 h-3.5 bg-cyan animate-pulse ml-0.5 align-middle" />
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                            {streamingMessage.metadata?.validatedContent && (
                                                <div className="space-y-2">
                                                    <p className="text-sm text-cyan font-medium flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" /> Content generated successfully
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Partial error recovery */}
                                {partialError && partialContent && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                                        <div className="rounded-2xl px-4 py-3 bg-[#1a1000] border border-yellow-500/30 max-w-[90%]">
                                            <div className="flex items-start gap-2 mb-3">
                                                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm font-medium text-yellow-500">
                                                    {partialError.reason === 'timeout' ? 'Generation Timed Out' : 'Generation Failed'}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-3">Received {partialContent.length} characters before {partialError.reason}.</p>
                                            <div className="flex flex-col gap-2">
                                                {partialError.canRetry && (
                                                    <button onClick={() => { setPartialContent(null); setPartialError(null); const last = messages.filter(m => m.role === 'user').pop(); if (last) { setInputText(last.content); setTimeout(handleSendFeedback, 100); } }}
                                                        className="w-full py-2 px-4 bg-cyan hover:bg-cyan/90 text-black rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                                        <RefreshCw className="w-4 h-4" /> Retry
                                                    </button>
                                                )}
                                                {partialError.canDiscard && (
                                                    <button onClick={() => { setPartialContent(null); setPartialError(null); setMessages(prev => [...prev, { role: 'assistant', content: 'Discarded. You can try again with different feedback.' }]); }}
                                                        className="w-full py-2 px-4 bg-[#1E2A34] text-gray-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                                        <X className="w-4 h-4" /> Discard
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Selected field content preview — step 1 only */}
                                {chatStep === 1 && selectedFields.size > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-start w-full"
                                    >
                                        <div className="w-full max-w-[92%] rounded-2xl px-4 py-3 bg-[#0D1217] border border-[#1E2A34]">
                                            <SelectedFieldsPreview
                                                sectionId={sectionId}
                                                selectedFields={selectedFields}
                                                currentContent={currentContent}
                                                funnelSubPage={funnelSubPage}
                                                isFunnelCopy={isFunnelCopy}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* ── Step 1: Proceed button ───────────────────── */}
                            {chatStep === 1 && (
                                <div className="flex-shrink-0 p-4 border-t border-[#1E2A34] bg-[#05080B]">
                                    <button
                                        onClick={handleProceedWithFields}
                                        disabled={!hasSelectedFields || (isFunnelCopy && !funnelSubPage)}
                                        className="w-full py-2.5 px-5 bg-cyan hover:bg-cyan/90 disabled:bg-[#1E2A34] disabled:text-gray-600 text-black rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        {hasSelectedFields ? (
                                            <>
                                                <ChevronRight className="w-4 h-4" />
                                                Continue with {selectedFields.size} field{selectedFields.size !== 1 ? 's' : ''}
                                            </>
                                        ) : (
                                            <>Select fields from the panel to continue</>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* ── Step 3: Save / Try again ─────────────────── */}
                            {chatStep === 3 && suggestedChanges && (
                                <div className="flex-shrink-0 p-4 border-t border-[#1E2A34] bg-[#05080B]">
                                    <div className="flex gap-3">
                                        <button onClick={handleSaveChanges}
                                            className="flex-1 py-2.5 px-5 bg-cyan hover:bg-cyan/90 text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan/10">
                                            <Save className="w-4 h-4" /> Save Changes
                                        </button>
                                        <button onClick={handleTryAgain}
                                            disabled={isProcessing || regenerationCount >= MAX_REGENERATIONS}
                                            className="flex-1 py-2.5 px-5 bg-[#0D1217] hover:bg-[#111820] border border-[#1E2A34] text-gray-300 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                                            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} /> Try Again
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 4: Dependency review ────────────────── */}
                            {chatStep === 4 && dependencyImpact && (
                                <div className="flex-shrink-0 p-4 border-t border-[#1E2A34] bg-[#05080B] space-y-3">
                                    <p className="text-xs text-gray-400">Select sections to regenerate for consistency:</p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {dependencyImpact.affectedSections.map(dep => (
                                            <label key={dep.sectionId} className="flex items-start gap-3 p-3 bg-[#0D1217] rounded-lg cursor-pointer hover:bg-[#111820] transition-colors border border-[#1E2A34]">
                                                <input type="checkbox" checked={selectedDependencies.includes(dep.sectionId)}
                                                    onChange={() => toggleDependencySection(dep.sectionId)}
                                                    className="mt-0.5 w-4 h-4 rounded border-gray-600 accent-cyan" />
                                                <div>
                                                    <span className="text-sm text-white font-medium">{dep.sectionName}</span>
                                                    <p className="text-xs text-gray-500 mt-0.5">{dep.reason}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleRegenerateDependencies} disabled={isDependencyProcessing || selectedDependencies.length === 0}
                                            className="flex-1 py-2.5 px-4 bg-cyan hover:bg-cyan/90 text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer">
                                            {isDependencyProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                            Regenerate {selectedDependencies.length > 0 ? `(${selectedDependencies.length})` : ''}
                                        </button>
                                        <button onClick={() => { commitSave(); onClose(); }} disabled={isDependencyProcessing}
                                            className="py-2.5 px-4 bg-[#0D1217] border border-[#1E2A34] text-gray-300 rounded-xl text-sm font-medium hover:bg-[#111820] disabled:opacity-40 cursor-pointer">
                                            Save Only
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Input (step 2+) ──────────────────────────── */}
                            {chatStep >= 2 && chatStep < 4 && (
                                <div className="flex-shrink-0 p-4 border-t border-[#1E2A34] bg-[#05080B]">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={e => setInputText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !isProcessing && !isStreaming && handleSendFeedback()}
                                            placeholder={chatStep === 3 ? "Ask for further changes…" : "Describe what you'd like to change…"}
                                            disabled={isProcessing || isStreaming}
                                            className="flex-1 px-4 py-2.5 bg-[#0D1217] border border-[#1E2A34] focus:border-cyan/50 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-colors disabled:opacity-50"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSendFeedback}
                                            disabled={!inputText.trim() || isProcessing || isStreaming}
                                            className="px-4 py-2.5 bg-cyan hover:bg-cyan/90 disabled:bg-[#1E2A34] disabled:text-gray-600 text-black rounded-xl transition-all disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                                        >
                                            {isProcessing || isStreaming
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Send className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
