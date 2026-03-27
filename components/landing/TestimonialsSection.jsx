"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { SectionLabel } from "./SectionLabel";

const TESTIMONIALS = [
  { quote: "I went from zero to a fully deployed funnel, email sequence, and CRM in under an hour. TedOS is the most useful tool I've ever used in my business. Nothing comes close.", name: "Alex Rodriguez",  role: "Digital Marketing Agency Owner", initials: "AR", result: "$47k in new revenue, month 1"      },
  { quote: "Finally an AI tool that actually BUILDS your business instead of just giving you ideas. I handed TedOS my offer and walked away with a complete marketing system. Absolutely game-changing.", name: "Sarah Kim",        role: "Online Business Coach",          initials: "SK", result: "Launch in 58 minutes flat"         },
  { quote: "Saved me $15,000 in agency fees in the first month alone. TedOS did in 60 minutes what would have taken a team of specialists 3 months. I can't imagine running my business without it.", name: "Marcus Johnson",    role: "E-commerce Founder",             initials: "MJ", result: "$15k agency cost eliminated"      },
  { quote: "The quality of the VSL script and email sequences TedOS wrote is better than what I've paid $5,000 copywriters to produce. It understood my audience better than I did.", name: "Jessica Park",     role: "Health & Wellness Brand",        initials: "JP", result: "68% email open rate achieved"     },
  { quote: "We use TedOS for every new client onboarding. Instead of weeks of strategy calls, we get a complete deliverable in one session. Our clients are blown away every time.", name: "David Torres",     role: "SaaS Startup Founder",           initials: "DT", result: "Client onboarding: 3 wks → 1 hr"  },
];

export default function TestimonialsSection() {
  const [active, setActive]       = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const total  = TESTIMONIALS.length;
  const next   = useCallback(() => setActive((a) => (a + 1) % total), [total]);
  const prev   = useCallback(() => setActive((a) => (a - 1 + total) % total), [total]);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd   = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    setTouchStart(null);
  };

  const getOffset = (i) => {
    let d = i - active;
    if (d >  total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  };

  return (
    <section
      id="testimonials"
      className="py-16 sm:py-20 md:py-[120px] relative section-glow-center overflow-hidden"
      style={{ background: "#00031C" }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.1)] to-transparent" />

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(0,229,255,1) 1px, transparent 1px)", backgroundSize: "32px 32px", opacity: 0.02 }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16"
        >
          <SectionLabel text="Testimonials" />
          <h2 className="font-poppins font-medium text-[#F4F7FF] tracking-tight mb-4" style={{ fontSize: "clamp(32px,4vw,48px)" }}>
            Our Clients <span style={{ color: "#00E5FF" }}>Love TedOS</span>
          </h2>
          <p className="text-[#94A3B8] font-poppins text-base max-w-md mx-auto leading-relaxed">
            Real results from real business owners who launched with TedOS.
          </p>
        </motion.div>

        {/* 3D Carousel */}
        <div
          className="relative h-[360px] sm:h-[320px] md:h-[280px] flex items-center justify-center overflow-hidden"
          style={{ perspective: "1200px" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {TESTIMONIALS.map((t, i) => {
            const offset = getOffset(i);
            const abs    = Math.abs(offset);
            if (abs > 2) return null;
            const tx      = offset * 265;
            const scale   = offset === 0 ? 1 : 0.88;
            const opacity = offset === 0 ? 1 : abs === 1 ? 0.4 : 0.18;
            const ry      = offset * 14;
            // On mobile hide side cards — only show active
            const mobileHide = offset !== 0 ? "hidden md:block" : "";

            return (
              <div
                key={i}
                onClick={() => setActive(i)}
                className={`absolute w-[440px] max-w-[85vw] cursor-pointer rounded-2xl ${mobileHide}`}
                style={{
                  transform  : `translateX(${tx}px) scale(${scale}) perspective(1200px) rotateY(${ry}deg)`,
                  opacity,
                  zIndex     : offset === 0 ? 10 : abs === 1 ? 5 : 1,
                  transition : "all 0.4s ease",
                  transformStyle: "preserve-3d",
                  background : "#020D1F",
                  border     : offset === 0 ? "1px solid rgba(0,229,255,0.3)" : "1px solid rgba(0,229,255,0.08)",
                  boxShadow  : offset === 0 ? "rgba(0,229,255,0.1) 0px 0px 40px 0px" : "none",
                  padding    : "28px 32px",
                }}
              >
                {offset === 0 && <div className="absolute top-0 inset-x-0 h-20 rounded-t-2xl pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,229,255,0.05), transparent)" }} />}

                {/* Subtle quote mark */}
                <span className="font-poppins text-3xl leading-none" style={{ color: "#00E5FF", opacity: 0.35 }}>&ldquo;</span>

                <p className="text-[#94A3B8] font-poppins font-normal text-sm leading-relaxed mb-5 line-clamp-4">
                  {t.quote}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-poppins font-semibold text-[#00E5FF] shrink-0"
                      style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)" }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-[#F4F7FF] font-poppins font-medium text-sm">{t.name}</p>
                      <p className="text-[#4B5563] font-poppins text-xs">{t.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-[#4B5563] uppercase tracking-wider font-poppins mb-0.5">Result</p>
                    <p className="text-xs font-poppins font-medium px-2 py-0.5 rounded-md" style={{ background: "rgba(0,229,255,0.08)", color: "#00E5FF" }}>
                      {t.result}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5 mt-10">
          <button onClick={prev} className="w-10 h-10 rounded-full border border-[rgba(0,229,255,0.15)] flex items-center justify-center text-[#4B5563] hover:border-[rgba(0,229,255,0.4)] hover:text-[#00E5FF] transition-colors cursor-pointer" aria-label="Previous">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="flex items-center justify-center cursor-pointer"
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label={`Go to ${i + 1}`}
              >
                <span
                  className="rounded-full transition-all duration-300 block"
                  style={{ width: i === active ? 24 : 8, height: 8, background: i === active ? "#00E5FF" : "rgba(255,255,255,0.1)" }}
                />
              </button>
            ))}
          </div>
          <button onClick={next} className="w-10 h-10 rounded-full border border-[rgba(0,229,255,0.15)] flex items-center justify-center text-[#4B5563] hover:border-[rgba(0,229,255,0.4)] hover:text-[#00E5FF] transition-colors cursor-pointer" aria-label="Next">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
