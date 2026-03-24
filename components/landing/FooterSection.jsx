"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUp, Mail, MapPin } from "lucide-react";

function TwitterX({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
}
function Instagram({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
}
function LinkedIn({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
}

const PRODUCT = [{ label: "Features", href: "#features" },{ label: "How It Works", href: "#how-it-works" },{ label: "Pricing", href: "#pricing" },{ label: "Dashboard", href: "/dashboard" }];
const COMPANY = [{ label: "About", href: "#" },{ label: "Privacy Policy", href: "#" },{ label: "Terms of Service", href: "#" },{ label: "Admin Portal", href: "/admin/login" }];

export default function FooterSection() {
  const [email, setEmail]   = useState("");
  const [done,  setDone]    = useState(false);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative" style={{ background: "#00020F", borderTop: "1px solid rgba(0,229,255,0.1)" }}>

      {/* Big background brand text — NEXUX pattern */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute bottom-2 left-0 h-[1.5px] w-[65%] rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)", animation: "raySlide 14s linear 2s infinite" }}
        />
        <p
          className="text-center font-poppins font-medium text-white leading-none whitespace-nowrap"
          style={{ fontSize: "clamp(80px,18vw,220px)", opacity: 0.025, letterSpacing: "-0.04em" }}
        >
          TEDOS
        </p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pt-12 md:pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8 mb-10 md:mb-12">

          {/* Col 1: Brand */}
          <div>
            <div className="mb-4">
              <Image src="/tedos-logo.png" alt="TedOS" width={100} height={30} className="object-contain" />
            </div>
            <p className="text-[#94A3B8] font-poppins text-sm leading-relaxed mb-6 max-w-[220px]">
              Your AI Business Operator. Complete marketing systems built and deployed in 60 minutes.
            </p>
            <div className="space-y-2 text-sm mb-8">
              <div className="flex items-center gap-2 text-[#94A3B8] font-poppins">
                <Mail className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                hello@tedos.ai
              </div>
              <div className="flex items-center gap-2 text-[#94A3B8] font-poppins">
                <MapPin className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                Los Angeles, CA
              </div>
            </div>
            <div className="flex items-center gap-3">
              {[{ Icon: TwitterX, label: "Twitter" },{ Icon: Instagram, label: "Instagram" },{ Icon: LinkedIn, label: "LinkedIn" }].map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label} className="w-11 h-11 rounded-full flex items-center justify-center text-[#4B5563] hover:text-[#00E5FF] transition-colors cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(0,229,255,0.3)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[#F4F7FF] font-poppins font-semibold text-sm uppercase tracking-widest mb-4">Product</p>
              <ul className="space-y-3">
                {PRODUCT.map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-[#94A3B8] hover:text-[#00E5FF] font-poppins text-sm transition-colors duration-200">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[#F4F7FF] font-poppins font-semibold text-sm uppercase tracking-widest mb-4">Company</p>
              <ul className="space-y-3">
                {COMPANY.map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-[#94A3B8] hover:text-[#00E5FF] font-poppins text-sm transition-colors duration-200">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Col 3: Newsletter */}
          <div>
            <p className="text-[#F4F7FF] font-poppins font-semibold text-sm uppercase tracking-widest mb-2">Newsletter</p>
            <p className="text-[#94A3B8] font-poppins text-sm mb-5 leading-relaxed">
              Get the latest AI business growth tips — free, weekly.
            </p>
            {done ? (
              <div className="flex items-center gap-2 text-[#00E5FF] font-poppins text-sm">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF]" style={{ boxShadow: "0 0 6px rgba(0,229,255,0.8)" }} />
                You&rsquo;re on the list — talk soon!
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (email) setDone(true); }} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg font-poppins text-sm text-[#F4F7FF] placeholder-[#4B5563] outline-none transition-colors"
                  style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.2)" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#00E5FF"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(0,229,255,0.2)"}
                  required
                />
                <button type="submit" className="w-full py-3 rounded-lg font-poppins font-semibold text-sm text-[#00E5FF] cursor-pointer transition-colors" style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,229,255,0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,229,255,0.08)"}
                >
                  Get Started Free →
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8" style={{ borderTop: "1px solid rgba(0,229,255,0.06)" }}>
          <p className="text-[#4B5563] font-poppins text-xs">
            © {new Date().getFullYear()} TedOS. All rights reserved.
          </p>
          <button onClick={scrollTop} className="flex items-center gap-1.5 text-[#4B5563] hover:text-[#00E5FF] font-poppins text-xs transition-colors cursor-pointer group">
            Back to top
            <ArrowUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </footer>
  );
}
