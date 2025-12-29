"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload, Video, Mail, MessageSquare, FileText, StickyNote,
    Trash2, CheckCircle, Loader2, AlertCircle, Sparkles,
    ChevronDown, ChevronUp, X, Mic
} from "lucide-react";
import { toast } from "sonner";

/**
 * VoiceUploadWidget
 * 
 * Component for uploading user content to build their TheirDNA™ voice model.
 * Allows uploading 5 of each: videos, emails, posts, copy, notes
 */

const CONTENT_TYPES = [
    {
        key: 'video',
        label: 'Video Transcripts',
        icon: Video,
        color: 'red',
        placeholder: 'Paste your video transcript here...',
        description: 'Transcripts from your videos, podcasts, or presentations'
    },
    {
        key: 'email',
        label: 'Emails',
        icon: Mail,
        color: 'blue',
        placeholder: 'Paste an email you\'ve written...',
        description: 'Marketing emails, newsletters, or client emails'
    },
    {
        key: 'post',
        label: 'Social Posts',
        icon: MessageSquare,
        color: 'cyan',
        placeholder: 'Paste your social media post...',
        description: 'LinkedIn, Facebook, Instagram, or Twitter posts'
    },
    {
        key: 'copy',
        label: 'Sales Copy',
        icon: FileText,
        color: 'green',
        placeholder: 'Paste your sales copy here...',
        description: 'Landing pages, ads, or promotional content'
    },
    {
        key: 'note',
        label: 'Notes / Writing',
        icon: StickyNote,
        color: 'yellow',
        placeholder: 'Paste any other writing samples...',
        description: 'Blog posts, articles, or any other written content'
    }
];

export default function VoiceUploadWidget({ onProfileComplete }) {
    const [content, setContent] = useState([]);
    const [counts, setCounts] = useState({});
    const [voiceProfile, setVoiceProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Upload form state
    const [expandedType, setExpandedType] = useState(null);
    const [uploadText, setUploadText] = useState('');
    const [uploadTitle, setUploadTitle] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Load existing content on mount
    useEffect(() => {
        fetchContent();
        fetchProfile();
    }, []);

    const fetchContent = async () => {
        try {
            const res = await fetch('/api/voice-model/upload');
            const data = await res.json();
            setContent(data.content || []);
            setCounts(data.counts || {});
        } catch (error) {
            console.error('Failed to fetch content:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/voice-model/analyze');
            const data = await res.json();
            setVoiceProfile(data.profile);
            if (data.isReady && onProfileComplete) {
                onProfileComplete(data.profile);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const handleUpload = async (contentType) => {
        if (!uploadText.trim() || uploadText.length < 50) {
            toast.error('Please enter at least 50 characters');
            return;
        }

        setIsUploading(true);
        try {
            const res = await fetch('/api/voice-model/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType,
                    title: uploadTitle.trim() || undefined,
                    rawContent: uploadText.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            toast.success(`${contentType} uploaded!`);
            setUploadText('');
            setUploadTitle('');
            setExpandedType(null);
            fetchContent();

        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`/api/voice-model/upload?id=${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                throw new Error('Delete failed');
            }

            toast.success('Content deleted');
            fetchContent();

        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleAnalyze = async () => {
        if (counts.total < 3) {
            toast.error('Please upload at least 3 content samples first');
            return;
        }

        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/voice-model/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analyzeAll: true })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            toast.success(`✨ Analyzed ${data.analyzed} samples! Your voice model is ready.`);
            fetchProfile();
            fetchContent();

        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getTypeContent = (type) => content.filter(c => c.content_type === type);
    const getTypeCount = (type) => counts[type] || 0;

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-cyan" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Voice Profile Status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                        <Mic className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">TheirDNA™ Voice Model</h3>
                        <p className="text-xs text-gray-500">
                            {counts.total > 0
                                ? `${counts.total} samples uploaded`
                                : 'Upload your content to train your voice'
                            }
                        </p>
                    </div>
                </div>

                {counts.total >= 3 && (
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110
                                   text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all
                                   disabled:opacity-50 shadow-lg shadow-purple-500/20"
                    >
                        {isAnalyzing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Voice'}
                    </button>
                )}
            </div>

            {/* Voice Profile Display */}
            {voiceProfile?.voice_summary && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 
                               border border-purple-500/20"
                >
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-purple-300">Your Voice Profile</p>
                            <p className="text-sm text-gray-300 mt-1">{voiceProfile.voice_summary}</p>
                            {voiceProfile.style_attributes?.tone && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {voiceProfile.style_attributes.tone.map((t, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 
                                                                  text-xs rounded-full">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Content Type Cards */}
            <div className="space-y-3">
                {CONTENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const typeContent = getTypeContent(type.key);
                    const count = getTypeCount(type.key);
                    const isExpanded = expandedType === type.key;

                    return (
                        <div
                            key={type.key}
                            className={`border rounded-xl overflow-hidden transition-all
                                ${isExpanded
                                    ? 'border-cyan/50 bg-cyan/5'
                                    : 'border-[#2a2a2d] bg-[#1b1b1d]/50'
                                }`}
                        >
                            {/* Type Header */}
                            <button
                                onClick={() => setExpandedType(isExpanded ? null : type.key)}
                                className="w-full p-4 flex items-center justify-between hover:bg-[#2a2a2d]/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-${type.color}-500/10`}>
                                        <Icon className={`w-4 h-4 text-${type.color}-400`} />
                                    </div>
                                    <div className="text-left">
                                        <span className="font-medium text-white text-sm">{type.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{count}/5 uploaded</span>
                                            {count >= 5 && (
                                                <CheckCircle className="w-3 h-3 text-green-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 pt-0 space-y-4 border-t border-[#2a2a2d]/50">
                                            {/* Existing items */}
                                            {typeContent.length > 0 && (
                                                <div className="space-y-2">
                                                    {typeContent.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center justify-between p-3 
                                                                       bg-[#0e0e0f] rounded-lg border border-[#2a2a2d]"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                {item.status === 'processed' ? (
                                                                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                                                ) : item.status === 'error' ? (
                                                                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                                                ) : (
                                                                    <Loader2 className="w-4 h-4 text-yellow-400 animate-spin flex-shrink-0" />
                                                                )}
                                                                <div className="truncate">
                                                                    <p className="text-sm text-white truncate">
                                                                        {item.title}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {item.word_count} words
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="p-1.5 hover:bg-red-500/20 rounded-lg 
                                                                           text-gray-500 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Upload form */}
                                            {count < 5 && (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={uploadTitle}
                                                        onChange={(e) => setUploadTitle(e.target.value)}
                                                        placeholder="Title (optional)"
                                                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg 
                                                                   p-3 text-white text-sm placeholder-gray-600
                                                                   focus:ring-2 focus:ring-cyan/50 focus:border-cyan outline-none"
                                                    />
                                                    <textarea
                                                        value={uploadText}
                                                        onChange={(e) => setUploadText(e.target.value)}
                                                        placeholder={type.placeholder}
                                                        rows={5}
                                                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg 
                                                                   p-3 text-white text-sm placeholder-gray-600 resize-none
                                                                   focus:ring-2 focus:ring-cyan/50 focus:border-cyan outline-none"
                                                    />
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs text-gray-500">
                                                            {uploadText.length < 50
                                                                ? `${50 - uploadText.length} more characters needed`
                                                                : `${uploadText.split(/\s+/).length} words`
                                                            }
                                                        </p>
                                                        <button
                                                            onClick={() => handleUpload(type.key)}
                                                            disabled={isUploading || uploadText.length < 50}
                                                            className="px-4 py-2 bg-cyan hover:bg-cyan/80 text-black 
                                                                       rounded-lg text-sm font-bold flex items-center gap-2
                                                                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                        >
                                                            {isUploading ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Upload className="w-4 h-4" />
                                                            )}
                                                            Upload
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {count >= 5 && (
                                                <p className="text-sm text-gray-500 text-center py-2">
                                                    ✓ Maximum {type.label.toLowerCase()} uploaded
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Progress Footer */}
            <div className="p-4 bg-[#1b1b1d] rounded-xl border border-[#2a2a2d]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Voice Model Progress</span>
                    <span className="text-sm font-bold text-white">{counts.total || 0}/25</span>
                </div>
                <div className="h-2 bg-[#2a2a2d] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((counts.total || 0) / 25) * 100}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {counts.total < 3
                        ? 'Upload at least 3 samples to analyze your voice'
                        : voiceProfile?.voice_summary
                            ? '✓ Voice model ready! Your content will match your style.'
                            : 'Click "Analyze Voice" to build your voice model'
                    }
                </p>
            </div>
        </div>
    );
}
