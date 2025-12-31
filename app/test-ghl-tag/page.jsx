"use client";
import { useState } from "react";
import { Tag, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function TestGHLTagPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [configured, setConfigured] = useState(null);

  // Check if credentials are configured on page load
  const checkConfiguration = async () => {
    try {
      const res = await fetch('/api/ghl/tags/test-create', {
        method: 'GET'
      });
      const data = await res.json();
      setConfigured(data.configured);
    } catch (error) {
      console.error('Configuration check error:', error);
      setConfigured(false);
    }
  };

  // Check configuration when component mounts
  useState(() => {
    checkConfiguration();
  }, []);

  const handleCreateTag = async () => {
    setTesting(true);
    setResult(null);

    try {
      const res = await fetch('/api/ghl/tags/test-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        toast.success('Tag created successfully in GoHighLevel!');
      } else {
        toast.error('Tag creation failed: ' + data.error);
      }

    } catch (error) {
      console.error('Tag creation error:', error);
      toast.error('Failed to connect to API: ' + error.message);
      setResult({
        success: false,
        error: 'Network error',
        details: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan to-blue-500 bg-clip-text text-transparent">
            GHL Tag Creation Test
          </h1>
          <p className="text-gray-400">
            Test creating an option tag in GoHighLevel before integrating into main flow
          </p>
        </div>

        {/* Setup Instructions */}
        <div className="bg-[#1b1b1d] border border-cyan/30 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-cyan mb-2">Before Testing</h3>
              <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                <li>Ensure <code className="bg-black/50 px-2 py-1 rounded">GHL_API_KEY</code> is set in your <code className="bg-black/50 px-2 py-1 rounded">.env.local</code> file</li>
                <li>Ensure <code className="bg-black/50 px-2 py-1 rounded">GHL_LOCATION_ID</code> is set in your <code className="bg-black/50 px-2 py-1 rounded">.env.local</code> file</li>
                <li>Verify your GoHighLevel account has permissions to create tags</li>
                <li>Click the button below to create a test tag named "Test-Option-Tag"</li>
                <li>Check your GHL dashboard (Settings → Tags) to verify the tag was created</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Configuration Status */}
        {configured !== null && (
          <div className={`border rounded-lg p-4 mb-8 ${configured ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
            <div className="flex items-center gap-2">
              {configured ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-400 font-medium">GHL credentials are configured</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-400 font-medium">GHL credentials not found - Please check your .env.local file</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Test Button */}
        <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Create Test Tag</h2>

          <div className="space-y-6">
            <div className="bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Tag Name:</p>
              <p className="text-lg font-mono text-cyan">Test-Option-Tag</p>
              <p className="text-xs text-gray-500 mt-2">
                This tag will be created in your GoHighLevel location
              </p>
            </div>

            <button
              onClick={handleCreateTag}
              disabled={testing || configured === false}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/90 hover:to-blue-500/90 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan/20"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Tag...
                </>
              ) : (
                <>
                  <Tag className="w-5 h-5" />
                  Create Test Option Tag
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              This will create a tag in your GoHighLevel account. You can delete it later from GHL Settings → Tags.
            </p>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className={`border rounded-lg p-6 ${result.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              )}

              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-2 ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                  {result.success ? 'Success!' : 'Failed'}
                </h3>

                {result.success ? (
                  <div className="space-y-4">
                    <p className="text-gray-300">{result.message}</p>

                    <div className="bg-black/30 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-2">Tag Details:</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-500">Tag Name:</span> <code className="text-cyan">{result.tagName}</code></p>
                        {result.tagId && (
                          <p><span className="text-gray-500">Tag ID:</span> <code className="text-gray-400">{result.tagId}</code></p>
                        )}
                      </div>
                    </div>

                    {result.nextSteps && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-400 mb-2">Next Steps:</p>
                        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                          {result.nextSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-red-400">{result.error}</p>

                    {result.troubleshooting && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <p className="text-sm font-semibold text-yellow-500 mb-1">Troubleshooting:</p>
                        <p className="text-sm text-yellow-200">{result.troubleshooting}</p>
                      </div>
                    )}

                    {result.details && (
                      <div className="bg-black/30 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">Error Details:</p>
                        <pre className="text-xs text-red-400 overflow-x-auto">
                          {typeof result.details === 'string'
                            ? result.details
                            : JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}

                    {result.status === 422 && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-sm text-blue-300">
                          <strong>Note:</strong> If the tag already exists, this error is expected.
                          You can delete "Test-Option-Tag" from your GHL dashboard and try again.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {result?.ghlResponse && (
          <details className="mt-4 bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg p-4">
            <summary className="cursor-pointer text-sm text-gray-400 font-mono">
              Show GHL API Response (Debug)
            </summary>
            <pre className="text-xs text-gray-500 mt-4 overflow-x-auto">
              {JSON.stringify(result.ghlResponse, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
