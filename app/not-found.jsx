"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h1 className="text-9xl font-bold text-cyan mb-4">404</h1>
                <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-cyan hover:brightness-110 text-black font-semibold rounded-lg transition-all"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1b1b1d] hover:bg-[#2a2a2d] border border-[#2a2a2d] text-white font-semibold rounded-lg transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
