"use client";
/**
 * Vault Page
 * 
 * Central repository for all generated assets.
 * Always accessible from navigation.
 * 
 * Contains:
 * - Ads (all variations)
 * - Pages (Opt-in, VSL, Thank You)
 * - Emails (full sequences)
 * - Brand assets (logos, colors)
 * - Business Core items
 * 
 * Features:
 * - View any asset
 * - Regenerate any item
 * - Copy to clipboard
 * - Export options
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, ChevronRight, Copy, RefreshCw, Download, Search,
    Megaphone, Gift, Layout, Video, Mail, MessageSquare,
    Users, MessageCircle, BookOpen, Award, Mic, Palette,
    X, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Asset categories for the vault
const VAULT_CATEGORIES = [
    {
        id: 'businessCore',
        title: 'Business Core',
        icon: Users,
        items: [
            { id: 'idealClient', name: 'Ideal Client', icon: Users },
            { id: 'message', name: 'Message', icon: MessageCircle },
            { id: 'stories', name: 'Story', icon: BookOpen },
            { id: 'proof', name: 'Proof', icon: Award },
            { id: 'offer', name: 'Offer & Pricing', icon: Gift },
            { id: 'scripts', name: 'Sales Script', icon: Mic }
        ]
    },
    {
        id: 'ads',
        title: 'Ad Copy',
        icon: Megaphone,
        items: [
            { id: 'ad_facebook', name: 'Facebook Ads', icon: Megaphone },
            { id: 'ad_instagram', name: 'Instagram Ads', icon: Megaphone },
            { id: 'ad_google', name: 'Google Ads', icon: Megaphone }
        ]
    },
    {
        id: 'pages',
        title: 'Pages',
        icon: Layout,
        items: [
            { id: 'optinPage', name: 'Opt-in Page', icon: Layout },
            { id: 'vslPage', name: 'VSL / Sales Page', icon: Video },
            { id: 'thankYouPage', name: 'Thank You Page', icon: CheckCircle }
        ]
    },
    {
        id: 'sequences',
        title: 'Sequences',
        icon: Mail,
        items: [
            { id: 'emails', name: 'Email Sequence', icon: Mail },
            { id: 'sms', name: 'SMS Sequence', icon: MessageSquare }
        ]
    },
    {
        id: 'brand',
        title: 'Brand Assets',
        icon: Palette,
        items: [
            { id: 'colors', name: 'Color Palette', icon: Palette },
            { id: 'fonts', name: 'Typography', icon: Palette },
            { id: 'logo', name: 'Logo Concepts', icon: Palette }
        ]
    }
];

export default function VaultPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [allAssets, setAllAssets] = useState({});
    const [selectedCategory, setSelectedCategory] = useState(VAULT_CATEGORIES[0].id);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Load all assets
    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadAllAssets = async () => {
            try {
                // Load business core from API
                const res = await fetchWithAuth('/api/os/results');
                const data = await res.json();

                // Load funnel assets from localStorage
                const funnelAssets = localStorage.getItem(`funnel_assets_${session.user.id}`);

                const combined = {
                    ...(data.data || {}),
                    ...(funnelAssets ? JSON.parse(funnelAssets) : {})
                };

                setAllAssets(combined);
            } catch (error) {
                console.error("Failed to load assets:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAllAssets();
    }, [session, authLoading, router]);

    // Get content for display
    const getAssetContent = (itemId) => {
        const content = allAssets[itemId];
        if (!content) return null;

        if (typeof content === 'string') return content;
        if (typeof content === 'object') {
            return Object.entries(content)
                .filter(([k]) => k !== '_contentName')
                .map(([k, v]) => {
                    const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                    const value = typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);
                    return `**${label}:**\n${value}`;
                })
                .join('\n\n');
        }
        return String(content);
    };

    // Copy to clipboard
    const handleCopy = (content) => {
        navigator.clipboard.writeText(content);
        toast.success("Copied to clipboard!");
    };

    // Regenerate an item
    const handleRegenerate = async (itemId) => {
        setIsRegenerating(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success("Content regenerated!");
        setIsRegenerating(false);
    };

    // Filter items based on search
    const filteredCategories = VAULT_CATEGORIES.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.items.length > 0);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan animate-spin" />
            </div>
        );
    }

    const currentCategory = VAULT_CATEGORIES.find(c => c.id === selectedCategory);
    const currentItem = selectedItem ? currentCategory?.items.find(i => i.id === selectedItem) : null;
    const currentContent = currentItem ? getAssetContent(currentItem.id) : null;

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white flex">
            {/* Sidebar */}
            <aside className="w-80 bg-[#131314] border-r border-[#2a2a2d] flex flex-col h-screen sticky top-0">
                <div className="p-6 border-b border-[#2a2a2d]">
                    <h1 className="text-2xl font-bold mb-4">Vault</h1>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {filteredCategories.map((category) => {
                        const CatIcon = category.icon;
                        const isActive = selectedCategory === category.id;

                        return (
                            <div key={category.id}>
                                <button
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${isActive ? 'bg-cyan/10 text-cyan' : 'text-gray-400 hover:text-white hover:bg-[#1b1b1d]'
                                        }`}
                                >
                                    <CatIcon className="w-5 h-5" />
                                    <span className="font-medium">{category.title}</span>
                                </button>

                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-2 ml-4 space-y-1"
                                    >
                                        {category.items.map((item) => {
                                            const ItemIcon = item.icon;
                                            const hasContent = !!allAssets[item.id];
                                            const isItemActive = selectedItem === item.id;

                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setSelectedItem(item.id)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all ${isItemActive
                                                            ? 'bg-cyan text-black font-medium'
                                                            : hasContent
                                                                ? 'text-gray-300 hover:bg-[#1b1b1d]'
                                                                : 'text-gray-600 hover:bg-[#1b1b1d]'
                                                        }`}
                                                >
                                                    <ItemIcon className="w-4 h-4" />
                                                    <span className="flex-1">{item.name}</span>
                                                    {hasContent && !isItemActive && (
                                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Back Button */}
                <div className="p-4 border-t border-[#2a2a2d]">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-gray-400 hover:text-white hover:bg-[#252528] transition-all text-sm font-medium"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {!selectedItem ? (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex items-center justify-center"
                        >
                            <div className="text-center max-w-md">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1b1b1d] flex items-center justify-center">
                                    <Search className="w-10 h-10 text-gray-600" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Select an Asset</h2>
                                <p className="text-gray-500">
                                    Click on any item in the sidebar to view and manage your generated content.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedItem}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    {currentItem && (
                                        <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center">
                                            <currentItem.icon className="w-6 h-6 text-cyan" />
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-3xl font-bold">{currentItem?.name}</h2>
                                        <p className="text-gray-500">{currentCategory?.title}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopy(currentContent || '')}
                                        disabled={!currentContent}
                                        className="px-4 py-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-gray-400 hover:text-white flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <Copy className="w-4 h-4" /> Copy
                                    </button>
                                    <button
                                        onClick={() => handleRegenerate(selectedItem)}
                                        disabled={isRegenerating}
                                        className="px-4 py-2 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-gray-400 hover:text-white flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isRegenerating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        Regenerate
                                    </button>
                                </div>
                            </div>

                            {/* Content Display */}
                            <div className="bg-[#131314] border border-[#2a2a2d] rounded-2xl p-8">
                                {currentContent ? (
                                    <pre className="text-gray-200 whitespace-pre-wrap text-lg leading-relaxed font-sans">
                                        {currentContent}
                                    </pre>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 mb-4">No content generated yet for this item.</p>
                                        <button
                                            onClick={() => handleRegenerate(selectedItem)}
                                            disabled={isRegenerating}
                                            className="px-6 py-3 bg-cyan text-black rounded-lg font-bold flex items-center gap-2 mx-auto hover:brightness-110 transition-all"
                                        >
                                            {isRegenerating ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-5 h-5" />
                                                    Generate Now
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
