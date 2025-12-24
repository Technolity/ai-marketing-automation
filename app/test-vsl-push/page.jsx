"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Rocket, Loader2, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

/**
 * VSL Funnel Push Test Page
 * Simplified workflow for testing GHL integration with all 88 custom values
 */
export default function TestVSLPushPage() {
    const router = useRouter();
    const { session: authSession, loading: authLoading } = useAuth();

    const [sessionId, setSessionId] = useState(null);
    const [locationId, setLocationId] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [pushResult, setPushResult] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    
    // Image uploads
    const [uploadedImages, setUploadedImages] = useState({
        logo: '',
        bio_author: '',
        product_mockup: '',
        results_image: ''
    });
    
    // Video URLs
    const [videoUrls, setVideoUrls] = useState({
        main_vsl: '',
        testimonial_video: '',
        thankyou_video: ''
    });
    
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    // Load session ID from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedSessionId = localStorage.getItem('ted_current_session_id');
            if (storedSessionId) {
                setSessionId(storedSessionId);
            }
        }
    }, []);

    // Auth check
    useEffect(() => {
        if (authLoading) return;
        if (!authSession) {
            router.push('/auth/login');
        }
    }, [authSession, authLoading, router]);

    const handleImageUpload = (imageType, url) => {
        setUploadedImages(prev => ({ ...prev, [imageType]: url }));
        toast.success(`${imageType.replace('_', ' ')} image added!`);
    };

    const handleVideoUrlChange = (videoType, url) => {
        setVideoUrls(prev => ({ ...prev, [videoType]: url }));
    };

    const handlePush = async () => {
        if (!sessionId) {
            toast.error('No session found. Please complete the intake form first.');
            return;
        }

        if (!locationId || !apiKey) {
            toast.error('Please enter both Location ID and API Key');
            return;
        }

        setIsPushing(true);
        setPushResult(null);

        try {
            console.log('[TestVSL] Starting push with:', { 
                sessionId, 
                locationId,
                uploadedImages: Object.keys(uploadedImages).filter(k => uploadedImages[k]),
                videoUrls: Object.keys(videoUrls).filter(k => videoUrls[k])
            });

            const res = await fetchWithAuth('/api/ghl/push-vsl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    locationId,
                    accessToken: apiKey,
                    uploadedImages: uploadedImages,
                    videoUrls: videoUrls
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setPushResult(data);
                toast.success(`Successfully pushed ${data.summary.total} custom values to GHL!`);
            } else {
                toast.error(data.error || 'Push failed');
                setPushResult({ error: data.error, details: data });
            }
        } catch (error) {
            console.error('[TestVSL] Push error:', error);
            toast.error('Failed to push to GHL');
            setPushResult({ error: error.message });
        } finally {
            setIsPushing(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    // Group custom values by page/category
    const groupCustomValuesByCategory = (details) => {
        const categories = {
            'Optin Page': [],
            'VSL Page - Hero': [],
            'VSL Page - Process': [],
            'VSL Page - FAQ': [],
            'VSL Page - Bio': [],
            'VSL Page - CTA': [],
            'VSL Page - Testimonials': [],
            'Questionnaire Page': [],
            'Thank You Page': [],
            'Booking Page': [],
            'Footer': [],
            'Company Info': [],
            'Other': []
        };

        const allItems = [
            ...(details.created || []),
            ...(details.updated || [])
        ];

        allItems.forEach(item => {
            const key = item.key.toLowerCase();
            
            if (key.includes('optin')) {
                categories['Optin Page'].push(item);
            } else if (key.includes('vsl_hero')) {
                categories['VSL Page - Hero'].push(item);
            } else if (key.includes('vsl_process')) {
                categories['VSL Page - Process'].push(item);
            } else if (key.includes('vsl_faq')) {
                categories['VSL Page - FAQ'].push(item);
            } else if (key.includes('vsl_bio')) {
                categories['VSL Page - Bio'].push(item);
            } else if (key.includes('vsl_cta')) {
                categories['VSL Page - CTA'].push(item);
            } else if (key.includes('vsl_testimonial')) {
                categories['VSL Page - Testimonials'].push(item);
            } else if (key.includes('questionnaire')) {
                categories['Questionnaire Page'].push(item);
            } else if (key.includes('thankyou')) {
                categories['Thank You Page'].push(item);
            } else if (key.includes('booking')) {
                categories['Booking Page'].push(item);
            } else if (key.includes('footer')) {
                categories['Footer'].push(item);
            } else if (key.includes('company')) {
                categories['Company Info'].push(item);
            } else {
                categories['Other'].push(item);
            }
        });

        // Remove empty categories
        return Object.entries(categories).filter(([_, items]) => items.length > 0);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/business-core')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Business Core
                    </button>
                    
                    <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-cyan via-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Test VSL Funnel Push
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Push all 88 custom values to your GoHighLevel VSL funnel template
                    </p>
                </div>

                {/* Session Info */}
                {sessionId && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-green-400 font-semibold">Session Found</p>
                                <p className="text-xs text-gray-400 font-mono">{sessionId}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!sessionId && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            <div>
                                <p className="text-yellow-400 font-semibold">No Session Found</p>
                                <p className="text-xs text-gray-400">Please complete the intake form first.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Credentials Form */}
                <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl p-8 mb-6">
                    <h2 className="text-2xl font-bold mb-6">GoHighLevel Credentials</h2>
                    
                    <div className="space-y-4">
                        {/* Location ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Location ID
                            </label>
                            <input
                                type="text"
                                value={locationId}
                                onChange={(e) => setLocationId(e.target.value)}
                                placeholder="Enter your GHL Location ID"
                                className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white focus:outline-none focus:border-cyan transition-colors"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Found in Settings → Business Profile → Location ID
                            </p>
                        </div>

                        {/* API Key */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                API Key (Access Token)
                            </label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your GHL API Key"
                                    className="w-full px-4 py-3 pr-12 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-white focus:outline-none focus:border-cyan transition-colors"
                                />
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Found in Settings → Integrations → API Key
                            </p>
                        </div>
                    </div>

                    {/* Advanced Options Toggle */}
                    <button
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        className="w-full mt-6 px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg text-gray-400 hover:text-white hover:border-cyan/30 transition-colors flex items-center justify-between"
                    >
                        <span className="text-sm font-medium">
                            {showAdvancedOptions ? '▼' : '▶'} Advanced: Upload Images & Add Videos (Optional)
                        </span>
                        <span className="text-xs text-gray-500">
                            {Object.values(uploadedImages).filter(Boolean).length} images, {Object.values(videoUrls).filter(Boolean).length} videos
                        </span>
                    </button>

                    {/* Advanced Options */}
                    {showAdvancedOptions && (
                        <div className="mt-4 space-y-6 p-6 bg-[#0e0e0f] border border-cyan/20 rounded-xl">
                            {/* Image Uploads */}
                            <div>
                                <h3 className="text-lg font-bold mb-4 text-cyan">Upload Your Own Images</h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    Upload image URLs (or leave empty for AI generation)
                                </p>
                                
                                <div className="space-y-3">
                                    {/* Logo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Logo Image
                                        </label>
                                        <input
                                            type="url"
                                            value={uploadedImages.logo}
                                            onChange={(e) => handleImageUpload('logo', e.target.value)}
                                            placeholder="https://yourdomain.com/logo.png"
                                            className="w-full px-4 py-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-white text-sm focus:outline-none focus:border-cyan transition-colors"
                                        />
                                    </div>

                                    {/* Bio/Author Photo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Bio / Author Photo
                                        </label>
                                        <input
                                            type="url"
                                            value={uploadedImages.bio_author}
                                            onChange={(e) => handleImageUpload('bio_author', e.target.value)}
                                            placeholder="https://yourdomain.com/author.jpg"
                                            className="w-full px-4 py-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-white text-sm focus:outline-none focus:border-cyan transition-colors"
                                        />
                                    </div>

                                    {/* Product Mockup */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Product Mockup
                                        </label>
                                        <input
                                            type="url"
                                            value={uploadedImages.product_mockup}
                                            onChange={(e) => handleImageUpload('product_mockup', e.target.value)}
                                            placeholder="https://yourdomain.com/product.png"
                                            className="w-full px-4 py-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-white text-sm focus:outline-none focus:border-cyan transition-colors"
                                        />
                                    </div>

                                    {/* Results Image */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Results / Proof Image
                                        </label>
                                        <input
                                            type="url"
                                            value={uploadedImages.results_image}
                                            onChange={(e) => handleImageUpload('results_image', e.target.value)}
                                            placeholder="https://yourdomain.com/results.png"
                                            className="w-full px-4 py-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-white text-sm focus:outline-none focus:border-cyan transition-colors"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-3">
                                    💡 Tip: AI will only generate images you don't upload
                                </p>
                            </div>

                            {/* Video URLs */}
                            <div className="pt-6 border-t border-[#2a2a2d]">
                                <h3 className="text-lg font-bold mb-4 text-cyan">Add Video URLs</h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    Supports: YouTube, Vimeo, Wistia, Loom, or any embeddable video
                                </p>
                                
                                <div className="space-y-3">
                                    {/* Main VSL Video */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Main VSL Video (Required for VSL funnel)
                                        </label>
                                        <input
                                            type="url"
                                            value={videoUrls.main_vsl}
                                            onChange={(e) => handleVideoUrlChange('main_vsl', e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=... or Wistia embed URL"
                                            className="w-full px-4 py-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-white text-sm focus:outline-none focus:border-cyan transition-colors"
                                        />
                                    </div>

                                    {/* Testimonial Video */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Testimonial Video (Optional)
                                        </label>
                                        <input
                                            type="url"
                                            value={videoUrls.testimonial_video}
                                            onChange={(e) => handleVideoUrlChange('testimonial_video', e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="w-full px-4 py-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-white text-sm focus:outline-none focus:border-cyan transition-colors"
                                        />
                                    </div>

                                    {/* Thank You Video */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Thank You Page Video (Optional)
                                        </label>
                                        <input
                                            type="url"
                                            value={videoUrls.thankyou_video}
                                            onChange={(e) => handleVideoUrlChange('thankyou_video', e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="w-full px-4 py-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-white text-sm focus:outline-none focus:border-cyan transition-colors"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-3">
                                    💡 Tip: GHL will auto-embed YouTube, Vimeo, and Wistia videos
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Push Button */}
                    <button
                        onClick={handlePush}
                        disabled={!sessionId || !locationId || !apiKey || isPushing}
                        className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/90 hover:to-blue-500/90 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-cyan/20 transition-all"
                    >
                        {isPushing ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Pushing to GHL...
                            </>
                        ) : (
                            <>
                                <Rocket className="w-6 h-6" />
                                Push 88 Custom Values to GHL
                            </>
                        )}
                    </button>
                </div>

                {/* Results */}
                {pushResult && (
                    <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Push Results</h2>

                        {/* Summary */}
                        {pushResult.success && (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                        <div className="text-3xl font-black text-green-400">{pushResult.summary.total}</div>
                                        <div className="text-sm text-gray-400">Total Values</div>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                        <div className="text-3xl font-black text-blue-400">{pushResult.summary.created}</div>
                                        <div className="text-sm text-gray-400">Created</div>
                                    </div>
                                    <div className="bg-cyan/10 border border-cyan/30 rounded-lg p-4">
                                        <div className="text-3xl font-black text-cyan">{pushResult.summary.updated}</div>
                                        <div className="text-sm text-gray-400">Updated</div>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                        <div className="text-3xl font-black text-red-400">{pushResult.summary.failed}</div>
                                        <div className="text-sm text-gray-400">Failed</div>
                                    </div>
                                </div>

                                {/* Validation Info */}
                                {pushResult.validation && (
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <h3 className="text-lg font-bold text-green-400">Validation Passed</h3>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-gray-400">✓ Content validation: {pushResult.validation.contentValid ? 'Pass' : 'Fail'}</p>
                                            <p className="text-gray-400">✓ Field mapping: {pushResult.validation.fieldsValid ? 'Pass' : 'Fail'}</p>
                                            <p className="text-gray-400">✓ Images: {pushResult.validation.imagesValid ? 'Pass' : 'Fail'}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Detailed Mapping by Category */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold">Custom Values by Page</h3>
                                    
                                    {groupCustomValuesByCategory(pushResult.details).map(([category, items]) => (
                                        <div key={category} className="border border-[#2a2a2d] rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleSection(category)}
                                                className="w-full px-6 py-4 bg-[#0e0e0f] hover:bg-[#1a1a1c] flex items-center justify-between transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                    <span className="font-bold">{category}</span>
                                                    <span className="text-sm text-gray-500">({items.length} values)</span>
                                                </div>
                                                <span className={`transform transition-transform ${expandedSections[category] ? 'rotate-180' : ''}`}>
                                                    ▼
                                                </span>
                                            </button>
                                            
                                            {expandedSections[category] && (
                                                <div className="px-6 py-4 space-y-3">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-4">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-cyan font-mono text-sm">{item.key}</span>
                                                                        <button
                                                                            onClick={() => copyToClipboard(item.key)}
                                                                            className="text-gray-500 hover:text-cyan transition-colors"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="text-sm text-gray-400 break-words">
                                                                        {String(item.value).length > 200 
                                                                            ? String(item.value).substring(0, 200) + '...'
                                                                            : String(item.value)
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Failed Items */}
                                {pushResult.details.failed && pushResult.details.failed.length > 0 && (
                                    <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                                        <h3 className="text-lg font-bold text-red-400 mb-4">Failed Items ({pushResult.details.failed.length})</h3>
                                        <div className="space-y-2">
                                            {pushResult.details.failed.map((item, idx) => (
                                                <div key={idx} className="text-sm">
                                                    <span className="text-red-300 font-mono">{item.key}:</span>
                                                    <span className="text-gray-400 ml-2">{item.error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Error Display */}
                        {pushResult.error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <h3 className="text-lg font-bold text-red-400">Push Failed</h3>
                                </div>
                                <p className="text-gray-400">{pushResult.error}</p>
                                {pushResult.details && (
                                    <pre className="mt-4 text-xs bg-black/50 p-4 rounded overflow-auto max-h-64">
                                        {JSON.stringify(pushResult.details, null, 2)}
                                    </pre>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

