"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Play, X, ArrowLeft, PlayCircle } from "lucide-react";
import { GUIDE_VIDEOS } from "@/lib/guideVideos";

/**
 * Guide to TedOS — video tutorials gallery.
 *
 * Data source: lib/guideVideos.js (GUIDE_VIDEOS) — the single registry. We do NOT
 * duplicate any video metadata here; we only group the existing keys into categories.
 *
 * Grouping note: guideVideos.js has no explicit `category` field, so categories are
 * derived from the registry's comment blocks / key naming. The CATEGORIES array below
 * lists the GUIDE_VIDEOS keys per category; any registry key not listed is rendered
 * under "More guides" so nothing is silently dropped if the registry grows.
 */
const CATEGORIES = [
    {
        id: "getting-started",
        label: "Getting Started",
        blurb: "Orient yourself before you build.",
        keys: ["welcomeToTedos", "createMarketingEngine", "howToBuild"],
    },
    {
        id: "intake",
        label: "Intake — The 20 Questions",
        blurb: "Answer the questions that power your engine.",
        keys: ["uniqueAdvantage", "storyFramework", "testimonialsGuide", "programService"],
    },
    {
        id: "vault-phases",
        label: "Vault Phases",
        blurb: "Understand each phase of your asset vault.",
        keys: ["phaseOne", "phaseTwo"],
    },
    {
        id: "sections",
        label: "Vault Section Guides",
        blurb: "How to use every generated asset.",
        keys: [
            "idealClient",
            "message",
            "story",
            "offerPricing",
            "freeGift",
            "vsl",
            "bio",
            "ads",
            "emailCampaigns",
            "smsFollowUp",
            "appointmentReminders",
        ],
    },
];

// Build display groups from the registry so titles/descriptions/ids stay single-sourced.
function buildGroups() {
    const used = new Set();
    const groups = CATEGORIES.map((cat) => ({
        ...cat,
        videos: cat.keys
            .filter((key) => {
                if (GUIDE_VIDEOS[key]) {
                    used.add(key);
                    return true;
                }
                return false;
            })
            .map((key) => ({ key, ...GUIDE_VIDEOS[key] })),
    })).filter((cat) => cat.videos.length > 0);

    // Catch any registry keys not assigned above so the gallery never drops content.
    const leftover = Object.keys(GUIDE_VIDEOS).filter((key) => !used.has(key));
    if (leftover.length > 0) {
        groups.push({
            id: "more",
            label: "More Guides",
            blurb: "Additional tutorials.",
            videos: leftover.map((key) => ({ key, ...GUIDE_VIDEOS[key] })),
        });
    }
    return groups;
}

export default function GuideToTedosPage() {
    const prefersReducedMotion = useReducedMotion();
    const [activeVideo, setActiveVideo] = useState(null);

    const groups = buildGroups();
    const totalCount = groups.reduce((sum, g) => sum + g.videos.length, 0);

    return (
        <div className="relative min-h-screen bg-[#0e0e0f] text-white font-poppins overflow-hidden">
            {/* Ambient cyan glow — matches introduction page atmosphere */}
            <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[min(720px,90vw)] w-[min(720px,90vw)] rounded-full bg-cyan/5 blur-[140px]" />

            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0e0e0f]/85 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-[#111213] text-gray-400 transition-colors hover:text-white"
                            aria-label="Back to dashboard"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4 text-cyan" />
                            <h1 className="text-base font-semibold text-white">Guide to TedOS</h1>
                        </div>
                    </div>
                    <Link
                        href="/guide"
                        className="hidden items-center gap-1.5 text-sm text-cyan transition-colors hover:text-white sm:inline-flex"
                    >
                        Setup PDFs
                    </Link>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12">
                {/* Page intro */}
                <motion.div
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mb-12 max-w-2xl"
                >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan">
                        Video Library
                    </span>
                    <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                        Learn TedOS, one video at a time.
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-white/60">
                        {totalCount} short walkthroughs covering setup, the 20-question intake, and every
                        asset in your vault. Pick a guide below and it opens right here.
                    </p>
                </motion.div>

                {/* Category sections */}
                <div className="space-y-14">
                    {groups.map((group, groupIndex) => (
                        <section key={group.id} aria-labelledby={`cat-${group.id}`}>
                            <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/[0.06] pb-3">
                                <div>
                                    <h3
                                        id={`cat-${group.id}`}
                                        className="text-lg font-bold tracking-tight text-white sm:text-xl"
                                    >
                                        {group.label}
                                    </h3>
                                    <p className="mt-1 text-sm text-white/45">{group.blurb}</p>
                                </div>
                                <span className="shrink-0 rounded-full border border-white/[0.07] bg-[#111213] px-2.5 py-1 text-[11px] font-medium text-white/50">
                                    {group.videos.length} {group.videos.length === 1 ? "video" : "videos"}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {group.videos.map((video, i) => (
                                    <motion.button
                                        key={video.key}
                                        type="button"
                                        onClick={() => setActiveVideo(video)}
                                        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-40px" }}
                                        transition={{
                                            duration: 0.4,
                                            ease: "easeOut",
                                            delay: prefersReducedMotion ? 0 : Math.min(i * 0.05, 0.3),
                                        }}
                                        className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#2a2a2d] bg-[#141416] text-left transition-colors duration-200 hover:border-cyan/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e0f]"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                                alt={video.title}
                                                loading="lazy"
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 transition-colors duration-200 group-hover:bg-black/25" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan/90 shadow-lg shadow-cyan/30 transition-transform duration-200 group-hover:bg-cyan group-hover:scale-110">
                                                    <Play className="ml-0.5 h-6 w-6 fill-black text-black" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex flex-1 flex-col gap-1.5 p-4">
                                            <p className="text-sm font-semibold leading-snug text-white">
                                                {video.title}
                                            </p>
                                            {video.description && (
                                                <p className="text-xs leading-relaxed text-white/45 line-clamp-2">
                                                    {video.description}
                                                </p>
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            {/* Modal player — youtube-nocookie + title mask, matching introduction page */}
            <AnimatePresence>
                {activeVideo && (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setActiveVideo(null)}
                            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 40, scale: prefersReducedMotion ? 1 : 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 30, scale: prefersReducedMotion ? 1 : 0.97 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center p-4"
                        >
                            <div
                                className="pointer-events-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[#2a2a2d] bg-[#0e0e0f] shadow-2xl shadow-black/60"
                                role="dialog"
                                aria-modal="true"
                                aria-label={activeVideo.title}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[#2a2a2d] px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/10">
                                            <Play className="h-3.5 w-3.5 fill-cyan text-cyan" />
                                        </div>
                                        <div>
                                            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan">
                                                Tutorial Guide
                                            </p>
                                            <h3 className="text-base font-bold leading-tight text-white">
                                                {activeVideo.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveVideo(null)}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                                        aria-label="Close video"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Video */}
                                <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                    <iframe
                                        src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?rel=0&modestbranding=1&autoplay=1&controls=0&iv_load_policy=3`}
                                        title={activeVideo.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        className="absolute inset-0 h-full w-full border-0"
                                    />
                                    {/* Mask top YouTube title area */}
                                    <div
                                        className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-14"
                                        style={{ background: "linear-gradient(to bottom, #0e0e0f 30%, transparent 100%)" }}
                                    />
                                </div>

                                {/* Footer */}
                                {activeVideo.description && (
                                    <div className="flex items-center justify-between gap-4 border-t border-[#2a2a2d] px-5 py-3">
                                        <p className="text-xs text-gray-500">{activeVideo.description}</p>
                                        <button
                                            type="button"
                                            onClick={() => setActiveVideo(null)}
                                            className="flex-shrink-0 rounded-lg border border-[#2a2a2d] bg-[#1b1b1d] px-4 py-1.5 text-xs font-medium text-gray-400 transition-all hover:bg-[#2a2a2d] hover:text-white"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
