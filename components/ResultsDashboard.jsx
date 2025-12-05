// components/ResultsDashboard.jsx
"use client";
import ContentBlock from "./ContentBlock";
import ExportButton from "./ExportButton";
import GHLPushButton from "./GHLPushButton";
import { useRouter } from "next/navigation";
import {
  Copy, RefreshCw, MessageSquare, Target, Diamond, Zap, FileText, Mail, Megaphone, Layout, Gift
} from "lucide-react";

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
      <div className="bg-grayDark p-8 rounded-xl border border-accentRed">
        <h1 className="text-4xl font-bold mb-2">
          Your Marketing System for <span className="text-accentRed">{results.businessName}</span>
        </h1>
        <p className="text-gray-400 text-lg">{results.productName}</p>

        <div className="flex gap-4 mt-6">
          <ExportButton data={results} filename={`${results.businessName} -marketing`} />
          <GHLPushButton data={results} />
          <button
            onClick={() => router.push("/intake")}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
          >
            <RefreshCw className="w-4 h-4" /> New Generation
          </button>
        </div>
      </div>

      {/* Brand Messaging */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">📋 Brand Messaging</h2>
        <ContentBlock
          title="Tagline"
          content={results.brandMessaging?.tagline}
          icon={<MessageSquare className="w-5 h-5 text-blue-400" />}
          color="border-blue-500"
        />
        <ContentBlock
          title="Mission Statement"
          content={results.brandMessaging?.missionStatement}
          icon={<Target className="w-5 h-5 text-red-400" />}
          color="border-blue-500"
        />
        <ContentBlock
          title="Value Proposition"
          content={results.brandMessaging?.valueProposition}
          icon={<Diamond className="w-5 h-5 text-purple-400" />}
          color="border-blue-500"
        />
        <ContentBlock
          title="Unique Mechanism"
          content={results.brandMessaging?.uniqueMechanism}
          icon={<Zap className="w-5 h-5 text-yellow-400" />}
          color="border-blue-500"
        />
      </div>

      {/* VSL Script */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">🎬 VSL Script</h2>
        {Object.entries(results.vslScript || {}).map(([key, value]) => (
          <ContentBlock
            key={key}
            title={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            content={value}
            icon={<FileText className="w-5 h-5 text-green-400" />}
            color="border-purple-500"
          />
        ))}
      </div>

      {/* Email Sequence */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">📧 Email Sequence</h2>
        {results.emailSequence?.map((email, i) => (
          <ContentBlock
            key={i}
            title={`Day ${email.day}: ${email.subject} `}
            content={email.body}
            icon={<Mail className="w-5 h-5 text-orange-400" />}
            color="border-green-500"
          />
        ))}
      </div>

      {/* Facebook Ads */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">📱 Facebook Ads</h2>
        {results.facebookAds?.map((ad, i) => (
          <ContentBlock
            key={i}
            title={ad.adName}
            content={`Headline: ${ad.headline} \n\n${ad.primaryText} \n\nCTA: ${ad.cta} `}
            icon={<Megaphone className="w-5 h-5 text-pink-400" />}
            color="border-pink-500"
          />
        ))}
      </div>

      {/* Landing Page */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">🌐 Landing Page Copy</h2>
        <ContentBlock
          title="Hero Section"
          content={`${results.landingPageCopy?.hero?.headline} \n\n${results.landingPageCopy?.hero?.subheadline} \n\nCTA: ${results.landingPageCopy?.hero?.cta} `}
          icon={<Target className="w-5 h-5 text-indigo-400" />}
          color="border-yellow-500"
        />
        <ContentBlock
          title="Offer Section"
          content={[
            ...results.landingPageCopy?.offer?.modules || [],
            ...results.landingPageCopy?.offer?.bonuses || [],
            `Price: ${results.landingPageCopy?.offer?.price} `
          ]}
          icon={<Gift className="w-5 h-5 text-teal-400" />}
          color="border-yellow-500"
        />
      </div>
    </div>
  );
}
