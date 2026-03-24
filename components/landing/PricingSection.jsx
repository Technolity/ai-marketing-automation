"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

const PLANS = [
  {
    name    : "Starter",
    price_m : "$97",
    price_y : "$77",
    desc    : "For solopreneurs launching their first system.",
    features: ["1 Business Build","VSL Script Generator","Email Sequence (5 emails)","Facebook Ad Copy","Basic CRM Setup","Builder Integration","Email Support"],
    cta     : "Get Started",
    featured: false,
  },
  {
    name    : "Growth",
    price_m : "$197",
    price_y : "$157",
    desc    : "The full TedOS experience — everything built and deployed.",
    features: ["5 Business Builds / mo","Full Funnel Suite (VSL, Emails, SMS, Ads)","Appointment Scripts + Setter Training","Sales Scripts + Objection Handling","Full CRM Automation","Priority AI Queue","Priority Support","White-label Output"],
    cta     : "Start Free Trial",
    featured: true,
  },
  {
    name    : "Scale",
    price_m : "$497",
    price_y : "$397",
    desc    : "For agencies building for multiple clients at scale.",
    features: ["Unlimited Business Builds","All Growth features included","Team Seats (up to 10)","Client Dashboard Access","Bulk Export + White-label","API Access","Dedicated Account Manager"],
    cta     : "Contact Sales",
    featured: false,
  },
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const cardAnim  = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } } };

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section
      id="pricing"
      className="py-16 sm:py-20 md:py-[120px] relative section-glow-center"
      style={{ background: "#00031C" }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.1)] to-transparent" />

      {/* Perspective grid floor */}
      <div className="perspective-grid absolute inset-x-0 bottom-0 h-[320px] pointer-events-none opacity-70" />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-8 md:mb-12"
        >
          <SectionLabel text="Pricing" />
          <h2 className="font-poppins font-medium text-[#F4F7FF] tracking-tight mb-4" style={{ fontSize: "clamp(32px,4vw,48px)" }}>
            Choose Your Plan
          </h2>
          <p className="text-[#94A3B8] font-poppins text-base max-w-lg mx-auto leading-relaxed mb-8">
            All plans include a 14-day free trial. No credit card required.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full" style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.2)" }}>
            <button
              onClick={() => setYearly(false)}
              className="px-7 py-2 rounded-full text-sm font-poppins font-semibold transition-all duration-200 cursor-pointer"
              style={!yearly ? { background: "#00E5FF", color: "#00031C" } : { color: "#94A3B8" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className="px-7 py-2 rounded-full text-sm font-poppins font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              style={yearly ? { background: "#00E5FF", color: "#00031C" } : { color: "#94A3B8" }}
            >
              Yearly <span className="text-[10px] opacity-75">-20%</span>
            </button>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center"
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardAnim}
              className={plan.featured ? "md:scale-[1.04] z-10" : ""}
            >
              {plan.featured ? (
                /* Featured — gradient border wrapper */
                <div className="p-px rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.6), rgba(0,229,255,0.2), rgba(0,229,255,0.6))" }}>
                  <PlanCard plan={plan} yearly={yearly} isInner />
                </div>
              ) : (
                <PlanCard plan={plan} yearly={yearly} />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PlanCard({ plan, yearly, isInner = false }) {
  const price = yearly ? plan.price_y : plan.price_m;

  const style = isInner
    ? {
        background  : "linear-gradient(160deg, rgba(0,229,255,0.12) 0%, rgba(0,229,255,0.04) 50%, rgba(8,145,178,0.10) 100%)",
        border      : "1px solid rgba(0,229,255,0.3)",
        borderRadius: "calc(1rem - 1px)",
        boxShadow   : "rgba(0,229,255,0.15) 0px 0px 50px 0px, rgba(0,229,255,0.06) 0px 0px 120px 0px inset",
      }
    : {
        background  : "#020D1F",
        border      : "1px solid rgba(0,229,255,0.12)",
        borderRadius: "1rem",
        boxShadow   : "rgba(0,229,255,0.06) 0px 0px 32px 0px",
      };

  return (
    <div className="p-8" style={style}>
      {/* Diamond icon on featured */}
      {isInner && (
        <div className="flex justify-center mb-5">
          <div className="w-9 h-9 rotate-45 flex items-center justify-center" style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}>
            <Sparkles className="w-4 h-4 text-[#00E5FF] -rotate-45" />
          </div>
        </div>
      )}

      <h3 className={`font-poppins font-medium text-lg mb-1 ${isInner ? "text-[#00E5FF]" : "text-[#F4F7FF]"}`}>{plan.name}</h3>
      <p className="text-[#94A3B8] font-poppins text-sm mb-6 leading-relaxed">{plan.desc}</p>

      <div className="mb-6">
        <span className="font-poppins font-medium text-5xl text-[#F4F7FF] tabular-nums">{price}</span>
        <span className="text-[#94A3B8] font-poppins text-sm ml-1">/ mo</span>
        {yearly && <p className="text-[#00E5FF]/60 font-poppins text-xs mt-1">Billed annually — save 20%</p>}
      </div>

      <Link href="/auth/login">
        <button
          className="w-full py-3.5 rounded-full font-poppins font-semibold text-sm transition-all duration-200 cursor-pointer mb-7"
          style={isInner
            ? { background: "#00E5FF", color: "#00031C" }
            : { border: "1px solid rgba(0,229,255,0.4)", color: "#F4F7FF" }
          }
          onMouseEnter={(e) => { if (isInner) e.currentTarget.style.background = "#fff"; }}
          onMouseLeave={(e) => { if (isInner) e.currentTarget.style.background = "#00E5FF"; }}
        >
          {plan.cta} →
        </button>
      </Link>

      <ul className="space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-[#94A3B8] font-poppins">
            <Check size={14} className="text-[#00E5FF] mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
