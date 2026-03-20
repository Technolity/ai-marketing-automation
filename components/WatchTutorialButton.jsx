"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X } from "lucide-react";
import { GUIDE_VIDEOS } from "@/lib/guideVideos";

/**
 * WatchTutorialButton
 *
 * A self-contained "Watch Tutorial" button that opens a TedOS-styled
 * modal overlay with an embedded YouTube video.
 *
 * Props:
 * - videoKey: string — key from GUIDE_VIDEOS (e.g. "idealClient")
 * - className: string — optional extra classes on the button
 * - size: "sm" | "md" — button size, defaults to "md"
 */
export default function WatchTutorialButton({ videoKey, className = "", size = "md" }) {
    const [isOpen, setIsOpen] = useState(false);

    const video = GUIDE_VIDEOS[videoKey];
    if (!video) return null;

    const embedUrl = `https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1&autoplay=1&controls=0&iv_load_policy=3&fs=0`;

    const sizeClasses = size === "sm"
        ? "px-3 py-1.5 text-xs gap-1.5"
        : "px-4 py-2 text-sm gap-2";

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`
                    inline-flex items-center font-semibold rounded-lg border transition-all
                    bg-white/5 hover:bg-cyan/10 text-gray-300 hover:text-cyan
                    border-white/10 hover:border-cyan/30 hover:scale-[1.02] active:scale-[0.98]
                    ${sizeClasses} ${className}
                `}
            >
                <Play className={size === "sm" ? "w-3 h-3 fill-current" : "w-3.5 h-3.5 fill-current"} />
                Watch Tutorial
            </button>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
                        />

                        {/* Modal Panel */}
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, y: 40, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.97 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none"
                        >
                            <div
                                className="pointer-events-auto w-full max-w-3xl bg-[#0e0e0f] rounded-2xl border border-[#2a2a2d] shadow-2xl shadow-black/60 overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2d]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center flex-shrink-0">
                                            <Play className="w-3.5 h-3.5 text-cyan fill-cyan" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-cyan uppercase tracking-widest mb-0.5">
                                                Tutorial Guide
                                            </p>
                                            <h3 className="text-white font-bold text-base leading-tight">
                                                {video.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all flex-shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Video Embed */}
                                <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                    <iframe
                                        src={embedUrl}
                                        title={video.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        className="absolute inset-0 w-full h-full border-0"
                                    />
                                    {/* Cover YouTube title overlay on hover */}
                                    <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none z-10" style={{ background: 'linear-gradient(to bottom, #0e0e0f 0%, transparent 100%)' }} />
                                </div>

                                {/* Modal Footer */}
                                {video.description && (
                                    <div className="px-5 py-3 border-t border-[#2a2a2d] flex items-center justify-between gap-4">
                                        <p className="text-gray-500 text-xs">{video.description}</p>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="flex-shrink-0 px-4 py-1.5 rounded-lg bg-[#1b1b1d] hover:bg-[#2a2a2d] text-gray-400 hover:text-white text-xs font-medium transition-all border border-[#2a2a2d]"
                                        >
                                            Close & Continue
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
