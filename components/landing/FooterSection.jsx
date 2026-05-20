"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowUp, Mail } from "@/lib/icons";

const PRODUCT = [{ label: "Features", href: "/features" }, { label: "How It Works", href: "/how-it-works" }, { label: "Pricing", href: "#pricing" }, { label: "Dashboard", href: "/dashboard" }];
const COMPANY = [{ label: "About", href: "/about" }, { label: "Privacy Policy", href: "/privacy-policy" }, { label: "Terms of Service", href: "terms-of-service" }, { label: "Admin Portal", href: "/admin/login" }];

export default function FooterSection() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative overflow-hidden" style={{ background: "#00020F", borderTop: "1px solid rgba(0,229,255,0.1)" }}>

      {/* Big background brand text */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Col 1: Brand */}
          <div className="md:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Image src="/tedos-logo.png" alt="TedOS" width={100} height={30} className="object-contain" />
            </div>
            <p className="text-[#94A3B8] font-poppins text-sm leading-relaxed mb-6 max-w-[220px]">
              Your AI Business Operator. Complete marketing systems built and deployed in 60 minutes.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#94A3B8] font-poppins">
                <Mail className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                support@tedmcgrathbrands.com
              </div>
            </div>
          </div>

          {/* Col 2: Product links */}
          <div>
            <p className="text-[#F4F7FF] font-poppins font-semibold text-sm uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-3">
              {PRODUCT.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-[#94A3B8] hover:text-[#00E5FF] font-poppins text-sm transition-colors duration-200">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 3: Company links */}
          <div>
            <p className="text-[#F4F7FF] font-poppins font-semibold text-sm uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-3">
              {COMPANY.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-[#94A3B8] hover:text-[#00E5FF] font-poppins text-sm transition-colors duration-200">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 4: Stay Updated */}
          <div>
            <div className="inline-flex items-center gap-1.5 mb-1">
              <p className="text-[#F4F7FF] font-poppins font-semibold text-sm uppercase tracking-widest">Stay Updated</p>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-poppins font-bold uppercase tracking-wider" style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.25)", color: "#00E5FF" }}>
                Coming Soon
              </span>
            </div>
            <p className="text-[#94A3B8] font-poppins text-xs mb-4 leading-relaxed">
              Subscribe to get the latest TedOS offers, updates, and new features.
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                disabled
                placeholder="your@email.com"
                className="w-full px-3.5 py-2.5 rounded-lg font-poppins text-sm text-[#F4F7FF] placeholder-[#4B5563] outline-none opacity-50 cursor-not-allowed"
                style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.15)" }}
              />
              <button
                disabled
                className="w-full py-2.5 rounded-lg font-poppins font-semibold text-sm opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.25)", color: "#00E5FF" }}
              >
                Notify Me →
              </button>
            </div>
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
