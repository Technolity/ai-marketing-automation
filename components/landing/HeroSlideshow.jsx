"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, TrendingUp, Users, Zap } from "lucide-react";

/* ─────────────────────────────────────────────────────
   Pin card shell — tilts from pinned → upright
───────────────────────────────────────────────────── */
function PinCard({ label, children, upright, onMouseEnter, onMouseLeave }) {
  return (
    <motion.div
      animate={{
        rotateX: upright ? 0 : 16,
        y:       upright ? 0 : 8,
        scale:   upright ? 1 : 0.96,
      }}
      transition={{ duration: 0.82, ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative rounded-2xl overflow-hidden h-full"
      style={{
        transformPerspective: 1400,
        transformOrigin:      "center 90%",
        background : "#020D1F",
        border     : "1px solid rgba(0,229,255,0.18)",
        boxShadow  : "0 0 48px rgba(0,229,255,0.07), 0 12px 40px rgba(0,0,0,0.55)",
      }}
    >
      {/* Top glow */}
      <div
        className="absolute top-0 inset-x-0 h-24 pointer-events-none rounded-t-2xl"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.11), transparent 70%)" }}
      />

      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(0,229,255,0.07)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)" }}
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#00E5FF" strokeWidth="1.2" fill="rgba(0,229,255,0.1)" />
              <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="#00E5FF" opacity="0.6" />
            </svg>
          </div>
          <span className="font-poppins text-[#F4F7FF] text-xs font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"
            style={{ animation: "ping 1.5s ease-in-out infinite", boxShadow: "0 0 6px rgba(0,229,255,0.8)" }}
          />
          <span className="font-poppins text-[9px] text-[#00E5FF] tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 relative z-10">{children}</div>

      {/* Pin beam — bottom centre decorative */}
      <motion.div
        animate={{ opacity: upright ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
      >
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-[rgba(0,229,255,0.5)]" />
        <div className="w-[4px] h-[4px] rounded-full bg-[#00E5FF] mb-1" style={{ boxShadow: "0 0 8px rgba(0,229,255,0.9)" }} />
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   Slide contents
───────────────────────────────────────────────────── */
function VSLContent() {
  const lines = [
    { tag: "HOOK",    text: "What if you could build an entire business in 60 minutes?" },
    { tag: "PROBLEM", text: "Most entrepreneurs waste months on copy, funnels, and ads." },
    { tag: "BRIDGE",  text: "TedOS changes that completely. Here's exactly how it works." },
    { tag: "CTA",     text: "Answer 20 questions. Walk away with a deployed system."     },
  ];
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3 pb-2.5" style={{ borderBottom: "1px solid rgba(0,229,255,0.06)" }}>
        <div className="w-2 h-2 rounded-full bg-red-500/60" />
        <div className="w-2 h-2 rounded-full bg-amber-400/60" />
        <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
        <span className="text-[#4B5563] font-poppins text-[9px] ml-1.5">vsl_script.txt</span>
      </div>
      <div className="space-y-2.5">
        {lines.map((l) => (
          <div key={l.tag} className="flex gap-2.5">
            <span className="text-[#00E5FF] font-poppins text-[8px] font-bold tracking-wider opacity-60 shrink-0 mt-0.5" style={{ minWidth: 48 }}>{l.tag}</span>
            <p className="text-[#94A3B8] font-poppins text-[10px] leading-snug">{l.text}</p>
          </div>
        ))}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-1 h-3.5 rounded-sm bg-[#00E5FF] animate-pulse" />
          <span className="text-[#4B5563] font-poppins text-[9px]">Generating objection handlers...</span>
        </div>
      </div>
    </div>
  );
}

function EmailContent() {
  const emails = [
    { num: "01", subject: "Welcome to [Business Name]",    open: 72, ready: true  },
    { num: "02", subject: "The #1 mistake founders make",  open: 68, ready: true  },
    { num: "03", subject: "Case study: $47k in 30 days",   open: 41, ready: false },
  ];
  return (
    <div>
      <p className="font-poppins text-[#F4F7FF] text-[10px] font-medium mb-2.5">
        Email Sequence — <span className="text-[#00E5FF]">5 emails</span>
      </p>
      <div className="space-y-1.5">
        {emails.map((e) => (
          <div key={e.num} className="flex items-start gap-2 px-2.5 py-2 rounded-lg" style={{ background: "rgba(0,229,255,0.03)", border: "1px solid rgba(0,229,255,0.07)" }}>
            <span className="font-poppins text-[8px] font-bold text-[#00E5FF] opacity-60 shrink-0 mt-0.5">{e.num}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-poppins text-[#F4F7FF] text-[10px] font-medium truncate">{e.subject}</p>
                <span className="font-poppins text-[9px] font-bold text-[#00E5FF] tabular-nums shrink-0">{e.open}%</span>
              </div>
              <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(0,229,255,0.08)" }}>
                <div className="h-full rounded-full bg-[#00E5FF]" style={{ width: `${e.open}%`, opacity: 0.65 }} />
              </div>
            </div>
            <span className={`font-poppins text-[8px] shrink-0 ${e.ready ? "text-emerald-400" : "text-[#4B5563]"}`}>
              {e.ready ? "✓" : "•"}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: "1px solid rgba(0,229,255,0.06)" }}>
        <span className="text-[#4B5563] font-poppins text-[9px]">12,400 sent</span>
        <span className="text-[#00E5FF]/70 font-poppins text-[9px] font-semibold">12% click rate</span>
      </div>
    </div>
  );
}

function CRMContent() {
  const stages = [
    { label: "Discovery",   count: 14, pct: 100, alpha: 0.55 },
    { label: "Proposal",    count:  9, pct:  64, alpha: 0.38 },
    { label: "Negotiation", count:  5, pct:  36, alpha: 0.26 },
    { label: "Won",         count:  3, pct:  21, alpha: 0.16 },
  ];
  return (
    <div>
      <p className="font-poppins text-[#F4F7FF] text-[10px] font-medium mb-2.5">
        CRM Pipeline — <span className="text-[#00E5FF]">28 contacts</span>
      </p>
      <div className="space-y-2">
        {stages.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5">
            <span className="text-[9px] text-[#4B5563] font-poppins shrink-0" style={{ minWidth: 70 }}>{s.label}</span>
            <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: "rgba(0,229,255,0.04)" }}>
              <div
                className="h-full rounded-md flex items-center px-2"
                style={{ width: `${s.pct}%`, background: `rgba(0,229,255,${s.alpha})`, borderLeft: "2px solid #00E5FF" }}
              >
                <span className="text-[9px] font-bold tabular-nums text-[#00E5FF]">{s.count}</span>
              </div>
            </div>
            <span className="text-[9px] text-[#4B5563] tabular-nums w-7 text-right shrink-0 font-poppins">{s.pct}%</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: "1px solid rgba(0,229,255,0.06)" }}>
        <span className="text-[#4B5563] font-poppins text-[9px] flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-[#00E5FF]" /> 47 active leads
        </span>
        <span className="text-[#00E5FF]/70 font-poppins text-[9px] font-semibold">$89k pipeline</span>
      </div>
    </div>
  );
}

function ResultsContent() {
  const metrics = [
    { Icon: TrendingUp, value: "$47,200", delta: "+312%", label: "Revenue",  color: "text-emerald-400" },
    { Icon: Users,      value: "1,847",   delta: "+89%",  label: "Leads",    color: "text-sky-400"     },
    { Icon: Mail,       value: "12,400",  delta: "+204%", label: "Emails",   color: "text-[#00E5FF]"   },
    { Icon: Zap,        value: "58 min",  delta: "−97%",  label: "Deploy",   color: "text-amber-400"   },
  ];
  return (
    <div>
      <p className="font-poppins text-[#F4F7FF] text-[10px] font-medium mb-2.5">
        Results Snapshot <span className="text-[#4B5563] text-[8px] ml-1">— Month 1</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(({ Icon, value, delta, label, color }) => (
          <div key={label} className="flex flex-col gap-1.5 p-2.5 rounded-xl" style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <Icon className={`w-3 h-3 ${color} opacity-80`} />
              <span className={`font-poppins text-[8px] font-semibold ${color}`}>{delta}</span>
            </div>
            <p className="font-poppins font-semibold text-[#F4F7FF] text-[15px] tabular-nums leading-none">{value}</p>
            <p className="font-poppins text-[#4B5563] text-[8px]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Config
───────────────────────────────────────────────────── */
const CARDS = [
  { id: "vsl",     label: "VSL Script",       Content: VSLContent     },
  { id: "emails",  label: "Email Sequence",   Content: EmailContent   },
  { id: "crm",     label: "CRM Pipeline",     Content: CRMContent     },
  { id: "results", label: "Results Snapshot", Content: ResultsContent },
];

const slideVariants = {
  enter : (dir) => ({ x: dir > 0 ? 64 : -64, opacity: 0 }),
  center:          { x: 0, opacity: 1 },
  exit  : (dir) => ({ x: dir > 0 ? -64 : 64, opacity: 0 }),
};

const TILT_DURATION  = 2600; // ms before card auto-straightens
const SLIDE_DURATION = 5800; // ms before advancing to next slide

/* ─────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────── */
export default function HeroSlideshow() {
  const [index,   setIndex]   = useState(0);
  const [dir,     setDir]     = useState(1);
  const [upright, setUpright] = useState(false);

  // On every slide change: reset tilt, set timers
  useEffect(() => {
    setUpright(false);

    const tiltTimer    = setTimeout(() => setUpright(true), TILT_DURATION);
    const advanceTimer = setTimeout(() => {
      setDir(1);
      setIndex((i) => (i + 1) % CARDS.length);
    }, SLIDE_DURATION);

    return () => {
      clearTimeout(tiltTimer);
      clearTimeout(advanceTimer);
    };
  }, [index]);

  const goTo = (i) => {
    setDir(i > index ? 1 : -1);
    setIndex(i);
  };

  const { label, Content } = CARDS[index];

  return (
    <div className="w-full max-w-[460px] flex flex-col gap-5">
      {/* Card area */}
      <div className="relative" style={{ height: 300 }}>
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={index}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            <PinCard
              label={label}
              upright={upright}
              onMouseEnter={() => setUpright(true)}
              onMouseLeave={() => {/* stays upright once raised */}}
            >
              <Content />
            </PinCard>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2">
        {CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width:      i === index ? 22 : 7,
              height:     7,
              background: i === index ? "#00E5FF" : "rgba(255,255,255,0.1)",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
