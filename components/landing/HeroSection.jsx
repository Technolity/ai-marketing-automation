"use client";
import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { Users, TrendingUp, Zap } from "lucide-react";
import HeroSlideshow from "./HeroSlideshow";

// Dynamically imported so ogl/WebGL is excluded from the initial JS bundle
const Balatro = dynamic(() => import("@/components/ui/Balatro"), { ssr: false });

const STATS = [
  { Icon: Users,      value: "1,200+", label: "Businesses Built"  },
  { Icon: Zap,        value: "60 min", label: "Avg Deploy Time"   },
  { Icon: TrendingUp, value: "94%",    label: "Client Retention"  },
];


const fadeUp = {
  hidden : { opacity: 0, y: 28 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.75, delay: d, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

export default function HeroSection() {
  const sectionRef = useRef(null);

  /* Scroll-driven fade: Balatro fades out as user scrolls 0% → 50% through the hero */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const balatraOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen w-full overflow-hidden grid-bg flex items-start md:items-center"
      style={{ background: "#00031C" }}
    >
      {/* ── Balatro WebGL background (scroll-fades out) ── */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ opacity: balatraOpacity, willChange: "opacity" }}
      >
        <Balatro
          spinRotation={-2}
          spinSpeed={7}
          color1="#1ec2eb"
          color2="#030507"
          color3="#162325"
          contrast={3.5}
          lighting={0.4}
          spinAmount={0.25}
          pixelFilter={700}
          mouseInteraction={false}
          style={{ width: "100%", height: "100%" }}
        />

        {/* Vignette: darkens all four edges so Balatro blends into #00031C */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, transparent 28%, rgba(0,3,28,0.55) 58%, rgba(0,3,28,0.92) 80%, #00031C 100%)",
          }}
        />

        {/* Bottom fade: smooth dissolve into the next section */}
        <div
          className="absolute bottom-0 inset-x-0 h-[45%]"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(0,3,28,0.6) 40%, rgba(0,3,28,0.92) 75%, #00031C 100%)",
          }}
        />

        {/* Top fade: keeps navbar area clean */}
        <div
          className="absolute top-0 inset-x-0 h-32"
          style={{
            background: "linear-gradient(to bottom, #00031C 0%, transparent 100%)",
          }}
        />

        {/* Left / right edge fades */}
        <div
          className="absolute inset-y-0 left-0 w-24"
          style={{
            background: "linear-gradient(to right, #00031C 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-24"
          style={{
            background: "linear-gradient(to left, #00031C 0%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* Hero glow overlay */}
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
