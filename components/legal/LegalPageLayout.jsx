'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LegalPageLayout({ title, subtitle, effectiveDate, lastUpdated, sections }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen font-poppins" style={{ background: '#00031C' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(ellipse, #00E5FF 0%, transparent 70%)' }} />
      </div>

      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.05]" style={{ background: 'rgba(0,3,28,0.92)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="font-poppins font-bold text-[#F4F7FF] text-base tracking-tight select-none">
            Ted<span style={{ color: '#00E5FF' }}>OS</span>
          </Link>
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-[#00E5FF] transition-colors duration-200"
          >
            <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="lg:flex lg:gap-14">

          {/* TOC sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2a3a4a] mb-3 pl-2">On this page</p>
              <nav className="space-y-0.5">
                {sections.map(({ id, number, title: t }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className={`group flex items-start gap-2.5 px-2 py-1.5 rounded-lg text-xs leading-snug transition-all duration-150 ${
                      activeId === id
                        ? 'text-[#00E5FF]'
                        : 'text-[#3a4a5a] hover:text-[#6a7a8a]'
                    }`}
                  >
                    <span className={`shrink-0 font-mono text-[9px] pt-[1px] transition-colors ${activeId === id ? 'text-[#00E5FF]/60' : 'text-[#2a3a4a]'}`}>
                      {String(number).padStart(2, '0')}
                    </span>
                    <span>{t}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1">
            {/* Page header */}
            <div className="mb-10 pb-8 border-b border-white/[0.05]">
              <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: '#00E5FF' }}>Legal</span>
              <h1 className="font-poppins font-semibold text-[#F4F7FF] leading-tight mb-3" style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-[#4a6070] text-sm leading-relaxed max-w-2xl mb-5">{subtitle}</p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#2e3e4e]">
                {effectiveDate && <span>Effective Date: <span className="text-[#3a5a6a]">{effectiveDate}</span></span>}
                {lastUpdated && <span>Last Updated: <span className="text-[#3a5a6a]">{lastUpdated}</span></span>}
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              {sections.map(({ id, number, title: t, content }) => (
                <section key={id} id={id} className="scroll-mt-20">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span
                      className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(0,229,255,0.07)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.12)' }}
                    >
                      {String(number).padStart(2, '0')}
                    </span>
                    <h2 className="font-poppins font-semibold text-[#E4EAF4] text-lg leading-snug">{t}</h2>
                  </div>
                  <div className="ml-0 sm:ml-8 space-y-3 text-[#7a8fa0] text-sm leading-[1.8]">
                    {content}
                  </div>
                </section>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-14 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-[#2e3e4e]">Questions? Contact us at <a href="mailto:support@tedmcgrathbrands.com" className="text-[#00E5FF]/70 hover:text-[#00E5FF] transition-colors">support@tedmcgrathbrands.com</a></p>
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#3a5a6a] hover:text-[#00E5FF] transition-colors">
                ← Back to TedOS Home
              </Link>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#1e2e3e]">© {new Date().getFullYear()} TedOS Inc. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy-policy" className="text-xs text-[#1e2e3e] hover:text-[#3a5a6a] transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-xs text-[#1e2e3e] hover:text-[#3a5a6a] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
