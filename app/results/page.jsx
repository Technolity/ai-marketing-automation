"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import {
  Download, Rocket, Image as ImageIcon,
  CheckCircle, Loader2, FileJson, Save, ArrowLeft, AlertCircle,
  ChevronDown, FolderOpen
} from "lucide-react";

import { toast } from "sonner";

// Map generated content keys to display titles
const CONTENT_TITLES = {
  idealClient: "Ideal Client Builder",
  message: "Million-Dollar Message",
  stories: "Signature Story (3 Versions)",
  program8Week: "8-Week Program Blueprint",
  program12Month: "12-Month Program Blueprint",
  scripts: "Sales Scripts (Setter, Closer, Objections)",
  leadMagnet: "Lead Magnet",
  vslScript: "VSL Script",
  vslPage: "VSL Page Copy",
  emails: "15-Day Email Sequence",
  ads: "Ad Copy & Image Prompts",
  funnel: "Funnel Copy (Opt-in, VSL, Thank You)",
  youtube: "YouTube Show",
  contentPillars: "Content Pillars"
};

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
  10: "Funnel Copy",
  11: "YouTube Show",
  12: "Content Pillars"
};

// Helper function to format field names into readable titles
const formatFieldName = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

// Helper function to format a single value with proper structure
const formatSingleValue = (value, indent = 0) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '';

    if (typeof value[0] === 'string') {
      return value.map((item) => `• ${item}`).join('\n');
    }

    return value.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        const title = item.title || item.name || item.subject || item.headline || `Item ${idx + 1}`;
        const entries = Object.entries(item)
          .filter(([k, v]) => v && v !== '' && k !== 'title' && k !== 'name')
          .map(([k, v]) => {
            const formattedValue = formatSingleValue(v, indent + 1);
            if (formattedValue.includes('\n')) {
              return `  ${formatFieldName(k)}:\n${formattedValue.split('\n').map(line => `    ${line}`).join('\n')}`;
            }
            return `  ${formatFieldName(k)}: ${formattedValue}`;
          })
          .join('\n');
        return `${idx + 1}. ${title}\n${entries}`;
      }
      return `${idx + 1}. ${String(item)}`;
    }).join('\n\n');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([k, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => {
        const formattedValue = formatSingleValue(v, indent + 1);
        if (typeof v === 'object' && !Array.isArray(v)) {
          return `${formatFieldName(k)}:\n${formattedValue.split('\n').map(line => `  ${line}`).join('\n')}`;
        }
        if (Array.isArray(v)) {
          return `${formatFieldName(k)}:\n${formattedValue.split('\n').map(line => `  ${line}`).join('\n')}`;
        }
        return `${formatFieldName(k)}: ${formattedValue}`;
      });
    return entries.join('\n\n');
  }

  return String(value);
};

// Main function to format JSON content into displayable sections
const formatContentForDisplay = (jsonContent) => {
  if (!jsonContent || typeof jsonContent !== 'object') {
    return [];
  }

  const sections = [];

  Object.entries(jsonContent).forEach(([topKey, topValue]) => {
    if (typeof topValue === 'object' && !Array.isArray(topValue) && topValue !== null) {
      Object.entries(topValue).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          sections.push({
            key: formatFieldName(key),
            value: formatSingleValue(value)
          });
        }
      });
    } else if (topValue !== null && topValue !== undefined && topValue !== '') {
      sections.push({
        key: formatFieldName(topKey),
        value: formatSingleValue(topValue)
      });
    }
  });

  return sections.filter(s => s.value && s.value.trim() !== '');
};

export default function ResultsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState({});
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessionSource, setSessionSource] = useState(null); // Track where results came from

  // Session selector state
  const [savedSessions, setSavedSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);


  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        // Check localStorage for session source
        const storedSource = localStorage.getItem('ted_results_source');
        if (storedSource) {
          try {
            const source = JSON.parse(storedSource);
            setSessionSource(source);
          } catch (e) {
            console.error('Error parsing session source:', e);
          }
        }

        // Check if we're viewing a saved session via URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');

        if (sessionId) {
          // Fetch the saved session
          const { data: sessionData, error: sessionError } = await supabase
            .from('saved_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single();

          if (sessionError) throw sessionError;

          if (sessionData && sessionData.results_data) {
            setResults(sessionData.results_data);
            setSessionSource({
              type: 'loaded',
              name: sessionData.session_name,
              id: sessionId
            });
            setIsLoading(false);
            return;
          }
        }

        // Check if there are any results to show
        const hasActiveSession = localStorage.getItem('ted_has_active_session');

        if (!hasActiveSession || hasActiveSession !== 'true') {
          // No active session - show empty
          setResults({});
          setIsLoading(false);
          return;
        }

        // Fetch all approved slide results (current session)
        const { data, error } = await supabase
          .from('slide_results')
          .select('*')
          .eq('user_id', user.id)
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(1); // Get the most recent result

        if (error) throw error;

        // The main results are stored under slide_id 99 as a single object
        if (data && data.length > 0) {
          const aiOutput = data[0].ai_output;

          // Transform the structure: {1: {name, data}, 2: {name, data}} -> {1: data, 2: data}
          // or if already flat, use as-is
          const transformedResults = {};
          Object.entries(aiOutput).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
              // If it has a 'data' property, extract it; otherwise use the value directly
              if (value.data && typeof value.data === 'object') {
                transformedResults[key] = {
                  ...(value.name ? { _contentName: value.name } : {}),
                  ...value.data
                };
              } else {
                transformedResults[key] = value;
              }
            }
          });

          setResults(transformedResults);
        } else {
          setResults({});
        }

      } catch (error) {
        console.error("Failed to fetch results:", error);
        toast.error("Failed to load results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [supabase, router]);

  // Fetch all saved sessions for the dropdown
  const fetchSavedSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_sessions')
        .select('id, session_name, business_name, created_at, updated_at, is_complete')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSavedSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Load results from a specific saved session
  const loadSessionResults = async (sessionId) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessionData, error } = await supabase
        .from('saved_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (sessionData && sessionData.results_data) {
        // Transform results data
        const transformedResults = {};
        Object.entries(sessionData.results_data).forEach(([key, value]) => {
          if (value && typeof value === 'object') {
            if (value.data && typeof value.data === 'object') {
              transformedResults[key] = {
                ...(value.name ? { _contentName: value.name } : {}),
                ...value.data
              };
            } else {
              transformedResults[key] = value;
            }
          }
        });
        setResults(transformedResults);
        setSelectedSessionId(sessionId);
        setSessionSource({
          type: 'loaded',
          name: sessionData.session_name,
          id: sessionId
        });
        setShowSessionDropdown(false);
        toast.success(`Loaded: ${sessionData.session_name}`);
      } else if (sessionData && sessionData.generated_content) {
        // Fallback to generated_content if results_data is empty
        setResults(sessionData.generated_content);
        setSelectedSessionId(sessionId);
        setSessionSource({
          type: 'loaded',
          name: sessionData.session_name,
          id: sessionId
        });
        setShowSessionDropdown(false);
        toast.success(`Loaded: ${sessionData.session_name}`);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sessions when dropdown is opened
  useEffect(() => {
    if (showSessionDropdown) {
      fetchSavedSessions();
    }
  }, [showSessionDropdown]);

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
  };

  const handleGenerateImages = async () => {
    setIsGeneratingImages(true);
    try {
      toast.info("Generating ad images... (feature coming soon)");
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Images generated!");
    } catch (error) {
      toast.error("Failed to generate images");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleSaveData = async () => {
    if (!sessionName.trim()) {
      toast.error("Please enter a session name");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase
        .from('saved_sessions')
        .insert({
          user_id: user.id,
          session_name: sessionName.trim(),
          onboarding_data: {},
          results_data: results,
          generated_content: results,
          completed_steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // All 12 steps complete
          is_complete: true,
          status: 'completed'
        });


      if (error) throw error;

      toast.success("Session saved successfully!");
      setShowSaveDialog(false);
      setSessionName("");
    } catch (error) {
      console.error("Failed to save session:", error);
      toast.error("Failed to save session");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-white">
      <div className="max-w-7xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>

              {/* Session Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                  className="px-4 py-2 bg-[#1b1b1d] hover:bg-[#252528] border border-[#2a2a2d] rounded-lg font-medium flex items-center gap-2 transition-all text-sm"
                >
                  <FolderOpen className="w-4 h-4 text-cyan" />
                  {sessionSource?.name || 'Current Session'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSessionDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSessionDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-[#2a2a2d]">
                      <p className="text-xs text-gray-500 uppercase font-medium">Switch Business</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {savedSessions.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No saved businesses yet
                        </div>
                      ) : (
                        savedSessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => loadSessionResults(session.id)}
                            className={`w-full px-4 py-3 text-left hover:bg-[#252528] transition-colors flex items-center justify-between ${selectedSessionId === session.id ? 'bg-cyan/10 border-l-2 border-cyan' : ''
                              }`}
                          >
                            <div>
                              <p className="font-medium text-white text-sm">{session.session_name}</p>
                              {session.business_name && (
                                <p className="text-xs text-cyan">{session.business_name}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(session.updated_at || session.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {session.is_complete && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Source Banner */}
            {sessionSource && sessionSource.type === 'loaded' && (
              <div className="mb-4 p-4 bg-cyan/10 border border-cyan/30 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-cyan" />
                <p className="text-cyan">
                  Viewing results from: <strong>{sessionSource.name}</strong>
                </p>
              </div>
            )}


            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Your Complete Marketing System
                </h1>
                <p className="text-gray-400">All your AI-generated content in one place</p>
              </div>

              {Object.keys(results).length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20"
                  >
                    <Save className="w-5 h-5" /> Save Data
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="px-6 py-3 bg-[#1b1b1d] hover:bg-[#2a2a2d] border border-[#2a2a2d] rounded-lg font-semibold flex items-center gap-2 transition-all"
                  >
                    <FileJson className="w-5 h-5" /> Export JSON
                  </button>
                  <button
                    onClick={handlePushToGHL}
                    className="px-6 py-3 bg-cyan rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-cyan/20 text-black"
                  >
                    <Rocket className="w-5 h-5" /> Push to GHL
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Results Content */}
        <div className="space-y-6">
          {Object.entries(results).map(([contentKey, content], idx) => {
            // Use _contentName if available, otherwise fall back to lookup tables
            const title = content?._contentName || CONTENT_TITLES[contentKey] || STEP_TITLES[contentKey] || formatFieldName(contentKey);

            // Remove _contentName from display content
            const displayContent = { ...content };
            delete displayContent._contentName;


            return (
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h2 className="text-2xl font-bold">{title}</h2>
                </div>

                <div className="space-y-6">
                  {formatContentForDisplay(displayContent).map(({ key, value }, index) => (

                    <div key={`${key}-${index}`} className="space-y-3">
                      <h4 className="text-sm font-bold text-cyan uppercase tracking-wide flex items-center gap-2">
                        <div className="w-1 h-4 bg-cyan rounded-full"></div>
                        {key}
                      </h4>
                      <div className="bg-[#0e0e0f] p-5 rounded-xl border border-[#2a2a2d] hover:border-[#3a3a3d] transition-colors">
                        <p className="text-gray-200 whitespace-pre-wrap text-base leading-relaxed font-normal">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {Object.keys(results).length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1b1b1d] flex items-center justify-center">
              <FileJson className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No Results Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Complete the wizard to generate your marketing content, or load a previously saved session.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-cyan hover:brightness-110 rounded-lg font-semibold transition-all text-black"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-4">Save Your Marketing System</h3>
            <p className="text-gray-400 mb-6">Give this session a name so you can find it later</p>

            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Fitness Coaching Campaign 2025"
              className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-lg p-4 text-white focus:ring-2 focus:ring-cyan focus:border-transparent outline-none transition-all mb-6"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveData()}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-6 py-3 bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveData}
                disabled={isSaving || !sessionName.trim()}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
