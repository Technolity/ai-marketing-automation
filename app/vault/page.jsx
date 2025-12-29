"use client";
/**
 * Vault Page - Unified Results Hub
 * 
 * Phase 1: Business Core (6 items) - Always accessible
 * Phase 2: Funnel Assets (7 items) - Locked until funnel approved
 * 
 * After all phases approved, user sees filled vault on every visit.
 * Reset only when business is reset.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, ChevronRight, RefreshCw, CheckCircle, Lock,
    Users, MessageSquare, BookOpen, Gift, Mic, Magnet,
    Video, Mail, Megaphone, Layout, Bell, Lightbulb,
    Sparkles, Edit3, ArrowRight, PartyPopper, ArrowLeft,
    ChevronDown, ChevronUp, Save
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Phase 1: Business Core - Always accessible
const PHASE_1_SECTIONS = [
    { id: 'idealClient', numericKey: 1, title: 'Ideal Client', subtitle: 'WHO you serve', icon: Users },
    { id: 'message', numericKey: 2, title: 'Message', subtitle: 'WHAT you help them with', icon: MessageSquare },
    { id: 'story', numericKey: 3, title: 'Story', subtitle: 'WHY you do this work', icon: BookOpen },
    { id: 'offer', numericKey: 4, title: 'Offer & Pricing', subtitle: 'Your core offer', icon: Gift },
    { id: 'salesScripts', numericKey: 5, title: 'Sales Script', subtitle: 'How you close', icon: Mic },
    { id: 'leadMagnet', numericKey: 6, title: 'Lead Magnet', subtitle: 'Your free gift', icon: Magnet }
];

// Phase 2: Funnel Assets - Locked until funnel approved
const PHASE_2_SECTIONS = [
    { id: 'vsl', numericKey: 7, title: 'VSL Script', subtitle: 'Video Sales Letter', icon: Video },
    { id: 'emails', numericKey: 8, title: '15-Day Email Sequence', subtitle: 'Nurture series', icon: Mail },
    { id: 'facebookAds', numericKey: 9, title: 'Facebook Ads', subtitle: 'Ad copy & prompts', icon: Megaphone },
    { id: 'funnelCopy', numericKey: 10, title: 'Funnel Page Copy', subtitle: 'Landing pages', icon: Layout },
    { id: 'contentIdeas', numericKey: 11, title: 'Content Ideas', subtitle: 'Social media topics', icon: Lightbulb },
    { id: 'appointmentReminders', numericKey: 16, title: 'Appointment Reminders', subtitle: 'Show-up sequences', icon: Bell },
    { id: 'bio', numericKey: 15, title: 'Professional Bio', subtitle: 'Authority positioning', icon: Users }
];

// Normalize data structure (handles numeric or named keys)
function normalizeData(rawData) {
    if (!rawData || typeof rawData !== 'object') return {};

    const normalized = {};
    const allSections = [...PHASE_1_SECTIONS, ...PHASE_2_SECTIONS];
    const hasNumericKeys = Object.keys(rawData).some(key => !isNaN(key));

    if (hasNumericKeys) {
        allSections.forEach(section => {
            const numKey = section.numericKey.toString();
            if (rawData[numKey]) {
                normalized[section.id] = rawData[numKey].data || rawData[numKey];
            }
        });
    } else {
        return rawData;
    }

    return normalized;
}

export default function VaultPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [vaultData, setVaultData] = useState({});
    const [dataSource, setDataSource] = useState(null);

    // Approval states
    const [approvedPhase1, setApprovedPhase1] = useState([]);
    const [funnelApproved, setFunnelApproved] = useState(false);
    const [approvedPhase2, setApprovedPhase2] = useState([]);

    // UI states
    const [expandedSection, setExpandedSection] = useState(null);
    const [editingSection, setEditingSection] = useState(null);
    const [editedContent, setEditedContent] = useState({});
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Save Session states
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Computed states
    const isPhase1Complete = approvedPhase1.length >= PHASE_1_SECTIONS.length;
    const isPhase2Complete = approvedPhase2.length >= PHASE_2_SECTIONS.length;
    const isVaultComplete = isPhase1Complete && isPhase2Complete;

    // Load vault data from database
    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadVault = async () => {
            try {
                const res = await fetchWithAuth('/api/os/results');
                const result = await res.json();

                if (result.error) {
                    console.error("API error:", result.error);
                    toast.error("Failed to load vault");
                    return;
                }

                if (result.data && Object.keys(result.data).length > 0) {
                    const normalizedData = normalizeData(result.data);
                    setVaultData(normalizedData);
                    setDataSource(result.source);
                    console.log('[Vault] Loaded from:', result.source);
                } else {
                    toast.info("No content yet. Complete the intake form first.");
                    router.push('/intake_form');
                    return;
                }

                // Load approvals
                await loadApprovals();

            } catch (error) {
                console.error("Failed to load vault:", error);
                toast.error("Failed to load vault");
            } finally {
                setIsLoading(false);
            }
        };

        loadVault();
    }, [session, authLoading, router]);

    const loadApprovals = async () => {
        try {
            const approvalsRes = await fetchWithAuth('/api/os/approvals');
            if (approvalsRes.ok) {
                const data = await approvalsRes.json();
                if (data.approvals) {
                    setApprovedPhase1(data.approvals.phase1 || data.approvals.businessCore || []);
                    setApprovedPhase2(data.approvals.phase2 || []);
                    setFunnelApproved(data.approvals.funnelApproved || false);
                }
            }
        } catch (e) {
            // Fallback to localStorage
            const saved = localStorage.getItem(`vault_approvals_${session.user.id}`);
            if (saved) {
                const approvals = JSON.parse(saved);
                setApprovedPhase1(approvals.phase1 || []);
                setApprovedPhase2(approvals.phase2 || []);
                setFunnelApproved(approvals.funnelApproved || false);
            }
        }
    };

    const saveApprovals = async (phase1, phase2, funnel) => {
        const approvals = { phase1, phase2, funnelApproved: funnel };
        localStorage.setItem(`vault_approvals_${session.user.id}`, JSON.stringify(approvals));

        try {
            await fetchWithAuth('/api/os/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'vault', approvals })
            });
        } catch (e) {
            console.log('Approvals saved to localStorage');
        }
    };

    const getSectionStatus = (sectionId, phaseNumber, approvedList, index) => {
        if (approvedList.includes(sectionId)) return 'approved';

        // Phase 2 locked until funnel approved
        if (phaseNumber === 2 && !funnelApproved) return 'locked';

        // First item or previous approved
        const sections = phaseNumber === 1 ? PHASE_1_SECTIONS : PHASE_2_SECTIONS;
        if (index === 0 || approvedList.includes(sections[index - 1].id)) {
            return 'current';
        }
        return 'locked';
    };

    const handleApprove = async (sectionId, phaseNumber) => {
        if (phaseNumber === 1) {
            const newApprovals = [...approvedPhase1, sectionId];
            setApprovedPhase1(newApprovals);
            await saveApprovals(newApprovals, approvedPhase2, funnelApproved);

            if (newApprovals.length >= PHASE_1_SECTIONS.length) {
                toast.success("🎉 Phase 1 Complete! Choose your funnel.");
                setTimeout(() => router.push('/funnel-recommendation'), 1500);
            } else {
                toast.success("Section approved!");
            }
        } else {
            const newApprovals = [...approvedPhase2, sectionId];
            setApprovedPhase2(newApprovals);
            await saveApprovals(approvedPhase1, newApprovals, funnelApproved);

            if (newApprovals.length >= PHASE_2_SECTIONS.length) {
                toast.success("🎉 Your Vault is Complete!");
            } else {
                toast.success("Section approved!");
            }
        }
        setExpandedSection(null);
    };

    const handleRegenerate = async (sectionId) => {
        setIsRegenerating(true);
        try {
            const sessionId = dataSource?.id || localStorage.getItem('ted_current_session_id');

            const res = await fetchWithAuth('/api/os/regenerate/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section: sectionId, sessionId })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.content) {
                    setVaultData(prev => ({ ...prev, [sectionId]: data.content }));
                    toast.success("Content regenerated!");
                }
            } else {
                toast.error("Regeneration failed (404). Checking endpoint...");
                console.error("Regeneration failed with status:", res.status);
            }
        } catch (error) {
            console.error("Regeneration error:", error);
            toast.error("Failed to regenerate");
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleEdit = (sectionId) => {
        setEditingSection(sectionId);
        setEditedContent(vaultData[sectionId] || {});
    };

    const handleSaveEdit = async (sectionId) => {
        try {
            // Update local state
            const updatedVaultData = { ...vaultData, [sectionId]: editedContent };
            setVaultData(updatedVaultData);
            setEditingSection(null);

            // Optional: Save to DB immediately or wait for Save Session
            toast.success("Changes saved locally. Use 'Save Session' to persist.");
        } catch (error) {
            console.error("Save edit error:", error);
            toast.error("Failed to save changes");
        }
    };

    const updateContentValue = (path, value) => {
        setEditedContent(prev => {
            const newContent = { ...prev };
            const keys = path.split('.');
            let current = newContent;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newContent;
        });
    };

    // Save session with a custom name
    const handleSaveSession = async () => {
        if (!sessionName.trim()) {
            toast.error("Please enter a session name");
            return;
        }

        setIsSaving(true);
        try {
            // Get user answers from localStorage
            const progressKey = `wizard_progress_${session.user.id}`;
            const savedProgress = localStorage.getItem(progressKey);
            const progressData = savedProgress ? JSON.parse(savedProgress) : {};

            const res = await fetchWithAuth('/api/os/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionName: sessionName.trim(),
                    currentStep: 20,
                    completedSteps: Array.from({ length: 20 }, (_, i) => i + 1),
                    answers: progressData.answers || {},
                    generatedContent: vaultData,
                    isComplete: true
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Session saved as "${sessionName}"`);
                setShowSaveModal(false);
                setSessionName('');
            } else {
                toast.error(data.error || "Failed to save session");
            }
        } catch (error) {
            console.error("Save session error:", error);
            toast.error("Failed to save session");
        } finally {
            setIsSaving(false);
        }
    };

    // Section title mapping for better display
    const SECTION_TITLES = {
        // Ideal Client sections
        coreAudienceSnapshot: 'Core Audience Snapshot',
        demographics: 'Demographics',
        psychographics: 'Psychographics',
        corePainsAndProblems: 'Core Pains & Problems',
        desiredOutcomesAndMotivations: 'Desired Outcomes & Motivations',
        buyingTriggers: 'Buying Triggers',
        objectionsAndResistance: 'Objections & Resistance',
        languageAndMessagingHooks: 'Language & Messaging Hooks',
        whereTheySpendTimeAndWhoTheyTrust: 'Where They Spend Time & Who They Trust',
        summaryForMarketers: 'Summary for Marketers',

        // Million Dollar Message sections
        oneLineMillionDollarMessage: 'The One-Line Million-Dollar Message',
        thisIsForYouIf: 'This Is For You If... Filter',
        coreProblemReframe: 'Core Problem Reframe',
        uniqueMechanism: 'The Unique Mechanism / New Way',
        outcomePromise: 'The Outcome Promise (Non-Hype)',
        proofAndCredibility: 'Proof & Credibility Anchors',
        objectionNeutralizers: 'Objection-Neutralizing Message',
        messageAnglesThatScale: 'Message Angles That Scale',
        ctaFraming: 'Call-to-Action Framing',
        messageToMillionsSummary: 'Final "Message to Millions" Summary',

        // Ideal Client field labels
        whoTheyAre: 'Who This Person Is',
        lifeOrBusinessStage: 'Stage of Life/Business',
        whyNow: 'Why Now Is The Moment',
        ageRange: 'Age Range',
        gender: 'Gender',
        location: 'Location',
        incomeOrRevenue: 'Income/Revenue',
        jobTitleOrRole: 'Job Title/Role',
        currentFrustrations: 'Current Frustrations',
        whatKeepsThemStuck: 'What Keeps Them Stuck',
        secretWorries: 'Secret Worries',
        successInTheirWords: 'Success In Their Words',
        tiredOfTrying: 'Tired of Trying',
        surfaceProblem: 'Surface Problem',
        deeperEmotionalProblem: 'Deeper Emotional Problem',
        costOfNotSolving: 'Cost of Not Solving',
        practicalResults: 'Practical Results',
        emotionalOutcomes: 'Emotional Outcomes',
        statusIdentityLifestyle: 'Status/Identity/Lifestyle',
        momentsThatPushAction: 'Moments That Push Action',
        needHelpNowMoments: 'I Need Help NOW Moments',
        messagingThatGrabsAttention: 'Messaging That Grabs Attention',
        reasonsToHesitate: 'Reasons They Hesitate',
        pastBadExperiences: 'Past Bad Experiences',
        whatTheyNeedToBelieve: 'What They Need to Believe',
        phrasesTheyUse: 'Phrases They Use',
        emotionallyResonantWords: 'Emotionally Resonant Words',
        authenticAngles: 'Authentic Angles',
        platforms: 'Platforms',
        trustedVoices: 'Trusted Voices',
        contentFormatsTheyRespondTo: 'Content Formats',
        howToSpeakToThem: 'How To Speak To Them',
        whatToAvoid: 'What To Avoid',
        whatBuildsTrustAndAuthority: 'What Builds Trust & Authority',

        // Message field labels
        headline: 'A single, clear sentence',
        whoItsFor: 'Who this is for',
        problemItSolves: 'What problem it solves',
        outcomeDelivered: 'What outcome it delivers',
        whyDifferent: 'Why different',
        qualifierBullets: 'Qualifiers',
        makeWrongPeopleSelfDisqualify: 'Makes the wrong people self-disqualify',
        howTheyExplainIt: 'How the audience currently explains their problem',
        whyItsIncomplete: 'Why that explanation is incomplete or misleading',
        deeperTruth: 'The deeper truth you help them see',
        methodName: 'Method Name',
        whatItIs: 'What it is',
        whyItWorks: 'Why it works when others fail',
        missingPiece: 'Position it as the missing piece',
        realisticExpectation: 'What people can realistically expect',
        tangibleResults: 'Tangible results',
        howToUseProof: 'How proof, results, experience, or story should be used',
        typeOfEvidence: 'What type of evidence builds trust fastest',
        objection1: 'Objection 1',
        objection2: 'Objection 2',
        objection3: 'Objection 3',
        theObjection: 'The Objection',
        howToDissolve: 'How it dissolves it',
        angles: 'High-leverage angles',
        howToPosition: 'How the CTA should be positioned',
        emotionalStateNeeded: 'Emotional state needed',
        fullParagraph: 'Summary Paragraph',
        tagline: 'Tagline',

        // Signature Story sections
        originMoment: 'The Origin Moment',
        emotionalStruggle: 'The Emotional Struggle',
        discoveryBreakthrough: 'The Discovery / Breakthrough',
        missionAndWhy: 'The Mission & “Why”',
        clientProofResults: 'Client Proof / Results',
        ctaTieIn: 'The Call-to-Action Tie-In',
        voiceAndTone: 'Voice & Tone',

        // Story field labels
        definingExperience: 'Defining Experience',
        relatableStruggle: 'Relatable Struggle',
        turningPoint: 'Turning Point',
        obstaclesFaced: 'Obstacles Faced',
        fearsAndDoubts: 'Fears & Doubts',
        connectionToAudience: 'Connection to Audience',
        howSolutionWasFound: 'How Solution Was Found',
        uniqueInsight: 'Unique Insight',
        whyItsLearnable: 'Why It\'s Learnable',
        whyYouHelp: 'Why You Help',
        deeperPurpose: 'Deeper Purpose',
        authenticityMarkers: 'Authenticity Markers',
        naturalTransition: 'Natural Transition',
        nextStepInvitation: 'Next Step Invitation',
        continuingTransformation: 'Continuing the Transformation',
        brandVoiceDescription: 'Brand Voice',
        emotionalTone: 'Emotional Tone',
        fullStoryScript: 'Full Story Script',
        shortVersion: 'Short Version',
        oneSentence: 'One Sentence Version',

        // Program Blueprint sections
        programOverview: 'Program Overview',
        weeklyBreakdown: 'Weekly Breakdown (Weeks 1-8)',
        deliverablesAssets: 'Deliverables & Program Assets',
        proofCredibilityIntegration: 'Proof & Credibility Integration',
        ctaEnrollmentFraming: 'CTA & Enrollment Framing',
        programVoiceTone: 'Voice & Tone',

        // Program field labels
        programName: 'Program Name',
        primaryOutcome: 'Primary Outcome',
        uniqueFramework: 'Unique Framework',
        whoItsFor: 'Who It\'s For',
        weekTheme: 'Theme / Focus',
        weekObjective: 'Objective / Outcome',
        coreLessons: 'Core Lessons',
        activities: 'Activities / Exercises',
        toolsResources: 'Tools & Resources',
        checkpoints: 'Checkpoints',
        deliverables: 'Deliverables',
        proofIntegration: 'How to Weave in Proof',
        keyProofMoments: 'Key Proof Moments',
        enrollmentGuidance: 'Enrollment Guidance',
        transformationEmphasis: 'Transformation Emphasis',

        // Top-level Vault sections
        idealClient: "Ideal Client Profile",
        message: "Million-Dollar Message",
        story: "Signature Story",
        tagline: "The Big Tagline",
        offer: "8-Week Program Blueprint",
        salesScripts: "Setter Call: Word-for-Word Script",
        leadMagnet: "The Lead Magnet Asset",
        vsl: "VSL Script",
        facebookAds: "Facebook Ad Variations",
        funnelCopy: "Funnel Page Copy",
        appointmentReminders: "Appointment Reminders",
        contentIdeas: "Social Media Content Ideas",
        bio: "Professional Bio",

        // Lead Magnet sections
        leadMagnetIdea: 'Lead Magnet Idea',
        titleAndHook: 'Title & Hook',
        audienceConnection: 'Audience Connection',
        coreContent: 'Core Content / Deliverables',
        leadMagnetCopy: 'Lead Magnet Copy',
        ctaIntegration: 'CTA Integration',
        voiceAndTone_leadMagnet: 'Voice & Tone',
        // voiceAndTone already defined above for Story

        // Lead Magnet field labels
        concept: 'Concept',
        coreProblemSolved: 'Core Problem Solved',
        keyOutcomeDelivered: 'Key Outcome Delivered',
        alignmentWithMethod: 'Alignment with Method / Approach',
        format: 'Format',
        mainTitle: 'Main Title',
        subtitle: 'Subtitle',
        alternativeTitles: 'Alternative Titles',
        whyItsIrresistible: 'Why It\'s Irresistible',
        openingHook: 'Opening Hook',
        painAcknowledgment: 'Pain Acknowledgment',
        desireValidation: 'Desire Validation',
        trustBuilder: 'Trust Builder',
        transitionToValue: 'Transition to Value',
        immediateValue: 'Immediate Value',
        uniquePerspective: 'Unique Perspective',
        bulletPoints: 'Bullet Points',
        softCta: 'Soft CTA',
        ctaButtonText: 'CTA Button Text',
        socialProof: 'Social Proof',
        privacyNote: 'Privacy Note',
        connectionToOffer: 'Connection to Offer',
        hintAtDeeperTransformation: 'Hint at Deeper Transformation',
        nextStepInvitation: 'Next Step Invitation',
        emailOptInValue: 'Email Opt-In Value',
        languageToUse: 'Language to Use',
        languageToAvoid: 'Language to Avoid',

        // Setter Call Script sections
        quickOutline: 'Quick Setter Call Outline',
        fullWordForWordScript: 'Full Word-for-Word Script',
        callGoal: 'Call Goal',
        callFlow: 'Call Flow (10 Steps)',
        setterMindset: 'Setter Mindset',
        script: 'Teleprompter Script',

        // Call Flow step labels
        step1: 'Opener + Permission',
        step2: 'Reference Opt-In',
        step3: 'Low-Pressure Frame',
        step4: 'Current Situation',
        step5: 'Goal + Motivation',
        step6: 'Challenge + Stakes',
        step7: 'Authority Drop',
        step8: 'Qualify Fit + Readiness',
        step9: 'Book Consultation',
        step10: 'Confirm Show-Up + Wrap-Up',
        name: 'Step Name',
        purpose: 'Purpose',
        keyLine: 'Key Line'
    };

    const SECTION_SORT_ORDER = {
        message: [
            'oneLineMillionDollarMessage',
            'thisIsForYouIf',
            'coreProblemReframe',
            'uniqueMechanism',
            'outcomePromise',
            'proofAndCredibility',
            'objectionNeutralizers',
            'messageAnglesThatScale',
            'ctaFraming',
            'messageToMillionsSummary'
        ],
        story: [
            'originMoment',
            'emotionalStruggle',
            'discoveryBreakthrough',
            'missionAndWhy',
            'clientProofResults',
            'ctaTieIn',
            'voiceAndTone'
        ],
        leadMagnet: [
            'leadMagnetIdea',
            'titleAndHook',
            'audienceConnection',
            'coreContent',
            'leadMagnetCopy',
            'ctaIntegration',
            'voiceAndTone_leadMagnet'
        ]
    };

    const getSectionTitle = (key) => {
        return SECTION_TITLES[key] || key.replace(/([A-Z])/g, ' $1').trim();
    };

    // Content Renderer with enhanced formatting
    const ContentRenderer = ({ content, sectionId, isEditing, onUpdate }) => {
        if (!content) return <p className="text-gray-500 text-sm">No content generated.</p>;

        // Intelligently unwrap common top-level wrappers
        let displayContent = content;
        const wrappers = [
            'idealClientProfile',
            'millionDollarMessage',
            'signatureStory',
            'programBlueprint',
            'setterCallScript',
            'leadMagnet'
        ];

        // If content has exactly one key and it's in our wrappers list, unwrap it
        const topLevelKeys = Object.keys(content);
        if (topLevelKeys.length === 1 && wrappers.includes(topLevelKeys[0])) {
            displayContent = content[topLevelKeys[0]];
        }

        const renderValue = (value, key = '', depth = 0, path = '') => {
            if (value === null || value === undefined) return null;

            const currentPath = path ? `${path}.${key}` : key;

            // Arrays - render as bullet list
            if (Array.isArray(value)) {
                return (
                    <div className="space-y-2 mt-2">
                        {value.map((item, idx) => {
                            const itemPath = `${currentPath}.${idx}`;
                            return (
                                <div key={idx} className="flex items-start gap-3">
                                    <span className="text-cyan font-bold mt-0.5">•</span>
                                    {typeof item === 'object' ? (
                                        <div className="flex-1">{renderValue(item, '', depth + 1, itemPath)}</div>
                                    ) : isEditing ? (
                                        <textarea
                                            value={String(item)}
                                            onChange={(e) => onUpdate(itemPath, e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-sm text-gray-300 focus:border-cyan outline-none min-h-[60px]"
                                        />
                                    ) : (
                                        <p className="text-gray-300 text-sm leading-relaxed flex-1">{String(item)}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            }

            // Objects - render sections
            if (typeof value === 'object') {
                let keys = Object.keys(value).filter((k) =>
                    k !== '_contentName' && k !== 'id' && k !== 'idealClientProfile'
                );

                // Apply custom sort order if exists for this sectionId
                if (sectionId && SECTION_SORT_ORDER[sectionId]) {
                    const order = SECTION_SORT_ORDER[sectionId];
                    keys = keys.sort((a, b) => {
                        const indexA = order.indexOf(a);
                        const indexB = order.indexOf(b);
                        if (indexA === -1 && indexB === -1) return 0;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });
                }

                const entries = keys.map(k => [k, value[k]]);

                // Render entries
                return (
                    <div className={`${depth > 0 ? 'ml-1' : ''} space-y-4`}>
                        {entries.map(([k, v]) => {
                            const title = getSectionTitle(k);
                            const isMainSection = depth === 0 || [
                                'quickOutline', 'fullWordForWordScript', 'callFlow'
                            ].includes(k);

                            const entryPath = currentPath;

                            return (
                                <div key={k} className={`${isMainSection ? 'border-l-2 border-cyan/40 pl-4 py-2' : ''}`}>
                                    <h4 className={`
                                        ${isMainSection
                                            ? 'text-cyan text-base font-bold mb-3'
                                            : 'text-cyan/80 text-xs font-semibold uppercase tracking-wider mb-1'
                                        }
                                    `}>
                                        {title}
                                    </h4>
                                    {renderValue(v, k, depth + 1, entryPath)}
                                </div>
                            );
                        })}
                    </div>
                );
            }

            // Strings/primitives
            if (isEditing) {
                return (
                    <textarea
                        value={String(value)}
                        onChange={(e) => onUpdate(currentPath, e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-gray-300 focus:border-cyan outline-none min-h-[100px]"
                    />
                );
            }

            return (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {String(value)}
                </p>
            );
        };

        return <div className="space-y-6">{renderValue(displayContent)}</div>;
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // Vault Complete View
    if (isVaultComplete) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] text-white p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="mb-6 p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>

                    <div className="text-center mb-10">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
                            <PartyPopper className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-black mb-4">Your Complete Vault</h1>
                        <p className="text-gray-400">All your content is ready. Edit or regenerate anytime.</p>
                    </div>

                    {/* Phase 1 */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Phase 1: Business Core
                        </h2>
                        <div className="grid gap-3">
                            {PHASE_1_SECTIONS.map((section) => renderCompletedSection(section, 1))}
                        </div>
                    </div>

                    {/* Phase 2 */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Phase 2: Funnel Assets
                        </h2>
                        <div className="grid gap-3">
                            {PHASE_2_SECTIONS.map((section) => renderCompletedSection(section, 2))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Helper to render completed sections
    const renderCompletedSection = (section, phaseNumber) => {
        const Icon = section.icon;
        const content = vaultData[section.id];
        const isExpanded = expandedSection === section.id;

        return (
            <div key={section.id} className="rounded-xl border border-green-500/30 bg-green-500/5 overflow-hidden">
                <button
                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-green-500/10 transition-colors"
                >
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-green-400">{section.title}</h3>
                        <p className="text-xs text-gray-500">{section.subtitle}</p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-green-500/20"
                        >
                            <div className="p-4">
                                <div className="bg-[#0e0e0f] rounded-lg p-4 mb-4 max-h-80 overflow-y-auto">
                                    <ContentRenderer
                                        content={editingSection === section.id ? editedContent : content}
                                        isEditing={editingSection === section.id}
                                        onUpdate={updateContentValue}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    {editingSection === section.id ? (
                                        <>
                                            <button
                                                onClick={() => handleSaveEdit(section.id)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 transition-all text-sm font-bold"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Save Changes
                                            </button>
                                            <button
                                                onClick={() => setEditingSection(null)}
                                                className="px-4 py-2 bg-[#2a2a2d] text-white rounded-lg flex items-center gap-2 hover:bg-[#3a3a3d] transition-all text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleEdit(section.id)}
                                                className="px-4 py-2 bg-[#2a2a2d] text-white rounded-lg flex items-center gap-2 hover:bg-[#3a3a3d] transition-all text-sm"
                                            >
                                                <Edit3 className="w-4 h-4" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleRegenerate(section.id)}
                                                disabled={isRegenerating}
                                                className="px-4 py-2 bg-[#2a2a2d] text-white rounded-lg flex items-center gap-2 hover:bg-[#3a3a3d] transition-all disabled:opacity-50 text-sm"
                                            >
                                                {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                Regenerate
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Active Flow View (approval process)
    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mb-6 p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan/10 text-cyan text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        {isPhase1Complete ? 'Phase 2 of 2' : 'Phase 1 of 2'}
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 tracking-tighter">
                        Your Vault
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto mb-4">
                        {isPhase1Complete
                            ? 'Review and approve your funnel assets.'
                            : 'Review and approve each section. Approval unlocks the next step.'}
                    </p>

                    {/* Save Session Button */}
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1b1b1d] hover:bg-[#2a2a2d] border border-[#2a2a2d] rounded-lg text-sm font-medium transition-colors"
                    >
                        <Save className="w-4 h-4 text-cyan" />
                        Save Session
                    </button>
                </div>

                {/* Save Session Modal */}
                <AnimatePresence>
                    {showSaveModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowSaveModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-2xl p-6 w-full max-w-md"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-xl font-bold mb-4">Save Session</h3>
                                <p className="text-gray-400 mb-4">Give your session a name to easily identify it later.</p>

                                <input
                                    type="text"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    placeholder="e.g., Fitness Coach Marketing Plan"
                                    className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan mb-6"
                                    autoFocus
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowSaveModal(false)}
                                        className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveSession}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-3 bg-cyan hover:brightness-110 text-black rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" /> Save
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress */}
                <div className="mb-10">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">
                            {isPhase1Complete ? 'Phase 2 Progress' : 'Phase 1 Progress'}
                        </span>
                        <span className="text-cyan font-medium">
                            {isPhase1Complete
                                ? `${approvedPhase2.length} of ${PHASE_2_SECTIONS.length}`
                                : `${approvedPhase1.length} of ${PHASE_1_SECTIONS.length}`}
                        </span>
                    </div>
                    <div className="h-2 bg-[#1b1b1d] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${isPhase1Complete
                                    ? (approvedPhase2.length / PHASE_2_SECTIONS.length) * 100
                                    : (approvedPhase1.length / PHASE_1_SECTIONS.length) * 100}%`
                            }}
                            className="h-full bg-gradient-to-r from-cyan to-green-500 rounded-full"
                        />
                    </div>
                </div>

                {/* Phase 1 Sections */}
                {!isPhase1Complete && (
                    <div className="space-y-4">
                        {PHASE_1_SECTIONS.map((section, index) => {
                            const status = getSectionStatus(section.id, 1, approvedPhase1, index);
                            const Icon = section.icon;
                            const isExpanded = expandedSection === section.id;
                            const content = vaultData[section.id];

                            return (
                                <motion.div
                                    key={section.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`rounded-xl border overflow-hidden transition-all ${status === 'approved' ? 'bg-green-500/5 border-green-500/30' :
                                        status === 'current' ? 'bg-[#1b1b1d] border-cyan/30 shadow-lg shadow-cyan/10' :
                                            'bg-[#131314] border-[#2a2a2d] opacity-60'
                                        }`}
                                >
                                    <button
                                        onClick={() => status !== 'locked' && setExpandedSection(isExpanded ? null : section.id)}
                                        disabled={status === 'locked'}
                                        className={`w-full p-4 sm:p-5 flex items-center gap-4 text-left ${status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}
                                    >
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${status === 'approved' ? 'bg-green-500/20' :
                                            status === 'current' ? 'bg-cyan/20' : 'bg-gray-700/50'
                                            }`}>
                                            {status === 'approved' ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" /> :
                                                status === 'locked' ? <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" /> :
                                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-bold text-base sm:text-lg ${status === 'approved' ? 'text-green-400' :
                                                status === 'current' ? 'text-white' : 'text-gray-500'
                                                }`}>{section.title}</h3>
                                            <p className="text-xs sm:text-sm text-gray-500">{section.subtitle}</p>
                                        </div>
                                        {status !== 'locked' && (
                                            <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && status !== 'locked' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-[#2a2a2d]"
                                            >
                                                <div className="p-4 sm:p-6">
                                                    <div className="bg-[#0e0e0f] rounded-xl p-4 sm:p-6 mb-4 max-h-96 overflow-y-auto">
                                                        <ContentRenderer
                                                            content={editingSection === section.id ? editedContent : content}
                                                            isEditing={editingSection === section.id}
                                                            onUpdate={updateContentValue}
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        {editingSection === section.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleSaveEdit(section.id)}
                                                                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all text-sm"
                                                                >
                                                                    <CheckCircle className="w-5 h-5" /> Save Changes
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingSection(null)}
                                                                    className="px-6 py-3 bg-[#2a2a2d] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3a3a3d] transition-all text-sm"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {status === 'current' && (
                                                                    <button
                                                                        onClick={() => handleApprove(section.id, 1)}
                                                                        className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                                                                    >
                                                                        <CheckCircle className="w-5 h-5" />
                                                                        Approve
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleEdit(section.id)}
                                                                    className="px-4 py-3 bg-[#2a2a2d] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#3a3a3d] transition-all text-sm"
                                                                >
                                                                    <Edit3 className="w-5 h-5" /> Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRegenerate(section.id)}
                                                                    disabled={isRegenerating}
                                                                    className="flex-1 sm:flex-none px-4 py-3 bg-[#2a2a2d] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#3a3a3d] transition-all disabled:opacity-50"
                                                                >
                                                                    {isRegenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                                                    Regenerate
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Phase 2 - Locked Message or Sections */}
                {isPhase1Complete && !funnelApproved && (
                    <div className="text-center py-12">
                        <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Phase 2 Locked</h2>
                        <p className="text-gray-500 mb-6">Select and approve a funnel to unlock Phase 2.</p>
                        <button
                            onClick={() => router.push('/funnel-recommendation')}
                            className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-bold flex items-center gap-3 mx-auto hover:brightness-110 transition-all shadow-xl shadow-cyan/30"
                        >
                            <Sparkles className="w-6 h-6" />
                            Choose Your Funnel
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* Phase 2 Sections */}
                {isPhase1Complete && funnelApproved && (
                    <div className="space-y-4">
                        {PHASE_2_SECTIONS.map((section, index) => {
                            const status = getSectionStatus(section.id, 2, approvedPhase2, index);
                            const Icon = section.icon;
                            const isExpanded = expandedSection === section.id;
                            const content = vaultData[section.id];

                            return (
                                <motion.div
                                    key={section.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`rounded-xl border overflow-hidden transition-all ${status === 'approved' ? 'bg-green-500/5 border-green-500/30' :
                                        status === 'current' ? 'bg-[#1b1b1d] border-cyan/30 shadow-lg shadow-cyan/10' :
                                            'bg-[#131314] border-[#2a2a2d] opacity-60'
                                        }`}
                                >
                                    <button
                                        onClick={() => status !== 'locked' && setExpandedSection(isExpanded ? null : section.id)}
                                        disabled={status === 'locked'}
                                        className={`w-full p-4 sm:p-5 flex items-center gap-4 text-left ${status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}
                                    >
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${status === 'approved' ? 'bg-green-500/20' :
                                            status === 'current' ? 'bg-cyan/20' : 'bg-gray-700/50'
                                            }`}>
                                            {status === 'approved' ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" /> :
                                                status === 'locked' ? <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" /> :
                                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-bold text-base sm:text-lg ${status === 'approved' ? 'text-green-400' :
                                                status === 'current' ? 'text-white' : 'text-gray-500'
                                                }`}>{section.title}</h3>
                                            <p className="text-xs sm:text-sm text-gray-500">{section.subtitle}</p>
                                        </div>
                                        {status !== 'locked' && (
                                            <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && status !== 'locked' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-[#2a2a2d]"
                                            >
                                                <div className="p-4 sm:p-6">
                                                    <div className="bg-[#0e0e0f] rounded-xl p-4 sm:p-6 mb-4 max-h-96 overflow-y-auto">
                                                        <ContentRenderer
                                                            content={editingSection === section.id ? editedContent : content}
                                                            isEditing={editingSection === section.id}
                                                            onUpdate={updateContentValue}
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        {editingSection === section.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleSaveEdit(section.id)}
                                                                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all text-sm"
                                                                >
                                                                    <CheckCircle className="w-5 h-5" /> Save Changes
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingSection(null)}
                                                                    className="px-6 py-3 bg-[#2a2a2d] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3a3a3d] transition-all text-sm"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {status === 'current' && (
                                                                    <button
                                                                        onClick={() => handleApprove(section.id, 2)}
                                                                        className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                                                                    >
                                                                        <CheckCircle className="w-5 h-5" />
                                                                        Approve
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleEdit(section.id)}
                                                                    className="px-4 py-3 bg-[#2a2a2d] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#3a3a3d] transition-all text-sm"
                                                                >
                                                                    <Edit3 className="w-5 h-5" /> Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRegenerate(section.id)}
                                                                    disabled={isRegenerating}
                                                                    className="flex-1 sm:flex-none px-4 py-3 bg-[#2a2a2d] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#3a3a3d] transition-all disabled:opacity-50"
                                                                >
                                                                    {isRegenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                                                    Regenerate
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
