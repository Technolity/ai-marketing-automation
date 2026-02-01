"use client";

import React, { useState, useEffect } from "react";
import { Download, BookOpen, Rocket, Settings, ChevronRight } from "lucide-react";

// Guide configuration - easily extensible
const GUIDES = [
    {
        id: "how-to-login",
        title: "How to Login",
        description: "Learn how to access your account",
        pdfPath: "/guide.pdf",
        icon: BookOpen,
    },
    {
        id: "getting-started",
        title: "Getting Started!",
        description: "Your first steps with the platform",
        pdfPath: "/guide-2.pdf",
        icon: Rocket,
    },
    {
        id: "setting-up-builder",
        title: "Setting Up the Builder",
        description: "Configure your automation builder",
        pdfPath: "/guide-3.pdf",
        icon: Settings,
    },
];

export default function GuidePage() {
    const [activeGuide, setActiveGuide] = useState(GUIDES[0]);

    useEffect(() => {
        console.log(`[GuidePage] Component mounted. Active guide: ${activeGuide.title}`);
    }, []);

    useEffect(() => {
        console.log(`[GuidePage] Switched to guide: ${activeGuide.title} (${activeGuide.pdfPath})`);

        // Check if the PDF file exists
        fetch(activeGuide.pdfPath, { method: 'HEAD' })
            .then(res => {
                if (res.ok) {
                    console.log(`[GuidePage] PDF file found: ${activeGuide.pdfPath}`);
                } else {
                    console.error(`[GuidePage] PDF file not found: ${activeGuide.pdfPath} (status: ${res.status})`);
                }
            })
            .catch(err => {
                console.error(`[GuidePage] Error checking PDF file:`, err);
            });
    }, [activeGuide]);

    const handleGuideSelect = (guide) => {
        console.log(`[GuidePage] User selected guide: ${guide.title}`);
        setActiveGuide(guide);
    };

    return (
        <div className="min-h-screen bg-dark pt-24 px-6 pb-12 flex flex-col">
            <div className="max-w-7xl mx-auto w-full h-full flex-1 flex flex-col gap-6">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Implementation Guide
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Follow these step-by-step guides to set up your automation.
                        </p>
                    </div>
                </div>

                {/* Main Content - Sidebar + PDF Viewer */}
                <div className="flex-1 flex gap-6 min-h-[800px]">

                    {/* Sidebar */}
                    <div className="w-80 flex-shrink-0 bg-[#0e0e0f] rounded-xl border border-white/10 p-4 flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                            Guides
                        </h3>
                        {GUIDES.map((guide) => {
                            const Icon = guide.icon;
                            const isActive = activeGuide.id === guide.id;

                            return (
                                <button
                                    key={guide.id}
                                    onClick={() => handleGuideSelect(guide)}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-300
                    ${isActive
                                            ? 'bg-cyan/10 border border-cyan/30 text-white'
                                            : 'hover:bg-white/5 border border-transparent text-gray-400 hover:text-white'
                                        }
                  `}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan' : ''}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${isActive ? 'text-white' : ''}`}>
                                            {guide.title}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {guide.description}
                                        </p>
                                    </div>
                                    {isActive && <ChevronRight className="w-4 h-4 text-cyan flex-shrink-0" />}
                                </button>
                            );
                        })}

                        {/* Download Button in Sidebar */}
                        <div className="mt-auto pt-4 border-t border-white/10">
                            <a
                                href={activeGuide.pdfPath}
                                download={`${activeGuide.title.replace(/\s+/g, '_')}.pdf`}
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/20 rounded-lg transition-all duration-300 font-medium"
                                onClick={() => console.log(`[GuidePage] Download clicked for: ${activeGuide.title}`)}
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </a>
                        </div>
                    </div>

                    {/* PDF Viewer */}
                    <div className="flex-1 bg-[#0e0e0f] rounded-xl border border-white/10 overflow-hidden shadow-2xl relative flex flex-col">
                        {/* PDF Title Bar */}
                        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                            {React.createElement(activeGuide.icon, { className: "w-5 h-5 text-cyan" })}
                            <h2 className="text-lg font-semibold text-white">{activeGuide.title}</h2>
                        </div>

                        {/* PDF Content */}
                        <div className="flex-1 relative">
                            <iframe
                                key={activeGuide.id}
                                src={activeGuide.pdfPath}
                                className="w-full h-full absolute inset-0 border-0"
                                title={activeGuide.title}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
