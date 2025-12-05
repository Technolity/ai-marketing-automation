// components/ResultsDashboard.jsx
"use client";
import { useState } from "react";
import ContentBlock from "./ContentBlock";
import ExportButton from "./ExportButton";
import GHLPushButton from "./GHLPushButton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Copy, RefreshCw, MessageSquare, Target, Zap, FileText, Mail, Megaphone, Layout, Gift,
  Sparkles, ChevronDown, CheckCircle, Edit3, HelpCircle, ArrowRight
} from "lucide-react";

// Ted Insights Button Component
function TedInsightsButton({ content, contentType }) {
  const supabase = createClientComponentClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(null);

  const actions = [
    { key: 'evaluate', label: 'Evaluate', icon: CheckCircle },
    { key: 'improve', label: 'Improve', icon: Sparkles },
    { key: 'rewrite', label: 'Rewrite', icon: Edit3 },
    { key: 'explain', label: 'Explain Why', icon: HelpCircle },
    { key: 'next', label: 'Next Steps', icon: ArrowRight },
  ];

  const handleAction = async (action) => {
    setLoading(action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to use Ted Insights");
        return;
      }

      const res = await fetch("/api/os/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action, content, contentType }),
      });

      const data = await res.json();

      if (data.comingSoon) {
        toast.info(data.message, { duration: 5000 });
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message);
      }
    } catch (error) {
      toast.error("Failed to process. Please try again.");
    } finally {
      setLoading(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded-lg text-sm font-medium transition-all"
      >
        <Sparkles className="w-4 h-4" />
        Improve with Ted Insights
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg shadow-xl z-50 overflow-hidden">
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={() => handleAction(action.key)}
              disabled={loading !== null}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-gray-300 hover:bg-cyan/10 hover:text-white transition-all disabled:opacity-50"
            >
              <action.icon className="w-4 h-4 text-cyan" />
              {loading === action.key ? 'Loading...' : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultsDashboard({ results }) {
  const router = useRouter();

  if (!results) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-gray-400">No results available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-grayDark p-8 rounded-xl border border-cyan">
        <h1 className="text-4xl font-bold mb-2">
          Your Marketing System for <span className="text-cyan">{results.businessName}</span>
        </h1>
        <p className="text-gray-400 text-lg">{results.productName}</p>

        <div className="flex gap-4 mt-6">
          <ExportButton data={results} filename={`${results.businessName}-marketing`} />
          <GHLPushButton data={results} />
          <button
            onClick={() => router.push("/intake")}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> New Generation
          </button>
        </div>
      </div>

      {/* Brand Messaging */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">📋 Brand Messaging</h2>
          <TedInsightsButton content={results.brandMessaging} contentType="brandMessaging" />
        </div>
        <ContentBlock
          title="Tagline"
          content={results.brandMessaging?.tagline}
          icon={<MessageSquare className="w-5 h-5 text-cyan" />}
          color="border-cyan"
        />
        <ContentBlock
          title="Mission Statement"
          content={results.brandMessaging?.missionStatement}
          icon={<Target className="w-5 h-5 text-cyan" />}
          color="border-cyan"
        />
        <ContentBlock
          title="Value Proposition"
          content={results.brandMessaging?.valueProposition}
          icon={<Sparkles className="w-5 h-5 text-cyan" />}
          color="border-cyan"
        />
        <ContentBlock
          title="Unique Mechanism"
          content={results.brandMessaging?.uniqueMechanism}
          icon={<Zap className="w-5 h-5 text-cyan" />}
          color="border-cyan"
        />
      </div>

      {/* VSL Script */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">🎬 VSL Script</h2>
          <TedInsightsButton content={results.vslScript} contentType="vslScript" />
        </div>
        {Object.entries(results.vslScript || {}).map(([key, value]) => (
          <ContentBlock
            key={key}
            title={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            content={value}
            icon={<FileText className="w-5 h-5 text-cyan" />}
            color="border-cyan/50"
          />
        ))}
      </div>

      {/* Email Sequence */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">📧 Email Sequence</h2>
          <TedInsightsButton content={results.emailSequence} contentType="emailSequence" />
        </div>
        {results.emailSequence?.map((email, i) => (
          <ContentBlock
            key={i}
            title={`Day ${email.day}: ${email.subject}`}
            content={email.body}
            icon={<Mail className="w-5 h-5 text-cyan" />}
            color="border-cyan/50"
          />
        ))}
      </div>

      {/* Facebook Ads */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">📱 Facebook Ads</h2>
          <TedInsightsButton content={results.facebookAds} contentType="facebookAds" />
        </div>
        {results.facebookAds?.map((ad, i) => (
          <ContentBlock
            key={i}
            title={ad.adName}
            content={`Headline: ${ad.headline}\n\n${ad.primaryText}\n\nCTA: ${ad.cta}`}
            icon={<Megaphone className="w-5 h-5 text-cyan" />}
            color="border-cyan/50"
          />
        ))}
      </div>

      {/* Landing Page */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">🌐 Landing Page Copy</h2>
          <TedInsightsButton content={results.landingPageCopy} contentType="landingPageCopy" />
        </div>
        <ContentBlock
          title="Hero Section"
          content={`${results.landingPageCopy?.hero?.headline}\n\n${results.landingPageCopy?.hero?.subheadline}\n\nCTA: ${results.landingPageCopy?.hero?.cta}`}
          icon={<Target className="w-5 h-5 text-cyan" />}
          color="border-cyan/50"
        />
        <ContentBlock
          title="Offer Section"
          content={[
            ...(results.landingPageCopy?.offer?.modules || []),
            ...(results.landingPageCopy?.offer?.bonuses || []),
            `Price: ${results.landingPageCopy?.offer?.price}`
          ]}
          icon={<Gift className="w-5 h-5 text-cyan" />}
          color="border-cyan/50"
        />
      </div>
    </div>
  );
}
