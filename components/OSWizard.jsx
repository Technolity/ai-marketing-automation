"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, CheckCircle, Lock, RefreshCw, ArrowRight, Edit3,
    Target, MessageSquare, BookOpen, DollarSign, Phone, Magnet,
    Video, Mail, Megaphone, Layout, ChevronRight, ChevronLeft
} from "lucide-react";
import { toast } from "sonner";

// Steps configuration with Icons
const STEPS = [
    { id: 1, title: "Ideal Client Builder", description: "Define who you serve and their deepest pain points.", icon: Target },
    { id: 2, title: "Million-Dollar Message", description: "Craft your one-liner, tagline, and core message.", icon: MessageSquare },
    { id: 3, title: "Signature Story Creator", description: "Structure your origin story for different formats.", icon: BookOpen },
    { id: 4, title: "High-Ticket Offer Builder", description: "Outline your program, deliverables, and pricing.", icon: DollarSign },
    { id: 5, title: "Personalized Sales Scripts", description: "Generate scripts for setting and closing deals.", icon: Phone },
    { id: 6, title: "Lead Magnet Generator", description: "Create ideas for high-value free resources.", icon: Magnet },
    { id: 7, title: "VSL Builder", description: "Script your Book-a-Call video sales letter.", icon: Video },
    { id: 8, title: "15-Day Email Sequence", description: "Nurture leads and drive them to book calls.", icon: Mail },
    { id: 9, title: "Ad Copy & Creative", description: "Hooks, angles, and headlines for paid ads.", icon: Megaphone },
    { id: 10, title: "Funnel Copy", description: "Copy for your opt-in, VSL, and booking pages.", icon: Layout },
];

// Input fields configuration for each step
const STEP_INPUTS = {
    1: [
        { name: "whoTheyServe", label: "Who do you serve?", type: "text", placeholder: "e.g. Corporate women, Real estate agents" },
        { name: "demographics", label: "Demographics", type: "text", placeholder: "Age, location, income level..." },
        { name: "corePains", label: "Core Pains (Top 3)", type: "textarea", placeholder: "What keeps them up at night?" },
        { name: "desiredOutcomes", label: "Desired Outcomes", type: "textarea", placeholder: "What do they want most?" },
        { name: "category", label: "Market Category", type: "text", placeholder: "Health, Wealth, Relationships..." },
        { name: "nichePositioning", label: "Niche Positioning", type: "text", placeholder: "How are you different?" }
    ],
    2: [
        { name: "result", label: "What result do you give?", type: "text" },
        { name: "forWhom", label: "For whom?", type: "text" },
        { name: "uniqueAngle", label: "Unique Angle / Mechanism", type: "text" },
        { name: "timeFrame", label: "Time Frame / Differentiation", type: "text" }
    ],
    3: [
        { name: "originStory", label: "Origin Story Raw Notes", type: "textarea", rows: 6 },
        { name: "turningPoint", label: "The Turning Point", type: "textarea" },
        { name: "bigResult", label: "The Big Result / Epiphany", type: "textarea" },
        { name: "lessons", label: "Key Lessons / Framework", type: "textarea" }
    ],
    4: [
        { name: "whoFor", label: "Who is the program for?", type: "text" },
        { name: "modules", label: "Modules / Components", type: "textarea", rows: 4 },
        { name: "delivery", label: "Delivery Format", type: "text", placeholder: "1-on-1, Group, Course..." },
        { name: "duration", label: "Duration", type: "text" },
        { name: "price", label: "Price & Payment Plans", type: "text" },
        { name: "guarantee", label: "Guarantees & Bonuses", type: "textarea" }
    ],
    5: [
        { name: "salesProcess", label: "Sales Process", type: "text", placeholder: "DM -> Call, Webinar -> Call..." },
        { name: "objections", label: "Common Objections", type: "textarea" },
        { name: "tone", label: "Sales Tone", type: "text", placeholder: "Consultative, Direct, Empathetic..." }
    ],
    6: [
        { name: "topic", label: "Lead Magnet Topic", type: "text" },
        { name: "painSolved", label: "Core Pain Solved", type: "text" },
        { name: "outcome", label: "Desired Outcome", type: "text" }
    ],
    7: [
        { name: "promise", label: "Main Promise", type: "text" },
        { name: "transformation", label: "Core Transformation", type: "textarea" },
        { name: "proof", label: "Proof / Case Studies", type: "textarea" },
        { name: "cta", label: "Call to Action", type: "text" }
    ],
    8: [
        { name: "timeline", label: "Timeline", type: "text", defaultValue: "15 Days" },
        { name: "primaryCta", label: "Primary CTA", type: "text" },
        { name: "themes", label: "Story Themes / Angles", type: "textarea" }
    ],
    9: [
        { name: "platforms", label: "Platforms", type: "text", placeholder: "FB, IG, TikTok..." },
        { name: "bigIdea", label: "Big Idea / Angle", type: "textarea" }
    ],
    10: [
        { name: "mainCta", label: "Main CTA", type: "text" },
        { name: "funnelType", label: "Funnel Type", type: "text", placeholder: "Book a Call, Webinar, Low Ticket..." }
    ]
};

export default function OSWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [stepData, setStepData] = useState({}); // Stores approved data for all steps
    const [currentInput, setCurrentInput] = useState({}); // Stores input for current step
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [isReviewMode, setIsReviewMode] = useState(false);

    const handleInputChange = (field, value) => {
        setCurrentInput(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Include previously approved data for context if needed
            const payload = {
                step: currentStep,
                data: {
                    ...currentInput,
                    // We could pass previous steps data here if the prompt needs it
                    ...stepData
                }
            };

            const res = await fetch("/api/os/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
            // Save approval to backend
            await fetch("/api/os/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step: currentStep, content: generatedContent }),
            });

            setStepData(prev => ({
                ...prev,
                [`step${currentStep}`]: generatedContent
            }));

            setGeneratedContent(null);
            setIsReviewMode(false);
            setCurrentInput({}); // Reset input for next step

            if (currentStep < STEPS.length) {
                setCurrentStep(prev => prev + 1);
                toast.success(`Step ${currentStep} completed!`);
            } else {
                toast.success("All steps completed! Redirecting to dashboard...");
                // Redirect to dashboard
            }
        } catch (error) {
            toast.error("Failed to save approval.");
        }
    };

    const CurrentIcon = STEPS[currentStep - 1].icon;

    return (
        <div className="flex flex-col h-screen bg-[#0e0e0f] text-white overflow-hidden font-sans">
            {/* Top Bar */}
            <div className="h-16 border-b border-[#1b1b1d] bg-[#0e0e0f] flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-white">S</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Scalez Media</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400">Step {currentStep} of {STEPS.length}</span>
                        <div className="w-32 h-1 bg-[#1b1b1d] rounded-full mt-1">
                            <div
                                className="h-full bg-red-600 rounded-full transition-all duration-500"
                                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Left Panel - Input / Question Area */}
                <div className={`flex-1 overflow-y-auto p-8 transition-all duration-500 ${isReviewMode ? 'lg:w-[60%] lg:flex-none' : 'w-full'}`}>
                    <div className="max-w-3xl mx-auto pt-8">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 text-red-500 text-sm font-medium mb-4">
                                    <CurrentIcon className="w-4 h-4" />
                                    {STEPS[currentStep - 1].title}
                                </div>
                                <h1 className="text-4xl font-bold mb-3">{STEPS[currentStep - 1].title}</h1>
                                <p className="text-gray-400 text-lg">{STEPS[currentStep - 1].description}</p>
                            </div>

                            <div className="space-y-6 bg-[#1b1b1d] p-8 rounded-2xl border border-[#2a2a2d] shadow-xl">
                                {STEP_INPUTS[currentStep]?.map((input) => (
                                    <div key={input.name}>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {input.label}
                                        </label>
                                        {input.type === 'textarea' ? (
                                            <textarea
                                                className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-4 text-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all min-h-[120px]"
                                                placeholder={input.placeholder}
                                                value={currentInput[input.name] || ""}
                                                onChange={(e) => handleInputChange(input.name, e.target.value)}
                                                rows={input.rows || 3}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-4 text-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
                                                placeholder={input.placeholder}
                                                value={currentInput[input.name] || ""}
                                                onChange={(e) => handleInputChange(input.name, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}

                                <div className="pt-4 flex justify-between items-center">
                                    {currentStep > 1 && (
                                        <button
                                            onClick={() => setCurrentStep(prev => prev - 1)}
                                            className="text-gray-400 hover:text-white flex items-center gap-2 px-4 py-2"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Back
                                        </button>
                                    )}

                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="ml-auto bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
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

                {/* Right Panel - AI Output Review */}
                <AnimatePresence>
                    {isReviewMode && generatedContent && (
                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full lg:w-[40%] border-l border-[#1b1b1d] bg-[#131314] overflow-y-auto absolute lg:relative right-0 h-full z-10 shadow-2xl"
                        >
                            <div className="p-6 border-b border-[#1b1b1d] flex justify-between items-center sticky top-0 bg-[#131314]/95 backdrop-blur z-20">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    AI Generated Result
                                </h3>
                                <button
                                    onClick={() => setIsReviewMode(false)}
                                    className="lg:hidden text-gray-400"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {Object.entries(generatedContent).map(([key, value]) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                                            {key.replace(/_/g, " ")}
                                        </label>
                                        <div className="bg-[#0e0e0f] p-4 rounded-lg border border-[#2a2a2d] text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
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
