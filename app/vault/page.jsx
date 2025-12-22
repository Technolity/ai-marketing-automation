"use client";
/**
 * Vault Page
 * 
 * Connected to existing database schema.
 * Uses /api/os/results to read from saved_sessions.generated_content
 * No mock data - displays actual AI-generated content from database.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, ChevronRight, Copy, RefreshCw, Download, Search,
    Megaphone, Gift, Layout, Video, Mail, MessageSquare,
    Users, MessageCircle, BookOpen, Award, Mic, Palette,
    X, CheckCircle, Menu, ArrowLeft, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Asset categories mapped to saved_sessions.generated_content keys
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
            { id: 'ads', name: 'All Ad Variations', icon: Megaphone },
            { id: 'adHeadlines', name: 'Headlines', icon: Megaphone },
            { id: 'adCopy', name: 'Body Copy', icon: Megaphone }
        ]
    },
    {
        id: 'pages',
        title: 'Pages',
        icon: Layout,
        items: [
            { id: 'optinPage', name: 'Opt-in Page', icon: Layout },
            { id: 'salesPage', name: 'Sales Page', icon: Video },
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
            { id: 'brandColors', name: 'Color Palette', icon: Palette },
            { id: 'brandFonts', name: 'Typography', icon: Palette },
            { id: 'logo', name: 'Logo Concepts', icon: Palette }
        ]
    }
];

export default function VaultPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [allAssets, setAllAssets] = useState({});
    const [dataSource, setDataSource] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(VAULT_CATEGORIES[0].id);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState([VAULT_CATEGORIES[0].id]);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsSidebarOpen(window.innerWidth >= 1024);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Load all assets from database via /api/os/results
    useEffect(() => {
        if (authLoading) return;
        if (!session) {
            router.push("/auth/login");
            return;
        }

        const loadAllAssets = async () => {
            try {
                // Fetch from saved_sessions.generated_content via API
                const res = await fetchWithAuth('/api/os/results');
                const result = await res.json();

                if (result.error) {
                    console.error("API error:", result.error);
                    toast.error("Failed to load assets");
                    return;
                }

                if (result.data && Object.keys(result.data).length > 0) {
                    setAllAssets(result.data);
                    setDataSource(result.source);
                    console.log('[Vault] Loaded assets from:', result.source);
                } else {
                    toast.info("No generated content yet. Complete the intake form first.");
                }
            } catch (error) {
                console.error("Failed to load assets:", error);
                toast.error("Failed to load assets");
            } finally {
                setIsLoading(false);
            }
        };

        loadAllAssets();
    }, [session, authLoading, router]);

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
        setSelectedCategory(categoryId);
    };

    const getAssetContent = (itemId) => {
        const content = allAssets[itemId];
        if (!content) return null;

        if (typeof content === 'string') return content;
        if (typeof content === 'object') {
            return Object.entries(content)
                .filter(([k]) => k !== '_contentName' && k !== 'id')
                .map(([k, v]) => {
                    const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                    const value = typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);
                    return `**${label}:**\n${value}`;
                })
                .join('\n\n');
        }
        return String(content);
    };

    const handleCopy = (content) => {
        navigator.clipboard.writeText(content);
        toast.success("Copied to clipboard!");
    };

    // Regenerate via existing API
    const handleRegenerate = async (itemId) => {
        setIsRegenerating(true);
        try {
            const res = await fetchWithAuth('/api/os/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section: itemId,
                    sessionId: dataSource?.id
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.content) {
                    setAllAssets(prev => ({ ...prev, [itemId]: data.content }));
                    toast.success("Content regenerated!");
                }
            } else {
                toast.error("Regeneration failed - check API logs");
            }
        } catch (error) {
            console.error("Regeneration error:", error);
            toast.error("Failed to regenerate");
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleItemSelect = (itemId) => {
        setSelectedItem(itemId);
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

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
    const currentItem = selectedItem ?
        VAULT_CATEGORIES.flatMap(c => c.items).find(i => i.id === selectedItem) : null;
    const currentContent = currentItem ? getAssetContent(currentItem.id) : null;

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white flex flex-col lg:flex-row">

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#2a2a2d] bg-[#131314]">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Vault</h1>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed lg:relative z-50 h-full lg:h-auto w-[280px] sm:w-[320px] lg:w-80 bg-[#131314] border-r border-[#2a2a2d] flex flex-col lg:sticky lg:top-0 lg:max-h-screen"
                    >
                        <div className="p-4 sm:p-6 border-b border-[#2a2a2d] flex items-center justify-between">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold">Vault</h1>
                                {dataSource && (
                                    <p className="text-xs text-gray-500 mt-1">From: {dataSource.name || dataSource.type}</p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors lg:hidden"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b border-[#2a2a2d]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search assets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredCategories.map((category) => {
                                const CatIcon = category.icon;
                                const isExpanded = expandedCategories.includes(category.id);

                                return (
                                    <div key={category.id}>
                                        <button
                                            onClick={() => toggleCategory(category.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${isExpanded ? 'bg-cyan/10 text-cyan' : 'text-gray-400 hover:text-white hover:bg-[#1b1b1d]'
                                                }`}
                                        >
                                            <CatIcon className="w-5 h-5 flex-shrink-0" />
                                            <span className="font-medium flex-1">{category.title}</span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-1 ml-4 space-y-1 overflow-hidden"
                                                >
                                                    {category.items.map((item) => {
                                                        const ItemIcon = item.icon;
                                                        const hasContent = !!allAssets[item.id];
                                                        const isItemActive = selectedItem === item.id;

                                                        return (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => handleItemSelect(item.id)}
                                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${isItemActive
                                                                        ? 'bg-cyan text-black font-medium'
                                                                        : hasContent
                                                                            ? 'text-gray-300 hover:bg-[#1b1b1d]'
                                                                            : 'text-gray-600 hover:bg-[#1b1b1d]'
                                                                    }`}
                                                            >
                                                                <ItemIcon className="w-4 h-4 flex-shrink-0" />
                                                                <span className="flex-1 truncate">{item.name}</span>
                                                                {hasContent && !isItemActive && (
                                                                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-[#2a2a2d]">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full py-3 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-gray-400 hover:text-white hover:bg-[#252528] transition-all text-sm font-medium"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Toggle Sidebar Button (Desktop) */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:flex fixed left-4 top-20 z-30 bg-[#1b1b1d] p-2 rounded-lg border border-[#2a2a2d] hover:bg-[#2a2a2d] transition-colors"
            >
                {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-[calc(100vh-60px)] lg:min-h-screen">
                <AnimatePresence mode="wait">
                    {!selectedItem ? (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex items-center justify-center min-h-[400px]"
                        >
                            <div className="text-center max-w-md px-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-[#1b1b1d] flex items-center justify-center">
                                    <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold mb-2">Select an Asset</h2>
                                <p className="text-gray-500 text-sm sm:text-base">
                                    {isSidebarOpen
                                        ? "Click on any item in the sidebar to view your generated content."
                                        : "Tap the menu button to browse your assets."}
                                </p>
                                {!isSidebarOpen && (
                                    <button
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="mt-6 px-6 py-3 bg-cyan text-black rounded-lg font-bold flex items-center gap-2 mx-auto hover:brightness-110 transition-all"
                                    >
                                        <Menu className="w-5 h-5" />
                                        Browse Assets
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedItem}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="lg:hidden p-2 hover:bg-[#1b1b1d] rounded-lg transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    {currentItem && (
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan/10 flex items-center justify-center flex-shrink-0">
                                            <currentItem.icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h2 className="text-2xl sm:text-3xl font-bold truncate">{currentItem?.name}</h2>
                                        <p className="text-gray-500 text-sm">{currentCategory?.title}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopy(currentContent || '')}
                                        disabled={!currentContent}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
                                    >
                                        <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Copy</span>
                                    </button>
                                    <button
                                        onClick={() => handleRegenerate(selectedItem)}
                                        disabled={isRegenerating}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
                                    >
                                        {isRegenerating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        <span className="hidden sm:inline">Regenerate</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#131314] border border-[#2a2a2d] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
                                {currentContent ? (
                                    <pre className="text-gray-200 whitespace-pre-wrap text-sm sm:text-base lg:text-lg leading-relaxed font-sans overflow-x-auto">
                                        {currentContent}
                                    </pre>
                                ) : (
                                    <div className="text-center py-8 sm:py-12">
                                        <p className="text-gray-500 mb-4 text-sm sm:text-base">
                                            No content generated for this item yet.
                                        </p>
                                        <p className="text-gray-600 text-xs">
                                            Complete the intake form to generate content.
                                        </p>
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
