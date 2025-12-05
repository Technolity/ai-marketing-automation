"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, CheckCircle, Lock, RefreshCw, ArrowRight, Sparkles,
    Target, MessageSquare, BookOpen, DollarSign, Phone, Magnet,
    Video, Mail, Megaphone, Layout, ChevronLeft, Menu, X, Info
} from "lucide-react";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Steps configuration with Icons and Dependencies
const STEPS = [
    { id: 1, title: "Ideal Client Builder", description: "Define who you serve and their deepest pain points.", icon: Target, dependencies: [] },
    { id: 2, title: "Million-Dollar Message", description: "Craft your one-liner, tagline, and core message.", icon: MessageSquare, dependencies: [1] },
    { id: 3, title: "Signature Story Creator", description: "Structure your origin story for different formats.", icon: BookOpen, dependencies: [1] },
    { id: 4, title: "High-Ticket Offer Builder", description: "Outline your program, deliverables, and pricing.", icon: DollarSign, dependencies: [1, 2] },
    { id: 5, title: "Personalized Sales Scripts", description: "Generate scripts for setting and closing deals.", icon: Phone, dependencies: [4] },
    { id: 6, title: "Lead Magnet Generator", description: "Create ideas for high-value free resources.", icon: Magnet, dependencies: [1, 2] },
    { id: 7, title: "VSL Builder", description: "Script your Book-a-Call video sales letter.", icon: Video, dependencies: [4] },
    { id: 8, title: "15-Day Email Sequence", description: "Nurture leads and drive them to book calls.", icon: Mail, dependencies: [4, 6] },
    { id: 9, title: "Ad Copy & Creative", description: "Hooks, angles, and headlines for paid ads.", icon: Megaphone, dependencies: [4] },
    { id: 10, title: "Funnel Copy", description: "Copy for your opt-in, VSL, and booking pages.", icon: Layout, dependencies: [4, 7] },
];

// Helper function to format JSON content into human-readable format
const formatContentForDisplay = (jsonContent) => {
    if (!jsonContent || typeof jsonContent !== 'object') {
        return jsonContent;
    }

    return Object.entries(jsonContent).map(([key, value]) => {
        const formattedKey = key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();

        let formattedValue;
        if (Array.isArray(value)) {
            formattedValue = value.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
        } else if (typeof value === 'object' && value !== null) {
            formattedValue = JSON.stringify(value, null, 2);
        } else {
            formattedValue = value;
        }

        return { key: formattedKey, value: formattedValue };
    });
};

// Input fields configuration for each step
const STEP_INPUTS = {
    1: [
        { name: "whoTheyServe", label: "Who do you serve?", type: "text", placeholder: "e.g. Corporate women, Real estate agents", info: "Be specific about your target audience" },
        { name: "demographics", label: "Demographics", type: "text", placeholder: "Age, location, income level...", info: "Helps AI understand your market better" },
        { name: "corePains", label: "Core Pains (Top 3)", type: "textarea", placeholder: "What keeps them up at night?", info: "Focus on their biggest struggles" },
        { name: "desiredOutcomes", label: "Desired Outcomes", type: "textarea", placeholder: "What do they want most?", info: "What transformation are they seeking?" },
        { name: "category", label: "Market Category", type: "text", placeholder: "Health, Wealth, Relationships...", info: "Primary market vertical" },
        { name: "nichePositioning", label: "Niche Positioning", type: "text", placeholder: "How are you different?", info: "Your unique angle in the market" }
    ],
    2: [
        { name: "result", label: "What result do you give?", type: "text", info: "The main transformation you provide" },
        { name: "forWhom", label: "For whom?", type: "text", info: "Your specific target audience" },
        { name: "uniqueAngle", label: "Unique Angle / Mechanism", type: "text", info: "What makes your approach special" },
        { name: "timeFrame", label: "Time Frame / Differentiation", type: "text", info: "How quickly can they expect results" }
    ],
    3: [
        { name: "originStory", label: "Origin Story Raw Notes", type: "textarea", rows: 6, info: "Your journey and what led you here" },
        { name: "turningPoint", label: "The Turning Point", type: "textarea", info: "The moment everything changed" },
        { name: "bigResult", label: "The Big Result / Epiphany", type: "textarea", info: "What breakthrough did you achieve" },
        { name: "lessons", label: "Key Lessons / Framework", type: "textarea", info: "What you learned that you now teach" }
    ],
    4: [
        { name: "whoFor", label: "Who is the program for?", type: "text", info: "Ideal client for this offer" },
        { name: "modules", label: "Modules / Components", type: "textarea", rows: 4, info: "What's included in your program" },
        { name: "delivery", label: "Delivery Format", type: "text", placeholder: "1-on-1, Group, Course...", info: "How is it delivered" },
        { name: "duration", label: "Duration", type: "text", info: "How long is the program" },
        { name: "price", label: "Price & Payment Plans", type: "text", info: "Investment options" },
        { name: "guarantee", label: "Guarantees & Bonuses", type: "textarea", info: "Risk reversal and extras" }
    ],
    5: [
        { name: "salesProcess", label: "Sales Process", type: "text", placeholder: "DM -> Call, Webinar -> Call...", info: "Your sales funnel flow" },
        { name: "objections", label: "Common Objections", type: "textarea", info: "What pushback do you get" },
        { name: "tone", label: "Sales Tone", type: "text", placeholder: "Consultative, Direct, Empathetic...", info: "Your selling style" }
    ],
    6: [
        { name: "topic", label: "Lead Magnet Topic", type: "text", info: "What will the free resource be about" },
        { name: "painSolved", label: "Core Pain Solved", type: "text", info: "The quick win you provide" },
        { name: "outcome", label: "Desired Outcome", type: "text", info: "What will they achieve from it" }
    ],
    7: [
        { name: "promise", label: "Main Promise", type: "text", info: "The big claim of your VSL" },
        { name: "transformation", label: "Core Transformation", type: "textarea", info: "Before and after state" },
        { name: "proof", label: "Proof / Case Studies", type: "textarea", info: "Evidence it works" },
        { name: "cta", label: "Call to Action", type: "text", info: "What should they do next" }
    ],
    8: [
        { name: "timeline", label: "Timeline", type: "text", defaultValue: "15 Days", info: "Duration of sequence" },
        { name: "primaryCta", label: "Primary CTA", type: "text", info: "Main action you want" },
        { name: "themes", label: "Story Themes / Angles", type: "textarea", info: "Topics to cover in emails" }
    ],
    9: [
        { name: "platforms", label: "Platforms", type: "text", placeholder: "FB, IG, TikTok...", info: "Where you'll run ads" },
        { name: "bigIdea", label: "Big Idea / Angle", type: "textarea", info: "Your hook for the ads" }
    ],
    10: [
        { name: "mainCta", label: "Main CTA", type: "text", info: "Primary call to action" },
        { name: "funnelType", label: "Funnel Type", type: "text", placeholder: "Book a Call, Webinar, Low Ticket...", info: "Type of funnel you're building" }
    ]
};

// Section info for each step
const STEP_INFO = {
    1: "Understanding your ideal client is the foundation of all marketing. The AI will use this to create targeted messaging.",
    2: "Your million-dollar message is your positioning statement. It tells people exactly what you do and who you serve in one sentence.",
    3: "Your signature story builds trust and connection. It shows your journey and why you're qualified to help.",
    4: "Your high-ticket offer is the core of your business. This defines what you sell and how you deliver value.",
    5: "Sales scripts help you convert prospects into clients. The AI will create conversation frameworks for different scenarios.",
    6: "A lead magnet attracts your ideal clients. It solves one specific problem and leads them to your main offer.",
    7: "A VSL (Video Sales Letter) sells your program on autopilot. It tells your story and makes the offer without you being live.",
    8: "Email sequences nurture leads over time. They build trust and guide people toward booking a call or buying.",
    9: "Ad copy grabs attention and drives clicks. The AI will create hooks based on your ideal client's pain points.",
    10: "Funnel copy converts visitors into leads and customers. This includes all the pages in your marketing funnel."
};

export default function OSWizard() {
    const supabase = createClientComponentClient();
    const router = useRouter();

    // View Management
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'step'
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentStep, setCurrentStep] = useState(null);

    // Data Management
    const [completedSteps, setCompletedSteps] = useState([]);
    const [stepData, setStepData] = useState({});
    const [currentInput, setCurrentInput] = useState({});

    // AI Generation
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [aiAssisting, setAiAssisting] = useState(null); // Track which field is being AI-assisted

    const [isLoading, setIsLoading] = useState(true);

    // Auth protection
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth/login");
            } else {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [supabase, router]);

    // Check if a step is unlocked based on dependencies
    const isStepUnlocked = (stepId) => {
        const step = STEPS.find(s => s.id === stepId);
        if (!step) return false;
        if (step.dependencies.length === 0) return true;
        return step.dependencies.every(depId => completedSteps.includes(depId));
    };

    // Get step status
    const getStepStatus = (stepId) => {
        if (completedSteps.includes(stepId)) return 'completed';
        if (isStepUnlocked(stepId)) return 'unlocked';
        return 'locked';
    };

    // Handle step click from Mission Control
    const handleStepClick = (stepId) => {
        const status = getStepStatus(stepId);
        if (status === 'locked') {
            toast.error('Complete previous steps first');
            return;
        }

        setCurrentStep(stepId);
        setViewMode('step');
        setCurrentInput({});
        setGeneratedContent(null);
        setIsReviewMode(false);
    };

    // Handle back to dashboard
    const handleBackToDashboard = () => {
        setViewMode('dashboard');
        setCurrentStep(null);
        setCurrentInput({});
        setGeneratedContent(null);
        setIsReviewMode(false);
    };

    const handleInputChange = (field, value) => {
        setCurrentInput(prev => ({ ...prev, [field]: value }));
    };

    // AI Assist for individual fields
    const handleAiAssist = async (fieldName, fieldLabel) => {
        setAiAssisting(fieldName);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("You must be logged in.");
                return;
            }

            const res = await fetch("/api/os/assist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    fieldLabel,
                    sectionTitle: STEPS[currentStep - 1].title,
                    userContext: { ...currentInput, ...stepData }
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            handleInputChange(fieldName, data.suggestion);
            toast.success("AI suggestion added!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to get AI suggestion.");
        } finally {
            setAiAssisting(null);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("You must be logged in to generate content.");
                setIsGenerating(false);
                return;
            }

            const payload = {
                step: currentStep,
                data: {
                    ...currentInput,
                    ...stepData
                }
            };

            const res = await fetch("/api/os/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setGeneratedContent(data.result);
            setIsReviewMode(true);
            toast.success("Content generated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate content. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApprove = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("You must be logged in.");
                return;
            }

            await fetch("/api/os/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ step: currentStep, content: generatedContent }),
            });

            setStepData(prev => ({
                ...prev,
                [`step${currentStep}`]: generatedContent
            }));

            setCompletedSteps(prev => [...new Set([...prev, currentStep])]);

            toast.success(`Step ${currentStep} completed!`);

            // Go back to dashboard
            handleBackToDashboard();

            if (currentStep === STEPS.length) {
                toast.success("All steps completed! Check results page.");
            }
        } catch (error) {
            toast.error("Failed to save approval.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0e0e0f]">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        );
    }

    // Mission Control View
    if (viewMode === 'dashboard') {
        return (
            <div className="min-h-screen bg-[#0e0e0f] text-white">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Mission Control
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Complete all 10 steps to build your complete marketing system
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-gray-400">Completed ({completedSteps.length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-gray-400">Unlocked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                                <span className="text-gray-400">Locked</span>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {STEPS.map((step, index) => {
                            const status = getStepStatus(step.id);
                            const Icon = step.icon;

                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <button
                                        onClick={() => handleStepClick(step.id)}
                                        disabled={status === 'locked'}
                                        className={`
                                            w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left
                                            ${status === 'completed'
                                                ? 'bg-green-600/10 border-green-600 hover:border-green-500 hover:shadow-lg hover:shadow-green-900/20'
                                                : status === 'unlocked'
                                                ? 'bg-[#1b1b1d] border-blue-600/50 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/20'
                                                : 'bg-[#1b1b1d] border-gray-700 opacity-50 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`
                                                p-3 rounded-xl
                                                ${status === 'completed'
                                                    ? 'bg-green-600/20'
                                                    : status === 'unlocked'
                                                    ? 'bg-blue-600/20'
                                                    : 'bg-gray-700/20'
                                                }
                                            `}>
                                                <Icon className={`w-6 h-6 ${
                                                    status === 'completed'
                                                        ? 'text-green-500'
                                                        : status === 'unlocked'
                                                        ? 'text-blue-500'
                                                        : 'text-gray-500'
                                                }`} />
                                            </div>

                                            {status === 'completed' && (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            )}
                                            {status === 'locked' && (
                                                <Lock className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>

                                        {step.dependencies.length > 0 && status === 'locked' && (
                                            <div className="mt-4 pt-4 border-t border-gray-700">
                                                <p className="text-xs text-gray-500">
                                                    Requires: {step.dependencies.map(d => `Step ${d}`).join(', ')}
                                                </p>
                                            </div>
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Step View with Sidebar
    const CurrentIcon = STEPS[currentStep - 1].icon;

    return (
        <div className="min-h-screen bg-[#0e0e0f] text-white font-sans flex">
            {/* Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        className="w-80 bg-[#131314] border-r border-[#1b1b1d] flex flex-col"
                    >
                        <div className="p-6 border-b border-[#1b1b1d]">
                            <button
                                onClick={handleBackToDashboard}
                                className="text-sm text-gray-400 hover:text-white flex items-center gap-2 mb-4"
                            >
                                <ChevronLeft className="w-4 h-4" /> Mission Control
                            </button>
                            <h2 className="text-xl font-bold">Steps</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {STEPS.map((step) => {
                                const status = getStepStatus(step.id);
                                const Icon = step.icon;
                                const isActive = currentStep === step.id;

                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => status !== 'locked' && handleStepClick(step.id)}
                                        disabled={status === 'locked'}
                                        className={`
                                            w-full p-4 rounded-lg text-left transition-all flex items-center gap-3
                                            ${isActive
                                                ? 'bg-red-600 text-white'
                                                : status === 'completed'
                                                ? 'bg-green-600/10 text-green-400 hover:bg-green-600/20'
                                                : status === 'unlocked'
                                                ? 'bg-[#1b1b1d] text-gray-300 hover:bg-[#2a2a2d]'
                                                : 'bg-[#1b1b1d] text-gray-600 cursor-not-allowed opacity-50'
                                            }
                                        `}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm font-medium flex-1">{step.title}</span>
                                        {status === 'completed' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                                        {status === 'locked' && <Lock className="w-4 h-4 flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Sidebar Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="fixed left-4 top-20 z-30 bg-[#1b1b1d] p-2 rounded-lg border border-[#2a2a2d] hover:bg-[#2a2a2d] transition-colors"
            >
                {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Input Panel */}
                <div className={`flex-1 overflow-y-auto p-8 transition-all duration-500 ${isReviewMode ? 'lg:w-[60%]' : 'w-full'}`}>
                    <div className="max-w-3xl mx-auto pt-8">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Header */}
                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 text-red-500 text-sm font-medium mb-4">
                                    <CurrentIcon className="w-4 h-4" />
                                    Step {currentStep} of {STEPS.length}
                                </div>
                                <h1 className="text-4xl font-bold mb-3">{STEPS[currentStep - 1].title}</h1>
                                <p className="text-gray-400 text-lg">{STEPS[currentStep - 1].description}</p>
                            </div>

                            {/* Info Box */}
                            <div className="mb-6 p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg flex gap-3">
                                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-bold text-blue-400 mb-1">What is this?</h3>
                                    <p className="text-sm text-gray-300">{STEP_INFO[currentStep]}</p>
                                </div>
                            </div>

                            {/* Input Fields */}
                            <div className="space-y-6 bg-[#1b1b1d] p-8 rounded-2xl border border-[#2a2a2d] shadow-xl">
                                {STEP_INPUTS[currentStep]?.map((input) => (
                                    <div key={input.name}>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {input.label}
                                            {input.info && (
                                                <span className="ml-2 text-xs text-gray-500">({input.info})</span>
                                            )}
                                        </label>
                                        <div className="relative">
                                            {input.type === 'textarea' ? (
                                                <textarea
                                                    className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-4 text-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all min-h-[120px]"
                                                    placeholder={input.placeholder}
                                                    value={currentInput[input.name] || input.defaultValue || ""}
                                                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                                                    rows={input.rows || 3}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-4 text-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
                                                    placeholder={input.placeholder}
                                                    value={currentInput[input.name] || input.defaultValue || ""}
                                                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                                                />
                                            )}
                                            <button
                                                onClick={() => handleAiAssist(input.name, input.label)}
                                                disabled={aiAssisting === input.name}
                                                className="absolute right-2 top-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-50"
                                            >
                                                {aiAssisting === input.name ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3 h-3" />
                                                )}
                                                AI Answer
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-4">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                Generate <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* AI Output Panel */}
                <AnimatePresence>
                    {isReviewMode && generatedContent && (
                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full lg:w-[40%] border-l border-[#1b1b1d] bg-[#131314] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-[#1b1b1d] flex justify-between items-center sticky top-0 bg-[#131314]/95 backdrop-blur z-20">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    AI Generated Result
                                </h3>
                            </div>

                            <div className="p-6 space-y-6">
                                {formatContentForDisplay(generatedContent).map(({ key, value }) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                                            {key}
                                        </label>
                                        <div className="bg-[#0e0e0f] p-4 rounded-lg border border-[#2a2a2d] text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 border-t border-[#1b1b1d] bg-[#131314] sticky bottom-0 z-20 flex gap-3">
                                <button
                                    onClick={handleGenerate}
                                    className="flex-1 py-3 rounded-lg font-medium text-gray-300 hover:bg-[#1b1b1d] border border-[#2a2a2d] transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Regenerate
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                                >
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
