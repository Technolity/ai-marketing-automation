// components/Loader.jsx
"use client";
import { motion } from "framer-motion";

export default function Loader({ message = "Generating your marketing system..." }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 border-4 border-gray-800 rounded-full"
        />
        <motion.div
          className="absolute inset-0 border-4 border-transparent border-t-accentRed rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-3 bg-accentRed/20 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-2xl font-semibold text-white">{message}</p>
        <p className="text-gray-400">This may take 30-60 seconds...</p>
      </div>
      
      <div className="flex space-x-2">
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-accentRed rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: delay
            }}
          />
        ))}
      </div>
    </div>
  );
}
