"use client";

import React, { useState, useEffect } from "react";
import { Download, BookOpen, Rocket, Settings, Globe, ChevronRight, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
        title: "Getting Started",
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
    {
        id: "tedos-domain",
        title: "Domain Setup",
        description: "Domain setup and configuration guide",
        pdfPath: "/TedOS_Domains.pdf",
        icon: Globe,
    },
];

export default function GuidePage() {
    const searchParams = useSearchParams();
    const [activeGuide, setActiveGuide] = useState(() => {
        const id = searchParams?.get('guide');
        return GUIDES.find(g => g.id === id) || GUIDES[0];
    });

    return (
        <div className="min-h-screen font-poppins" style={{ background: "#00031C", color: "#F4F7FF" }}>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b backdrop-blur-md"
                style={{ background: "rgba(0,3,28,0.85)", borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard"
                            className="p-2 rounded-lg transition-colors text-[#94A3B8] hover:text-white"
                            style={{ background: "rgba(255,255,255,0)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0)"}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-base font-semibold flex items-center gap-2 text-[#F4F7FF]">
                            <BookOpen className="w-4 h-4 text-[#00E5FF]" />
                            Implementation Guides
                        </h1>
                    </div>
                    <a
                        href="https://docs.google.com/document/d/1-BDkFocpe3M5zvcar2usO_On3hZ0P3DhoXhbq1hi-1k/edit?tab=t.pj3ujvxwo1qp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm transition-colors text-[#00E5FF] hover:text-white"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Latest version
                    </a>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">

                {/* Page title */}
                <div className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00E5FF]">Resources</span>
                    <h2 className="text-3xl sm:text-4xl font-semibold text-[#F4F7FF] leading-tight">
                        Setup Guides
                    </h2>
                    <p className="text-[#94A3B8] text-base max-w-xl">
                        Step-by-step guides to get your TedOS system live. Select a guide from the list to view or download.
                    </p>
                </div>

                {/* Main layout */}
                <div className="flex flex-col lg:flex-row gap-6 min-h-[700px]">

                    {/* Sidebar */}
                    <div className="w-full lg:w-72 lg:flex-shrink-0 flex flex-col gap-2 rounded-2xl p-4"
                        style={{ background: "#020D1F", border: "1px solid rgba(0,229,255,0.08)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4a5a6a] px-3 mb-1">
                            Guides
                        </p>
                        {GUIDES.map((guide) => {
                            const Icon = guide.icon;
                            const isActive = activeGuide.id === guide.id;
                            return (
                                <button
                                    key={guide.id}
                                    onClick={() => setActiveGuide(guide)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer"
                                    style={isActive
                                        ? { background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)", color: "#F4F7FF" }
                                        : { border: "1px solid transparent", color: "#94A3B8" }
                                    }
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                                >
                                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#00E5FF]" : ""}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isActive ? "text-[#F4F7FF]" : ""}`}>
                                            {guide.title}
                                        </p>
                                        <p className="text-xs text-[#4a5a6a] truncate mt-0.5">{guide.description}</p>
                                    </div>
                                    {isActive && <ChevronRight className="w-4 h-4 text-[#00E5FF] flex-shrink-0" />}
                                </button>
                            );
                        })}

                        {/* Download */}
                        <div className="mt-auto pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <a
                                href={activeGuide.pdfPath}
                                download={`${activeGuide.title.replace(/\s+/g, '_')}.pdf`}
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                                style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)", color: "#00E5FF" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,229,255,0.15)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(0,229,255,0.08)"}
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </a>
                        </div>
                    </div>

                    {/* PDF Viewer */}
                    <div className="flex-1 min-h-[500px] lg:min-h-0 rounded-2xl overflow-hidden flex flex-col"
                        style={{ background: "#020D1F", border: "1px solid rgba(0,229,255,0.08)" }}>

                        {/* Title bar */}
                        <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            {React.createElement(activeGuide.icon, { className: "w-4 h-4 text-[#00E5FF]" })}
                            <span className="text-sm font-semibold text-[#F4F7FF]">{activeGuide.title}</span>
                            <a
                                href={activeGuide.pdfPath}
                                download={`${activeGuide.title.replace(/\s+/g, '_')}.pdf`}
                                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", color: "#00E5FF" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,229,255,0.15)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(0,229,255,0.08)"}
                            >
                                <Download className="w-3 h-3" />
                                Download
                            </a>
                        </div>

                        {/* PDF */}
                        <div className="flex-1 relative">
                            <object
                                key={activeGuide.id}
                                data={`${activeGuide.pdfPath}#view=FitH&toolbar=1`}
                                type="application/pdf"
                                className="w-full h-full absolute inset-0 border-0"
                            >
                                <div className="flex flex-col items-center justify-center h-full gap-5 text-[#94A3B8]">
                                    <p className="text-sm">Your browser cannot display this PDF inline.</p>
                                    <a
                                        href={activeGuide.pdfPath}
                                        download={`${activeGuide.title.replace(/\s+/g, '_')}.pdf`}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                                        style={{ background: "#00E5FF", color: "#00031C" }}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download to view
                                    </a>
                                </div>
                            </object>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
