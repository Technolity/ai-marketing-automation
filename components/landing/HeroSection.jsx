"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, TrendingUp, Zap } from "lucide-react";
import HeroSlideshow from "./HeroSlideshow";

const STATS = [
  { Icon: Users, value: "100+", label: "Businesses Built" },
  { Icon: Zap, value: "60 min", label: "Avg Deploy Time" },
  { Icon: TrendingUp, value: "94%", label: "Client Retention" },
];


const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.75, delay: d, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden grid-bg flex items-start md:items-center"
      style={{ background: "#00031C" }}
    >
      {/* ── Aurora ambient background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">

        {/* Orb 1 — large primary, top-left quadrant */}
        <div
          className="hero-orb absolute rounded-full"
          style={{
            width: 860,
            height: 860,
            top: "-18%",
            left: "-10%",
            background: "radial-gradient(circle at center, rgba(0,229,255,0.07) 0%, rgba(0,229,255,0.025) 45%, transparent 70%)",
            animation: "orb-float-1 32s ease-in-out infinite",
          }}
        />

        {/* Orb 2 — medium, bottom-right */}
        <div
          className="hero-orb absolute rounded-full"
          style={{
            width: 620,
            height: 620,
            bottom: "-12%",
            right: "-6%",
            background: "radial-gradient(circle at center, rgba(8,145,178,0.08) 0%, rgba(8,145,178,0.03) 45%, transparent 70%)",
            animation: "orb-float-2 40s ease-in-out infinite",
          }}
        />

        {/* Orb 3 — small accent, upper-right */}
        <div
          className="hero-orb absolute rounded-full"
          style={{
            width: 420,
            height: 420,
            top: "10%",
            right: "12%",
            background: "radial-gradient(circle at center, rgba(0,229,255,0.045) 0%, transparent 65%)",
            animation: "orb-float-3 26s ease-in-out infinite",
          }}
        />

        {/* Bottom dissolve into the next section */}
        <div
          className="absolute bottom-0 inset-x-0 h-[38%]"
          style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(0,3,28,0.75) 65%, #00031C 100%)" }}
        />
      </div>

      {/* Hero glow overlay (right-side radial) */}
      <div className="hero-glow absolute inset-0 pointer-events-none z-[1]" />

      {/* Top border rule */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.2)] to-transparent z-[2]" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-24 sm:pt-[72px] pb-14 sm:pb-20 grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-16">

        {/* ── LEFT: Text ── */}
        <div className="flex flex-col gap-0">

          {/* Section label */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0.1}
            className="flex items-center gap-3 mb-5 sm:mb-7"
          >
            <div className="h-px w-14 bg-gradient-to-r from-transparent to-[rgba(0,229,255,0.5)]" />
            <span className="text-[#00E5FF] text-xs font-poppins font-medium tracking-[0.2em] uppercase">
              A.I. Driven Business Builder
            </span>
            <div className="h-px w-14 bg-gradient-to-l from-transparent to-[rgba(0,229,255,0.5)]" />
          </motion.div>

          {/* H1 — slightly smaller */}
          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={0.2}
            className="font-poppins font-medium text-[#F4F7FF] mb-6"
            style={{ fontSize: "clamp(36px,4vw,52px)", lineHeight: 1.15 }}
          >
            Transform Your Business<br />
            with{" "}
            <span style={{ color: "#00E5FF", textShadow: "0 0 30px rgba(0,229,255,0.4)" }}>
              AI-Powered Solutions
            </span>
          </motion.h1>

          {/* Body */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={0.32}
            className="font-poppins font-normal text-[#94A3B8] text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-md"
          >
            Answer 20 questions about your business. Walk away with a complete,
            deployed marketing system — funnels, scripts, emails, CRM — in 60 minutes.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0.44}
            className="flex flex-col sm:flex-row items-start gap-3 mb-8 sm:mb-10"
          >
            <Link href="/auth/login">
              <button
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-poppins font-semibold text-[#00031C] text-base cursor-pointer transition-all duration-300"
                style={{ background: "#00E5FF", boxShadow: "0px 0px 24px rgba(0,229,255,0.4)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0px 0px 40px rgba(0,229,255,0.6)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#00E5FF"; e.currentTarget.style.boxShadow = "0px 0px 24px rgba(0,229,255,0.4)"; }}
              >
                Launch TedOS →
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-poppins font-medium text-[#F4F7FF] text-base border border-[rgba(0,229,255,0.25)] hover:border-[rgba(0,229,255,0.5)] transition-colors cursor-pointer">
                Watch Demo
              </button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0.56}
            className="flex items-start gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-[rgba(0,229,255,0.08)]"
          >
            {STATS.map(({ Icon, value, label }, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-poppins font-semibold text-[#F4F7FF] text-lg tabular-nums">
                  <Icon className="w-4 h-4 text-[#00E5FF] opacity-70" />
                  {value}
                </div>
                <span className="text-[11px] text-[#4B5563] uppercase tracking-wider font-poppins">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT: Product Slideshow ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="hidden lg:flex items-center justify-center"
        >
          <HeroSlideshow />
        </motion.div>
      </div>

      {/* Bottom scroll hint */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#4B5563] pointer-events-none z-10"
      >
        <span className="text-[9px] uppercase tracking-[0.25em] font-poppins">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-[#4B5563] to-transparent" />
      </motion.div>
    </section>
  );
}
