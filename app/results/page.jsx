"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, Rocket, Image as ImageIcon,
  CheckCircle, Loader2, FileJson, Save, ArrowLeft, AlertCircle,
  ChevronDown, FolderOpen, ChevronRight, Menu, X, Users, MessageSquare,
  BookOpen, Calendar, ScrollText, Magnet, Video, Mail, Megaphone,
  Layout, MonitorPlay, Layers
} from "lucide-react";
import { toast } from "sonner";
import GHLPushButton from "@/components/GHLPushButton";

// Map generated content keys to display titles
const CONTENT_TITLES = {
  idealClient: "Ideal Client Builder",
  message: "Million-Dollar Message",
  stories: "Signature Story",
  program8Week: "8-Week Program Blueprint",
  program12Month: "12-Month Program Blueprint",
  scripts: "Sales Scripts",
  leadMagnet: "Lead Magnet",
  vslScript: "VSL Script",
  vslPage: "VSL Page Copy",
  emails: "15-Day Email Sequence",
  ads: "Ad Copy & Prompts",
  funnel: "Funnel Copy",
  youtube: "YouTube Show",
  contentPillars: "Content Pillars"
};

const STEP_TITLES = {
  1: "Industry Analysis",
  2: "Target Market Summary",
  3: "Core Message",
  4: "Ideal Client Profile",
  5: "Outcomes Framework",
  6: "Unique Positioning",
  7: "Signature Story",
  8: "Social Proof Strategy",
  9: " 8-Week Program",
  10: "Deliverables Structure",
  11: "Pricing Strategy",
  12: "Assets Gap Analysis",
  13: "Growth Strategy",
  14: "Brand Voice Guide",
  15: "Visual Style Guide",
  16: "CTA Variations",
  17: "Platform Ads Preview",
  18: "90-Day Action Plan",
  19: "Stage Recommendations",
  20: "Help Priority Analysis"
};

// Icons mapping for sidebar
const CONTENT_ICONS = {
  idealClient: Users,
  message: MessageSquare,
  stories: BookOpen,
  program8Week: Calendar,
  program12Month: Calendar,
  scripts: ScrollText,
  leadMagnet: Magnet,
  vslScript: Video,
  vslPage: Layout,
  emails: Mail,
  ads: Megaphone,
  funnel: Layers,
  youtube: MonitorPlay,
  contentPillars: Layers,
  default: FileJson
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
  const { session, loading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessionSource, setSessionSource] = useState(null);

  // Session selector state
  const [savedSessions, setSavedSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);

  // New UI State
  const [selectedContentKey, setSelectedContentKey] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.push("/auth/login");
      return;
    }

    const fetchResults = async () => {
      try {
        const storedSource = localStorage.getItem('ted_results_source');
        if (storedSource) {
          try { setSessionSource(JSON.parse(storedSource)); } catch (e) { }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');

        const endpoint = sessionId
          ? `/api/os/results?session_id=${sessionId}`
          : '/api/os/results';

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch results');

        const data = await res.json();

        if (data.source) {
          setSessionSource(data.source);
          setSelectedSessionId(data.source.id);
        }

        if (data.data && Object.keys(data.data).length > 0) {
          processResults(data.data);
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
  }, [session, authLoading, router]);

  const processResults = (rawData) => {
    const transformedResults = {};
    Object.entries(rawData).forEach(([key, value]) => {
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
  };

  const fetchSavedSessions = async () => {
    try {
      const res = await fetch('/api/os/sessions');
      const data = await res.json();
      if (data.sessions) {
        setSavedSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const loadSessionResults = async (sessionId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/os/results?session_id=${sessionId}`);
      const data = await res.json();

      if (data.data) {
        processResults(data.data);
        setSessionSource(data.source);
        setSelectedSessionId(sessionId);
        setShowSessionDropdown(false);
        setSelectedContentKey(null); // Reset selection
        setIsSidebarOpen(true); // Re-open sidebar
        toast.success(`Loaded: ${data.source?.name}`);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSaveData = async () => {
    if (!sessionName.trim()) {
      toast.error("Please enter a session name");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/os/sessions", {
        method: "POST",
        body: JSON.stringify({
          sessionName: sessionName.trim(),
          completedSteps: Array.from({ length: 20 }, (_, i) => i + 1),
          answers: {},
          generatedContent: results,
          isComplete: true
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Session saved successfully!");
      setShowSaveDialog(false);
      setSessionName("");
      fetchSavedSessions();
    } catch (error) {
      console.error("Failed to save session:", error);
      toast.error("Failed to save session");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentSelect = (key) => {
    setSelectedContentKey(key);
    // Auto close sidebar on selection for cleaner reading experience
    setIsSidebarOpen(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan animate-spin" />
      </div>
    );
  }

  // Current Content Rendering Logic
  const currentContent = selectedContentKey ? results[selectedContentKey] : null;
  const currentTitle = currentContent
    ? (currentContent._contentName || CONTENT_TITLES[selectedContentKey] || STEP_TITLES[selectedContentKey] || formatFieldName(selectedContentKey))
    : "Welcome";

  const displayContent = currentContent ? { ...currentContent } : null;
  if (displayContent) delete displayContent._contentName;

  const IconComponent = selectedContentKey ? (CONTENT_ICONS[selectedContentKey] || CONTENT_ICONS.default) : Rocket;

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-[#0e0e0f] text-white overflow-hidden font-sans selection:bg-cyan/30">

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : "-100%",
          width: isSidebarOpen ? "320px" : "0px",
          opacity: isSidebarOpen ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed lg:relative z-50 h-full bg-[#1b1b1d]/80 backdrop-blur-xl border-r border-[#2a2a2d] flex flex-col flex-shrink-0 lg:flex overflow-hidden`}
      >
        <div className="p-6 border-b border-[#2a2a2d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-blue-600 flex items-center justify-center shadow-lg shadow-cyan/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">TedOS</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          <div className="mb-4 px-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Generated Assets</p>
            {Object.keys(results).length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-[#2a2a2d] rounded-xl">
                <p className="text-sm text-gray-500">No content generated yet.</p>
              </div>
            ) : (
              Object.keys(results).map((key, idx) => {
                const ItemIcon = CONTENT_ICONS[key] || CONTENT_ICONS.default;
                const title = results[key]?._contentName || CONTENT_TITLES[key] || STEP_TITLES[key] || formatFieldName(key);
                const isActive = selectedContentKey === key;

                return (
                  <motion.button
                    key={key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleContentSelect(key)}
                    className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 border border-transparent ${isActive
                      ? "bg-cyan/10 text-cyan border-cyan/20 shadow-lg shadow-cyan/5"
                      : "text-gray-400 hover:text-white hover:bg-[#2a2a2d]"
                      }`}
                  >
                    <ItemIcon className={`w-5 h-5 ${isActive ? "text-cyan" : "text-gray-500 group-hover:text-gray-300"}`} />
                    <span className="text-sm font-medium truncate">{title}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#2a2a2d]">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2a2a2d] hover:bg-[#343437] text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Top Header */}
        <header className="h-16 border-b border-[#2a2a2d] bg-[#0e0e0f]/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-30">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Open Sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            {/* Breadcrumb / Title */}
            {selectedContentKey && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                title="Back to Menu"
              >
                <span className="text-gray-500">Results</span>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <span className="text-white font-medium truncate max-w-[200px] md:max-w-md">{currentTitle}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Session Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                className="px-3 py-2 hover:bg-[#1b1b1d] rounded-lg font-medium flex items-center gap-2 transition-all text-xs text-gray-400 hover:text-white"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">{sessionSource?.name || 'Session'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showSessionDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSessionDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-[#1b1b1d] border border-[#2a2a2d] rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-[#2a2a2d]">
                      <p className="text-xs text-gray-500 uppercase font-medium">Switch Session</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {savedSessions.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No saved sessions found.
                        </div>
                      ) : (
                        savedSessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => loadSessionResults(session.id)}
                            className={`w-full px-4 py-3 text-left hover:bg-[#252528] transition-colors flex items-center justify-between border-b last:border-0 border-[#2a2a2d]/50 ${selectedSessionId === session.id ? 'bg-cyan/5' : ''
                              }`}
                          >
                            <div className="overflow-hidden">
                              <p className={`font-medium text-sm truncate ${selectedSessionId === session.id ? 'text-cyan' : 'text-gray-300'}`}>{session.session_name}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {new Date(session.updated_at || session.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-6 w-px bg-[#2a2a2d] mx-2"></div>

            <button
              onClick={() => setShowSaveDialog(true)}
              className="p-2 hover:bg-[#2a2a2d] rounded-lg text-gray-400 hover:text-green-500 transition-colors"
              title="Save Session"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={handleExportJSON}
              className="p-2 hover:bg-[#2a2a2d] rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
              title="Export JSON"
            >
              <FileJson className="w-5 h-5" />
            </button>
            <GHLPushButton sessionId={selectedSessionId} minimal={true} />
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 relative">
          <AnimatePresence mode="wait">
            {!selectedContentKey ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center min-h-full py-12 text-center max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-black border border-[#2a2a2d] flex items-center justify-center mb-8 shadow-2xl relative">
                  <div className="absolute inset-0 rounded-full bg-cyan/20 blur-xl animate-pulse"></div>
                  <Rocket className="w-10 h-10 text-cyan relative z-10" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent pb-2 leading-none tracking-tighter">
                  TedOS has built your<br />marketing system.
                </h1>
                <p className="text-lg text-gray-400 mb-10 max-w-lg leading-relaxed font-light">
                  Your complete 20-part marketing system is ready. Use the sidebar to explore your message, offers, and assets.
                </p>

                {!isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1"
                  >
                    <Menu className="w-4 h-4" />
                    Open Menu
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={selectedContentKey}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto"
              >
                <header className="mb-8 flex items-center gap-4 border-b border-[#2a2a2d] pb-6">
                  <div className="p-4 rounded-2xl bg-cyan/5 border border-cyan/10 shadow-glow-sm">
                    <IconComponent className="w-10 h-10 text-cyan text-glow" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter">{currentTitle}</h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium uppercase tracking-widest">Targeted Marketing Module</p>
                  </div>
                </header>

                <div className="space-y-8 pb-20">
                  {formatContentForDisplay(displayContent).map(({ key, value }, index) => (
                    <div key={`${key}-${index}`} className="group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-cyan shadow-glow-sm group-hover:scale-150 transition-transform"></div>
                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{key}</h4>
                      </div>
                      <div className="glass-card p-8 lg:p-10 rounded-3xl border border-white/5 shadow-2xl hover:border-cyan/20 transition-all relative overflow-hidden group/card">
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(value);
                              toast.success("Copied to clipboard");
                            }}
                            className="p-3 bg-white/5 hover:bg-cyan hover:text-black rounded-xl border border-white/10 transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          </button>
                        </div>
                        <p className="text-gray-200 whitespace-pre-wrap text-lg lg:text-xl leading-relaxed font-light selection:bg-cyan/40">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Save Dialog Modal */}
      <AnimatePresence>
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan/20 blur-3xl rounded-full pointer-events-none"></div>

              <h3 className="text-2xl font-bold mb-2 z-10 relative">Save Session</h3>
              <p className="text-gray-400 mb-6 text-sm z-10 relative">Name your session to easily find it later.</p>

              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Q1 Marketing Campaign"
                autoFocus
                className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan/50 focus:border-cyan outline-none transition-all mb-6 placeholder:text-gray-600"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveData()}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-6 py-3 bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-xl font-medium transition-all text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveData}
                  disabled={isSaving || !sessionName.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan to-blue-600 hover:brightness-110 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan/20"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
