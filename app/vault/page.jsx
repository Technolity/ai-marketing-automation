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
    ChevronDown, ChevronUp, Save, Image as ImageIcon, Video as VideoIcon, Plus, Trash2 as TrashIcon, ExternalLink,
    Upload, X
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
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
    { id: 'vsl', numericKey: 7, title: 'Marketing Funnel', subtitle: 'Video Sales Letter', icon: Video },
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
    const [unsavedChanges, setUnsavedChanges] = useState(false); // Track if there are unsaved regenerations

    // Save Session states
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Tab Management
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('phase') === '2' ? 'assets' : 'dna';
    const [activeTab, setActiveTab] = useState(initialTab); // 'dna' or 'assets'

    // Asset Management States
    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [uploadedImages, setUploadedImages] = useState({
        logo: '', bio_author: '', product_mockup: '', results_image: ''
    });
    const [videoUrls, setVideoUrls] = useState({
        main_vsl: '', testimonial_video: '', thankyou_video: ''
    });
    const [isUpdatingAssets, setIsUpdatingAssets] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState({});

    // Computed states
    const isPhase1Complete = approvedPhase1.length >= PHASE_1_SECTIONS.length;
    const isPhase2Complete = approvedPhase2.length >= PHASE_2_SECTIONS.length;
    const isVaultComplete = isPhase1Complete && isPhase2Complete;

    // Track if initial load is complete to prevent re-fetching on tab switch
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Load vault data from database - ONLY on initial mount
    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        // Don't reload if we already have data - prevents tab switch from clearing regenerations
        if (initialLoadComplete && Object.keys(vaultData).length > 0) {
            console.log('[Vault] Skipping reload - data already loaded');
            return;
        }

        const loadVault = async () => {
            const sessionId = searchParams.get('session_id');
            setIsLoading(true);
            try {
                const res = await fetchWithAuth(`/api/os/results${sessionId ? `?session_id=${sessionId}` : ''}`);
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
                    setInitialLoadComplete(true);
                    console.log('[Vault] Loaded from:', result.source);

                    // Load approvals for this specific session if available
                    const activeSessionId = result.source?.id || 'current';
                    await loadApprovals(activeSessionId);
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
    }, [session, authLoading]); // Removed searchParams to prevent reload on tab switch

    const loadApprovals = async (sId = null) => {
        const activeSessionId = sId || dataSource?.id || 'current';
        try {
            const approvalsRes = await fetchWithAuth(`/api/os/approvals?session_id=${activeSessionId}`);
            if (approvalsRes.ok) {
                const data = await approvalsRes.json();
                setApprovedPhase1(data.businessCoreApprovals || []);
                setApprovedPhase2(data.funnelAssetsApprovals || []);
                setFunnelApproved(data.funnelApproved || false);

                // Keep local storage in sync
                const approvals = {
                    phase1: data.businessCoreApprovals || [],
                    phase2: data.funnelAssetsApprovals || [],
                    funnelApproved: data.funnelApproved || false
                };
                localStorage.setItem(`vault_approvals_${session.user.id}_${activeSessionId}`, JSON.stringify(approvals));
            }
        } catch (e) {
            // Fallback to localStorage
            const saved = localStorage.getItem(`vault_approvals_${session.user.id}_${activeSessionId}`);
            if (saved) {
                const approvals = JSON.parse(saved);
                setApprovedPhase1(approvals.phase1 || []);
                setApprovedPhase2(approvals.phase2 || []);
                setFunnelApproved(approvals.funnelApproved || false);
            }
        }
    };

    const saveApprovals = async (phase1, phase2, funnel) => {
        const activeSessionId = dataSource?.id || 'current';
        const approvals = { phase1, phase2, funnelApproved: funnel };
        localStorage.setItem(`vault_approvals_${session.user.id}_${activeSessionId}`, JSON.stringify(approvals));

        try {
            await fetchWithAuth('/api/os/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: activeSessionId,
                    businessCoreApprovals: phase1,
                    funnelAssetsApprovals: phase2,
                    funnelApproved: funnel
                })
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
                    const newVaultData = { ...vaultData, [sectionId]: data.content };
                    setVaultData(newVaultData);
                    setUnsavedChanges(true); // Mark as having unsaved changes
                    toast.success("Content regenerated! Click 'Save Changes' to persist.");
                }
            } else {
                toast.error(`Regeneration failed (${res.status}).`);
                console.error("Regeneration failed with status:", res.status);
            }
        } catch (error) {
            console.error("Regeneration error:", error);
            toast.error("Failed to regenerate");
        } finally {
            setIsRegenerating(false);
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
        // Ideal Client sections
        coreAudienceSnapshot: 'Core Audience Snapshot',
        demographics: 'Demographics (only where relevant)',
        psychographics: 'Psychographics (THIS IS THE MOST IMPORTANT SECTION)',
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

        // Signature Story sections
        originMoment: '1. The Origin Moment',
        emotionalStruggle: '2. The Emotional Struggle',
        discoveryBreakthrough: '3. The Discovery / Breakthrough',
        missionAndWhy: '4. The Mission & “Why”',
        clientProofResults: '5. Client Proof / Results',
        ctaTieIn: '6. The Call-to-Action Tie-In',
        voiceAndTone: '7. Voice & Tone',

        // Story field labels
        definingExperience: 'The defining personal or professional experience that led the founder to this mission',
        relatableStruggle: 'Highlight a relatable struggle, pain point, or turning point',
        turningPoint: 'The specific moment or event that changed everything',
        obstaclesFaced: 'The obstacles, fears, or frustrations the founder faced',
        fearsAndDoubts: 'Show vulnerability and authenticity',
        connectionToAudience: 'Connect these struggles to the audience’s own pain',
        howSolutionWasFound: 'How the founder found a solution',
        uniqueInsight: 'The unique method, approach, or insight that changed everything',
        whyItsLearnable: 'Position it as relatable and learnable, not mystical',
        whyYouHelp: 'Why the founder now helps this audience',
        deeperPurpose: 'The deeper purpose beyond money or status',
        authenticityMarkers: 'Show authenticity, empathy, and authority',
        naturalTransition: 'Transition from story to the audience’s next step naturally',
        nextStepInvitation: 'The invitation to join the program, service, or community',
        continuingTransformation: 'Show how joining the program, service, or community continues the transformation',
        brandVoiceDescription: 'Keep story aligned with brand voice (direct, bold, compassionate, humorous, etc.)',
        emotionalTone: 'Maintain readability and emotional resonance',
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
        vsl: "Marketing Funnel",
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
        idealClient: [
            'coreAudienceSnapshot',
            'demographics',
            'psychographics',
            'corePainsAndProblems',
            'desiredOutcomesAndMotivations',
            'buyingTriggers',
            'objectionsAndResistance',
            'languageAndMessagingHooks',
            'whereTheySpendTimeAndWhoTheyTrust',
            'summaryForMarketers'
        ],
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
                                            {unsavedChanges && (
                                                <button
                                                    onClick={handleSaveChanges}
                                                    disabled={isSaving}
                                                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 text-sm font-bold"
                                                >
                                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    Save
                                                </button>
                                            )}
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

    // Helper to render sections
    const renderSection = (section, status, index, phase) => {
        const Icon = section.icon;
        const isExpanded = expandedSection === section.id;
        const content = vaultData[section.id];
        const isEditing = editingSection === section.id;

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
                                        content={isEditing ? editedContent : content}
                                        isEditing={isEditing}
                                        onUpdate={updateContentValue}
                                    />
                                </div>
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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

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
                            Business DNA
                        </button>
                        <button
                            onClick={() => { setActiveTab('assets'); setShowMediaLibrary(false); }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'assets' ? 'bg-cyan text-black shadow-lg shadow-cyan/20' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Marketing Assets
                        </button>
                    </div>

                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="w-fit inline-flex items-center gap-2 px-4 py-2 bg-[#1b1b1d] hover:bg-[#2a2a2d] border border-[#2a2a2d] rounded-lg text-sm font-medium transition-colors"
                    >
                        <Save className="w-4 h-4 text-cyan" />
                        Save Session
                    </button>
                </div>

                {/* Content Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                        {showMediaLibrary ? 'Media Library' : (activeTab === 'dna' ? 'Business DNA' : 'Marketing Assets')}
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        {showMediaLibrary
                            ? 'Update your funnel images and videos.'
                            : (activeTab === 'dna'
                                ? 'Your core business intelligence. The foundation for all marketing.'
                                : 'Deployable assets for your funnels, emails, and ads.')}
                    </p>
                </div>

                {/* Media Library Toggle (Only for Assets Tab) */}
                {activeTab === 'assets' && funnelApproved && !showMediaLibrary && (
                    <div className="mb-8 p-6 bg-gradient-to-br from-cyan/10 to-blue-600/10 border border-cyan/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-center md:text-left">
                            <div className="w-12 h-12 rounded-xl bg-cyan/20 flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-cyan" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Media Library</h3>
                                <p className="text-sm text-gray-400">Update images and videos in your deployed funnel instantly.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowMediaLibrary(true)}
                            className="w-full md:w-auto px-6 py-3 bg-cyan text-black font-black rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                        >
                            <Edit3 className="w-4 h-4" />
                            Update Assets
                        </button>
                    </div>
                )}

                {/* Progress Bar (Hide in Media Library) */}
                {!showMediaLibrary && (
                    <div className="mb-12 bg-[#131314] p-6 rounded-2xl border border-[#2a2a2d]">
                        <div className="flex justify-between text-sm mb-3">
                            <span className="text-gray-400 font-medium">Completion Progress</span>
                            <span className="text-cyan font-bold">
                                {activeTab === 'dna'
                                    ? `${approvedPhase1.length} of ${PHASE_1_SECTIONS.length}`
                                    : `${approvedPhase2.length} of ${PHASE_2_SECTIONS.length}`}
                            </span>
                        </div>
                        <div className="h-2.5 bg-[#0e0e0f] rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${activeTab === 'dna'
                                        ? (approvedPhase1.length / PHASE_1_SECTIONS.length) * 100
                                        : (approvedPhase2.length / PHASE_2_SECTIONS.length) * 100}%`
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
                                {isPhase1Complete ? (
                                    <div className="grid gap-3">
                                        {PHASE_1_SECTIONS.map((section) => renderCompletedSection(section, 1))}

                                        {!funnelApproved && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="mt-8 p-8 rounded-3xl bg-gradient-to-br from-[#1c1c1e] to-[#131314] border border-cyan/20 text-center shadow-2xl shadow-cyan/5"
                                            >
                                                <div className="w-16 h-16 bg-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Sparkles className="w-8 h-8 text-cyan" />
                                                </div>
                                                <h3 className="text-xl font-bold mb-2">Business DNA Complete!</h3>
                                                <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                                                    Your core business assets are approved. Now, let's see which marketing funnel will work best for your offer.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        const sessionId = dataSource?.id || searchParams.get('session_id');
                                                        router.push(`/funnel-recommendation${sessionId ? `?session_id=${sessionId}` : ''}`);
                                                    }}
                                                    className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-3 mx-auto hover:brightness-110 transition-all group"
                                                >
                                                    Show Recommended Funnel
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    PHASE_1_SECTIONS.map((section, index) => {
                                        const status = getSectionStatus(section.id, 1, approvedPhase1, index);
                                        return renderSection(section, status, index, 1);
                                    })
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="assets-content"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {funnelApproved ? (
                                    isPhase2Complete ? (
                                        <div className="grid gap-3">
                                            {PHASE_2_SECTIONS.map((section) => renderCompletedSection(section, 2))}
                                        </div>
                                    ) : (
                                        PHASE_2_SECTIONS.map((section, index) => {
                                            const status = getSectionStatus(section.id, 2, approvedPhase2, index);
                                            return renderSection(section, status, index, 2);
                                        })
                                    )
                                ) : (
                                    <div className="text-center py-16 bg-[#131314] rounded-3xl border border-dashed border-[#2a2a2d]">
                                        <Lock className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                                        <h2 className="text-2xl font-bold mb-3">Marketing Assets Locked</h2>
                                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                                            Finish your Business DNA and deploy your first funnel to unlock these professional marketing assets.
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
            </div>
        </div>
    );
}
