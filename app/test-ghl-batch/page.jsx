"use client";
import { useState } from "react";
import { Rocket, CheckCircle, XCircle, Loader2, AlertCircle, Image, Palette, FileText, Layers } from "lucide-react";
import { toast } from "sonner";

export default function TestGHLBatchPage() {
  const [accessToken, setAccessToken] = useState('');
  const [locationId, setLocationId] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    if (!accessToken || !locationId) {
      toast.error('Please enter both Access Token and Location ID');
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const res = await fetch('/api/ghl/test-push-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, locationId })
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        toast.success(`Successfully pushed ${data.summary.created + data.summary.updated} custom values!`);
      } else {
        toast.error(`Partial success: ${data.summary.failed} failed`);
      }

    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to connect: ' + error.message);
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
            GHL Batch Test: Multiple Custom Values
          </h1>
          <p className="text-gray-400">
            Test pushing multiple types: text, images, colors, and values for different pages
          </p>
        </div>

        {/* Explanation */}
        <div className="bg-[#1b1b1d] border border-cyan/30 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-cyan mb-3">How GHL Custom Values Work</h3>
              <div className="text-sm text-gray-300 space-y-3">
                <p><strong>Key Concept:</strong> Custom Values are stored at the <strong>Location level</strong>, not per funnel or page.</p>

                <div className="bg-black/30 rounded-lg p-4 space-y-2">
                  <p className="text-cyan font-semibold">This test will push:</p>
                  <ul className="space-y-1 ml-4">
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span><strong>Text values</strong> - Headlines, subheadlines, CTAs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-green-400" />
                      <span><strong>Image URLs</strong> - Hero images, testimonials (as URLs)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-400" />
                      <span><strong>Brand colors</strong> - Primary, secondary, accent (hex codes)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-yellow-400" />
                      <span><strong>Multi-page values</strong> - Different values for Landing, Thank You, VSL pages</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-200 text-xs">
                    <strong>Important:</strong> All custom values are shared across ALL funnels in this location.
                    Each page/funnel chooses which values to display using merge tags like <code className="bg-black/50 px-1">{'{{custom_values.key_name}}'}</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Form */}
        <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">GHL Credentials</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Access Token (API Key) <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Your GHL Private Integration token"
                className="w-full px-4 py-3 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                placeholder="abc123-def456-ghi789..."
                className="w-full px-4 py-3 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors"
              />
            </div>

            <button
              onClick={handleTest}
              disabled={testing || !accessToken || !locationId}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/90 hover:to-blue-500/90 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan/20"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Pushing 10 Custom Values...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Push All Test Values
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <div className={`border rounded-lg p-6 ${result.success ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                )}

                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-3 ${result.success ? 'text-green-500' : 'text-yellow-500'}`}>
                    {result.success ? 'All Values Pushed Successfully!' : 'Partial Success'}
                  </h3>

                  {result.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-black/30 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-2xl font-bold">{result.summary.total}</p>
                      </div>
                      <div className="bg-green-500/20 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Created</p>
                        <p className="text-2xl font-bold text-green-400">{result.summary.created}</p>
                      </div>
                      <div className="bg-blue-500/20 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Updated</p>
                        <p className="text-2xl font-bold text-blue-400">{result.summary.updated}</p>
                      </div>
                      <div className="bg-red-500/20 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Failed</p>
                        <p className="text-2xl font-bold text-red-400">{result.summary.failed}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-sm text-cyan font-semibold mb-2">Success Rate: {result.summary?.successRate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Instructions */}
            {result.usage && (
              <div className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">How to Use These Values</h3>

                <div className="space-y-4">
                  {/* Text */}
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <h4 className="font-semibold">Text Values</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">For headlines, paragraphs, buttons:</p>
                    <code className="text-xs bg-black/50 px-3 py-2 rounded block text-cyan">
                      {'{{custom_values.test_headline}}'}
                    </code>
                  </div>

                  {/* Images */}
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="w-5 h-5 text-green-400" />
                      <h4 className="font-semibold">Image URLs</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">For image elements, set src attribute:</p>
                    <code className="text-xs bg-black/50 px-3 py-2 rounded block text-cyan">
                      {'{{custom_values.test_hero_image}}'}
                    </code>
                    <p className="text-xs text-gray-500 mt-2">
                      In GHL page builder: Add Image → Set Source → Custom Value → Select test_hero_image
                    </p>
                  </div>

                  {/* Colors */}
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="w-5 h-5 text-purple-400" />
                      <h4 className="font-semibold">Brand Colors</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">For backgrounds, buttons, text colors:</p>
                    <code className="text-xs bg-black/50 px-3 py-2 rounded block text-cyan">
                      {'{{custom_values.test_brand_color_primary}}'}
                    </code>
                    <p className="text-xs text-gray-500 mt-2">
                      In element style settings, use the merge tag in color fields
                    </p>
                  </div>

                  {/* Multiple Pages */}
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-5 h-5 text-yellow-400" />
                      <h4 className="font-semibold">Multiple Pages/Funnels</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">Each page uses different custom values:</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between bg-black/50 px-3 py-2 rounded">
                        <span className="text-gray-400">Landing Page CTA:</span>
                        <code className="text-cyan">{'{{custom_values.test_landing_cta}}'}</code>
                      </div>
                      <div className="flex items-center justify-between bg-black/50 px-3 py-2 rounded">
                        <span className="text-gray-400">Thank You Headline:</span>
                        <code className="text-cyan">{'{{custom_values.test_thankyou_headline}}'}</code>
                      </div>
                      <div className="flex items-center justify-between bg-black/50 px-3 py-2 rounded">
                        <span className="text-gray-400">VSL Hook:</span>
                        <code className="text-cyan">{'{{custom_values.test_vsl_hook}}'}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            {result.nextSteps && (
              <div className="bg-cyan/10 border border-cyan/30 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-3 text-cyan">Next Steps</h3>
                <ol className="space-y-2 text-sm text-gray-300">
                  {result.nextSteps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-cyan font-bold">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Detailed Results */}
            {result.results && (
              <details className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg">
                <summary className="cursor-pointer p-4 font-semibold hover:bg-[#252528] transition-colors">
                  View Detailed Results
                </summary>
                <div className="p-4 space-y-4">
                  {/* Created */}
                  {result.results.created?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-2">Created ({result.results.created.length})</h4>
                      <div className="space-y-2">
                        {result.results.created.map((item, i) => (
                          <div key={i} className="bg-green-500/10 border border-green-500/30 rounded p-3 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <code className="text-green-400">{item.name}</code>
                              <span className="text-gray-500">{item.type}</span>
                            </div>
                            <p className="text-gray-400 truncate">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Updated */}
                  {result.results.updated?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-blue-400 mb-2">Updated ({result.results.updated.length})</h4>
                      <div className="space-y-2">
                        {result.results.updated.map((item, i) => (
                          <div key={i} className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <code className="text-blue-400">{item.name}</code>
                              <span className="text-gray-500">{item.type}</span>
                            </div>
                            <p className="text-gray-400 truncate">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed */}
                  {result.results.failed?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-400 mb-2">Failed ({result.results.failed.length})</h4>
                      <div className="space-y-2">
                        {result.results.failed.map((item, i) => (
                          <div key={i} className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs">
                            <code className="text-red-400 block mb-1">{item.name}</code>
                            <p className="text-gray-400">{item.error}</p>
                            {item.status && <p className="text-gray-500 mt-1">Status: {item.status}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
