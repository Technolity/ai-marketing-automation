"use client";
/**
 * Vault Page - Unified Results Hub
 * 
 * Phase 1: Business Core (4 sections) - Always accessible
 * Phase 2: Funnel Assets (7 items) - Locked until funnel approved
 * 
 * After all phases approved, user sees filled vault on every visit.
 * Reset only when business is reset.
 */

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from 'react-dom';
import FeedbackChatModal from '@/components/FeedbackChatModal';
import { supabase } from '@/lib/supabase';

import {
    Loader2, ChevronRight, RefreshCw, CheckCircle, Lock, AlertTriangle,
    Users, MessageSquare, BookOpen, Gift, Mic, Magnet,
    Video, Mail, Megaphone, Layout, Bell, Lightbulb,
    Sparkles, Edit3, ArrowRight, PartyPopper, ArrowLeft,
    ChevronDown, ChevronUp, Save, Image as ImageIcon, Video as VideoIcon, Plus, Trash2 as TrashIcon, ExternalLink,
    Upload, X, Info, FileImage, Rocket, AlertOctagon, Play, Palette
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { applyFreeGiftReplacement } from "@/lib/vault/freeGiftReplacer";


// Helper component for safe hydration-friendly portaling
const SafePortal = ({ children, targetId }) => {
    const [mounted, setMounted] = useState(false);
    const [element, setElement] = useState(null);

    useEffect(() => {
        setMounted(true);
        setElement(document.getElementById(targetId));
    }, [targetId]);

    if (!mounted || !element) return null;
    return createPortal(children, element);
};

// Granular Field Components
import IdealClientFields from "@/components/vault/IdealClientFields";
import MessageFields from "@/components/vault/MessageFields";
import OfferFields from "@/components/vault/OfferFields";
import SalesScriptsFields from "@/components/vault/SalesScriptsFields";
import SetterScriptFields from "@/components/vault/SetterScriptFields";
import StoryFields from "@/components/vault/StoryFields";
import LeadMagnetFields from "@/components/vault/LeadMagnetFields";
import VslFields from "@/components/vault/VslFields";
import EmailsFields from "@/components/vault/EmailsFields";
import SmsFields from "@/components/vault/SmsFields";
import FacebookAdsFields from "@/components/vault/FacebookAdsFields";
import FunnelCopyFields from "@/components/vault/FunnelCopyFields";
import BioFields from "@/components/vault/BioFields";
import AppointmentRemindersFields from "@/components/vault/AppointmentRemindersFields";
import MediaFields from "@/components/vault/MediaFields";
import ColorsFields from "@/components/vault/ColorsFields";
import ApprovalWatcher from "@/components/vault/ApprovalWatcher";
import PushToGHLButton from "@/components/vault/PushToGHLButton";

// Map section IDs to granular field components (all 13 sections)
const GRANULAR_FIELD_COMPONENTS = {
    idealClient: IdealClientFields,
    message: MessageFields,
    offer: OfferFields,
    salesScripts: SalesScriptsFields,
    setterScript: SetterScriptFields,
    story: StoryFields,
    leadMagnet: LeadMagnetFields,
    vsl: VslFields,
    emails: EmailsFields,
    sms: SmsFields,
    facebookAds: FacebookAdsFields,
    funnelCopy: FunnelCopyFields,
    bio: BioFields,
    appointmentReminders: AppointmentRemindersFields,
    media: MediaFields,
    colors: ColorsFields
};

// Phase 1: Business Assets - Core business foundations (4 sections only)
const PHASE_1_SECTIONS = [
    { id: 'idealClient', numericKey: 1, title: 'Ideal Client', subtitle: 'Who you serve', icon: Users, hint: "Use this to dial in your ad targeting, write focused copy, and speak directly to your premium buyer's pains and desires." },
    { id: 'message', numericKey: 2, title: 'Message', subtitle: 'What you help them with', icon: MessageSquare, hint: "Use your One-Liner for bios and social profiles. Use the Spoken Version for intros, podcasts, and networking events." },
    { id: 'story', numericKey: 3, title: 'Story', subtitle: 'Why you do this work', icon: BookOpen, hint: "Share your 60s story in networking. Use the 3-5min story for podcasts, stages, and webinars to build deep trust." },
    { id: 'offer', numericKey: 4, title: 'Offer & Pricing', subtitle: 'Your core offer', icon: Gift, hint: "This is your core product architecture. Use the 7-Step Blueprint names in your marketing to build 'method authority'." }
];

// Phase 2: Marketing Assets - Funnel & marketing materials (locked until funnel choice made)
const PHASE_2_SECTIONS = [
    { id: 'leadMagnet', numericKey: 6, title: 'Free Gift', subtitle: 'Your value-packed free gift', icon: Magnet, hint: "Give this away in exchange for an email address. Use the title and hook in your ads and landing pages." },
    { id: 'vsl', numericKey: 7, title: 'Appointment Booking Video', subtitle: 'Funnel video script', icon: Video, hint: "Record this script for your landing page or sales page video. Keep it authentic and focused on the viewer." },
    { id: 'bio', numericKey: 15, title: 'Professional Bio', subtitle: 'Authority positioning', icon: Users, hint: "Use the short bio for guesting (podcasts/events) and the full bio for your 'About' page." },
    { id: 'facebookAds', numericKey: 9, title: 'Ad Copy', subtitle: 'Platform-specific ads', icon: Megaphone, hint: "Test these ad variations on Facebook/Instagram. Use the hooks as the first line of your captions." },
    { id: 'emails', numericKey: 8, title: 'Email Campaigns', subtitle: '15-day nurture series', icon: Mail, hint: "Load these into your email autoresponder to nurture new leads over 15 days." },
    { id: 'sms', numericKey: 19, title: 'Text Messages', subtitle: 'Text message nurture', icon: MessageSquare, hint: "Send these automated texts to increase engagement and show-up rates." },
    { id: 'appointmentReminders', numericKey: 16, title: 'Appointment Reminders', subtitle: 'Show-up sequences', icon: Bell, hint: "Add these to your calendar booking system (Calendly, GHL) to increase show-up rates." },
    { id: 'funnelCopy', numericKey: 10, title: 'Funnel Page Copy', subtitle: 'Landing & sales pages', icon: Layout, hint: "Copy and paste this into your landing page builder (ClickFunnels, GHL, etc.) for high conversion." },
    { id: 'media', numericKey: 18, title: 'Upload images & videos for your funnel', subtitle: 'Logo, images, and videos', icon: ImageIcon, hint: "Upload your professional assets here to be used across your funnel pages." },
    { id: 'colors', numericKey: 20, title: 'Brand Colors', subtitle: 'Your brand color palette', icon: Palette, hint: "These colors from your intake form will be applied to your funnel pages for consistent branding." }
];

// Phase 3: Sales Scripts - Setter and Closer scripts (locked until Phase 2 approved)
const PHASE_3_SECTIONS = [
    { id: 'setterScript', numericKey: 17, title: 'Setter Script', subtitle: 'Appointment setting', icon: Bell, hint: "Use this for 15-min triage calls or DM conversations to qualify leads and book them into a sales call." },
    { id: 'salesScripts', numericKey: 5, title: 'Closer Script', subtitle: 'How you close deals', icon: Mic, hint: "Use this script for booked sales calls. Follow the flow to diagnose deeply before prescribing your solution." }
];

// Content mapping: numeric keys to section IDs (for legacy feedback API compatibility)
const CONTENT_MAPPING = {
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
    18: 'media',
    19: 'sms'
};


// Normalize data structure (handles numeric or named keys)
function normalizeData(rawData) {
    if (!rawData || typeof rawData !== 'object') return {};

    const normalized = {};
    const allSections = [...PHASE_1_SECTIONS, ...PHASE_2_SECTIONS, ...PHASE_3_SECTIONS];
    const hasNumericKeys = Object.keys(rawData).some(key => !isNaN(key));

    if (hasNumericKeys) {
        // Old format with numeric keys (legacy)
        allSections.forEach(section => {
            const numKey = section.numericKey.toString();
            if (rawData[numKey]) {
                const sectionData = rawData[numKey].data || rawData[numKey];
                // CRITICAL FIX: Preserve status field for approval persistence
                if (rawData[numKey].status) {
                    normalized[section.id] = {
                        ...sectionData,
                        _status: rawData[numKey].status  // Prefix with _ to avoid conflicts
                    };
                } else {
                    normalized[section.id] = sectionData;
                }
            }
        });
    } else {
        // New format with section IDs as keys
        // Check if values have {data, status} structure
        for (const [key, value] of Object.entries(rawData)) {
            if (value && typeof value === 'object' && ('data' in value || 'status' in value)) {
                // New format: { media: { data: {...}, status: "approved" } }
                const sectionData = value.data || value;
                if (value.status) {
                    normalized[key] = {
                        ...sectionData,
                        _status: value.status  // Preserve status
                    };
                } else {
                    normalized[key] = sectionData;
                }
            } else {
                // Old flat format: { media: {...} }
                normalized[key] = value;
            }
        }
        return normalized;
    }

    return normalized;
}

// Common wrappers that AI often adds around content
// ⚠️ IMPORTANT: Only include truly extraneous wrappers that AI might add
// DO NOT include schema-required top-level keys like setterCallScript, closerCallScript
// Those are REQUIRED by the schema and must NOT be unwrapped
const AI_WRAPPERS = [
    'signatureOffer', 'idealClientProfile', 'millionDollarMessage',
    'signatureStory', 'masterBlueprint', 'programBlueprint',
    'leadMagnet', 'vslScript', 'emailSequence', 'adCopy', 'funnelCopy',
    // Removed: 'setterCallScript', 'closerCallScript' - these are schema keys!
];

/**
 * Parse and clean AI-generated content (handles JSON strings, markdown blocks, and unwraps common wrappers)
 */
function parseAndCleanContent(content) {
    if (!content) return {};

    let parsed = content;

    // If it's a string, try to extract JSON
    if (typeof content === 'string') {
        // Remove markdown code blocks
        let cleaned = content
            .replace(/^```(?:json)?[\s\n]*/gi, '')
            .replace(/[\s\n]*```$/gi, '')
            .trim();

        // Try to parse as JSON
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            // Return as-is if not valid JSON
            return content;
        }
    }

    // Unwrap common AI wrappers (e.g., { signatureOffer: { offerName: "..." } } -> { offerName: "..." })
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        if (keys.length === 1 && AI_WRAPPERS.includes(keys[0])) {
            parsed = parsed[keys[0]];
        }
    }

    // Recursively clean nested content
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const cleaned = {};
        for (const [key, value] of Object.entries(parsed)) {
            // Skip wrapper keys if they exist in nested content
            if (AI_WRAPPERS.includes(key) && typeof value === 'object') {
                Object.assign(cleaned, parseAndCleanContent(value));
            } else {
                cleaned[key] = typeof value === 'string' ? value.replace(/\\n/g, '\n') : value;
            }
        }
        return cleaned;
    }

    return parsed;
}

/**
 * Deep merge with intelligent field matching
 * Finds the correct location for updated fields even if nested differently
 */
/**
 * Strict replacement - only updates the exact sub-section specified
 * @param {Object} target - Existing vault content
 * @param {Object} source - AI-generated content (may be partial)
 * @param {Object} options - Replacement options
 * @returns {Object} Updated content with ONLY the specified field replaced
 */
function strictReplace(target, source, options = {}) {
    const { subSection } = options;

    console.log('[StrictReplace] Input:', {
        targetKeys: Object.keys(target || {}),
        sourceKeys: Object.keys(source || {}),
        subSection
    });

    // If source has _rawContent flag, return it as-is
    if (source && source._rawContent) {
        console.log('[StrictReplace] Raw content detected, returning as-is');
        return source._rawContent;
    }

    // Handle null/undefined cases
    if (!source || typeof source !== 'object') {
        console.warn('[StrictReplace] Source is not an object, returning target');
        return target;
    }
    if (!target || typeof target !== 'object') {
        console.log('[StrictReplace] Target is not an object, returning source');
        return source;
    }

    // Deep clone to avoid mutations
    const result = JSON.parse(JSON.stringify(target));

    // Case 1: Full section replacement (subSection === 'all' or undefined)
    if (!subSection || subSection === 'all') {
        console.log('[StrictReplace] Full section replacement');
        return source; // Complete replacement
    }

    // Case 2: Sub-section replacement - locate and replace ONLY that field
    const fieldToReplace = Object.keys(source)[0]; // First key in source
    console.log('[StrictReplace] Attempting to replace field:', fieldToReplace);

    const replaced = replaceNestedField(result, fieldToReplace, source[fieldToReplace] || source);

    if (!replaced) {
        console.warn('[StrictReplace] Could not find sub-section path:', fieldToReplace);
        // Fallback: try intelligent merge
        return intelligentMerge(result, source, subSection);
    }

    console.log('[StrictReplace] Result keys after replacement:', Object.keys(result));
    return result;
}

/**
 * Replace a specific nested field by searching for it
 * @param {Object} obj - Object to update
 * @param {string} fieldPath - Field name to find (e.g., "step1_openerPermission")
 * @param {any} newValue - New value for the field
 * @returns {boolean} True if replacement succeeded
 */
function replaceNestedField(obj, fieldPath, newValue) {
    // Handle direct field replacement (e.g., "step1_openerPermission")
    if (fieldPath in obj) {
        console.log('[ReplaceNested] Direct field found:', fieldPath);
        obj[fieldPath] = newValue;
        return true;
    }

    // Search nested objects
    for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Check if fieldPath exists in this nested object
            if (fieldPath in value) {
                console.log('[ReplaceNested] Found in nested object:', key);
                value[fieldPath] = newValue;
                return true;
            }

            // Recurse deeper
            if (replaceNestedField(value, fieldPath, newValue)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Intelligent merge for complex sub-sections
 * Handles cases where AI returns wrapped or unwrapped content
 */
function intelligentMerge(target, source, subSection) {
    console.log('[IntelligentMerge] Attempting intelligent merge for:', subSection);

    // Find where this field lives in the target structure
    const sourceKeys = Object.keys(source);
    console.log('[IntelligentMerge] Source keys to merge:', sourceKeys);

    // Try to find a matching structure in target
    for (const sourceKey of sourceKeys) {
        const path = findFieldPath(target, sourceKey);

        if (path.length > 0) {
            console.log('[IntelligentMerge] Found path for', sourceKey, ':', path.join('.'));

            // Navigate to parent and replace
            let current = target;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }

            const finalKey = path[path.length - 1];
            current[finalKey] = source[sourceKey];
        }
    }

    // DEBUG: Log the target structure to understand vault content
    console.log('[IntelligentMerge] Target keys:', Object.keys(target));

    for (const sourceKey of sourceKeys) {
        let foundAndUpdated = false;
        const commonWrappers = ['idealClientSnapshot', 'signatureMessage', 'signatureOffer', 'signatureStory', 'callFlow', 'leadMagnet'];

        // First, try to find the field directly in target
        if (sourceKey in target) {
            console.log('[IntelligentMerge] Found', sourceKey, 'directly in target');
            target[sourceKey] = source[sourceKey];
            foundAndUpdated = true;
            continue;
        }

        // Check common wrappers
        for (const wrapper of commonWrappers) {
            if (target[wrapper] && typeof target[wrapper] === 'object') {
                console.log('[IntelligentMerge] Checking wrapper:', wrapper, 'for field:', sourceKey);
                if (sourceKey in target[wrapper]) {
                    console.log('[IntelligentMerge] Found', sourceKey, 'in wrapper', wrapper);
                    target[wrapper][sourceKey] = source[sourceKey];
                    foundAndUpdated = true;
                    break;
                } else {
                    // Search one level deeper
                    for (const subKey of Object.keys(target[wrapper])) {
                        if (typeof target[wrapper][subKey] === 'object' && target[wrapper][subKey] !== null) {
                            if (sourceKey in target[wrapper][subKey]) {
                                console.log('[IntelligentMerge] Found', sourceKey, 'in', wrapper + '.' + subKey);
                                target[wrapper][subKey][sourceKey] = source[sourceKey];
                                foundAndUpdated = true;
                                break;
                            }
                        }
                    }
                    if (foundAndUpdated) break;
                }
            }
        }

        // If not found in wrappers, search entire target structure recursively
        if (!foundAndUpdated) {
            const path = findFieldPath(target, sourceKey);
            if (path.length > 0) {
                console.log('[IntelligentMerge] Found via path search:', path.join('.'));
                let current = target;
                for (let i = 0; i < path.length - 1; i++) {
                    current = current[path[i]];
                }
                current[path[path.length - 1]] = source[sourceKey];
                foundAndUpdated = true;
            }
        }

        // If still not found, merge at top level (last resort)
        if (!foundAndUpdated) {
            console.log('[IntelligentMerge] Adding to top level:', sourceKey);
            target[sourceKey] = source[sourceKey];
        }
    }

    return target;
}

/**
 * Find the path to a field in a nested object
 * @returns {string[]} Array representing the path (e.g., ["callFlow", "step1_openerPermission"])
 */
function findFieldPath(obj, targetField, currentPath = []) {
    if (!obj || typeof obj !== 'object') return [];

    if (targetField in obj) {
        return [...currentPath, targetField];
    }

    for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const found = findFieldPath(value, targetField, [...currentPath, key]);
            if (found.length > 0) return found;
        }
    }

    return [];
}

/**
 * DEPRECATED: Legacy deepMerge kept for backward compatibility
 * Use strictReplace instead for proper content replacement
 */
function deepMerge(target, source, depth = 0) {
    console.warn('[DeepMerge] DEPRECATED - Use strictReplace instead');

    if (source && source._rawContent) {
        console.log('[DeepMerge] Raw content detected, returning as-is');
        return source._rawContent;
    }

    if (!source || typeof source !== 'object') return target;
    if (!target || typeof target !== 'object') return source;

    // Prevent infinite recursion
    if (depth > 10) {
        console.warn('[DeepMerge] Max depth reached');
        return { ...target, ...source };
    }

    const result = JSON.parse(JSON.stringify(target)); // Deep clone to avoid mutations

    for (const [key, value] of Object.entries(source)) {
        // Skip internal keys
        if (key.startsWith('_')) continue;

        // First, check if this key exists directly in target
        if (key in result) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                result[key] = deepMerge(result[key] || {}, value, depth + 1);
            } else if (value !== undefined && value !== null) {
                // Direct replacement for primitives and arrays
                result[key] = value;
            }
        } else {
            // Key doesn't exist at this level - search for it deeper
            const found = findAndReplaceInObject(result, key, value);
            if (!found) {
                // If not found anywhere, add it at this level
                result[key] = value;
            }
        }
    }

    return result;
}

// Tooltip Use Cases
const SECTION_USE_CASES = {
    idealClient: "Use this to dial in your ad targeting, write focused copy, and speak directly to your premium buyer's pains and desires.",
    message: "Use your One-Liner for bios and social profiles. Use the Spoken Version for intros, podcasts, and networking events.",
    story: "Share your 60s story in networking. Use the 3-5min story for podcasts, stages, and webinars to build deep trust.",
    offer: "This is your core product architecture. Use the 7-Step Blueprint names in your marketing to build 'method authority'.",
    salesScripts: "Use this script for booked sales calls. Follow the flow to diagnose deeply before prescribing your solution.",
    setterScript: "Use this for 15-min triage calls or DM conversations to qualify leads and book them into a sales call.",
    leadMagnet: "Give this away in exchange for an email address. Use the title and hook in your ads and landing pages.",
    funnelCopy: "Copy and paste this into your landing page builder (ClickFunnels, GHL, etc.) for high conversion.",
    vsl: "Record this script for your landing page or sales page video. Keep it authentic and focused on the viewer.",
    facebookAds: "Test these ad variations on Facebook/Instagram. Use the hooks as the first line of your captions.",
    emails: "Load these into your email autoresponder to nurture new leads over 15 days.",
    appointmentReminders: "Add these to your calendar booking system (Calendly, GHL) to increase show-up rates.",
    bio: "Use the short bio for guesting (podcasts/events) and the full bio for your 'About' page."
};

/**
 * Search for a key in nested object and replace its value
 */
function findAndReplaceInObject(obj, searchKey, newValue) {
    if (!obj || typeof obj !== 'object') return false;

    for (const [key, value] of Object.entries(obj)) {
        if (key === searchKey) {
            obj[key] = newValue;
            return true;
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (findAndReplaceInObject(value, searchKey, newValue)) {
                return true;
            }
        }
    }
    return false;
}

export default function VaultPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { session, loading: authLoading, isProfileComplete } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [vaultData, setVaultData] = useState({});
    const [dataSource, setDataSource] = useState(null);
    const [approvedPhase1, setApprovedPhase1] = useState([]);
    const [hasFunnelChoice, setHasFunnelChoice] = useState(false);
    const [approvedPhase2, setApprovedPhase2] = useState([]);
    const [approvedPhase3, setApprovedPhase3] = useState([]);
    const [expandedSections, setExpandedSections] = useState(() => new Set());
    const [editingSection, setEditingSection] = useState(null);
    const [editedContent, setEditedContent] = useState({});
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [uploadedImages, setUploadedImages] = useState({
        logo: '', bio_author: '', product_mockup: '', results_image: ''
    });
    const [videoUrls, setVideoUrls] = useState({
        main_vsl: '', testimonial_video: '', thankyou_video: ''
    });
    const [isUpdatingAssets, setIsUpdatingAssets] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState({});
    const [feedbackChatOpen, setFeedbackChatOpen] = useState(false);
    const [feedbackSection, setFeedbackSection] = useState(null);
    const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [ghlLocationId, setGhlLocationId] = useState('');
    const [ghlAccessToken, setGhlAccessToken] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploymentComplete, setDeploymentComplete] = useState(false);
    const [ghlConnected, setGhlConnected] = useState(false);
    const [checkingGhlConnection, setCheckingGhlConnection] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [sectionStatuses, setSectionStatuses] = useState({});
    const [isBackgroundGenerating, setIsBackgroundGenerating] = useState(false);
    const [regeneratingSection, setRegeneratingSection] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Ref to track completed job IDs we've already processed (prevents duplicate refreshes)
    const previouslyCompletedJobsRef = useRef(new Set());

    // Tab state - determine initial tab from URL param
    const initialTab = searchParams.get('phase') === '2' ? 'assets' : 'dna';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Phase completion tracking
    const phase1FullyApproved = approvedPhase1.length >= PHASE_1_SECTIONS.length;
    const phase2FullyApproved = approvedPhase2.length >= PHASE_2_SECTIONS.length;
    const phase3FullyApproved = approvedPhase3.length >= PHASE_3_SECTIONS.length;

    // Computed states
    const isPhase1Complete = approvedPhase1.length >= PHASE_1_SECTIONS.length;
    const isPhase2Complete = approvedPhase2.length >= PHASE_2_SECTIONS.length;
    const isPhase3Complete = approvedPhase3.length >= PHASE_3_SECTIONS.length;
    const isVaultComplete = isPhase1Complete && isPhase2Complete && isPhase3Complete;

    // Check if we came from early redirect (still generating in background)
    const isGeneratingMode = searchParams.get('generating') === 'true';

    // Load vault data from database - ONLY on initial mount
    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        // Redirect to onboarding if profile is incomplete
        if (isProfileComplete === false) {
            console.log('[Vault] Profile incomplete, redirecting to onboarding');
            router.push("/onboarding");
            return;
        }

        // Don't reload if we already have data - prevents tab switch from clearing regenerations
        if (initialLoadComplete && Object.keys(vaultData).length > 0) {
            console.log('[Vault] Skipping reload - data already loaded');
            return;
        }

        const loadVault = async () => {
            // ... existing loadVault logic
            // Support both funnel_id (new) and session_id (backwards compatibility)
            const funnelId = searchParams.get('funnel_id') || searchParams.get('session_id');
            console.log('[Vault] Loading with funnel_id:', funnelId || 'default (no param)');
            setIsLoading(true);
            try {
                const res = await fetchWithAuth(`/api/os/results${funnelId ? `?funnel_id=${funnelId}` : ''}`);
                const result = await res.json();

                if (result.error) {
                    console.error("API error:", result.error);
                    toast.error("Failed to load vault");
                    return;
                }

                if (result.data && Object.keys(result.data).length > 0) {
                    const normalizedData = normalizeData(result.data);
                    const withFreeGift = applyFreeGiftReplacement(normalizedData);
                    setVaultData(withFreeGift);
                    setDataSource(result.source);
                    setHasFunnelChoice(result.source?.has_funnel_choice || false);
                    setInitialLoadComplete(true);
                    console.log('[Vault] Successfully loaded funnel:', result.source?.id, result.source?.name);

                    // Load approvals - prioritize URL param which we confirmed exists
                    const activeSessionId = funnelId || result.source?.id;
                    if (activeSessionId) {
                        await loadApprovals(activeSessionId);
                    } else {
                        console.log('[Vault] No valid session ID to load approvals');
                    }
                } else {
                    toast.info("No content yet. Complete the intake form first.");
                    router.push('/intake_form');
                    return;
                }
            } catch (error) {
                console.error("Failed to load vault:", error);
                toast.error("Failed to load vault");
            } finally {
                setIsLoading(false);
            }
        };

        loadVault();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, authLoading, isProfileComplete]); // Added isProfileComplete dependency


    // Listen for funnelCopyGenerated custom event from ApprovalWatcher
    // This enables real-time updates when background generation completes
    useEffect(() => {
        const funnelId = searchParams.get('funnel_id');
        if (!funnelId || !session) return;

        const handleFunnelCopyGenerated = async (e) => {
            if (e.detail.funnelId === funnelId) {
                console.log('[Vault] funnelCopyGenerated event received, refreshing data...');

                // Refresh vault data for the specific section
                try {
                    const res = await fetchWithAuth(`/api/os/results?funnel_id=${funnelId}`);
                    const result = await res.json();

                    if (result.data && Object.keys(result.data).length > 0) {
                        const normalizedData = normalizeData(result.data);
                        const withFreeGift = applyFreeGiftReplacement(normalizedData);
                        setVaultData(withFreeGift);
                        console.log('[Vault] Data refreshed after funnelCopy generation');
                    }

                    // Also refresh approvals
                    await loadApprovals(funnelId);
                } catch (error) {
                    console.error('[Vault] Error refreshing after funnelCopy generation:', error);
                }
            }
        };

        window.addEventListener('funnelCopyGenerated', handleFunnelCopyGenerated);
        return () => window.removeEventListener('funnelCopyGenerated', handleFunnelCopyGenerated);
    }, [searchParams, session]);

    // Poll for active generation jobs (Phase 2/3 background generation)
    // This provides real-time updates even without the ?generating=true flag
    useEffect(() => {
        const funnelId = searchParams.get('funnel_id');
        if (!funnelId || !session || !initialLoadComplete) return;

        let pollInterval;
        let isPolling = false;
        let lastSectionCount = Object.keys(vaultData).length;

        const checkForNewSections = async () => {
            if (isPolling) return; // Prevent concurrent polls
            isPolling = true;

            try {
                console.log('[Vault] Polling for new sections...');

                // Directly poll vault content to check for new sections
                const res = await fetchWithAuth(`/api/os/results?funnel_id=${funnelId}`);
                if (!res.ok) {
                    isPolling = false;
                    return;
                }

                const result = await res.json();

                if (result.data && Object.keys(result.data).length > 0) {
                    const normalizedData = normalizeData(result.data);
                    const newSectionCount = Object.keys(normalizedData).length;

                    // Check if new sections have been generated
                    if (newSectionCount > lastSectionCount) {
                        console.log(`[Vault] 🎉 New sections detected! ${lastSectionCount} → ${newSectionCount}`);
                        lastSectionCount = newSectionCount;

                        const withFreeGift = applyFreeGiftReplacement(normalizedData);
                        setVaultData(withFreeGift);
                        console.log('[Vault] Vault data refreshed, sections:', Object.keys(normalizedData));

                        // Trigger refresh of field components
                        setRefreshTrigger(prev => prev + 1);

                        // Refresh approvals to update section status
                        await loadApprovals(funnelId);

                        // Show a toast notification
                        toast.success('New sections generated!');
                    } else {
                        console.log(`[Vault] No new sections (current: ${newSectionCount})`);
                    }
                }
            } catch (error) {
                console.error('[Vault] Error polling for new sections:', error);
            } finally {
                isPolling = false;
            }
        };

        // Poll every 3 seconds for faster updates during generation
        pollInterval = setInterval(checkForNewSections, 3000);

        // Initial check
        checkForNewSections();

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [searchParams, session, initialLoadComplete, vaultData]);


    const loadApprovals = async (sId = null) => {
        // Priority: passed parameter > URL param > dataSource.id > 'current' (fallback)
        const funnelIdFromUrl = searchParams.get('funnel_id') || searchParams.get('session_id');
        const activeSessionId = sId || funnelIdFromUrl || dataSource?.id;

        // Validate UUID format to prevent invalid requests
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!activeSessionId || !uuidRegex.test(activeSessionId)) {
            console.log('[Vault] Skipping approvals load - no valid funnel ID:', { sId, funnelIdFromUrl, dataSourceId: dataSource?.id });
            return;
        }

        console.log('[Vault] Loading approvals for funnel:', activeSessionId);

        try {
            const approvalsRes = await fetchWithAuth(`/api/os/approvals?session_id=${activeSessionId}`);
            if (approvalsRes.ok) {
                const data = await approvalsRes.json();

                // Deduplicate arrays to prevent count issues
                const phase1Deduped = [...new Set(data.businessCoreApprovals || [])];
                const phase2Deduped = [...new Set(data.funnelAssetsApprovals || [])];

                console.log('[Vault] Approvals loaded:', {
                    phase1: phase1Deduped,
                    phase2: phase2Deduped,
                    phase1Count: phase1Deduped.length,
                    phase2Count: phase2Deduped.length
                });

                setApprovedPhase1(phase1Deduped);
                setApprovedPhase2(phase2Deduped);

                // Handle Phase 3 if present
                const phase3Raw = data.scriptsApprovals || [];
                const phase3Deduped = [...new Set(phase3Raw)];
                setApprovedPhase3(phase3Deduped);

                // Keep local storage in sync
                const approvals = {
                    phase1: phase1Deduped,
                    phase2: phase2Deduped,
                    phase3: phase3Deduped
                };
                localStorage.setItem(`vault_approvals_${session.user.id}_${activeSessionId}`, JSON.stringify(approvals));
            }
        } catch (e) {
            console.error('[Vault] Error loading approvals:', e);
            // Fallback to localStorage
            const saved = localStorage.getItem(`vault_approvals_${session.user.id}_${activeSessionId}`);
            if (saved) {
                const approvals = JSON.parse(saved);
                // Deduplicate from localStorage too
                const phase1Deduped = [...new Set(approvals.phase1 || [])];
                const phase2Deduped = [...new Set(approvals.phase2 || [])];
                setApprovedPhase1(phase1Deduped);
                setApprovedPhase2(phase2Deduped);
            }
        }
    };

    const saveApprovals = async (phase1, phase2, phase3 = []) => {
        // Priority: dataSource.id > URL param > 'current'
        const funnelIdFromUrl = searchParams.get('funnel_id') || searchParams.get('session_id');
        const activeSessionId = dataSource?.id || funnelIdFromUrl || 'current';

        const approvals = { phase1, phase2, phase3 };
        localStorage.setItem(`vault_approvals_${session.user.id}_${activeSessionId}`, JSON.stringify(approvals));

        // Only call API if we have a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(activeSessionId)) {
            console.log('[Vault] Skipping approval save API - invalid ID:', activeSessionId);
            return;
        }

        try {
            await fetchWithAuth('/api/os/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: activeSessionId,
                    businessCoreApprovals: phase1,
                    funnelAssetsApprovals: phase2,
                    scriptsApprovals: phase3
                })
            });
        } catch (e) {
            console.log('Approvals saved to localStorage');
        }
    };

    const getSectionStatus = (sectionId, phaseNumber, approvedList, index) => {
        // 1. Already approved sections stay approved (check approvedList first)
        if (approvedList.includes(sectionId)) return 'approved';

        // 1b. CRITICAL FIX: Also check vault_content.status for database-persisted approvals
        // This handles cases where Media/Colors were approved but not in approvedList
        const sectionData = vaultData?.[sectionId];
        if (sectionData?._status === 'approved') {
            console.log(`[Vault] Section ${sectionId} approved via vault_content.status`);
            return 'approved';
        }

        // 2. Phase gating
        if (phaseNumber === 2 && !hasFunnelChoice) return 'locked';
        if (phaseNumber === 3 && !phase2FullyApproved) return 'locked';

        // 3. Check for explicit error in data (from DB or normalization)
        if (sectionData?.error) {
            return 'failed';
        }

        // 4. MANUAL SECTIONS: media is user-uploaded, skip AI population check
        const MANUAL_SECTIONS = ['media'];
        let hasContent = false;

        if (MANUAL_SECTIONS.includes(sectionId)) {
            // For manual sections, consider as having content (user uploads)
            hasContent = true;
        } else {
            // 5. AI-generated sections: Check if content exists
            const meaningfulKeys = Object.keys(sectionData || {}).filter(k => !k.startsWith('_') && k !== 'error');
            hasContent = meaningfulKeys.length > 0;
        }

        // 6. If NO content, check polling status or default to generating
        if (!hasContent) {
            const genStatus = sectionStatuses[sectionId];
            if (genStatus === 'failed') return 'failed';
            // No content = still generating
            return 'generating';
        }

        // 7. CONTENT EXISTS - determine if current or locked based on sequence
        const sections = phaseNumber === 1 ? PHASE_1_SECTIONS
            : phaseNumber === 2 ? PHASE_2_SECTIONS
                : PHASE_3_SECTIONS;

        if (index === 0) {
            return 'current';
        }

        // 8. Unlocked only if ALL previous sections are approved
        const allPreviousApproved = sections.slice(0, index).every(s => approvedList.includes(s.id));
        if (allPreviousApproved) {
            return 'current';
        }

        return 'locked';
    };

    const handleApprove = async (sectionId, phaseNumber) => {
        // Get sections list for current phase
        const phaseSections = phaseNumber === 1 ? PHASE_1_SECTIONS
            : phaseNumber === 2 ? PHASE_2_SECTIONS
                : PHASE_3_SECTIONS;
        const currentIndex = phaseSections.findIndex(s => s.id === sectionId);

        if (phaseNumber === 1) {
            if (approvedPhase1.includes(sectionId)) {
                console.log('[Vault] Section already approved:', sectionId);
                return;
            }

            const newApprovals = [...approvedPhase1, sectionId];
            setApprovedPhase1(newApprovals);
            await saveApprovals(newApprovals, approvedPhase2, approvedPhase3);

            if (newApprovals.length >= PHASE_1_SECTIONS.length) {
                toast.success("🎉 Phase 1 Complete! Choose your funnel to unlock Phase 2.");
            } else {
                toast.success("Section approved!");
            }
        } else if (phaseNumber === 2) {
            if (approvedPhase2.includes(sectionId)) {
                console.log('[Vault] Section already approved:', sectionId);
                return;
            }

            const newApprovals = [...approvedPhase2, sectionId];
            setApprovedPhase2(newApprovals);
            await saveApprovals(approvedPhase1, newApprovals, approvedPhase3);

            if (newApprovals.length >= PHASE_2_SECTIONS.length) {
                toast.success("🎉 Phase 2 Complete! Unlock Sales Scripts.");
            } else {
                toast.success("Section approved!");
            }
        } else {
            // Phase 3
            if (approvedPhase3.includes(sectionId)) {
                console.log('[Vault] Section already approved:', sectionId);
                return;
            }

            const newApprovals = [...approvedPhase3, sectionId];
            setApprovedPhase3(newApprovals);
            await saveApprovals(approvedPhase1, approvedPhase2, newApprovals);

            if (newApprovals.length >= PHASE_3_SECTIONS.length) {
                toast.success("🎉 All Phases Complete! Ready to Deploy.");
            } else {
                toast.success("Section approved!");
            }
        }

        // Auto-collapse current section and expand next section
        const newExpanded = new Set();

        // Find and expand next section
        if (currentIndex >= 0 && currentIndex < phaseSections.length - 1) {
            const nextSection = phaseSections[currentIndex + 1];
            newExpanded.add(nextSection.id);
        } else if (phaseNumber === 1 && hasFunnelChoice && PHASE_2_SECTIONS.length > 0) {
            // If Phase 1 complete and has funnel choice, expand first Phase 2 section
            newExpanded.add(PHASE_2_SECTIONS[0].id);
        } else if (phaseNumber === 2 && phase2FullyApproved && PHASE_3_SECTIONS.length > 0) {
            // If Phase 2 complete, expand first Phase 3 section
            newExpanded.add(PHASE_3_SECTIONS[0].id);
        }

        setExpandedSections(newExpanded);
    };

    // Handle unapprove when fields are edited
    const handleUnapprove = async (sectionId) => {
        console.log('[Vault] Section unapproved due to field edit:', sectionId);

        // Determine which phase this section belongs to
        const isPhase1Section = PHASE_1_SECTIONS.some(s => s.id === sectionId);
        const isPhase2Section = PHASE_2_SECTIONS.some(s => s.id === sectionId);
        const isPhase3Section = PHASE_3_SECTIONS.some(s => s.id === sectionId);

        if (isPhase1Section) {
            const newApprovals = approvedPhase1.filter(id => id !== sectionId);
            setApprovedPhase1(newApprovals);
            await saveApprovals(newApprovals, approvedPhase2, approvedPhase3);
        } else if (isPhase2Section) {
            const newApprovals = approvedPhase2.filter(id => id !== sectionId);
            setApprovedPhase2(newApprovals);
            await saveApprovals(approvedPhase1, newApprovals, approvedPhase3);
        } else if (isPhase3Section) {
            const newApprovals = approvedPhase3.filter(id => id !== sectionId);
            setApprovedPhase3(newApprovals);
            await saveApprovals(approvedPhase1, approvedPhase2, newApprovals);
        }

        // Trigger refresh of field components
        setRefreshTrigger(prev => prev + 1);
    };

    // REMOVED: handleRegenerate function - replaced by AI Feedback Chat
    // Old regeneration was blind - new Feedback system uses user input for targeted refinement

    // Handle regeneration of a single failed section
    const handleRegenerateSection = async (sectionId, numericKey, feedback = null) => {
        setRegeneratingSection(sectionId);
        setSectionStatuses(prev => ({ ...prev, [sectionId]: 'generating' }));

        try {
            const funnelId = searchParams.get('funnel_id');
            if (!funnelId) {
                toast.error("No funnel ID found");
                return;
            }

            const res = await fetchWithAuth('/api/os/regenerate-section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_key: numericKey,
                    feedback: feedback // Pass feedback if present
                })
            });

            const result = await res.json();

            if (result.success && result.section) {
                // Update vault data with new content
                setVaultData(prev => ({
                    ...prev,
                    [sectionId]: result.section.content
                }));
                // Reset granular field components for this section to force re-render/update
                // Or simply the data update should trigger it if they use props correctly.

                setSectionStatuses(prev => ({ ...prev, [sectionId]: 'generated' }));

                // Reset approval status since content has changed
                setApprovedPhase1(prev => prev.filter(id => id !== sectionId));
                setApprovedPhase2(prev => prev.filter(id => id !== sectionId));

                toast.success(`${result.section.name} regenerated successfully!`);
            } else {
                setSectionStatuses(prev => ({ ...prev, [sectionId]: 'failed' }));
                toast.error(result.error || 'Regeneration failed');
            }
        } catch (error) {
            console.error('[Vault] Regeneration error:', error);
            setSectionStatuses(prev => ({ ...prev, [sectionId]: 'failed' }));
            toast.error('Failed to regenerate section');
        } finally {
            setRegeneratingSection(null);
        }
    };

    const handleFeedbackSubmit = async (feedback) => {
        if (!feedbackSection) return;

        setIsFeedbackSubmitting(true);
        try {
            // Find the numeric key for the section
            const mapping = Object.entries(CONTENT_MAPPING).find(([key, val]) => val === feedbackSection.id);
            const numericKey = mapping ? parseInt(mapping[0]) : null;

            if (!numericKey) {
                throw new Error("Section key not found");
            }

            await handleRegenerateSection(feedbackSection.id, numericKey, feedback);
            setFeedbackChatOpen(false);
            setFeedbackSection(null);
        } catch (error) {
            console.error("Feedback submission error:", error);
            toast.error("Failed to submit feedback");
        } finally {
            setIsFeedbackSubmitting(false);
        }
    };

    // Explicit save handler for regenerated content
    const handleSaveChanges = async () => {
        const sessionId = dataSource?.id || localStorage.getItem('ted_current_session_id');
        if (!sessionId) {
            toast.error("No active session. Please save your session first.");
            setShowSaveModal(true);
            return;
        }

        console.log(`[Vault] Attempting to save changes to session ${sessionId}`);
        console.log(`[Vault] Data to save:`, Object.keys(vaultData));

        setIsSaving(true);
        try {
            const res = await fetchWithAuth('/api/os/sessions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: sessionId,
                    generatedContent: vaultData
                })
            });

            const responseData = await res.json();

            if (res.ok && responseData.success) {
                setUnsavedChanges(false);
                toast.success("Changes saved to database!");
                console.log(`[Vault] Successfully saved to session ${sessionId}`, responseData);
            } else {
                toast.error(`Save failed: ${responseData.error || 'Unknown error'}`);
                console.error('[Vault] Save failed:', responseData);
            }
        } catch (error) {
            console.error("[Vault] Save error:", error);
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    // Check for saved GHL credentials when modal opens
    const checkGhlConnection = async () => {
        console.log('[Vault] Checking GHL connection...');
        setCheckingGhlConnection(true);
        try {
            const res = await fetchWithAuth('/api/ghl/credentials');
            const data = await res.json();
            console.log('[Vault] GHL credentials response:', data);

            if (data.exists && data.credentials?.location_id) {
                console.log('[Vault] GHL Connected! Location:', data.credentials.location_id);
                setGhlConnected(true);
                setGhlLocationId(data.credentials.location_id);
            } else {
                console.log('[Vault] No GHL credentials found');
                setGhlConnected(false);
            }
        } catch (error) {
            console.error('[Vault] Error checking GHL connection:', error);
            setGhlConnected(false);
        } finally {
            setCheckingGhlConnection(false);
        }
    };

    // Handle opening deploy modal
    const handleOpenDeployModal = () => {
        console.log('[Vault] handleOpenDeployModal called! Setting showDeployModal to true');
        setShowDeployModal(true);
        setDeploymentComplete(false);
        checkGhlConnection();
        console.log('[Vault] showDeployModal state set');
    };

    // Handle GHL Deployment (Pabbly Workflow)
    const handleDeployToGHL = async () => {
        const funnelId = dataSource?.id || searchParams.get('funnel_id');

        if (!funnelId) {
            toast.error('No funnel ID found');
            return;
        }

        setIsDeploying(true);
        console.log('[Vault] Starting Pabbly deployment workflow...');

        try {
            const res = await fetchWithAuth('/api/ghl/deploy-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnelId })
            });

            const result = await res.json();

            if (res.ok && result.success) {
                setDeploymentComplete(true);
                toast.success('Deployment started! Your funnel assets are being pushed to GoHighLevel.');
            } else {
                console.error('[Vault] Deployment error:', result);
                toast.error(result.error || 'Failed to start deployment');
            }
        } catch (error) {
            console.error('[Vault] Deployment error:', error);
            toast.error('Failed to trigger deployment');
        } finally {
            setIsDeploying(false);
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

            // Persist to database automatically if in a loaded session
            const sessionId = dataSource?.id || searchParams.get('session_id');
            const isPersistable = dataSource?.type === 'loaded' || dataSource?.type === 'latest_session';
            if (sessionId && isPersistable) {
                try {
                    await fetchWithAuth('/api/os/sessions', {
                        method: 'PATCH',
                        body: JSON.stringify({
                            id: sessionId,
                            generatedContent: updatedVaultData
                        })
                    });
                    toast.success("Changes saved to session!");
                } catch (saveError) {
                    console.error("[Vault] Failed to persist edit:", saveError);
                    toast.error("Saved locally, but failed to sync with database.");
                }
            } else {
                toast.success("Changes saved locally. Use 'Save Session' to persist to a new session.");
            }
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
            if (data.success && data.session) {
                toast.success(`Session saved as "${sessionName}"`);
                setShowSaveModal(false);
                setSessionName('');

                // Update dataSource to the newly saved session
                setDataSource({ type: 'loaded', name: data.session.session_name, id: data.session.id });

                // Update URL to include the new session ID
                const currentPhase = activeTab === 'assets' ? '2' : '1';
                router.push(`/vault?session_id=${data.session.id}&phase=${currentPhase}`, { scroll: false });
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

    // Asset Management Handlers
    const handleFileUpload = async (fileType, file, isVideo = false) => {
        if (!file) return;
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            toast.error(`File too large. Max size: 10MB`);
            return;
        }

        setUploadingFiles(prev => ({ ...prev, [fileType]: true }));
        const toastId = toast.loading(`Uploading ${file.name}...`);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', isVideo ? 'video' : 'image');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (response.ok && data.success) {
                if (isVideo) {
                    setVideoUrls(prev => ({ ...prev, [fileType]: data.fullUrl }));
                } else {
                    setUploadedImages(prev => ({ ...prev, [fileType]: data.fullUrl }));
                }
                toast.success(`${file.name} uploaded!`, { id: toastId });
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('[Upload] Error:', error);
            toast.error(`Upload failed: ${error.message}`, { id: toastId });
        } finally {
            setUploadingFiles(prev => ({ ...prev, [fileType]: false }));
        }
    };

    const handleUpdateAssets = async () => {
        setIsUpdatingAssets(true);
        const toastId = toast.loading("Updating your funnel assets...");

        try {
            // Get credentials from GHL API
            const credsRes = await fetchWithAuth('/api/ghl/credentials');
            const credsData = await credsRes.json();

            if (!credsData.location_id || !credsData.access_token) {
                toast.error("Funnel credentials not found. Please connect your account first.", { id: toastId });
                setIsUpdatingAssets(false);
                return;
            }

            const sessionId = dataSource?.id || localStorage.getItem('ted_current_session_id');

            const res = await fetchWithAuth('/api/ghl/update-assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    locationId: credsData.location_id,
                    accessToken: credsData.access_token,
                    uploadedImages,
                    videoUrls
                })
            });

            const result = await res.json();
            if (res.ok && result.success) {
                toast.success(`Success! ${result.summary.updated} assets updated in your funnel.`, { id: toastId });
                setShowMediaLibrary(false);
            } else {
                throw new Error(result.error || 'Failed to update assets');
            }
        } catch (error) {
            console.error('[Assets] Update error:', error);
            toast.error(`Failed to update: ${error.message}`, { id: toastId });
        } finally {
            setIsUpdatingAssets(false);
        }
    };




    const handleFeedbackSave = async (saveData) => {
        if (!feedbackSection) return;

        // FeedbackChatModal passes { refinedContent, subSection }
        let refinedContent = saveData?.refinedContent || saveData;
        const subSection = saveData?.subSection;
        const funnelId = searchParams.get('funnel_id');

        console.log('[Vault] Saving feedback:', { subSection, contentType: typeof refinedContent });

        // PRIMITIVE FIX: If AI returns a simple string value for a field, wrap it with the field name
        // e.g., "I help..." becomes { oneLineMessage: "I help..." }
        if (subSection && subSection !== 'all' && typeof refinedContent === 'string') {
            console.log('[Vault] Wrapping primitive string with field name:', subSection);
            refinedContent = { [subSection]: refinedContent };
        }

        // UNWRAP FIX: AI sometimes returns content wrapped with the subSection key
        // e.g., {oneLiner: {signatureMessage: {...}}} instead of {signatureMessage: {...}}
        // Detect and unwrap this pattern
        if (subSection && subSection !== 'all' && refinedContent && typeof refinedContent === 'object') {
            const contentKeys = Object.keys(refinedContent);

            // Check if the content is wrapped with the subSection key
            if (contentKeys.length === 1 && contentKeys[0] === subSection) {
                const wrappedContent = refinedContent[subSection];

                // If the wrapped content contains wrapper keys (signatureMessage, idealClientSnapshot, etc.)
                // then unwrap it and use that as the content
                const wrapperKeys = ['signatureMessage', 'idealClientSnapshot', 'signatureOffer', 'signatureStory', 'callFlow', 'leadMagnet'];
                const hasWrapper = Object.keys(wrappedContent || {}).some(k => wrapperKeys.includes(k));

                if (hasWrapper) {
                    console.log('[Vault] Detected wrapped content, unwrapping:', subSection);
                    refinedContent = wrappedContent;
                }
            }
        }

        // Get current content for this section
        const currentSectionContent = vaultData[feedbackSection.id] || {};

        // Merge new content into existing
        const updatedContent = strictReplace(currentSectionContent, refinedContent, { subSection });

        // Update local state immediately for responsive UI
        setVaultData(prev => ({
            ...prev,
            [feedbackSection.id]: updatedContent
        }));

        try {
            // 1. Save individual fields to vault_content_fields for granular persistence
            const fieldsToSave = subSection && subSection !== 'all'
                ? { [subSection]: refinedContent[subSection] || refinedContent }
                : refinedContent;

            const fieldSavePromises = Object.entries(fieldsToSave).map(async ([fieldId, fieldValue]) => {
                try {
                    const response = await fetchWithAuth('/api/os/vault-field', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            funnel_id: funnelId,
                            section_id: feedbackSection.id,
                            field_id: fieldId,
                            field_value: fieldValue
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        console.warn(`[Vault] Field ${fieldId} save warning:`, errData);
                    }
                    return { fieldId, success: response.ok };
                } catch (err) {
                    console.warn(`[Vault] Field ${fieldId} save error:`, err);
                    return { fieldId, success: false };
                }
            });

            await Promise.all(fieldSavePromises);

            // 2. Also update vault_content JSONB for backwards compatibility
            const { error: sectionError } = await supabase
                .from('vault_content')
                .update({ content: updatedContent })
                .eq('funnel_id', funnelId)
                .eq('section_id', feedbackSection.id);

            if (sectionError) {
                console.warn('[Vault] Section content sync warning:', sectionError);
            }

            toast.success('Changes saved!');

            // CRITICAL: Increment refreshTrigger for real-time UI updates
            setRefreshTrigger(prev => prev + 1);

            // Reset approval since content changed
            handleUnapprove(feedbackSection.id);

            setFeedbackChatOpen(false);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save changes');
        }
    };

    const MediaLibrary = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-2xl overflow-hidden shadow-2xl"
        >
            <div className="p-6 border-b border-[#2a2a2d] flex items-center justify-between bg-gradient-to-r from-cyan/10 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan/20 rounded-lg">
                        <ImageIcon className="w-5 h-5 text-cyan" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Media Library</h3>
                        <p className="text-sm text-gray-400">Update logos, images and videos in your funnel</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowMediaLibrary(false)}
                    className="p-2 hover:bg-[#2a2a2d] rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="p-8 space-y-10">
                {/* Images Section */}
                <div>
                    <h4 className="text-xs font-black text-cyan uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Visual Assets
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { id: 'logo', label: 'Business Logo', icon: ImageIcon },
                            { id: 'bio_author', label: 'Bio / Author Photo', icon: Users },
                            { id: 'product_mockup', label: 'Product Mockup', icon: Gift },
                            { id: 'results_image', label: 'Results / Proof Image', icon: CheckCircle }
                        ].map(asset => (
                            <div key={asset.id} className="space-y-3">
                                <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <asset.icon className="w-4 h-4 text-cyan/70" /> {asset.label}
                                </label>
                                <div className="group relative">
                                    <input
                                        type="text"
                                        value={uploadedImages[asset.id]}
                                        onChange={(e) => setUploadedImages(prev => ({ ...prev, [asset.id]: e.target.value }))}
                                        placeholder="Paste image URL..."
                                        className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white text-sm focus:border-cyan focus:outline-none transition-all pr-24"
                                    />
                                    <div className="absolute right-2 top-1.5 flex gap-1">
                                        <label className="p-1.5 bg-[#1b1b1d] hover:bg-[#2a2a2d] text-cyan rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(asset.id, e.target.files?.[0])}
                                                disabled={uploadingFiles[asset.id]}
                                            />
                                            {uploadingFiles[asset.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        </label>
                                        {uploadedImages[asset.id] && (
                                            <button
                                                onClick={() => setUploadedImages(prev => ({ ...prev, [asset.id]: '' }))}
                                                className="p-1.5 bg-[#1b1b1d] hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Videos Section */}
                <div className="pt-8 border-t border-[#2a2a2d]">
                    <h4 className="text-xs font-black text-cyan uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <VideoIcon className="w-3 h-3" /> Video Content
                    </h4>
                    <div className="space-y-6">
                        {[
                            { id: 'main_vsl', label: 'Main VSL Video', icon: VideoIcon },
                            { id: 'testimonial_video', label: 'Testimonial Video', icon: Users },
                            { id: 'thankyou_video', label: 'Thank You Video', icon: CheckCircle }
                        ].map(asset => (
                            <div key={asset.id} className="space-y-3">
                                <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <asset.icon className="w-4 h-4 text-cyan/70" /> {asset.label}
                                </label>
                                <div className="group relative">
                                    <input
                                        type="text"
                                        value={videoUrls[asset.id]}
                                        onChange={(e) => setVideoUrls(prev => ({ ...prev, [asset.id]: e.target.value }))}
                                        placeholder="Paste video URL (YouTube, Vimeo, etc.)..."
                                        className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white text-sm focus:border-cyan focus:outline-none transition-all pr-24"
                                    />
                                    <div className="absolute right-2 top-1.5 flex gap-1">
                                        <label className="p-1.5 bg-[#1b1b1d] hover:bg-[#2a2a2d] text-cyan rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="video/*"
                                                onChange={(e) => handleFileUpload(asset.id, e.target.files?.[0], true)}
                                                disabled={uploadingFiles[asset.id]}
                                            />
                                            {uploadingFiles[asset.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        </label>
                                        {videoUrls[asset.id] && (
                                            <button
                                                onClick={() => setVideoUrls(prev => ({ ...prev, [asset.id]: '' }))}
                                                className="p-1.5 bg-[#1b1b1d] hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-8 border-t border-[#2a2a2d] flex justify-end gap-4">
                    <button
                        onClick={() => setShowMediaLibrary(false)}
                        className="px-6 py-3 bg-[#2a2a2d] text-white rounded-xl font-medium hover:bg-[#3a3a3d] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdateAssets}
                        disabled={isUpdatingAssets}
                        className="px-8 py-3 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-black flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                    >
                        {isUpdatingAssets ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        Update All Assets in Funnel
                    </button>
                </div>
            </div>
        </motion.div>
    );

    const SECTION_TITLES = {
        // Ideal Client sections (NEW - Premium Buyer Framework)
        // Ideal Client Snapshot sections
        bestIdealClient: 'Best Ideal Client (1 sentence):',
        topChallenges: 'Top 3 Challenges:',
        whatTheyWant: 'What They Want (3 bullets):',
        whatMakesThemPay: 'What Makes Them Pay (2 bullets):',
        howToTalkToThem: 'How to Talk to Them (3 coffee-talk lines):',
        idealClientSnapshot: 'IDEAL CLIENT SNAPSHOT',

        // Million Dollar Message sections (NEW - Signature Message)
        signatureMessage: 'Signature Message',
        oneLiner: 'Signature Message (One-Liner)',
        spokenVersion: '30-Second Spoken Version',

        // Ideal Client field labels
        whoTheyAre: 'Who this person is in one clear sentence',
        lifeOrBusinessStage: 'What stage of life or business they are in',
        whyNow: 'Why now is the moment they’re looking for a solution',
        ageRange: 'Age range',
        gender: 'Gender (if applicable)',
        location: 'Location (if implied)',
        incomeOrRevenue: 'Income or business revenue range',
        jobTitleOrRole: 'Job title or role',
        currentFrustrations: 'What they are frustrated about right now',
        whatKeepsThemStuck: 'What keeps them stuck or overwhelmed',
        secretWorries: 'What they secretly worry might never change',
        successInTheirWords: 'What success looks like in their own words',
        tiredOfTrying: 'What they’re tired of trying or hearing',
        surfaceProblem: 'The surface problem they complain about',
        deeperEmotionalProblem: 'The deeper, emotional problem underneath',
        costOfNotSolving: 'The real cost of not solving this problem',
        practicalResults: 'Practical results they want',
        emotionalOutcomes: 'Emotional outcomes they’re chasing',
        statusIdentityLifestyle: 'Status, identity, or lifestyle signals they care about',
        momentsThatPushAction: 'What moments push them to finally take action',
        needHelpNowMoments: 'What makes them say “I need help with this now”',
        messagingThatGrabsAttention: 'What type of messaging gets their attention instantly',
        reasonsToHesitate: 'Common reasons they hesitate to buy',
        pastBadExperiences: 'Past bad experiences that made them skeptical',
        whatTheyNeedToBelieve: 'What they need to believe before saying yes',
        phrasesTheyUse: 'Phrases they likely use to describe their problem',
        emotionallyResonantWords: 'Words that resonate emotionally',
        authenticAngles: 'Angles that would feel authentic, not salesy',
        platforms: 'Platforms they actively consume content on',
        trustedVoices: 'Types of creators, brands, or voices they trust',
        contentFormatsTheyRespondTo: 'Content formats they respond to best',
        howToSpeakToThem: 'How this ICP should be spoken to',
        whatToAvoid: 'What to avoid saying',
        whatBuildsTrustAndAuthority: 'What will immediately build trust and authority',

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

        // Signature Story sections (NEW - 6-Phase Framework)
        signatureStory: 'Signature Story',
        storyBlueprint: 'Story Blueprint (6 Phases)',
        thePit: '1. The Pit',
        theSearch: '2. The Search',
        theDrop: '3. The Drop',
        searchAgain: '4. Search Again',
        theBreakthrough: '5. The Breakthrough',
        theOutcome: '6. The Outcome',
        coreLessonExtracted: 'Core Lesson',
        networkingStory: '60-90s Networking Story',
        stageStory: '3-5 min Stage/Podcast Story',
        oneLinerStory: '15-25s One-Liner Story',
        socialPostVersion: 'Social Post Version',
        emailStory: 'Email Story',
        subjectLine: 'Subject Line',
        body: 'Email Body',
        pullQuotes: 'Signature Pull Quotes',

        // Signature Offer sections (NEW - 7-Step Blueprint)
        signatureOffer: 'Signature Offer',
        offerName: 'Offer Name',
        whoItsFor: 'Who It\'s For',
        thePromise: 'The Promise',
        offerMode: 'Offer Mode',
        sevenStepBlueprint: '7-Step Blueprint',
        stepNumber: 'Step',
        stepName: 'Step Name',
        whatItIs: 'What It Is',
        problemSolved: 'Problem Solved',
        outcomeCreated: 'Outcome Created',
        toolAsset: 'Tool/Asset Produced',
        tier1SignatureOffer: 'Tier 1 Signature Offer',
        delivery: 'Delivery',
        whatTheyGet: 'What They Get',
        recommendedPrice: 'Recommended Price',
        ascensionLadder: 'Ascension Ladder',
        tier0: 'Tier 0 ($37)',
        tier05: 'Tier 0.5 ($97)',
        course: 'Course ($1K-$2K)',
        tier2: 'Tier 2 (Premium)',
        cta: 'CTA',

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
        offer: "Phase 1",
        salesScripts: "Setter Call: Word-for-Word Script",
        leadMagnet: "Free Gift Asset",
        vsl: "VSL Video Script",
        facebookAds: "Facebook Ad Variations",
        funnelCopy: "Funnel Page Copy",
        appointmentReminders: "Appointment Reminders",
        contentIdeas: "Social Media Content Ideas",
        bio: "Professional Bio",
        emails: "Email & SMS Sequences",

        // Free Gift sections
        leadMagnetIdea: 'Free Gift Idea',
        titleAndHook: 'Title & Hook',
        audienceConnection: 'Audience Connection',
        coreContent: 'Core Content / Deliverables',
        leadMagnetCopy: 'Free Gift Copy',
        ctaIntegration: 'CTA Integration',
        voiceAndTone_leadMagnet: 'Voice & Tone',
        // voiceAndTone already defined above for Story

        // Free Gift field labels
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
        callGoal: 'Call Goal',
        callFlow: 'Call Flow (10 Steps)',
        setterMindset: 'Setter Mindset',

        // Call Flow step labels
        step1_openerPermission: 'Step 1: Opener + Permission',
        step2_referenceOptIn: 'Step 2: Reference Opt-In',
        step3_lowPressureFrame: 'Step 3: Low-Pressure Frame',
        step4_currentSituation: 'Step 4: Current Situation',
        step5_goalMotivation: 'Step 5: Goal + Motivation',
        step6_challengeStakes: 'Step 6: Challenge + Stakes',
        step7_authorityDrop: 'Step 7: Authority Drop',
        step8_qualifyFit: 'Step 8: Qualify Fit + Readiness',
        step9_bookConsultation: 'Step 9: Book Consultation',
        step10_confirmShowUp: 'Step 10: Confirm Show-Up + Wrap-Up',
        name: 'Step Name',
        purpose: 'Purpose',
        keyLine: 'Key Line'
    };

    const SECTION_SORT_ORDER = {
        idealClient: [
            'bestIdealClient',
            'topChallenges',
            'whatTheyWant',
            'whatMakesThemPay',
            'howToTalkToThem'
        ],
        message: [
            'signatureMessage',
            'oneLiner',
            'spokenVersion'
        ],
        story: [
            'signatureStory',
            'storyBlueprint',
            'coreLessonExtracted',
            'networkingStory',
            'stageStory',
            'oneLinerStory',
            'socialPostVersion',
            'emailStory',
            'pullQuotes'
        ],
        leadMagnet: [
            'leadMagnetIdea',
            'titleAndHook',
            'audienceConnection',
            'coreContent',
            'leadMagnetCopy',
            'ctaIntegration',
            'voiceAndTone_leadMagnet'
        ],
        offer: [
            'offerName',
            'whoItsFor',
            'thePromise',
            'offerMode',
            'sevenStepBlueprint',
            'tier1SignatureOffer',
            'ascensionLadder',
            'cta'
        ],
        salesScripts: [
            'quickOutline',
            'fullWordForWordScript',
            'objectionHandlingGuide'
        ],
        setterScript: [
            'quickOutline'
        ],
        vsl: [
            'fullScript',
            'estimatedLength',
            'hookOptions',
            'threeTips',
            'stepsToSuccess',
            'callToActionName',
            'objectionHandlers',
            'urgencyElements',
            'socialProofMentions',
            'guarantee',
            'closingSequence'
        ],
        funnelCopy: [
            'optInHeadlines',
            'optInPageCopy',
            'thankYouPageCopy',
            'confirmationPageScript',
            'faqs',
            'stepsToSuccess',
            'salesPageCopy'
        ],
        bio: [
            'oneLiner',
            'shortBio',
            'fullBio',
            'speakerBio',
            'keyAchievements',
            'personalTouch',
            'socialMediaVersions'
        ],
        emails: [
            'tips',
            'stepsToSuccess',
            'faqs',
            'successStory',
            'emails'
        ]
    };

    // Nested content sort order (for depth > 0)
    // Defines explicit ordering for specific nested objects that need it
    const NESTED_SORT_ORDER = {
        storyBlueprint: [
            'thePit',
            'theSearch',
            'theDrop',
            'searchAgain',
            'theBreakthrough',
            'theOutcome'
        ],
        appointmentReminders: [
            'contentTips',
            'keyFeatures',
            'preparationSteps',
            'confirmationEmail',
            'reminder48Hours',
            'reminder24Hours',
            'reminder1Hour',
            'reminder10Minutes',
            'startingNow',
            'noShowFollowUp'
        ]
    };

    const getSectionTitle = (key) => {
        if (!key) return '';

        // Check for SECTION_TITLES match first
        if (SECTION_TITLES[key]) return SECTION_TITLES[key];

        // Handle keys with underscores (e.g., part2_discovery)
        let processedKey = key;

        // Case: PART2_DISCOVERY or part2_discovery
        if (processedKey.match(/part\d+_/i)) {
            processedKey = processedKey.replace(/_/g, ': ');
        }

        // Standardize camelCase to spaces
        let title = processedKey.replace(/([A-Z])/g, ' $1').trim();

        // Replace underscores with spaces if any remain
        title = title.replace(/_/g, ' ');

        // Capitalize acronyms correctly
        title = title
            .replace(/\bCta\b/g, 'CTA')
            .replace(/\bVsl\b/g, 'VSL')
            .replace(/\bSms\b/g, 'SMS')
            .replace(/\bFaq\b/g, 'FAQ')
            .replace(/\bIcp\b/g, 'ICP');

        // Fix "Part 2 : Discovery" spacing issues
        title = title.replace(/\s+:\s+/g, ': ');

        // Title case the result
        return title.charAt(0).toUpperCase() + title.slice(1);
    };

    // Content Renderer with enhanced formatting
    const ContentRenderer = ({ content, sectionId, isEditing, onUpdate }) => {
        if (!content) return <p className="text-gray-500 text-sm">No content generated.</p>;

        // Intelligently unwrap common top-level wrappers
        let displayContent = content;
        const wrappers = [
            'idealClientProfile',
            'idealClientSnapshot',
            'millionDollarMessage',
            'signatureMessage',
            'signatureStory',
            'signatureOffer',
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
            // Objects - render sections
            if (typeof value === 'object') {
                let keys = Object.keys(value).filter((k) =>
                    k !== '_contentName' && k !== 'id' && k !== 'idealClientProfile'
                );

                // Smart sort helper function
                const smartSort = (a, b) => {
                    // Extract numbers from start of meaningful strings
                    // Supports: "4. Title", "Phase 1", "Part 2", "Step 3", "Tier 1"
                    const getNum = (str) => {
                        // Check for "Part 1", "Step 2" types
                        const match = str.match(/(?:^|part|step|phase|tier)\s?_?(\d+)/i);
                        if (match && match[1]) {
                            return parseInt(match[1], 10);
                        }
                        // Check for "4. Title" format (number at start followed by dot/space)
                        const startMatch = str.match(/^(\d+)[._\s]/);
                        if (startMatch && startMatch[1]) {
                            return parseInt(startMatch[1], 10);
                        }
                        return null;
                    };

                    const numA = getNum(a);
                    const numB = getNum(b);

                    // Strictly sort by number if both have numbers
                    if (numA !== null && numB !== null) {
                        return numA - numB;
                    }

                    // Put numbered items BEFORE non-numbered items
                    if (numA !== null && numB === null) return -1;
                    if (numA === null && numB !== null) return 1;

                    // Fallback to alphabetical
                    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                };

                // SORTING LOGIC:
                // 1. If depth > 0 (nested content), check NESTED_SORT_ORDER first, then smartSort
                // 2. If depth === 0 (top level), check SECTION_SORT_ORDER first
                if (depth > 0) {
                    // Check if this nested object has a predefined sort order
                    if (key && NESTED_SORT_ORDER[key]) {
                        const order = NESTED_SORT_ORDER[key];
                        const hasOrderedKeys = keys.some(k => order.includes(k));

                        if (hasOrderedKeys) {
                            keys = keys.sort((a, b) => {
                                const indexA = order.indexOf(a);
                                const indexB = order.indexOf(b);
                                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                if (indexA !== -1) return -1;
                                if (indexB !== -1) return 1;
                                return smartSort(a, b);
                            });
                        } else {
                            keys = keys.sort(smartSort);
                        }
                    } else {
                        keys = keys.sort(smartSort);
                    }
                } else if (sectionId && SECTION_SORT_ORDER[sectionId]) {
                    const order = SECTION_SORT_ORDER[sectionId];
                    const hasOrderedKeys = keys.some(k => order.includes(k));

                    if (hasOrderedKeys) {
                        keys = keys.sort((a, b) => {
                            const indexA = order.indexOf(a);
                            const indexB = order.indexOf(b);
                            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                            if (indexA !== -1) return -1;
                            if (indexB !== -1) return 1;
                            return smartSort(a, b);
                        });
                    } else {
                        keys = keys.sort(smartSort);
                    }
                } else {
                    keys = keys.sort(smartSort);
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
                                        {k === 'stepNumber' || k === 'step' ? <span className="text-cyan font-black">Step {v}</span> : title}
                                    </h4>
                                    {k !== 'stepNumber' && k !== 'step' && renderValue(v, k, depth + 1, entryPath)}
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
                        <p className="text-gray-400 mb-6">All your content is ready. Deploy to Builder or continue editing.</p>

                        {/* Deploy to GHL Button */}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => {
                                    console.log('[Vault] Deploy to Builder clicked!');
                                    window.alert('Deploy to Builder button clicked!');
                                    handleOpenDeployModal();
                                }}
                                className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-xl font-bold text-white shadow-lg shadow-cyan/30 transition-all hover:scale-105 flex items-center gap-2"
                            >
                                <ExternalLink className="w-5 h-5" />
                                Build Your Funnel
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-8 py-4 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-xl font-medium text-white transition-all border border-[#2a2a2d]"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>

                    {/* Phase 1 */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Phase 1
                        </h2>
                        <div className="grid gap-3">
                            {PHASE_1_SECTIONS.map((section, index) => renderSection(section, 'approved', index, 1))}
                        </div>
                    </div>

                    {/* Phase 2 */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Phase 2
                        </h2>
                        <div className="grid gap-3">
                            {PHASE_2_SECTIONS.map((section, index) => renderSection(section, 'approved', index, 2))}
                        </div>
                    </div>

                    {/* Phase 3 */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Phase 3
                        </h2>
                        <div className="grid gap-3">
                            {PHASE_3_SECTIONS.map((section, index) => renderSection(section, 'approved', index, 3))}
                        </div>
                    </div>
                </div>

                {/* GHL Deployment Modal - Unified with main view */}
                <AnimatePresence>
                    {showDeployModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => !isDeploying && setShowDeployModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#131314] border border-[#2a2a2d] rounded-2xl p-8 max-w-md w-full"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">Build Your Funnel</h2>
                                    {!isDeploying && (
                                        <button
                                            onClick={() => setShowDeployModal(false)}
                                            className="p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {deploymentComplete ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <CheckCircle className="w-10 h-10 text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Deployment Complete!</h3>
                                        <p className="text-gray-400 mb-4">Your content is now live in Builder.</p>
                                        <button
                                            onClick={() => {
                                                setShowDeployModal(false);
                                                const funnelId = dataSource?.id || searchParams.get('funnel_id');
                                                router.push(`/vault/deployed-assets${funnelId ? `?funnel_id=${funnelId}` : ''}`);
                                            }}
                                            className="px-6 py-2 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-lg font-medium transition-colors"
                                        >
                                            View Deployed Assets
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-cyan/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                                            <Rocket className="w-8 h-8 text-cyan" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Ready to Deploy?</h3>
                                        <p className="text-gray-400 max-w-sm mx-auto mb-8">
                                            This will push all your approved content to your connected GoHighLevel account.
                                        </p>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowDeployModal(false)}
                                                disabled={isDeploying}
                                                className="flex-1 px-4 py-3 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-lg font-medium transition-colors disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeployToGHL}
                                                disabled={isDeploying}
                                                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isDeploying ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Deploying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ExternalLink className="w-4 h-4" />
                                                        Start Deployment
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }



    // Helper to render sections
    function renderSection(section, status, index, phase) {
        const Icon = section.icon;
        const isExpanded = expandedSections.has(section.id);
        const content = vaultData[section.id];
        const isEditing = editingSection === section.id;

        return (
            <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl border transition-all ${status === 'approved' ? 'bg-cyan/5 border-cyan/30' :
                    status === 'current' ? 'bg-[#1b1b1d] border-cyan/30 shadow-lg shadow-cyan/10' :
                        status === 'generating' ? 'bg-[#1b1b1d] border-cyan/30' :
                            status === 'failed' ? 'bg-red-500/5 border-red-500/30' :
                                'bg-[#131314] border-[#2a2a2d] opacity-60'
                    }`}
            >
                <div
                    className={`w-full p-3 sm:p-5 flex items-center justify-between gap-4 text-left ${status === 'locked' || status === 'generating' ? 'cursor-not-allowed' : ''
                        }`}
                >
                    <div className="flex items-center gap-4 flex-1">
                        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${status === 'approved' ? 'bg-cyan/20' :
                            status === 'current' ? 'bg-cyan/20' :
                                status === 'generating' ? 'bg-cyan/20' :
                                    status === 'failed' ? 'bg-red-500/20' :
                                        status === 'locked' ? 'bg-cyan/5 border border-cyan/20' :
                                            'bg-gray-700/50'
                            }`}>
                            {status === 'approved' ? <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-cyan" /> :
                                status === 'locked' ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" className="text-cyan" />
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" className="text-cyan fill-cyan/20" />
                                    </svg>
                                ) :
                                    status === 'generating' ? <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 text-cyan animate-spin" /> :
                                        status === 'failed' ? <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" /> :
                                            <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-cyan" />}

                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className={`font-bold text-sm sm:text-lg ${status === 'approved' ? 'text-cyan' :
                                    status === 'current' ? 'text-white' :
                                        status === 'generating' ? 'text-white' :
                                            status === 'failed' ? 'text-red-400' :
                                                'text-gray-400'
                                    }`}>
                                    {section.title}
                                </h3>
                                {section.hint && (
                                    <div className="group relative">
                                        <Info className="w-4 h-4 text-gray-500 hover:text-cyan cursor-help" />
                                        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 p-2 bg-black/90 border border-gray-800 rounded-lg text-xs text-gray-300 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                                            {section.hint}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] sm:text-sm text-gray-500 truncate">{section.subtitle}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {(status === 'current' || status === 'approved' || status === 'failed') && (
                        <div className="flex items-center gap-3">
                            {!isExpanded ? (
                                <button
                                    onClick={() => {
                                        // "One Action At A Time" - Only allow one section expanded
                                        setExpandedSections(new Set([section.id]));
                                    }}
                                    className="px-2 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-cyan/20 to-blue-500/20 hover:from-cyan/30 hover:to-blue-500/30 text-cyan border border-cyan/30 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all hover:scale-105"
                                >
                                    <span className="hidden sm:inline">Show My {section.title}</span><span className="sm:hidden">Show</span> <ChevronDown className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setFeedbackSection(section);
                                            setFeedbackChatOpen(true); // Using Chat Modal
                                        }}
                                        className="px-2 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105"
                                    >
                                        <MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">AI Feedback</span>
                                    </button>
                                    {status === 'approved' ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    // Enable editing by unapproving first
                                                    handleUnapprove(section.id, phase);
                                                    toast.info('Section unlocked for editing');
                                                }}
                                                className="px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 rounded-lg text-gray-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all"
                                                title="Edit this section"
                                            >
                                                <Edit3 className="w-4 h-4" /> <span className="hidden sm:inline">Edit</span>
                                            </button>
                                            {/* Push to GHL button for applicable sections */}
                                            {['funnelCopy', 'emails', 'sms', 'media', 'appointmentReminders', 'colors'].includes(section.id) && (
                                                <PushToGHLButton
                                                    section={section.id}
                                                    funnelId={searchParams.get('funnel_id') || dataSource?.id}
                                                    isApproved={true}
                                                    isVaultComplete={isVaultComplete}
                                                />
                                            )}
                                            <div className="px-2 py-1.5 sm:px-4 sm:py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-medium flex items-center gap-2 text-xs sm:text-sm">
                                                <CheckCircle className="w-4 h-4" /> <span className="hidden sm:inline">Approved</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleApprove(section.id, phase)}
                                            className="px-2 py-1.5 sm:px-4 sm:py-2 bg-cyan text-black hover:bg-cyan/90 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105"
                                        >
                                            <CheckCircle className="w-4 h-4" /> <span className="hidden sm:inline">Approve</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            const newExpanded = new Set(expandedSections);
                                            newExpanded.delete(section.id);
                                            setExpandedSections(newExpanded);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                                    >
                                        <ChevronUp className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Portal Target for Granular Section Actions */}
                    <div id={`section-header-actions-${section.id}`} className="flex items-center gap-2" />
                </div>


                <AnimatePresence>
                    {isExpanded && status !== 'locked' && status !== 'generating' && status !== 'failed' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-[#2a2a2d]"
                        >
                            <div className="p-4 sm:p-6">
                                {/* Granular Fields for supported sections, or ContentRenderer for others */}
                                {GRANULAR_FIELD_COMPONENTS[section.id] ? (
                                    (() => {
                                        const GranularComponent = GRANULAR_FIELD_COMPONENTS[section.id];
                                        const funnelId = searchParams.get('funnel_id') || dataSource?.id;
                                        return (
                                            <GranularComponent
                                                key={`${section.id}-${status}`}
                                                funnelId={funnelId}
                                                isApproved={status === 'approved'}
                                                onApprove={(sectionId) => handleApprove(sectionId, phase)}
                                                onUnapprove={handleUnapprove}
                                                refreshTrigger={refreshTrigger}
                                                onRenderApproveButton={(btn) => (
                                                    <SafePortal targetId={`section-header-actions-${section.id}`}>
                                                        {btn}
                                                    </SafePortal>
                                                )}
                                            />
                                        );
                                    })()
                                ) : (
                                    <div className="bg-[#0e0e0f] rounded-xl p-4 sm:p-6 mb-4 max-h-96 overflow-y-auto">
                                        <ContentRenderer
                                            content={isEditing ? editedContent : content}
                                            sectionId={section.id}
                                            isEditing={isEditing}
                                            onUpdate={updateContentValue}
                                        />
                                    </div>
                                )}
                                {/* Only show action buttons for sections NOT using granular fields */}
                                {!GRANULAR_FIELD_COMPONENTS[section.id] && (
                                    <div className="flex flex-wrap gap-3">
                                        {isEditing ? (
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
                                                        onClick={() => handleApprove(section.id, phase)}
                                                        className="flex-1 sm:flex-none px-6 py-3 btn-approve rounded-xl flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                        Approve
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setFeedbackSection(section);
                                                        setFeedbackChatOpen(true);
                                                    }}
                                                    className="flex-1 sm:flex-none px-6 py-3 btn-feedback rounded-xl flex items-center justify-center gap-2"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                    Feedback
                                                </button>
                                                {unsavedChanges && (
                                                    <button
                                                        onClick={handleSaveChanges}
                                                        disabled={isSaving}
                                                        className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 font-bold"
                                                    >
                                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                        Save
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div >
        );
    };

    // Initial Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-cyan animate-spin mx-auto" />
                    <p className="text-gray-400 animate-pulse">Loading your vault...</p>
                </div>
            </div>
        );
    }

    // Unified Tabbed View
    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">

                {/* Navigation & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-fit p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>

                    <div className="flex items-center gap-2 bg-[#131314] p-1.5 rounded-xl border border-[#2a2a2d]">
                        <button
                            onClick={() => { setActiveTab('dna'); setShowMediaLibrary(false); }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dna' ? 'bg-cyan text-black shadow-lg shadow-cyan/20' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Phase 1
                        </button>
                        <button
                            onClick={() => { setActiveTab('assets'); setShowMediaLibrary(false); }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'assets' ? 'bg-cyan text-black shadow-lg shadow-cyan/20' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Phase 2
                        </button>
                        <button
                            onClick={() => { setActiveTab('scripts'); setShowMediaLibrary(false); }}
                            disabled={!phase2FullyApproved}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'scripts' ? 'bg-cyan text-black shadow-lg shadow-cyan/20' : phase2FullyApproved ? 'text-gray-500 hover:text-gray-300' : 'text-gray-700 cursor-not-allowed'}`}
                        >
                            Phase 3
                        </button>
                    </div>


                </div>

                {/* Content Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                        {showMediaLibrary ? 'Media Library' : (activeTab === 'dna' ? 'Phase 1' : activeTab === 'assets' ? 'Phase 2' : 'Phase 3')}
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        {showMediaLibrary
                            ? 'Update your funnel images and videos.'
                            : (activeTab === 'dna'
                                ? 'Your core business foundations. The foundation for all marketing.'
                                : activeTab === 'assets'
                                    ? 'Deployable assets for your marketing funnels, emails, and ads.'
                                    : 'Sales scripts to close deals and set appointments.')}
                    </p>
                </div>

                {/* Media Library Toggle removed - using 'Upload Images and Videos' section instead */}

                {/* Progress Bar (Hide in Media Library) */}
                {!showMediaLibrary && (
                    <div className="mb-12 bg-[#131314] p-6 rounded-2xl border border-[#2a2a2d]">
                        <div className="flex justify-between text-sm mb-3">
                            <span className="text-gray-400 font-medium">Completion Progress</span>
                            <span className="text-cyan font-bold">
                                {activeTab === 'dna'
                                    ? `${approvedPhase1.length} of ${PHASE_1_SECTIONS.length}`
                                    : activeTab === 'assets'
                                        ? `${approvedPhase2.length} of ${PHASE_2_SECTIONS.length}`
                                        : `${approvedPhase3.length} of ${PHASE_3_SECTIONS.length}`}
                            </span>
                        </div>
                        <div className="h-2.5 bg-[#0e0e0f] rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${activeTab === 'dna'
                                        ? (approvedPhase1.length / PHASE_1_SECTIONS.length) * 100
                                        : activeTab === 'assets'
                                            ? (approvedPhase2.length / PHASE_2_SECTIONS.length) * 100
                                            : (approvedPhase3.length / PHASE_3_SECTIONS.length) * 100}%`
                                }}
                                className="h-full bg-gradient-to-r from-cyan via-blue-500 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                            />
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        {showMediaLibrary ? (
                            <motion.div
                                key="media-library"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <MediaLibrary />
                            </motion.div>
                        ) : activeTab === 'dna' ? (
                            <motion.div
                                key="dna-content"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="grid gap-3">
                                    {PHASE_1_SECTIONS.map((section, index) => {
                                        const status = getSectionStatus(section.id, 1, approvedPhase1, index);
                                        return renderSection(section, status, index, 1);
                                    })}

                                    {isPhase1Complete && !hasFunnelChoice && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="mt-8 p-8 rounded-3xl bg-gradient-to-br from-[#1c1c1e] to-[#131314] border border-cyan/20 text-center shadow-2xl shadow-cyan/5"
                                        >
                                            <div className="w-16 h-16 bg-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Sparkles className="w-8 h-8 text-cyan" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">Phase 1 Complete!</h3>
                                            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                                                Your core business assets are approved. Now let's build your marketing assets in Phase 2.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    // Redirect to funnel choice page
                                                    const funnelId = searchParams.get('funnel_id') || dataSource?.id;
                                                    router.push(`/funnel-recommendation?funnel_id=${funnelId}`);
                                                }}
                                                className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-3 mx-auto hover:brightness-110 transition-all group"
                                            >
                                                Show my recommended funnel
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ) : activeTab === 'assets' ? (
                            <motion.div
                                key="assets-content"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {hasFunnelChoice ? (
                                    <div className="grid gap-3">
                                        {PHASE_2_SECTIONS.map((section, index) => {
                                            const status = getSectionStatus(section.id, 2, approvedPhase2, index);
                                            return renderSection(section, status, index, 2);
                                        })}

                                        {isPhase2Complete && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="mt-8 p-8 rounded-3xl bg-gradient-to-br from-[#1c1c1e] to-[#131314] border border-cyan/20 text-center shadow-2xl shadow-cyan/5"
                                            >
                                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                                </div>
                                                <h3 className="text-xl font-bold mb-2">All Marketing Assets Complete!</h3>
                                                <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                                                    Your marketing assets are complete. Now let's focus on closing clients.
                                                </p>
                                                <button
                                                    onClick={() => setActiveTab('scripts')}
                                                    className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-3 mx-auto hover:brightness-110 transition-all group"
                                                >
                                                    <Sparkles className="w-5 h-5" />
                                                    Proceed to Phase 3
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-[#131314] rounded-3xl border border-dashed border-[#2a2a2d]">
                                        <div className="w-16 h-16 mx-auto mb-6 relative bg-cyan/5 rounded-2xl flex items-center justify-center border border-cyan/20">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" className="text-cyan" />
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" className="text-cyan fill-cyan/20" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-bold mb-3">Marketing Assets Locked</h2>
                                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                                            Finish your Phase 1 and deploy your first funnel to unlock these professional marketing assets.
                                        </p>
                                        <button
                                            onClick={() => router.push('/funnel-recommendation')}
                                            className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-bold flex items-center gap-3 mx-auto hover:brightness-110 transition-all shadow-xl shadow-cyan/30"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            Go to Funnel Deployment
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="scripts-content"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="grid gap-3">
                                    {PHASE_3_SECTIONS.map((section, index) => {
                                        const status = getSectionStatus(section.id, 3, approvedPhase3, index);
                                        return renderSection(section, status, index, 3);
                                    })}

                                    {phase3FullyApproved && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="mt-8 p-8 rounded-3xl bg-gradient-to-br from-[#1c1c1e] to-[#131314] border border-green-500/20 text-center shadow-2xl shadow-green-500/5"
                                        >
                                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle className="w-8 h-8 text-green-500" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">🎉 All Phases Complete!</h3>
                                            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                                                Your vault is fully approved. Deploy to Builder to activate your marketing system.
                                            </p>
                                            <button
                                                onClick={() => setShowDeployModal(true)}
                                                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black flex items-center justify-center gap-3 mx-auto hover:brightness-110 transition-all group"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                                Build Your Funnel
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>

                {/* Save Session Modal */}
                <AnimatePresence>
                    {showSaveModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                            onClick={() => setShowSaveModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-3xl p-8 w-full max-w-md shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-3 bg-cyan/10 rounded-2xl w-fit mb-6">
                                    <Save className="w-6 h-6 text-cyan" />
                                </div>
                                <h3 className="text-2xl font-black mb-2">Save This Session</h3>
                                <p className="text-gray-400 mb-8">Give your strategy a name so you can load it later in the dashboard.</p>

                                <div className="space-y-4 mb-8">
                                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-1">Session Name</label>
                                    <input
                                        type="text"
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        placeholder="e.g. Real Estate Growth Plan"
                                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl px-4 py-4 text-white focus:outline-none focus:border-cyan transition-all text-lg font-medium"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowSaveModal(false)}
                                        className="px-4 py-4 bg-[#2a2a2d] hover:bg-[#3a3a3d] text-white rounded-xl font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveSession}
                                        disabled={isSaving}
                                        className="px-4 py-4 bg-cyan hover:brightness-110 text-black rounded-xl font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        {isSaving ? 'Saving...' : 'Save Now'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>



                {/* GHL Deployment Modal */}
                <AnimatePresence>
                    {showDeployModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => !isDeploying && setShowDeployModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#131314] border border-[#2a2a2d] rounded-2xl p-8 max-w-md w-full"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">Build Your Funnel</h2>
                                    {!isDeploying && (
                                        <button
                                            onClick={() => setShowDeployModal(false)}
                                            className="p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {deploymentComplete ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <CheckCircle className="w-10 h-10 text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Deployment Complete!</h3>
                                        <p className="text-gray-400 mb-4">Your content is now live in Builder.</p>
                                        <button
                                            onClick={() => setShowDeployModal(false)}
                                            className="px-6 py-2 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-lg font-medium transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-cyan/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                                            <Rocket className="w-8 h-8 text-cyan" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Ready to Deploy?</h3>
                                        <p className="text-gray-400 max-w-sm mx-auto mb-8">
                                            This will push all your approved content to your connected GoHighLevel account.
                                        </p>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowDeployModal(false)}
                                                disabled={isDeploying}
                                                className="flex-1 px-4 py-3 bg-[#1b1b1d] hover:bg-[#2a2a2d] rounded-lg font-medium transition-colors disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeployToGHL}
                                                disabled={isDeploying}
                                                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isDeploying ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Deploying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ExternalLink className="w-4 h-4" />
                                                        Start Deployment
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <FeedbackChatModal
                isOpen={feedbackChatOpen}
                onClose={() => setFeedbackChatOpen(false)}
                sectionId={feedbackSection?.id}
                sectionTitle={feedbackSection?.title}
                currentContent={feedbackSection ? vaultData[feedbackSection.id] : null}
                sessionId={session?.activeSessionId || searchParams.get('funnel_id')} // Fallback to funnel_id if session not found
                onSave={handleFeedbackSave}
            />

            {/* ApprovalWatcher: Monitors approvals and auto-triggers Funnel Copy generation */}
            <ApprovalWatcher funnelId={searchParams.get('funnel_id')} userId={session?.userId} />
        </div>
    );
}
