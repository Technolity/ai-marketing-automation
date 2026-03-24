"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { SectionLabel } from "./SectionLabel";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ────────────────────────────────────────────────────
   Shared card constants
──────────────────────────────────────────────────── */
const CARD_STYLE = {
  background  : "#020D1F",
  border      : "1px solid rgba(0,229,255,0.12)",
  borderRadius: "16px",
  boxShadow   : "rgba(0,229,255,0.06) 0px 0px 32px 0px",
  transition  : "border-color 0.3s, box-shadow 0.3s",
};
const CARD_HOVER_STYLE = {
  borderColor : "rgba(0,229,255,0.35)",
  boxShadow   : "rgba(0,229,255,0.12) 0px 0px 40px 0px",
};
const ICON_WRAP_CLASS = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0";
const ICON_WRAP_STYLE = { background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" };

/* ────────────────────────────────────────────────────
   CRM: Monochromatic pipeline bars
──────────────────────────────────────────────────── */
function CRMCard({ hovered }) {
  const barsRef     = useRef([]);
  const containerRef = useRef(null);
  const stages  = [
    { label: "Discovery",   count: 14, pct: 100, alpha: 0.50 },
    { label: "Proposal",    count:  9, pct:  64, alpha: 0.35 },
    { label: "Negotiation", count:  5, pct:  36, alpha: 0.25 },
    { label: "Won",         count:  3, pct:  21, alpha: 0.15 },
  ];

  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } });
    barsRef.current.forEach((b, i) => {
      if (!b) return;
      tl.to(b, { opacity: 0.5, duration: 1.4 + i * 0.2 }, i * 0.45);
      tl.to(b, { opacity: 1,   duration: 1.4 + i * 0.2 }, i * 0.45 + 1.4);
    });

    // Pause the forever-loop when card is off-screen
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting ? tl.resume() : tl.pause(),
      { threshold: 0 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    return () => { tl.kill(); observer.disconnect(); };
  }, []);

  useEffect(() => {
    barsRef.current.forEach((b, i) => {
      if (!b) return;
      gsap.to(b, { width: hovered ? `${Math.min(stages[i].pct + 6, 100)}%` : `${stages[i].pct}%`, duration: 0.5, ease: "power2.out", delay: i * 0.04 });
    });
  }, [hovered]); // eslint-disable-line

  return (
    <div ref={containerRef} className="space-y-2.5">
      <div className="space-y-1.5">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2.5">
            <span className="text-[11px] text-[#4B5563] font-poppins w-[78px] shrink-0">{s.label}</span>
            <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: "rgba(0,229,255,0.04)" }}>
              <div
                ref={(el) => (barsRef.current[i] = el)}
                className="h-full rounded-md flex items-center px-2.5"
                style={{ width: `${s.pct}%`, background: `rgba(0,229,255,${s.alpha})`, borderLeft: "2px solid #00E5FF" }}
              >
                <span className="text-[10px] font-bold tabular-nums text-[#00E5FF]">{s.count}</span>
              </div>
            </div>
            <span className="text-[10px] text-[#4B5563] tabular-nums w-7 text-right shrink-0">{s.pct}%</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(0,229,255,0.08)] text-[11px] text-[#4B5563] font-poppins">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-[#00E5FF]" />
          47 active leads
        </span>
        <span className="font-semibold text-[#00E5FF]/80">$89k pipeline</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Workflows: Monochromatic SVG node graph
──────────────────────────────────────────────────── */
function WorkflowsCard({ hovered }) {
  const nodeRefs = useRef([]);

  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "sine.inOut" } });
    nodeRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.to(el, { attr: { "stroke-opacity": 1   }, duration: 0.35 }, i * 0.55)
        .to(el, { attr: { "stroke-opacity": 0.3  }, duration: 0.35 }, i * 0.55 + 0.35);
    });
    return () => tl.kill();
  }, []);

  const nodes = [
    { x:  2, y:  8, w: 58, h: 26, label: "TRIGGER",  sub: "Lead Opts In",       a: 1.0 },
    { x:100, y:  8, w: 74, h: 26, label: "ACTION",   sub: "Apply Tag + Score",  a: 0.75 },
    { x:214, y:  8, w: 54, h: 26, label: "ACTION",   sub: "Send Email",         a: 0.75 },
    { x:214, y: 58, w: 54, h: 26, label: "DELAY",    sub: "Wait 3 Days",        a: 0.5  },
    { x:100, y: 58, w: 74, h: 26, label: "IF/ELSE",  sub: "Opened?",            a: 0.6  },
  ];

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 270 92" className="w-full" height="92" aria-hidden="true">
        <line x1="60"  y1="21" x2="100" y2="21" stroke="rgba(0,229,255,0.25)" strokeWidth="1" strokeDasharray="3 2"/>
        <line x1="174" y1="21" x2="214" y2="21" stroke="rgba(0,229,255,0.25)" strokeWidth="1" strokeDasharray="3 2"/>
        <line x1="241" y1="34" x2="241" y2="58" stroke="rgba(0,229,255,0.25)" strokeWidth="1" strokeDasharray="3 2"/>
        <line x1="214" y1="71" x2="174" y2="71" stroke="rgba(0,229,255,0.25)" strokeWidth="1" strokeDasharray="3 2"/>
        <polygon points="100,18 94,21 100,24" fill="rgba(0,229,255,0.4)"/>
        <polygon points="214,18 208,21 214,24" fill="rgba(0,229,255,0.4)"/>
        <polygon points="174,68 180,71 174,74" fill="rgba(0,229,255,0.4)"/>
        {nodes.map((n, i) => (
          <g key={i}>
            <rect
              ref={(el) => (nodeRefs.current[i] = el)}
              x={n.x} y={n.y} width={n.w} height={n.h} rx="6"
              fill={`rgba(0,229,255,${n.a * 0.07})`}
              stroke="#00E5FF" strokeWidth="1" strokeOpacity={n.a * 0.5}
            />
            <text x={n.x + n.w / 2} y={n.y + 10} textAnchor="middle" fill={`rgba(0,229,255,${n.a})`} fontSize="6" fontWeight="600" letterSpacing="0.4">{n.label}</text>
            <text x={n.x + n.w / 2} y={n.y + 20} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="5.5">{n.sub}</text>
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-between pt-1 border-t border-[rgba(0,229,255,0.08)] text-[11px] text-[#4B5563] font-poppins">
        <span>12 active workflows</span>
        <span className="text-[#00E5FF]/80 font-semibold">94% completion</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Automations: Live activity feed (cyan only)
──────────────────────────────────────────────────── */
const ALL_EVENTS = [
  { label: "Appointment Booked",     time: "now",    live: true  },
  { label: "Email Sequence Started", time: "8s ago", live: true  },
  { label: "Lead Score +15",         time: "22s ago", live: false },
  { label: "No-Show Follow Up",      time: "1m ago",  live: false },
  { label: "Tag Applied: Hot Lead",  time: "2m ago",  live: false },
  { label: "Pipeline Stage Moved",   time: "4m ago",  live: false },
];

function AutomationsCard() {
  const [events, setEvents] = useState(ALL_EVENTS.slice(0, 4));
  const [key,    setKey]    = useState(0);
  const cycleRef            = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      cycleRef.current = (cycleRef.current + 1) % ALL_EVENTS.length;
      setEvents((prev) => [ALL_EVENTS[cycleRef.current], ...prev.slice(0, 3)]);
      setKey((k) => k + 1);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-1.5">
      {events.map((e, i) => (
        <div
          key={i === 0 ? `new-${key}` : `${e.label}-${i}`}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
          style={{
            background : "rgba(0,229,255,0.03)",
            border     : "1px solid rgba(0,229,255,0.07)",
            animation  : i === 0 ? "event-in 0.35s ease-out forwards" : "none",
            opacity    : 1 - i * 0.07,
          }}
        >
          <span className="relative shrink-0 flex w-2 h-2">
            {e.live && <span className="absolute inset-0 rounded-full bg-[#00E5FF]" style={{ animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.5 }} />}
            <span className="relative inline-flex rounded-full w-2 h-2 bg-[#00E5FF]" />
          </span>
          <span className="text-[12px] text-[#94A3B8] font-poppins font-normal flex-1 truncate">{e.label}</span>
          <span className="text-[10px] text-[#4B5563] shrink-0 tabular-nums font-poppins">{e.time}</span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(0,229,255,0.08)] text-[11px] text-[#4B5563] font-poppins">
        <span className="flex items-center gap-1.5">
          <svg width="10" height="12" viewBox="0 0 10 12" fill="#00E5FF"><path d="M6 0L0 7h4l-1 5 7-8H6L7 0z"/></svg>
          3,847 fired this month
        </span>
        <span className="text-[#00E5FF]/80 font-semibold">All live</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Emails: Preview stack (cyan progress bars)
──────────────────────────────────────────────────── */
function EmailsCard({ hovered }) {
  const barRefs = useRef([]);
  const [mounted, setMounted] = useState(false);
  const campaigns = [
    { subject: "Welcome to TedOS 👋",    preview: "Hey {first_name}, your account is ready...", open: 72 },
    { subject: "Your offer is live",      preview: "We've built your complete funnel and CRM...", open: 68 },
    { subject: "Re-engagement check-in", preview: "It's been a few days — here's what's next...", open: 41 },
  ];

  useEffect(() => {
    setMounted(true);
    barRefs.current.forEach((b, i) => {
      if (!b) return;
      gsap.fromTo(b, { width: "0%" }, { width: `${campaigns[i].open}%`, duration: 1.1, delay: i * 0.15, ease: "power2.out" });
    });
    const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } });
    barRefs.current.forEach((b, i) => {
      if (!b) return;
      tl.to(b, { opacity: 0.4, duration: 1.5 + i * 0.2 }, i * 0.5);
      tl.to(b, { opacity: 0.7, duration: 1.5 + i * 0.2 }, i * 0.5 + 1.5);
    });
    return () => tl.kill();
  }, []); // eslint-disable-line

  useEffect(() => {
    barRefs.current.forEach((b, i) => {
      if (!b) return;
      gsap.to(b, { width: hovered ? `${Math.min(campaigns[i].open + 5, 100)}%` : `${campaigns[i].open}%`, duration: 0.45, ease: "power2.out", delay: i * 0.05 });
    });
  }, [hovered]); // eslint-disable-line

  return (
    <div className="space-y-1.5">
      {campaigns.map((c, i) => (
        <div key={i} className="px-2.5 py-2 rounded-lg" style={{ background: "rgba(0,229,255,0.03)", border: "1px solid rgba(0,229,255,0.07)" }}>
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[12px] text-[#F4F7FF] font-poppins font-medium truncate flex-1">{c.subject}</p>
            <span className="text-[10px] font-bold tabular-nums shrink-0 text-[#00E5FF]">{c.open}%</span>
          </div>
          <p className="text-[10px] text-[#4B5563] font-poppins truncate mb-1.5">{c.preview}</p>
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(0,229,255,0.08)" }}>
            <div ref={(el) => (barRefs.current[i] = el)} className="h-full rounded-full bg-[#00E5FF]" style={{ opacity: 0.6 }} />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(0,229,255,0.08)] text-[11px] text-[#4B5563] font-poppins">
        <span className="flex items-center gap-1.5">
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" stroke="#00E5FF" strokeWidth="1">
            <rect x="0.5" y="0.5" width="10" height="8" rx="1.5"/>
            <path d="M0.5 2.5L5.5 5.5L10.5 2.5"/>
          </svg>
          12,400 sent
        </span>
        <span className="text-[#00E5FF]/80 font-semibold">12% click rate</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Icon SVGs — all cyan
──────────────────────────────────────────────────── */
function IconCRM({ className })       { return <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 16h16M2 16V12l4-4 4 4 4-6 4 2v8"/><circle cx="10" cy="4" r="1.5"/></svg>; }
function IconWorkflow({ className })  { return <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="7" width="5" height="5" rx="1.5"/><rect x="7.5" y="1" width="5" height="5" rx="1.5"/><rect x="7.5" y="14" width="5" height="5" rx="1.5"/><rect x="14" y="7" width="5" height="5" rx="1.5"/><path d="M6 9.5h1.5M13 9.5h1M10 6v2.5M10 11.5V14"/></svg>; }
function IconAutomation({ className }) { return <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 1.5L3.5 11h5.5L7.5 18.5 17 8.5h-6z"/></svg>; }
function IconEmail({ className })     { return <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="18" height="13" rx="2"/><path d="M1 7.5l9 5.5 9-5.5"/></svg>; }

/* ────────────────────────────────────────────────────
   Card config
──────────────────────────────────────────────────── */
const CARDS = [
  { IconEl: IconCRM,       title: "CRM Management",   subtitle: "Full pipeline visibility",   status: "Active",   Content: CRMCard       },
  { IconEl: IconWorkflow,  title: "Smart Workflows",  subtitle: "Trigger-based automation",   status: "Running",  Content: WorkflowsCard  },
  { IconEl: IconAutomation,title: "Automations",      subtitle: "Set it and forget it",       status: "Live",     Content: AutomationsCard},
  { IconEl: IconEmail,     title: "Email Sequences",  subtitle: "Multi-step campaigns",       status: "Sending",  Content: EmailsCard     },
];

/* ────────────────────────────────────────────────────
   Cursor-spotlight wrapper
──────────────────────────────────────────────────── */
function FeatureCard({ children, onHoverChange }) {
  const cardRef  = useRef(null);
  const spotRef  = useRef(null);
  const [hov, setHov] = useState(false);

  const onMove = useCallback((e) => {
    if (!cardRef.current || !spotRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    spotRef.current.style.background = `radial-gradient(350px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, rgba(0,229,255,0.06), transparent 70%)`;
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseEnter={() => { setHov(true); onHoverChange?.(true); }}
      onMouseLeave={() => {
        setHov(false); onHoverChange?.(false);
        if (spotRef.current) spotRef.current.style.background = "transparent";
      }}
      className="relative rounded-2xl overflow-hidden cursor-default"
      style={{
        ...CARD_STYLE,
        ...(hov ? CARD_HOVER_STYLE : {}),
        transform: hov ? "translateY(-5px) scale(1.015)" : "none",
      }}
    >
      <div ref={spotRef} className="absolute inset-0 pointer-events-none z-0 rounded-2xl" />
      {hov && <div className="absolute top-0 left-0 w-56 h-40 pointer-events-none z-0 rounded-tl-2xl" style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(0,229,255,0.12), transparent 70%)" }} />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Main export
──────────────────────────────────────────────────── */
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const cardAnim  = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } } };

export default function FeaturesGrid() {
  const sectionRef    = useRef(null);
  const [hovered, setHovered] = useState(-1);

  useEffect(() => {
    const ctx = gsap.context(() => { ScrollTrigger.refresh(); }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-16 sm:py-20 md:py-[120px] relative"
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
          <SectionLabel text="What TedOS Builds For You" />
          <h2 className="font-poppins font-medium text-[#F4F7FF] tracking-tight mb-4" style={{ fontSize: "clamp(32px,4vw,48px)" }}>
            Everything Your Business Needs
          </h2>
          <p className="text-[#94A3B8] font-poppins font-normal text-base max-w-xl mx-auto leading-relaxed">
            One system. Every asset. Built and deployed in a single session.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {CARDS.map((card, i) => {
            const { IconEl, Content } = card;
            return (
              <motion.div key={card.title} variants={cardAnim}>
                <FeatureCard onHoverChange={(h) => setHovered(h ? i : -1)}>
                  <div className="p-7">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={ICON_WRAP_CLASS} style={ICON_WRAP_STYLE}>
                          <IconEl className="w-5 h-5 text-[#00E5FF]" />
                        </div>
                        <div>
                          <h3 className="font-poppins font-medium text-[#F4F7FF] text-xl leading-tight">{card.title}</h3>
                          <p className="text-[#4B5563] font-poppins text-xs mt-0.5">{card.subtitle}</p>
                        </div>
                      </div>
                      {/* Dot status badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#00E5FF]" style={{ boxShadow: "0 0 6px rgba(0,229,255,0.8)" }} />
                        <span className="text-[#00E5FF] text-xs font-poppins">{card.status}</span>
                      </div>
                    </div>

                    {/* Inner panel */}
                    <div className="rounded-xl p-3" style={{ background: "rgba(0,229,255,0.02)", border: "1px solid rgba(0,229,255,0.07)" }}>
                      <Content hovered={hovered === i} />
                    </div>
                  </div>
                </FeatureCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
