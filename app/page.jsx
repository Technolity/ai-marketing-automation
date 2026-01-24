// app/page.jsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare, Layers, Shield, Rocket } from "lucide-react";

export default function Home() {
  // Simple landing page - no auth checks, no redirects
  // Users click buttons to go where they need to go

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-x-hidden px-6 pt-20">
      {/* Background Glows - Cyan/Ice theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan/8 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cyan/12 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-5xl text-center relative z-10"
      >

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white tracking-tight leading-tight drop-shadow-2xl">
          Your Business <br />
          <span className="text-cyan text-glow">Built For You</span> in
          <span className="text-cyan text-glow-lg"> 60 Minutes</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
          Build your <span className="text-cyan font-medium">message</span>, <span className="text-cyan font-medium">program</span>, <span className="text-cyan font-medium">sales system</span> & <span className="text-cyan font-medium">marketing funnel</span> — in minutes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/auth/login">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(0, 229, 255, 0.8)" }}
              whileTap={{ scale: 0.98 }}
              className="bg-cyan text-black px-16 py-6 text-2xl font-bold rounded-full shadow-glow-xl transition-all duration-300 border border-cyan relative overflow-hidden group flex items-center gap-3"
            >
              <Rocket className="w-6 h-6" />
              <span className="relative z-10 font-black">Launch TED OS →</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </motion.button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Zero setup • Answer 20 questions • Launch in minutes</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4"
      >
        {[
          { icon: <MessageSquare className="w-6 h-6 text-cyan" />, title: "Craft Your Message", desc: "Discover your million-dollar message that attracts your ideal clients" },
          { icon: <Layers className="w-6 h-6 text-cyan" />, title: "Build Your Program", desc: "Structure your signature offer and high-ticket program" },
          { icon: <Sparkles className="w-6 h-6 text-cyan" />, title: "Launch Your Funnel", desc: "Generate complete sales copy, emails, and marketing content" }
        ].map((feature, i) => (
          <div key={i} className="glass-card p-10 rounded-2xl hover:border-cyan/50 transition-all duration-300 group hover:-translate-y-2 hover:shadow-glow-lg">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
            <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Admin Portal Link - Subtle at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-20 mb-10"
      >
        <Link href="/admin/login">
          <button className="flex items-center gap-2 px-6 py-3 bg-transparent border border-[#2a2a2d] hover:border-cyan/50 text-gray-500 hover:text-cyan rounded-full transition-all text-sm">
            <Shield className="w-4 h-4" />
            Admin Portal
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
