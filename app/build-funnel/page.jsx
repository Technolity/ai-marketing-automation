"use client";
import { useState, useEffect } from 'react';
import { Rocket, Sparkles, CheckCircle, Loader2, ArrowRight, Image as ImageIcon, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import GHLCredentialsForm from '@/components/GHLCredentialsForm';
import GHLPushProgress from '@/components/GHLPushProgress';

/**
 * Build Funnel Page
 * Complete workflow for generating content, images, CSS, and pushing to GHL
 */
export default function BuildFunnelPage() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Setup, 2: Credentials, 3: Generate, 4: Push, 5: Complete
  const [sessionId, setSessionId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [savedSessions, setSavedSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [credentials, setCredentials] = useState(null);
  const [credentialsValid, setCredentialsValid] = useState(false);

  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingCSS, setGeneratingCSS] = useState(false);
  const [imageStatus, setImageStatus] = useState(null);
  const [cssStatus, setCssStatus] = useState(null);

  const [pushing, setPushing] = useState(false);
  const [pushOperationId, setPushOperationId] = useState(null);

  // Load saved sessions on mount
  useEffect(() => {
    loadSavedSessions();
  }, []);

  // Load session from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get('sessionId');

    if (urlSessionId) {
      setSessionId(urlSessionId);
      localStorage.setItem('currentSessionId', urlSessionId);
      // Find and set the selected session
      const session = savedSessions.find(s => s.id === urlSessionId);
      if (session) {
        setSelectedSession(session);
      }
    } else {
      const storedSessionId = localStorage.getItem('currentSessionId');
      if (storedSessionId) {
        setSessionId(storedSessionId);
        const session = savedSessions.find(s => s.id === storedSessionId);
        if (session) {
          setSelectedSession(session);
        }
      }
    }
  }, [savedSessions]);

  const loadSavedSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();

      if (data.sessions) {
        // Sort by most recent first
        const sorted = data.sessions.sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        );
        setSavedSessions(sorted);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSessionSelect = (session) => {
    setSessionId(session.id);
    setSelectedSession(session);
    localStorage.setItem('currentSessionId', session.id);
    toast.success(`Selected: ${session.session_name || 'Session'}`);
  };

  const handleCredentialsSaved = (creds) => {
    setCredentials(creds);
    toast.success('Credentials saved! Ready to generate content.');
    setCurrentStep(3);
  };

  const handleValidationComplete = (result) => {
    setCredentialsValid(result.valid);
  };

  const startImageGeneration = async () => {
    if (!sessionId) {
      toast.error('No session selected');
      return;
    }

    setGeneratingImages(true);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Image generation started in background!');
        setImageStatus('generating');

        // Poll for status
        pollImageStatus();
      } else {
        toast.error('Failed to start image generation');
        setGeneratingImages(false);
      }
    } catch (error) {
      console.error('Error starting image generation:', error);
      toast.error('Failed to start image generation');
      setGeneratingImages(false);
    }
  };

  const pollImageStatus = async () => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/images/generate?sessionId=${sessionId}`);
        const data = await res.json();

        if (data.allCompleted) {
          setImageStatus('completed');
          setGeneratingImages(false);
          toast.success(`Generated ${data.images.length} images!`);
          return true;
        } else {
          setImageStatus(`${data.completedCount}/${data.totalCount} images completed`);
          return false;
        }
      } catch (error) {
        console.error('Error checking image status:', error);
        return false;
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(async () => {
      const completed = await checkStatus();
      if (completed) {
        clearInterval(interval);
      }
    }, 3000);

    // Initial check
    checkStatus();
  };

  const startCSSGeneration = async () => {
    if (!sessionId) {
      toast.error('No session selected');
      return;
    }

    setGeneratingCSS(true);

    try {
      const res = await fetch('/api/css/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await res.json();

      if (data.success) {
        toast.success('CSS code generated!');
        setCssStatus('completed');
      } else {
        toast.error('Failed to generate CSS');
      }
    } catch (error) {
      console.error('Error generating CSS:', error);
      toast.error('Failed to generate CSS');
    } finally {
      setGeneratingCSS(false);
    }
  };

  const handleGenerateAll = async () => {
    // Start both image and CSS generation in parallel
    await Promise.all([
      startImageGeneration(),
      startCSSGeneration()
    ]);
  };

  const handlePushToGHL = async () => {
    if (!sessionId || !credentials) {
      toast.error('Missing session or credentials');
      return;
    }

    // Get access token from user (we don't store it client-side for security)
    const accessToken = prompt('Please re-enter your GHL Access Token to proceed:');
    if (!accessToken) {
      toast.error('Access token required');
      return;
    }

    setPushing(true);
    setCurrentStep(4);

    try {
      const res = await fetch('/api/ghl/push-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ghlLocationId: credentials.location_id,
          ghlAccessToken: accessToken
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Content pushed to GHL!');
        setPushOperationId(data.operationId);
        setCurrentStep(5);
      } else {
        toast.error(data.error || 'Failed to push content');
        setPushing(false);
      }
    } catch (error) {
      console.error('Error pushing to GHL:', error);
      toast.error('Failed to push content');
      setPushing(false);
    }
  };

  const handlePushComplete = (operation) => {
    setPushing(false);
    toast.success('Push operation completed!');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan to-blue-500 bg-clip-text text-transparent">
            Build Your Funnel
          </h1>
          <p className="text-gray-400">
            Generate content, images, and CSS, then push everything to your GHL funnel
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Setup', icon: Sparkles },
              { num: 2, label: 'Credentials', icon: CheckCircle },
              { num: 3, label: 'Generate', icon: ImageIcon },
              { num: 4, label: 'Push to GHL', icon: Rocket },
              { num: 5, label: 'Complete', icon: CheckCircle }
            ].map((step, i) => (
              <div key={step.num} className="flex items-center">
                <div className={`flex flex-col items-center ${
                  currentStep >= step.num ? 'opacity-100' : 'opacity-40'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    currentStep > step.num
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : currentStep === step.num
                      ? 'bg-cyan/20 border-2 border-cyan'
                      : 'bg-gray-700 border-2 border-gray-600'
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium">{step.label}</p>
                </div>
                {i < 4 && (
                  <ArrowRight className={`w-6 h-6 mx-4 ${
                    currentStep > step.num ? 'text-green-500' : 'text-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Setup */}
        {currentStep === 1 && (
          <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
            <p className="text-gray-400 mb-6">
              This workflow will help you generate all the content you need for your GHL funnel,
              including AI-generated images and custom CSS styling.
            </p>

            {/* Session Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select a Session
              </label>

              {loadingSessions ? (
                <div className="flex items-center gap-3 text-gray-400 py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading your sessions...</span>
                </div>
              ) : savedSessions.length === 0 ? (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm mb-2">
                    No saved sessions found.
                  </p>
                  <p className="text-xs text-gray-400">
                    Please complete the questionnaire and content generation first.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={sessionId || ''}
                      onChange={(e) => {
                        const session = savedSessions.find(s => s.id === e.target.value);
                        if (session) handleSessionSelect(session);
                      }}
                      className="w-full px-4 py-3 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-cyan transition-colors pr-10"
                    >
                      <option value="" disabled>Select a session...</option>
                      {savedSessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.session_name || 'Untitled Session'} - {new Date(session.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>

                  <button
                    onClick={loadSavedSessions}
                    className="flex items-center gap-2 text-sm text-cyan hover:text-cyan/80 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Sessions
                  </button>
                </div>
              )}
            </div>

            {/* Selected Session Info */}
            {selectedSession && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-400 font-semibold mb-1">
                      {selectedSession.session_name || 'Session Selected'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Created: {new Date(selectedSession.created_at).toLocaleString()}
                    </p>
                    {selectedSession.answers?.industry && (
                      <p className="text-xs text-gray-500 mt-1">
                        Industry: {selectedSession.answers.industry}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setCurrentStep(2)}
              disabled={!sessionId}
              className="px-6 py-3 bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/90 hover:to-blue-500/90 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold flex items-center gap-2"
            >
              Continue to Credentials
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Credentials */}
        {currentStep === 2 && (
          <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg p-8">
            <GHLCredentialsForm
              onCredentialsSaved={handleCredentialsSaved}
              onValidationComplete={handleValidationComplete}
              autoValidate={true}
            />
          </div>
        )}

        {/* Step 3: Generate Content */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Generate Images & CSS</h2>
              <p className="text-gray-400 mb-6">
                Generate AI-powered images and custom CSS styling for your funnel.
                This runs in the background and may take 2-3 minutes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Image Generation */}
                <div className="bg-black/30 border border-cyan/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <ImageIcon className="w-6 h-6 text-cyan" />
                    <h3 className="text-lg font-bold">AI Images</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Generates 8 images: hero, testimonials, product, features, background, logo
                  </p>
                  {imageStatus === 'completed' ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Complete!</span>
                    </div>
                  ) : generatingImages ? (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{imageStatus || 'Generating...'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={startImageGeneration}
                      className="px-4 py-2 bg-cyan hover:bg-cyan/90 rounded-lg font-semibold"
                    >
                      Generate Images
                    </button>
                  )}
                </div>

                {/* CSS Generation */}
                <div className="bg-black/30 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-bold">Custom CSS</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Generates CSS code based on your color preferences
                  </p>
                  {cssStatus === 'completed' ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Complete!</span>
                    </div>
                  ) : generatingCSS ? (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <button
                      onClick={startCSSGeneration}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-semibold"
                    >
                      Generate CSS
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleGenerateAll}
                  disabled={generatingImages || generatingCSS}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/90 hover:to-blue-500/90 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate All (Parallel)
                </button>

                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={imageStatus !== 'completed' && cssStatus !== 'completed'}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-bold flex items-center gap-2"
                >
                  Continue to Push
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Push to GHL */}
        {currentStep === 4 && (
          <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Push to GoHighLevel</h2>
            <p className="text-gray-400 mb-6">
              Ready to push all generated content, images, and colors to your GHL funnel.
            </p>

            <button
              onClick={handlePushToGHL}
              disabled={pushing}
              className="px-8 py-4 bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/90 hover:to-blue-500/90 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg flex items-center gap-3 shadow-lg shadow-cyan/20"
            >
              {pushing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Pushing to GHL...
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6" />
                  Push Everything to GHL
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 5: Complete - Show Progress */}
        {currentStep === 5 && pushOperationId && (
          <div>
            <GHLPushProgress
              operationId={pushOperationId}
              isActive={true}
              onComplete={handlePushComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
