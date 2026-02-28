"use client";
import { motion } from "framer-motion";
import { Wrench, Clock, ArrowRight } from "lucide-react";

/**
 * MaintenancePage
 *
 * A full-screen maintenance page shown to non-admin users
 * when maintenance mode is enabled by an admin.
 */
export default function MaintenancePage() {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#0a0a0b] flex items-center justify-center overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-cyan/5 via-transparent to-transparent animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-purple-500/5 via-transparent to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative text-center px-6 max-w-lg"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto mb-8 w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan/20 to-purple-500/20 border border-cyan/20 flex items-center justify-center"
                >
                    <Wrench className="w-12 h-12 text-cyan" />
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
                >
                    Under Maintenance
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-gray-400 text-lg mb-8 leading-relaxed"
                >
                    We&apos;re currently performing scheduled maintenance to improve your experience.
                    We&apos;ll be back shortly!
                </motion.p>

                {/* Status indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-[#1b1b1d] border border-[#2a2a2d]"
                >
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                    </span>
                    <span className="text-sm text-gray-300 font-medium">Maintenance in progress</span>
                    <Clock className="w-4 h-4 text-gray-500" />
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="mt-10 text-sm text-gray-600"
                >
                    If you&apos;re an administrator, please{' '}
                    <a
                        href="/admin"
                        className="text-cyan hover:underline inline-flex items-center gap-1"
                    >
                        sign in to the admin portal
                        <ArrowRight className="w-3 h-3" />
                    </a>
                </motion.p>
            </motion.div>
        </div>
    );
}
