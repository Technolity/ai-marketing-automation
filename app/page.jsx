// app/page.jsx
"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, MessageSquare, Layers, Shield, Rocket } from "lucide-react";

export default function Home() {
  const prefersReducedMotion = useReducedMotion();

  const fadeUp = (delay = 0) => ({
    initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0.15 : 0.55, delay: prefersReducedMotion ? 0 : delay, ease: "easeOut" }
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-x-hidden px-6 pt-20">
      {/* Single centered ambient glow — not a triangle */}
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[700px] h-[600px] bg-cyan/8 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Hero */}
      <div className="max-w-5xl text-center relative z-10">

        {/* Eyebrow */}
        <motion.p
          {...fadeUp(0)}
          className="text-xs font-semibold uppercase tracking-widest text-cyan/60 mb-6"
        >
          AI-Powered Business Builder
        </motion.p>

        <motion.h1
          {...fadeUp(0.08)}
          className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white tracking-tight leading-tight"
        >
          Your Business <br />
          <span className="text-cyan text-glow">Built For You</span> in
          <span className="text-cyan text-glow"> 60 Minutes</span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.16)}
          className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed"
        >
          Build your complete <span className="text-cyan font-medium">marketing system</span> — message, program, sales scripts &amp; funnel — in minutes.
        </motion.p>

        {/* CTA */}
        <motion.div {...fadeUp(0.24)} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/auth/login">
            <motion.button
              whileHover={prefersReducedMotion ? {} : { scale: 1.02, boxShadow: "0 0 28px rgba(0, 229, 255, 0.4)" }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              className="bg-cyan text-black px-10 py-4 text-lg font-bold rounded-full border border-cyan/30 transition-all duration-200 flex items-center gap-3 relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:ring-offset-2 focus:ring-offset-dark"
            >
              <Rocket className="w-5 h-5" />
              <span className="relative z-10 font-black">Launch TED OS →</span>
              <div className="absolute inset-0 bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </motion.button>
          </Link>
        </motion.div>

        <motion.p
          {...fadeUp(0.30)}
          className="text-sm text-gray-500 font-medium tracking-wide uppercase"
        >
          Zero setup • Answer 20 questions • Launch in minutes
        </motion.p>
      </div>

      {/* Feature Cards */}
      <motion.div
        {...fadeUp(0.42)}
        className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4"
      >
        {[
          { icon: <MessageSquare className="w-6 h-6 text-cyan" />, title: "Craft Your Message", desc: "Discover your million-dollar message that attracts your ideal clients" },
          { icon: <Layers className="w-6 h-6 text-cyan" />, title: "Build Your Program", desc: "Structure your signature offer and high-ticket program" },
          { icon: <Sparkles className="w-6 h-6 text-cyan" />, title: "Launch Your Funnel", desc: "Generate complete sales copy, emails, and marketing content" }
        ].map((feature, i) => (
          <div key={i} className="glass-card p-10 rounded-2xl group">
            <div className="mb-6 w-12 h-12 rounded-xl bg-cyan/5 border border-cyan/10 flex items-center justify-center">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Admin Portal Link — subtle footer anchor */}
      <motion.div
        {...fadeUp(0.9)}
        className="mt-20 mb-10"
      >
        <Link href="/admin/login">
          <button className="flex items-center gap-2 px-6 py-3 bg-transparent border border-subtle hover:border-cyan/50 text-gray-500 hover:text-cyan rounded-full transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-cyan/30">
            <Shield className="w-4 h-4" />
            Admin Portal
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
