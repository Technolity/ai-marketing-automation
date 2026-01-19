'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    Palette, Image as ImageIcon, Video, ArrowLeft, RefreshCw,
    CheckCircle, ExternalLink, Loader2, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import PushToGHLButton from '@/components/vault/PushToGHLButton';

export default function DeployedAssetsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { session, loading: authLoading } = useAuth();

    const funnelId = searchParams.get('funnel_id');

    const [isLoading, setIsLoading] = useState(true);
    const [colors, setColors] = useState({});
    const [media, setMedia] = useState({});
    const [pushLogs, setPushLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('colors');

    useEffect(() => {
        if (!authLoading && session && funnelId) {
            loadDeployedAssets();
        }
    }, [authLoading, session, funnelId]);

    const loadDeployedAssets = async () => {
        setIsLoading(true);
        try {
            // Load colors from user profile
            const profileRes = await fetchWithAuth('/api/os/user-profile');
            const profileData = await profileRes.json();

            if (profileData.brandColors) {
                setColors(profileData.brandColors);
            }

            // Load media from vault
            const mediaRes = await fetchWithAuth(`/api/os/vault-fields?funnel_id=${funnelId}&section_id=media`);
            const mediaData = await mediaRes.json();

            if (mediaData.fields) {
                const mediaObj = {};
                mediaData.fields.forEach(f => {
                    mediaObj[f.field_id] = f.field_value;
                });
                setMedia(mediaObj);
            }

            // Load push logs
            const logsRes = await fetchWithAuth(`/api/ghl/push-logs?funnel_id=${funnelId}`);
            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setPushLogs(logsData.logs || []);
            }

        } catch (error) {
            console.error('[DeployedAssets] Load error:', error);
            toast.error('Failed to load deployed assets');
        } finally {
            setIsLoading(false);
        }
    };

    const handleColorChange = (key, value) => {
        setColors(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveColors = async () => {
        try {
            const response = await fetchWithAuth('/api/os/user-profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandColors: colors }),
            });

            if (response.ok) {
                toast.success('Colors saved!');
            } else {
                toast.error('Failed to save colors');
            }
        } catch (error) {
            toast.error('Save failed');
        }
    };

    if (!funnelId) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">No funnel selected</p>
                    <button
                        onClick={() => router.push('/vault')}
                        className="px-4 py-2 bg-cyan text-black rounded-lg"
                    >
                        Go to Vault
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white">
            {/* Header */}
            <div className="border-b border-[#2a2a2d] bg-[#0f0f11]">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push(`/vault?funnel_id=${funnelId}`)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold">Deployed Assets</h1>
                                <p className="text-sm text-gray-400">View and manage your GHL custom values</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={loadDeployedAssets}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-4 py-2 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-lg font-medium text-white transition-all"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-6">
                        {[
                            { id: 'colors', label: 'Colors', icon: Palette },
                            { id: 'media', label: 'Media', icon: ImageIcon },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.id
                                        ? 'bg-cyan text-black'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }
                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan" />
                    </div>
                ) : (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'colors' && (
                            <ColorsSection
                                colors={colors}
                                onChange={handleColorChange}
                                onSave={handleSaveColors}
                                funnelId={funnelId}
                            />
                        )}
                        {activeTab === 'media' && (
                            <MediaSection
                                media={media}
                                funnelId={funnelId}
                            />
                        )}
                    </motion.div>
                )}

                {/* Push Logs */}
                {pushLogs.length > 0 && (
                    <div className="mt-12">
                        <h3 className="text-lg font-bold mb-4">Recent Push History</h3>
                        <div className="bg-[#1b1b1d] rounded-xl border border-[#2a2a2d] overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-[#2a2a2d]">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm text-gray-400">Section</th>
                                        <th className="text-left px-4 py-3 text-sm text-gray-400">Values</th>
                                        <th className="text-left px-4 py-3 text-sm text-gray-400">Status</th>
                                        <th className="text-left px-4 py-3 text-sm text-gray-400">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pushLogs.slice(0, 5).map((log, i) => (
                                        <tr key={i} className="border-t border-[#2a2a2d]">
                                            <td className="px-4 py-3 capitalize">{log.section}</td>
                                            <td className="px-4 py-3">{log.values_pushed}</td>
                                            <td className="px-4 py-3">
                                                {log.success ? (
                                                    <span className="text-emerald-400 flex items-center gap-1">
                                                        <CheckCircle className="w-4 h-4" /> Success
                                                    </span>
                                                ) : (
                                                    <span className="text-red-400">Failed</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Colors Section Component
function ColorsSection({ colors, onChange, onSave, funnelId }) {
    const colorFields = [
        { key: 'primary', label: 'Primary Color' },
        { key: 'secondary', label: 'Secondary Color' },
        { key: 'accent', label: 'Accent Color' },
        { key: 'text', label: 'Text Color' },
        { key: 'background', label: 'Background Color' },
        { key: 'cta', label: 'CTA Button Color' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Palette className="w-5 h-5 text-cyan" />
                    Brand Colors
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save
                    </button>
                    <PushToGHLButton
                        section="colors"
                        funnelId={funnelId}
                        isApproved={true}
                        isVaultComplete={true}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {colorFields.map(({ key, label }) => (
                    <div
                        key={key}
                        className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl p-4"
                    >
                        <label className="block text-sm text-gray-400 mb-2">{label}</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={colors[key] || '#000000'}
                                onChange={(e) => onChange(key, e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                            />
                            <input
                                type="text"
                                value={colors[key] || ''}
                                onChange={(e) => onChange(key, e.target.value)}
                                placeholder="#000000"
                                className="flex-1 px-3 py-2 bg-[#2a2a2d] rounded-lg text-white text-sm"
                            />
                        </div>
                        {/* Preview on white */}
                        <div className="mt-3 p-3 bg-white rounded-lg">
                            <span style={{ color: colors[key] || '#000000' }}>
                                Sample text preview
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Media Section Component  
function MediaSection({ media, funnelId }) {
    const mediaFields = [
        { key: 'logo', label: 'Logo', type: 'image' },
        { key: 'profile_photo', label: 'Profile Photo', type: 'image' },
        { key: 'banner_image', label: 'Banner Image', type: 'image' },
        { key: 'vsl_video', label: 'VSL Video', type: 'video' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-cyan" />
                    Media Assets
                </h2>
                <PushToGHLButton
                    section="media"
                    funnelId={funnelId}
                    isApproved={true}
                    isVaultComplete={true}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mediaFields.map(({ key, label, type }) => (
                    <div
                        key={key}
                        className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl p-4"
                    >
                        <label className="block text-sm text-gray-400 mb-3">{label}</label>
                        {media[key] ? (
                            <div className="relative">
                                {type === 'image' ? (
                                    <img
                                        src={media[key]}
                                        alt={label}
                                        className="w-full h-40 object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="w-full h-40 bg-[#2a2a2d] rounded-lg flex items-center justify-center">
                                        <Video className="w-12 h-12 text-gray-500" />
                                        <a
                                            href={media[key]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute bottom-2 right-2 p-2 bg-black/50 rounded-lg"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                )}
                                <a
                                    href={media[key]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 text-xs text-cyan hover:underline block truncate"
                                >
                                    {media[key]}
                                </a>
                            </div>
                        ) : (
                            <div className="w-full h-40 bg-[#2a2a2d] rounded-lg flex items-center justify-center">
                                <p className="text-gray-500">No {label.toLowerCase()} uploaded</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
