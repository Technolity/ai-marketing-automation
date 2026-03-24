"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Features",     href: "#features"     },
  { label: "How It Works", href: "#how-it-works"  },
  { label: "Testimonials", href: "#testimonials"  },
  { label: "Pricing",      href: "#pricing"       },
];

export default function LandingNav() {
  const { isSignedIn } = useAuth();
  const [scrolled,   setScrolled]   = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [isOpen,     setIsOpen]     = useState(false);

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 50);
      setShowReturn(window.scrollY > 200);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Body scroll lock when drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const scrollTo = (href) => (e) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    close();
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, isOpen ? 300 : 0);
  };

  return (
    <>
      {/* ── Main nav ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 h-[64px] sm:h-[72px] flex items-center transition-all duration-300"
        style={{
          background:    scrolled || isOpen ? "rgba(0,3,28,0.96)" : "transparent",
          backdropFilter: scrolled || isOpen ? "blur(12px)" : "none",
          borderBottom:  scrolled && !isOpen ? "1px solid rgba(0,229,255,0.08)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4 sm:gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0" onClick={close}>
            <Image src="/tedos-logo.png" alt="TedOS" width={120} height={36} className="object-contain" priority />
          </Link>

          {/* Nav links (desktop only) */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={scrollTo(l.href)}
                className="text-[#94A3B8] hover:text-white text-[15px] font-poppins font-normal transition-colors duration-200 cursor-pointer"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right: CTAs + Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop CTAs */}
            {isSignedIn ? (
              <>
                <Link href="/dashboard" className="hidden sm:block">
                  <span className="text-[#00E5FF] text-sm font-poppins hover:underline transition-colors">
                    ← Dashboard
                  </span>
                </Link>
                <Link href="/dashboard">
                  <button className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#00E5FF] text-[#00031C] text-sm font-semibold font-poppins hover:bg-white transition-colors cursor-pointer">
                    Open App
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:block">
                  <button className="text-[#94A3B8] hover:text-white text-sm font-poppins transition-colors cursor-pointer">
                    Sign In
                  </button>
                </Link>
                <Link href="/auth/login">
                  <button className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#00E5FF] text-[#00031C] text-sm font-semibold font-poppins hover:bg-white transition-colors cursor-pointer shadow-[0_0_16px_rgba(0,229,255,0.3)]">
                    <span className="hidden sm:inline">Get Started →</span>
                    <span className="sm:hidden">Start</span>
                  </button>
                </Link>
              </>
            )}

            {/* Hamburger button — mobile only */}
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] cursor-pointer shrink-0 rounded-lg"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              <span
                className="w-5 h-[1.5px] bg-white rounded-full transition-all duration-300 origin-center"
                style={{ transform: isOpen ? "rotate(45deg) translate(0, 4.5px)" : "none" }}
              />
              <span
                className="w-5 h-[1.5px] bg-white rounded-full transition-all duration-200"
                style={{ opacity: isOpen ? 0 : 1, transform: isOpen ? "scaleX(0)" : "none" }}
              />
              <span
                className="w-4 h-[1.5px] bg-white rounded-full transition-all duration-300 origin-center"
                style={{ transform: isOpen ? "rotate(-45deg) translate(0, -5px)" : "none", width: isOpen ? "20px" : "16px" }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] md:hidden"
              style={{ background: "rgba(0,3,28,0.6)", backdropFilter: "blur(4px)" }}
              onClick={close}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed top-[64px] inset-x-0 z-[56] md:hidden flex flex-col"
              style={{
                background: "rgba(0,3,28,0.98)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(0,229,255,0.1)",
              }}
            >
              <div className="px-6 pt-8 pb-10 flex flex-col gap-2">
                {/* Nav links */}
                {NAV_LINKS.map((l, i) => (
                  <motion.a
                    key={l.label}
                    href={l.href}
                    onClick={scrollTo(l.href)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.05 }}
                    className="flex items-center justify-between py-4 border-b border-[rgba(0,229,255,0.07)] text-[#F4F7FF] font-poppins font-medium text-xl cursor-pointer hover:text-[#00E5FF] transition-colors"
                  >
                    {l.label}
                    <span className="text-[#00E5FF] text-lg opacity-50">→</span>
                  </motion.a>
                ))}

                {/* Auth CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-col gap-3 mt-6"
                >
                  {isSignedIn ? (
                    <>
                      <Link href="/dashboard" onClick={close}>
                        <button className="w-full py-4 rounded-full border border-[rgba(0,229,255,0.25)] text-[#F4F7FF] font-poppins font-medium text-base cursor-pointer hover:border-[rgba(0,229,255,0.5)] transition-colors">
                          ← Dashboard
                        </button>
                      </Link>
                      <Link href="/dashboard" onClick={close}>
                        <button className="w-full py-4 rounded-full bg-[#00E5FF] text-[#00031C] font-poppins font-semibold text-base cursor-pointer hover:bg-white transition-colors" style={{ boxShadow: "0 0 24px rgba(0,229,255,0.35)" }}>
                          Open App →
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" onClick={close}>
                        <button className="w-full py-4 rounded-full border border-[rgba(0,229,255,0.25)] text-[#F4F7FF] font-poppins font-medium text-base cursor-pointer hover:border-[rgba(0,229,255,0.5)] transition-colors">
                          Sign In
                        </button>
                      </Link>
                      <Link href="/auth/login" onClick={close}>
                        <button className="w-full py-4 rounded-full bg-[#00E5FF] text-[#00031C] font-poppins font-semibold text-base cursor-pointer hover:bg-white transition-colors" style={{ boxShadow: "0 0 24px rgba(0,229,255,0.35)" }}>
                          Get Started Free →
                        </button>
                      </Link>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Floating "Back to App" pill (authenticated + scrolled) ── */}
      <AnimatePresence>
        {isSignedIn && showReturn && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          >
            <Link href="/dashboard">
              <button
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-[#00E5FF] text-xs sm:text-sm font-poppins font-medium border border-[#00E5FF]/30 cursor-pointer transition-colors hover:border-[#00E5FF]/60 hover:bg-[#00E5FF]/5"
                style={{ background: "rgba(0,3,28,0.95)", backdropFilter: "blur(12px)" }}
              >
                ← Back to App
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
