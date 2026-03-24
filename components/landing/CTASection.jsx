"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { SectionLabel } from "./SectionLabel";

export default function CTASection() {
  return (
    <section
      className="py-20 md:py-[160px] relative overflow-hidden"
      style={{ background: "#00031C" }}
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.15)] to-transparent" />

      {/* Perspective grid floor */}
      <div className="perspective-grid absolute inset-x-0 bottom-0 h-[300px] pointer-events-none" />

      {/* Radial glow from bottom */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(0,229,255,0.12) 0%, transparent 60%)" }} />

      {/* Light rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { top: "32%", width: "52%", dur: "9s",  delay: "0s"   },
          { top: "62%", width: "38%", dur: "12s", delay: "3.5s" },
        ].map((r, i) => (
          <div key={i} className="absolute left-0 rounded-full" style={{ top: r.top, width: r.width, height: "1.5px", background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.25), transparent)", animation: `raySlide ${r.dur} linear ${r.delay} infinite`, filter: "blur(0.5px)" }} />
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <SectionLabel text="Ready to Start?" />

          <h2 className="font-poppins font-medium text-[#F4F7FF] tracking-tight leading-tight mb-6" style={{ fontSize: "clamp(36px,5vw,64px)" }}>
            Make Your Business<br />
            More Efficient.<br />
            <span style={{ color: "#00E5FF", textShadow: "0 0 30px rgba(0,229,255,0.4)" }}>From This Moment.</span>
          </h2>

          <p className="font-poppins font-normal text-[#94A3B8] text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Get the full TedOS experience. Zero setup. Answer 20 questions.
            Walk away with a complete, deployed marketing system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login">
              <button
                className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-poppins font-semibold text-[#00031C] text-base cursor-pointer transition-all duration-300"
                style={{ background: "#00E5FF", boxShadow: "0px 0px 24px rgba(0,229,255,0.4)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0px 0px 40px rgba(0,229,255,0.6)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#00E5FF"; e.currentTarget.style.boxShadow = "0px 0px 24px rgba(0,229,255,0.4)"; }}
              >
                Launch TedOS →
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-poppins font-medium text-[#F4F7FF] text-base cursor-pointer transition-all duration-200" style={{ border: "1px solid rgba(0,229,255,0.25)" }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(0,229,255,0.5)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(0,229,255,0.25)"}
              >
                Watch Demo
              </button>
            </Link>
          </div>

          <p className="mt-5 text-xs text-[#4B5563] uppercase tracking-wider font-poppins">
            Zero setup • Answer 20 questions • Launch in minutes
          </p>
        </motion.div>

      </div>
    </section>
  );
}
