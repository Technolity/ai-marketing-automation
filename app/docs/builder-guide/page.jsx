'use client';

import { ArrowLeft, BookOpen, CheckCircle, ExternalLink, Globe, Calendar, ChevronRight, ArrowRight, FileDown } from 'lucide-react';
import Link from 'next/link';

const Step = ({ number, title, children }) => (
  <section className="space-y-5">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-cyan/20 border border-cyan/30 flex items-center justify-center text-cyan font-bold text-lg shrink-0">
        {number}
      </div>
      <h3 className="text-2xl font-bold text-white">{title}</h3>
    </div>
    <div className="pl-14 space-y-4 text-[#B2C0CD] leading-relaxed">
      {children}
    </div>
  </section>
);

const InstructionCard = ({ steps }) => (
  <div className="bg-[#0D1217] border border-[#1E2A34] rounded-xl overflow-hidden">
    {steps.map((step, i) => (
      <div key={i} className={`flex items-start gap-4 px-5 py-4 ${i < steps.length - 1 ? 'border-b border-[#1E2A34]' : ''}`}>
        <span className="w-5 h-5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
          {i + 1}
        </span>
        <p className="text-sm text-[#B2C0CD]" dangerouslySetInnerHTML={{ __html: step }} />
      </div>
    ))}
  </div>
);

const Callout = ({ icon: Icon, title, body, color = 'cyan' }) => (
  <div className={`flex items-start gap-3 p-4 rounded-xl bg-${color}/5 border border-${color}/20`}>
    <Icon className={`w-5 h-5 text-${color} shrink-0 mt-0.5`} />
    <div>
      {title && <p className={`font-semibold text-${color} text-sm mb-1`}>{title}</p>}
      <p className="text-sm text-[#B2C0CD]">{body}</p>
    </div>
  </div>
);

export default function BuilderGuidePage() {
  return (
    <div className="min-h-screen bg-[#00031C] text-white font-poppins">
      {/* Header */}
      <header className="border-b border-white/[0.05] bg-[#00031C]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/vault"
              className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors text-[#94A3B8] hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-semibold flex items-center gap-2 text-[#F4F7FF]">
              <BookOpen className="w-4 h-4 text-[#00E5FF]" />
              Builder Setup Guide
            </h1>
          </div>
          <Link
            href="/vault"
            className="inline-flex items-center gap-1.5 text-sm text-[#00E5FF] hover:text-white transition-colors"
          >
            Back to Phase 3 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="space-y-14">

          {/* Intro */}
          <div className="space-y-3">
            <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00E5FF]">Phase 3 Setup</span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#F4F7FF] leading-tight">
              Set Up Your Builder
            </h2>
            <p className="text-[#94A3B8] text-base leading-relaxed max-w-xl">
              Before you can go live, you need to configure two things in your builder account: your custom domain and your booking calendar. This guide walks you through both — step by step.
            </p>
          </div>

          {/* Overview */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Globe className="w-5 h-5 text-[#00E5FF] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white text-sm mb-1">Step 1 — Connect Your Domain</p>
                <p className="text-xs text-[#94A3B8]">Add your custom domain so your funnel goes live at your own URL.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Calendar className="w-5 h-5 text-[#00E5FF] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white text-sm mb-1">Step 2 — Get Calendar Embed URL</p>
                <p className="text-xs text-[#94A3B8]">Copy the embed URL for your booking calendar to paste into TedOS.</p>
              </div>
            </div>
          </div>

          {/* Domain Setup PDF Download */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#0D1217] border border-[#1E2A34] gap-4">
            <div className="flex items-center gap-3">
              <FileDown className="w-5 h-5 text-[#00E5FF] shrink-0" />
              <div>
                <p className="font-semibold text-white text-sm">Domain Setup PDF Guide</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">To get the full guide with screenshots, download the PDF guide.</p>
              </div>
            </div>
            <a
              href="/TedOS_Domains.pdf"
              download="TedOS Domain Setup Guide.pdf"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download
            </a>
          </div>

          {/* Step 1: Domain */}
          <Step number={1} title="Connect Your Custom Domain">
            <p>
              Your funnel needs to be hosted on your own domain (e.g., <span className="text-white font-medium">coaching.yourbusiness.com</span>). Here&apos;s how to connect it in your builder account.
            </p>

            <InstructionCard steps={[
              'Log in to your builder account and open the <strong class="text-white">Settings</strong> menu from the left sidebar.',
              'Under Settings, click <strong class="text-white">Domains</strong>.',
              'Click <strong class="text-white">Add New Domain</strong> and type in the custom domain you want to use.',
              'Your builder will display a <strong class="text-white">CNAME record</strong> (or A record). Copy these details — you\'ll need them in the next step.',
              'Log in to wherever you registered your domain (e.g., GoDaddy, Namecheap, Cloudflare, Google Domains) and <strong class="text-white">add the DNS record</strong> they provided.',
              'Return to your builder and click <strong class="text-white">Verify</strong>. DNS changes can take a few minutes — if it doesn\'t verify immediately, wait 5–10 minutes and try again.',
            ]} />

            <Callout
              icon={CheckCircle}
              title="Verification tip"
              body="If your domain doesn't verify right away, DNS propagation can take up to 30 minutes in some cases. Grab a coffee and try again — it'll go through."
            />
          </Step>

          {/* Step 2: Calendar Embed */}
          <Step number={2} title="Get Your Calendar Embed URL">
            <p>
              Your booking calendar needs to be embedded into your funnel page. To do that, you need the calendar&apos;s embed URL from your builder settings.
            </p>

            <InstructionCard steps={[
              'In your builder, go to <strong class="text-white">Settings</strong> in the left sidebar.',
              'Click <strong class="text-white">Calendars</strong>.',
              'Find the calendar you want to use for appointment bookings and click on it.',
              'Look for a <strong class="text-white">Share</strong> button or tab (sometimes labelled "Sharing" or "Share / Embed").',
              'You\'ll see a <strong class="text-white">calendar link or embed URL</strong> — copy that URL. It typically looks like: <span class="text-[#00E5FF] font-mono text-xs">https://api.yourdomain.com/widget/booking/...</span>',
            ]} />

            <Callout
              icon={Calendar}
              title="What to copy"
              body='Copy the embed URL — not the public calendar page link. The embed URL is what goes inside your funnel page. It usually starts with your builder domain followed by "/widget/booking/" or similar.'
            />
          </Step>

          {/* Step 3: Return to Phase 3 */}
          <Step number={3} title="Come Back and Complete Phase 3">
            <p>
              Once your domain is connected and you have your calendar embed URL, head back to <strong className="text-white">Phase 3 in TedOS</strong> and complete the following:
            </p>

            <div className="space-y-3">
              {[
                { label: 'Paste the calendar embed URL', desc: 'In the Calendar Embed step — paste the URL you copied from your builder.' },
                { label: 'Paste your Schedule Link', desc: 'In the Schedule Link step — this is the direct booking link you share with prospects.' },
                { label: 'Review and push Emails, SMS & Appointment Reminders', desc: 'Check your sequences look right, then push them to activate your automations.' },
                { label: 'Click "Continue to Scripts"', desc: "Once everything is pushed, you're ready to move to your sales scripts." },
              ].map(({ label, desc }, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="w-5 h-5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{label}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Step>

          {/* Back CTA */}
          <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-[#00031C] bg-[#00E5FF] hover:bg-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Phase 3
            </Link>
            <p className="text-xs text-[#4a5a6a]">
              Need help? Contact us at{' '}
              <a href="mailto:support@tedmcgrathbrands.com" className="text-[#00E5FF]/70 hover:text-[#00E5FF] transition-colors">
                support@tedmcgrathbrands.com
              </a>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
