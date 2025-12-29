"use client";
/**
 * Funnel Recommendation Screen
 * 
 * - VSL Funnel: Active and deployable
 * - All other funnels: Locked (under maintenance)
 * 
 * After selecting VSL, user can deploy to GHL directly.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Rocket, ChevronDown, CheckCircle, Loader2, Sparkles,
    BookOpen, Video, Mail, Gift, Megaphone, Layout, Star,
    ArrowRight, ArrowLeft, Lock, AlertTriangle, Wrench,
    Upload, X, Eye, EyeOff, Copy, Check
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import GHLCredentialsForm from "@/components/GHLCredentialsForm";
import GHLPushProgress from "@/components/GHLPushProgress";

// Available funnel types - VSL is the only active one
const FUNNEL_TYPES = [
    {
        id: 'vsl',
        title: 'VSL Funnel',
        icon: Video,
        description: 'Video sales letter to convert viewers into buyers',
        bestFor: ['courses', 'high-ticket', 'digital products'],
        features: ['VSL Page', 'Order Form', 'Upsell Pages', 'Email Follow-up'],
        locked: false
    },
    {
        id: 'free-book',
        title: 'Free Book Funnel',
        icon: BookOpen,
        description: 'Offer a free book or guide to capture leads',
        bestFor: ['coaches', 'consultants', 'authors'],
        features: ['Landing Page', 'Opt-in Form', 'Thank You Page', 'Email Sequence'],
        locked: true,
        lockReason: 'Under maintenance'
    },
    {
        id: 'webinar',
        title: 'Webinar Funnel',
        icon: Megaphone,
        description: 'Live or automated webinar to sell programs',
        bestFor: ['coaches', 'agencies', 'high-ticket services'],
        features: ['Registration Page', 'Thank You Page', 'Webinar Room', 'Offer Page'],
        locked: true,
        lockReason: 'Coming soon'
    },
    {
        id: 'lead-magnet',
        title: 'Lead Magnet Funnel',
        icon: Gift,
        description: 'Free resource to build your email list fast',
        bestFor: ['any business', 'list building'],
        features: ['Squeeze Page', 'Thank You Page', 'Email Nurture'],
        locked: true,
        lockReason: 'Under maintenance'
    },
    {
        id: 'application',
        title: 'Application Funnel',
        icon: Layout,
        description: 'Qualify leads before booking discovery calls',
        bestFor: ['agencies', 'high-ticket coaching'],
        features: ['Sales Page', 'Application Form', 'Calendar Booking'],
        locked: true,
        lockReason: 'Coming soon'
    }
];

export default function FunnelRecommendationPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [businessData, setBusinessData] = useState(null);
    const [selectedFunnel, setSelectedFunnel] = useState(null);
    const [showAlternatives, setShowAlternatives] = useState(false);

    // GHL Deployment States
    const [deployStep, setDeployStep] = useState('select'); // select, credentials, deploying, complete
    const [credentials, setCredentials] = useState(null);
    const [isPushing, setIsPushing] = useState(false);
    const [pushOperationId, setPushOperationId] = useState(null);
    const [sessionId, setSessionId] = useState(null);

    // Asset States
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState({});
    const [uploadedImages, setUploadedImages] = useState({
        logo: '',
        bio_author: '',
        product_mockup: '',
        results_image: ''
    });
    const [videoUrls, setVideoUrls] = useState({
        main_vsl: '',
        testimonial_video: '',
        thankyou_video: ''
    });

    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadData = async () => {
            try {
                const res = await fetchWithAuth('/api/os/results');
                const data = await res.json();

                if (data.data) {
                    setBusinessData(data.data);
                    // Default to VSL since it's the only active funnel
                    setSelectedFunnel(FUNNEL_TYPES.find(f => f.id === 'vsl'));

                    // Set session ID from source if available, otherwise fallback
                    if (data.source?.id) {
                        setSessionId(data.source.id);
                    } else {
                        const stored = localStorage.getItem('ted_current_session_id');
                        if (stored) setSessionId(stored);
                    }
                }
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [session, authLoading, router]);

    const handleSelectFunnel = (funnel) => {
        if (funnel.locked) {
            toast.error(`${funnel.title} is ${funnel.lockReason}`);
            return;
        }
        setSelectedFunnel(funnel);
    };

    const handleProceedToDeploy = () => {
        if (!selectedFunnel || selectedFunnel.locked) {
            toast.error("Please select an available funnel");
            return;
        }
        setDeployStep('credentials');
    };

    const handleCredentialsSaved = (creds) => {
        setCredentials(creds);
        toast.success("Credentials saved!");
    };

    const handleDeployToGHL = async () => {
        if (!credentials?.location_id) {
            toast.error("Please enter your GHL credentials first");
            return;
        }

        // Get access token
        const accessToken = prompt('Enter your GHL Access Token to deploy:');
        if (!accessToken) {
            toast.error('Access token required');
            return;
        }

        setIsPushing(true);
        setDeployStep('deploying');

        try {
            // Use the VSL push logic
            const res = await fetchWithAuth('/api/ghl/push-vsl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId,
                    locationId: credentials.location_id,
                    accessToken: accessToken,
                    funnelType: selectedFunnel.id,
                    uploadedImages: uploadedImages,
                    videoUrls: videoUrls
                })
            });

            const data = await res.json();

            if (data.success) {
                setPushOperationId(data.operationId);
                toast.success("Deploying your funnel...");
            } else {
                throw new Error(data.error || 'Deployment failed');
            }
        } catch (error) {
            console.error("Deploy error:", error);
            toast.error(error.message || "Failed to deploy");
            setIsPushing(false);
            setDeployStep('credentials');
        }
    };

    // Asset Handlers
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

    const handleClearFile = (fileType, isVideo = false) => {
        if (isVideo) setVideoUrls(prev => ({ ...prev, [fileType]: '' }));
        else setUploadedImages(prev => ({ ...prev, [fileType]: '' }));
    };

    const FileUploadInput = ({ label, fileType, currentValue, isVideo = false, accept }) => {
        const isUploading = uploadingFiles[fileType];
        const hasFile = Boolean(currentValue);

        return (
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
                {!hasFile ? (
                    <div className="space-y-2">
                        <label className="relative block group">
                            <input
                                type="file"
                                accept={accept}
                                onChange={(e) => handleFileUpload(fileType, e.target.files?.[0], isVideo)}
                                className="hidden"
                                disabled={isUploading}
                            />
                            <div className={`w-full px-4 py-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${isUploading ? 'border-cyan/50 bg-cyan/5' : 'border-[#2a2a2d] hover:border-cyan/50 hover:bg-[#1b1b1d]'
                                }`}>
                                {isUploading ? (
                                    <div className="flex items-center justify-center gap-2 text-cyan">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm font-medium">Uploading...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-gray-300">
                                        <Upload className="w-5 h-5" />
                                        <span className="text-sm font-medium">Upload {isVideo ? 'video' : 'image'}</span>
                                    </div>
                                )}
                            </div>
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                value={currentValue}
                                onChange={(e) => isVideo ? setVideoUrls(prev => ({ ...prev, [fileType]: e.target.value })) : setUploadedImages(prev => ({ ...prev, [fileType]: e.target.value }))}
                                placeholder="Or paste public URL"
                                className="w-full px-4 py-2.5 bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl text-white text-sm focus:border-cyan focus:outline-none"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-cyan/5 border border-cyan/30 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-cyan flex-shrink-0" />
                        <span className="text-sm text-gray-300 flex-1 truncate">{currentValue.split('/').pop()}</span>
                        <button onClick={() => handleClearFile(fileType, isVideo)} className="text-gray-500 hover:text-red-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const handlePushComplete = async (operation) => {
        setIsPushing(false);
        setDeployStep('complete');

        // Save funnel approval to vault
        try {
            await fetchWithAuth('/api/os/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'vault',
                    approvals: { funnelApproved: true, funnelType: selectedFunnel.id }
                })
            });

            // Also save to localStorage
            const userId = session?.user?.id;
            if (userId) {
                const saved = localStorage.getItem(`vault_approvals_${userId}`);
                const approvals = saved ? JSON.parse(saved) : {};
                approvals.funnelApproved = true;
                approvals.funnelType = selectedFunnel.id;
                localStorage.setItem(`vault_approvals_${userId}`, JSON.stringify(approvals));
            }
        } catch (e) {
            console.log('Saved funnel approval to localStorage');
        }

        toast.success("🎉 Funnel deployed! Phase 2 unlocked.");

        // Redirect to vault or funnel-live
        const funnelUrl = operation?.funnelUrl || operation?.result?.funnelUrl;
        if (funnelUrl) {
            setTimeout(() => router.push(`/funnel-live?url=${encodeURIComponent(funnelUrl)}`), 2000);
        } else {
            setTimeout(() => router.push('/vault'), 2000);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    // VSL Funnel is always the recommended one
    const vslFunnel = FUNNEL_TYPES.find(f => f.id === 'vsl');
    const otherFunnels = FUNNEL_TYPES.filter(f => f.id !== 'vsl');

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => router.push('/vault')}
                    className="mb-6 p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Vault
                </button>

                {/* Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan/30"
                    >
                        <Rocket className="w-10 h-10 text-white" />
                    </motion.div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 tracking-tighter">
                        {deployStep === 'select' ? 'Choose Your Funnel' :
                            deployStep === 'credentials' ? 'Connect to GHL' :
                                deployStep === 'deploying' ? 'Deploying...' :
                                    'Funnel Deployed!'}
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        {deployStep === 'select' ? 'Select the funnel type that fits your business.' :
                            deployStep === 'credentials' ? 'Enter your GoHighLevel credentials to deploy.' :
                                deployStep === 'deploying' ? 'Pushing your content to GHL...' :
                                    'Your funnel is live! Phase 2 is now unlocked.'}
                    </p>
                </div>

                {/* Step: Select Funnel */}
                {deployStep === 'select' && (
                    <>
                        {/* VSL Funnel - Recommended */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleSelectFunnel(vslFunnel)}
                            className={`p-6 rounded-2xl border-2 mb-6 cursor-pointer transition-all ${selectedFunnel?.id === 'vsl'
                                ? 'bg-cyan/10 border-cyan shadow-xl shadow-cyan/20'
                                : 'bg-[#1b1b1d] border-[#2a2a2d] hover:border-cyan/50'
                                }`}
                        >
                            <div className="flex items-start gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-cyan/20 flex items-center justify-center flex-shrink-0">
                                    <Video className="w-7 h-7 text-cyan" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-bold">{vslFunnel.title}</h2>
                                        <span className="px-3 py-1 bg-cyan/20 text-cyan text-xs font-bold rounded-full flex items-center gap-1">
                                            <Star className="w-3 h-3" /> RECOMMENDED
                                        </span>
                                    </div>
                                    <p className="text-gray-400 mb-4">{vslFunnel.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {vslFunnel.features.map((feature, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-[#2a2a2d] text-gray-300 text-sm rounded-lg flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {selectedFunnel?.id === 'vsl' && (
                                    <CheckCircle className="w-8 h-8 text-cyan flex-shrink-0" />
                                )}
                            </div>
                        </motion.div>

                        {/* Other Funnels - Locked */}
                        <div className="mb-8">
                            <button
                                onClick={() => setShowAlternatives(!showAlternatives)}
                                className="w-full flex items-center justify-center gap-2 py-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <span>See other funnel options</span>
                                <ChevronDown className={`w-5 h-5 transition-transform ${showAlternatives ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showAlternatives && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        {otherFunnels.map((funnel, idx) => {
                                            const Icon = funnel.icon;
                                            return (
                                                <motion.div
                                                    key={funnel.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="p-5 rounded-xl border bg-[#131314] border-[#2a2a2d] opacity-60 cursor-not-allowed"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                                                            <Lock className="w-5 h-5 text-gray-500" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-gray-500">{funnel.title}</h3>
                                                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded flex items-center gap-1">
                                                                    <Wrench className="w-3 h-3" />
                                                                    {funnel.lockReason}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600">{funnel.description}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Deploy Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center"
                        >
                            <button
                                onClick={handleProceedToDeploy}
                                disabled={!selectedFunnel || selectedFunnel.locked}
                                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-2xl shadow-cyan/30 mx-auto disabled:opacity-50"
                            >
                                <Sparkles className="w-6 h-6" />
                                Deploy {selectedFunnel?.title || 'Funnel'}
                                <ArrowRight className="w-6 h-6" />
                            </button>
                            <p className="text-sm text-gray-500 mt-4">
                                This will push all your content to GoHighLevel
                            </p>
                        </motion.div>
                    </>
                )}

                {/* Step: Credentials */}
                {deployStep === 'credentials' && (
                    <div className="space-y-6">
                        <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl p-6">
                            <GHLCredentialsForm
                                onCredentialsSaved={handleCredentialsSaved}
                                onValidationComplete={() => { }}
                                autoValidate={false}
                            />
                        </div>

                        {/* Advanced Options Toggle */}
                        <button
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                            className="w-full px-4 py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl text-gray-400 hover:text-white hover:border-cyan/30 transition-colors flex items-center justify-between"
                        >
                            <span className="text-sm font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan" />
                                {showAdvancedOptions ? 'Hide' : 'Add'} Custom Images & Videos (Optional)
                            </span>
                            <span className="text-xs text-gray-500">
                                {Object.values(uploadedImages).filter(Boolean).length} images, {Object.values(videoUrls).filter(Boolean).length} videos
                            </span>
                        </button>

                        {/* Advanced Options */}
                        <AnimatePresence>
                            {showAdvancedOptions && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 bg-[#131314] border border-cyan/20 rounded-xl space-y-8">
                                        <div>
                                            <h3 className="text-sm font-bold text-cyan uppercase tracking-wider mb-4">📸 Custom Images</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FileUploadInput
                                                    label="Business Logo"
                                                    fileType="logo"
                                                    currentValue={uploadedImages.logo}
                                                    accept="image/*"
                                                />
                                                <FileUploadInput
                                                    label="Bio / Author Photo"
                                                    fileType="bio_author"
                                                    currentValue={uploadedImages.bio_author}
                                                    accept="image/*"
                                                />
                                                <FileUploadInput
                                                    label="Product Mockup"
                                                    fileType="product_mockup"
                                                    currentValue={uploadedImages.product_mockup}
                                                    accept="image/*"
                                                />
                                                <FileUploadInput
                                                    label="Results / Proof"
                                                    fileType="results_image"
                                                    currentValue={uploadedImages.results_image}
                                                    accept="image/*"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-[#2a2a2d]">
                                            <h3 className="text-sm font-bold text-cyan uppercase tracking-wider mb-4">🎬 Custom Videos</h3>
                                            <div className="space-y-4">
                                                <FileUploadInput
                                                    label="Main VSL Video URL"
                                                    fileType="main_vsl"
                                                    currentValue={videoUrls.main_vsl}
                                                    isVideo={true}
                                                    accept="video/*"
                                                />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <FileUploadInput
                                                        label="Testimonial Video"
                                                        fileType="testimonial_video"
                                                        currentValue={videoUrls.testimonial_video}
                                                        isVideo={true}
                                                        accept="video/*"
                                                    />
                                                    <FileUploadInput
                                                        label="Thank You Video"
                                                        fileType="thankyou_video"
                                                        currentValue={videoUrls.thankyou_video}
                                                        isVideo={true}
                                                        accept="video/*"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeployStep('select')}
                                className="px-6 py-3 bg-[#2a2a2d] text-white rounded-xl font-medium hover:bg-[#3a3a3d] transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleDeployToGHL}
                                disabled={!credentials?.location_id || isPushing}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                {isPushing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Deploying...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-5 h-5" />
                                        Deploy Now
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Deploying */}
                {deployStep === 'deploying' && pushOperationId && (
                    <GHLPushProgress
                        operationId={pushOperationId}
                        isActive={true}
                        onComplete={handlePushComplete}
                    />
                )}

                {/* Step: Complete */}
                {deployStep === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-3xl font-black mb-4">Funnel Deployed! 🎉</h2>
                        <p className="text-gray-400 mb-8">Phase 2 is now unlocked in your Vault.</p>
                        <button
                            onClick={() => router.push('/vault')}
                            className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-600 text-white rounded-xl font-bold flex items-center gap-3 mx-auto hover:brightness-110 transition-all"
                        >
                            Return to Vault
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
