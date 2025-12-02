// components/ProgressIndicator.jsx
"use client";
import { motion } from "framer-motion";

export default function ProgressIndicator({ current, total }) {
  const progress = (current / total) * 100;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Step {current} of {total}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-accentRed to-crimson shadow-glow-sm"
          />
        </div>
      </div>
    </div>
  );
}
