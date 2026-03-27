"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap } from "@/lib/icons";
import { SectionLabel } from "./SectionLabel";

const PLANS = [
  {
    name     : "Starter",
    price_m  : "$297",
    price_y  : "$255",       // $3,057 / 12
    total_y  : "$3,057",
    savings_y: "Save $507/yr",
    desc     : "For solopreneurs launching their first system.",
    features : [
      "1 Business Build",
      "VSL Script Generator",
      "Email Sequence (5 emails)",
      "Facebook Ad Copy",
      "Basic CRM Setup",
      "Builder Integration",
      "Email Support",
    ],
    cta     : "Get Started",
    featured: false,
    links: {
      standard_m  : "https://link.fastpaydirect.com/payment-link/69a8a2a47fba054fe45f8385",
      standard_y  : "https://link.fastpaydirect.com/payment-link/69a9b20298578f54d2119e3b",
      activation_m: "https://link.fastpaydirect.com/payment-link/69a74df58a96f7d2c3c90883",
      activation_y: "https://link.fastpaydirect.com/payment-link/69b2d4a492346e17038ac377",
    },
  },
  {
    name     : "Growth",
    price_m  : "$497",
    price_y  : "$447",       // $5,367 / 12
    total_y  : "$5,367",
    savings_y: "Save $597/yr",
    desc     : "The full TedOS experience — everything built and deployed.",
    features : [
      "5 Business Builds / mo",
      "Full Funnel Suite (VSL, Emails, SMS, Ads)",
      "Appointment Scripts + Setter Training",
      "Sales Scripts + Objection Handling",
      "Full CRM Automation",
      "Priority AI Queue",
      "Priority Support",
      "White-label Output",
    ],
    cta     : "Start Today",
    featured: true,
    links: {
      standard_m  : "https://link.fastpaydirect.com/payment-link/69a9b3c6fc564f53604bb9c0",
      standard_y  : "https://link.fastpaydirect.com/payment-link/69a9b3ed2211b7aee402c42b",
      activation_m: "https://link.fastpaydirect.com/payment-link/69af10d71e612111857be218",
      activation_y: "https://link.fastpaydirect.com/payment-link/69b03e4b0518ccea430b8689",
    },
  },
  {
    name     : "Scale",
    price_m  : "$997",
    price_y  : "$897",       // $10,767 / 12
    total_y  : "$10,767",
    savings_y: "Save $1,197/yr",
    desc     : "For agencies building for multiple clients at scale.",
    features : [
      "Unlimited Business Builds",
      "All Growth features included",
      "Team Seats (up to 10)",
      "Client Dashboard Access",
      "Bulk Export + White-label",
      "API Access",
      "Dedicated Account Manager",
    ],
    cta     : "Contact Sales",
    featured: false,
    links: {
      standard_m  : "https://link.fastpaydirect.com/payment-link/69a9b3d470f9d56b9a26d150",
      standard_y  : "https://link.fastpaydirect.com/payment-link/69a9b3dd2211b7922b02c41d",
      activation_m: "https://link.fastpaydirect.com/payment-link/69b025c984b2d75a9a65881f",
      activation_y: "https://link.fastpaydirect.com/payment-link/69b2d4f98e8f54b631536b69",
    },
  },
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const cardAnim  = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } } };

export default function PricingSection() {
  const [yearly,     setYearly]     = useState(false);
  const [activation, setActivation] = useState(false);

  return (
    <section
      id="pricing"
      className="py-16 sm:py-20 md:py-[120px] relative overflow-hidden section-glow-center"
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
            Every plan includes the full AI build. Add activation for a hands-on setup by our team.
          </p>

          {/* Plan type toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full"
              style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.2)" }}
            >
              <button
                onClick={() => setActivation(false)}
                className="px-5 py-2 rounded-full text-sm font-poppins font-semibold transition-all duration-200 cursor-pointer"
                style={!activation ? { background: "#00E5FF", color: "#00031C" } : { color: "#94A3B8" }}
              >
                Standard
              </button>
              <button
                onClick={() => setActivation(true)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-poppins font-semibold transition-all duration-200 cursor-pointer"
                style={activation
                  ? { background: "#7DD3FC", color: "#00031C" }
                  : { color: "#94A3B8" }
                }
              >
                <Zap className="w-3.5 h-3.5" />
                With Activation
              </button>
            </div>

            {/* Billing toggle */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full"
              style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.2)" }}
            >
              <button
                onClick={() => setYearly(false)}
                className="px-5 py-2 rounded-full text-sm font-poppins font-semibold transition-all duration-200 cursor-pointer"
                style={!yearly ? { background: "#00E5FF", color: "#00031C" } : { color: "#94A3B8" }}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-poppins font-semibold transition-all duration-200 cursor-pointer"
                style={yearly ? { background: "#00E5FF", color: "#00031C" } : { color: "#94A3B8" }}
              >
                Annual <span className="text-[10px] opacity-75">save ~10%</span>
              </button>
            </div>
          </div>

          {/* Activation description */}
          {activation && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-poppins text-xs"
              style={{ background: "rgba(125,211,252,0.08)", border: "1px solid rgba(125,211,252,0.25)", color: "#7DD3FC" }}
            >
              <Zap className="w-3 h-3 shrink-0" />
              Our team personally sets up your entire TedOS system — zero tech effort on your end.
            </motion.div>
          )}
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardAnim}
              className={plan.featured ? "lg:scale-[1.04] z-10" : ""}
            >
              {plan.featured ? (
                <div className="p-px rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.6), rgba(0,229,255,0.2), rgba(0,229,255,0.6))" }}>
                  <PlanCard plan={plan} yearly={yearly} activation={activation} isInner />
                </div>
              ) : (
                <PlanCard plan={plan} yearly={yearly} activation={activation} />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PlanCard({ plan, yearly, activation, isInner = false }) {
  const price = yearly ? plan.price_y : plan.price_m;
  const href  = activation
    ? (yearly ? plan.links.activation_y : plan.links.activation_m)
    : (yearly ? plan.links.standard_y   : plan.links.standard_m);

  const cardStyle = isInner
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
    <div className="p-8" style={cardStyle}>
      {/* Diamond icon on featured */}
      {isInner && (
        <div className="flex justify-center mb-5">
          <div className="w-9 h-9 rotate-45 flex items-center justify-center" style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}>
            <Sparkles className="w-4 h-4 text-[#00E5FF] -rotate-45" />
          </div>
        </div>
      )}

      {/* Activation badge */}
      {activation && (
        <div className="flex justify-start mb-3">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-poppins text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "rgba(125,211,252,0.08)", border: "1px solid rgba(125,211,252,0.25)", color: "#7DD3FC" }}
          >
            <Zap className="w-2.5 h-2.5" />
            Team Setup Included
          </span>
        </div>
      )}

      <h3 className={`font-poppins font-medium text-lg mb-1 ${isInner ? "text-[#00E5FF]" : "text-[#F4F7FF]"}`}>
        {plan.name}
      </h3>
      <p className="text-[#94A3B8] font-poppins text-sm mb-6 leading-relaxed">{plan.desc}</p>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="font-poppins font-medium text-5xl text-[#F4F7FF] tabular-nums leading-none">{price}</span>
          <span className="text-[#94A3B8] font-poppins text-sm mb-1">/ mo</span>
        </div>
        {yearly ? (
          <p className="text-[#00E5FF]/60 font-poppins text-xs mt-2">
            Billed as {plan.total_y}/yr · <span className="text-emerald-400/80">{plan.savings_y}</span>
          </p>
        ) : (
          <p className="text-[#4B5563] font-poppins text-xs mt-2">
            or {plan.total_y}/yr · billed annually
          </p>
        )}

        {/* Setup fee for activation plans */}
        {activation && (
          <div
            className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg"
            style={{ background: "rgba(125,211,252,0.05)", border: "1px solid rgba(125,211,252,0.15)" }}
          >
            <span className="font-poppins text-[11px] text-[#94A3B8]">One-time setup fee</span>
            <span className="font-poppins text-[11px] font-semibold text-[#7DD3FC] tabular-nums">+ $2,000</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <a href={href} target="_blank" rel="noopener noreferrer">
        <button
          className="w-full py-3.5 rounded-full font-poppins font-semibold text-sm transition-all duration-200 cursor-pointer mb-7"
          style={isInner
            ? { background: "#00E5FF", color: "#00031C" }
            : { border: "1px solid rgba(0,229,255,0.4)", color: "#F4F7FF" }
          }
          onMouseEnter={(e) => {
            if (isInner) { e.currentTarget.style.background = "#fff"; }
            else { e.currentTarget.style.borderColor = "rgba(0,229,255,0.7)"; e.currentTarget.style.color = "#00E5FF"; }
          }}
          onMouseLeave={(e) => {
            if (isInner) { e.currentTarget.style.background = "#00E5FF"; }
            else { e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)"; e.currentTarget.style.color = "#F4F7FF"; }
          }}
        >
          {plan.cta} →
        </button>
      </a>

      {/* Features */}
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
