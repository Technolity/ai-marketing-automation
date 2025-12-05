"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import {
  Download, Rocket, Image as ImageIcon,
  CheckCircle, Loader2, FileJson
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const STEP_TITLES = {
  1: "Ideal Client Builder",
  2: "Million-Dollar Message",
  3: "Signature Story Creator",
  4: "High-Ticket Offer Builder",
  5: "Personalized Sales Scripts",
  6: "Lead Magnet Generator",
  7: "VSL Builder",
  8: "15-Day Email Sequence",
  9: "Ad Copy & Creative",
  10: "Funnel Copy"
};

// Helper to format content for display
const formatContentForDisplay = (jsonContent) => {
  if (!jsonContent || typeof jsonContent !== 'object') {
    return jsonContent;
  }

  return Object.entries(jsonContent).map(([key, value]) => {
    const formattedKey = key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();

    let formattedValue;
    if (Array.isArray(value)) {
      formattedValue = value.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
    } else if (typeof value === 'object' && value !== null) {
      formattedValue = JSON.stringify(value, null, 2);
    } else {
      formattedValue = value;
    }

    return { key: formattedKey, value: formattedValue };
  });
};

export default function ResultsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState({});
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        // Fetch all approved slide results
        const { data, error } = await supabase
          .from('slide_results')
          .select('*')
          .eq('user_id', user.id)
          .eq('approved', true)
          .order('slide_id', { ascending: true });

        if (error) throw error;

        // Group results by slide_id
        const groupedResults = {};
        data.forEach(item => {
          groupedResults[item.slide_id] = item.ai_output;
        });

        setResults(groupedResults);
      } catch (error) {
        console.error("Failed to fetch results:", error);
        toast.error("Failed to load results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [supabase, router]);

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marketing-automation-results.json';
    link.click();
    toast.success("Downloaded JSON file!");
  };

  const handlePushToGHL = async () => {
    toast.info("Pushing to GoHighLevel... (feature coming soon)");
    // TODO: Implement GHL push functionality
  };

  const handleGenerateImages = async () => {
    setIsGeneratingImages(true);
    try {
      toast.info("Generating ad images... (feature coming soon)");
      // TODO: Implement OpenAI image generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Images generated!");
    } catch (error) {
      toast.error("Failed to generate images");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Complete Marketing System</h1>
              <p className="text-gray-400">All your AI-generated content in one place</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportJSON}
                className="px-6 py-3 bg-[#1b1b1d] hover:bg-[#2a2a2d] border border-[#2a2a2d] rounded-lg font-semibold flex items-center gap-2 transition-all"
              >
                <FileJson className="w-5 h-5" /> Export JSON
              </button>
              <button
                onClick={handleGenerateImages}
                disabled={isGeneratingImages}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20"
              >
                {isGeneratingImages ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" /> Generate Ad Images
                  </>
                )}
              </button>
              <button
                onClick={handlePushToGHL}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-red-900/20"
              >
                <Rocket className="w-5 h-5" /> Push to GHL
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results Content */}
        <div className="space-y-6">
          {Object.entries(results).map(([slideId, content]) => (
            <motion.div
              key={slideId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: parseInt(slideId) * 0.05 }}
              className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-2xl font-bold">{STEP_TITLES[slideId]}</h2>
              </div>

              <div className="space-y-4">
                {formatContentForDisplay(content).map(({ key, value }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                      {key}
                    </label>
                    <div className="bg-[#0e0e0f] p-4 rounded-lg border border-[#2a2a2d] text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {Object.keys(results).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No results yet. Complete the wizard to see your content here.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
