"use client";
import { motion } from "framer-motion";
import { ClipboardList, Cpu, Rocket } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

const STEPS = [
  { num: "01", Icon: ClipboardList, title: "Answer 20 Questions",   body: "A 5-minute intake about your business, offer, target audience, and goals. No tech knowledge needed — just talk about what you do." },
  { num: "02", Icon: Cpu,           title: "AI Builds Everything",  body: "TedOS generates your VSL script, email sequences, ad campaigns, funnel copy, appointment scripts, and CRM — simultaneously."       },
  { num: "03", Icon: Rocket,        title: "Launch in 60 Minutes",  body: "Everything is deployed into your Builder account. Your complete business system is live and ready to generate revenue."        },
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.13 } } };
const card      = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } } };

const CARD_STYLE = {
  background  : "#020D1F",
  border      : "1px solid rgba(0,229,255,0.12)",
  borderRadius: "16px",
  boxShadow   : "rgba(0,229,255,0.06) 0px 0px 32px 0px",
};

export default function HowToUseSection() {
  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-20 md:py-[120px] relative section-glow-center grid-bg"
      style={{ background: "#00031C" }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.1)] to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-8">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-10 md:mb-16"
        >
          <SectionLabel text="How to Use" />
          <h2 className="font-poppins font-medium text-[#F4F7FF] tracking-tight mb-4" style={{ fontSize: "clamp(32px,4vw,48px)" }}>
            Easy as 1, 2, 3
          </h2>
          <p className="text-[#94A3B8] font-poppins font-normal text-base max-w-xl mx-auto leading-relaxed">
            We dive deep into your business to build a complete system — deployed and ready to generate revenue.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 relative"
        >
          {/* Dashed connector line (desktop) */}
          <div className="hidden md:block absolute top-14 left-[33%] right-[33%] h-px border-t border-dashed border-[rgba(0,229,255,0.2)] z-0" />

          {STEPS.map((step) => {
            const { Icon } = step;
            return (
              <motion.div
                key={step.num}
                variants={card}
                className="relative group cursor-default"
                style={CARD_STYLE}
              >
                {/* Decorative bg number */}
                <span
                  className="absolute bottom-3 right-4 font-poppins font-medium select-none pointer-events-none"
                  style={{ fontSize: "80px", lineHeight: 1, color: "rgba(0,229,255,0.04)", zIndex: 0 }}
                >
                  {step.num}
                </span>

                {/* Hover top glow */}
                <div className="absolute top-0 inset-x-0 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-t-2xl"
                  style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.12), transparent 70%)" }} />

                <div className="relative z-10 p-7">
                  {/* Step badge + icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
                      <Icon className="w-5 h-5 text-[#00E5FF]" />
                    </div>
                    <span className="text-[#00E5FF] text-xs font-poppins font-medium tracking-wider px-3 py-1 rounded-full" style={{ background: "rgba(0,229,255,0.08)" }}>
                      {step.num}
                    </span>
                  </div>

                  <h3 className="font-poppins font-medium text-[#F4F7FF] text-xl mb-3 leading-tight">{step.title}</h3>
                  <p className="font-poppins font-normal text-[#94A3B8] text-sm leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center text-[#4B5563] text-sm font-poppins mt-12 uppercase tracking-widest"
        >
          Total time: Under 60 minutes &nbsp;•&nbsp; Zero technical knowledge required
        </motion.p>
      </div>
    </section>
  );
}
