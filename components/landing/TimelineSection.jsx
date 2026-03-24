"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const MILESTONES = [
  {
    minute: 0,
    label: "You Begin",
    desc: "Share your idea and target market",
    active: false,
  },
  {
    minute: 15,
    label: "Offer Ready",
    desc: "Signature program structured",
    active: false,
  },
  {
    minute: 30,
    label: "Funnel Built",
    desc: "Sales system complete",
    active: false,
  },
  {
    minute: 60,
    label: "Live Business",
    desc: "Everything deployed",
    active: true,
  },
];

export default function TimelineSection() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const trackFillRef = useRef(null);
  const milestoneRefs = useRef([]);
  const dotRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading
      gsap.from(headingRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 72%",
          toggleActions: "play none none reverse",
        },
      });

      // Track fill
      gsap.from(trackFillRef.current, {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.4,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 62%",
          toggleActions: "play none none reverse",
        },
      });

      // Milestone items
      gsap.from(milestoneRefs.current, {
        opacity: 0,
        y: 20,
        duration: 0.55,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 58%",
          toggleActions: "play none none reverse",
        },
      });

      // Dots pop in
      gsap.from(dotRefs.current, {
        scale: 0,
        duration: 0.4,
        stagger: 0.12,
        ease: "back.out(2)",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 58%",
          toggleActions: "play none none reverse",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-28 md:py-36 bg-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <div ref={headingRef} className="text-center mb-16 md:mb-24">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan/55 mb-4">
            Your timeline
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            60 Minutes to Launch
          </h2>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            What happens in the next hour.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative px-2">
          {/* Background track */}
          <div className="absolute top-[1.85rem] left-8 right-8 h-px bg-white/6 md:left-16 md:right-16" />

          {/* Animated fill */}
          <div
            ref={trackFillRef}
            className="absolute top-[1.85rem] left-8 right-8 h-px md:left-16 md:right-16"
            style={{
              background: "linear-gradient(to right, rgba(0,229,255,0.6), rgba(0,229,255,0.4), rgba(16,185,129,0.5))",
            }}
          />

          {/* Milestones grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4">
            {MILESTONES.map((m, i) => (
              <div
                key={m.minute}
                ref={(el) => (milestoneRefs.current[i] = el)}
                className="flex flex-col items-center text-center"
              >
                {/* Dot */}
                <div
                  ref={(el) => (dotRefs.current[i] = el)}
                  className={`w-[15px] h-[15px] rounded-full mb-5 relative z-10 ${
                    m.active
                      ? "bg-cyan shadow-[0_0_16px_rgba(0,229,255,0.7)] border-2 border-cyan"
                      : i === MILESTONES.length - 2
                      ? "bg-emerald-400/80 border-2 border-emerald-400/60"
                      : "bg-grayDark border-2 border-white/15"
                  }`}
                />

                {/* Minute */}
                <div className="mb-2">
                  <span
                    className={`text-3xl font-black tracking-tighter ${
                      m.active ? "text-cyan text-glow" : "text-white"
                    }`}
                  >
                    {m.minute}
                    <span className="text-sm font-medium text-gray-500 ml-0.5">min</span>
                  </span>
                </div>

                <h3 className={`font-bold text-sm mb-1 ${m.active ? "text-cyan" : "text-white"}`}>
                  {m.label}
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
