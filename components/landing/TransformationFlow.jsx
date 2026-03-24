"use client";
import { Lightbulb, Cpu, Rocket } from "lucide-react";
import { SectionLabel } from "./SectionLabel";
import { motion } from "framer-motion";

const STEPS = [
  {
    icon: Lightbulb,
    number: "01",
    label: "Your Idea",
    desc: "You have a business concept and a target market in mind.",
    iconColor: "text-amber-400",
    bg: "bg-amber-400/8 border-amber-400/18",
    dotColor: "bg-amber-400",
  },
  {
    icon: Cpu,
    number: "02",
    label: "AI Processing",
    desc: "TedOS analyzes your answers and builds every asset simultaneously.",
    iconColor: "text-cyan",
    bg: "bg-cyan/8 border-cyan/18",
    dotColor: "bg-cyan",
  },
  {
    icon: Rocket,
    number: "03",
    label: "Ready System",
    desc: "A complete, deployed business system — live in 60 minutes.",
    iconColor: "text-emerald-400",
    bg: "bg-emerald-400/8 border-emerald-400/18",
    dotColor: "bg-emerald-400",
  },
];

const container = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.14 } },
};

const stepAnim = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function TransformationFlow() {
  return (
    <section className="py-16 sm:py-20 md:py-[120px] relative" style={{ background: "#00031C" }}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.1)] to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-10 md:mb-24"
        >
          <SectionLabel text="How It Works" />
          <h2 className="font-poppins font-medium text-[#F4F7FF] tracking-tight mb-4" style={{ fontSize: "clamp(32px,4vw,48px)" }}>
            Idea to System in 60 Minutes
          </h2>
          <p className="text-[#94A3B8] font-poppins text-base max-w-lg mx-auto">
            Three steps. No complexity. No agency required.
          </p>
        </motion.div>

        {/* Step flow */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 md:gap-0"
        >
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.label}
                className="flex flex-col md:flex-row items-start md:items-center w-full md:w-auto"
              >
                {/* Step card */}
                <motion.div
                  variants={stepAnim}
                  className="flex flex-col items-start text-left md:max-w-[180px] lg:max-w-[200px]"
                >
                  {/* Step number */}
                  <span className="text-[11px] font-bold text-gray-600 tracking-widest mb-3">
                    {step.number}
                  </span>

                  {/* Icon box */}
                  <div
                    className={`w-16 h-16 rounded-2xl border ${step.bg} flex items-center justify-center mb-5`}
                  >
                    <Icon className={`w-8 h-8 ${step.iconColor}`} />
                  </div>

                  <h3 className="font-poppins font-medium text-[#F4F7FF] text-lg mb-2">
                    {step.label}
                  </h3>
                  <p className="font-poppins text-[#94A3B8] text-sm leading-relaxed">{step.desc}</p>
                </motion.div>

                {/* Connector */}
                {i === 0 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.05 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: "easeInOut" }}
                    style={{ transformOrigin: "left center" }}
                    className="hidden md:block flex-1 mx-6 lg:mx-10 relative"
                  >
                    <div className="h-px bg-gradient-to-r from-amber-400/30 via-cyan/40 to-transparent" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan/50" />
                  </motion.div>
                )}
                {i === 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.05 }}
                    transition={{ duration: 0.5, delay: 0.45, ease: "easeInOut" }}
                    style={{ transformOrigin: "left center" }}
                    className="hidden md:block flex-1 mx-6 lg:mx-10 relative"
                  >
                    <div className="h-px bg-gradient-to-r from-cyan/40 via-emerald-400/40 to-transparent" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
