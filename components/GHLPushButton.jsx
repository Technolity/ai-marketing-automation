// components/GHLPushButton.jsx
"use client";
import { useState } from "react";
import { Rocket, Settings } from "lucide-react";
import { toast } from "sonner";

export default function GHLPushButton({ sessionId }) {
  const [building, setBuilding] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [ghlConfig, setGhlConfig] = useState({
    accessToken: '',
    locationId: '',
    contactId: '' // Optional: for updating existing contact
  });

  const handleBuildFunnel = async () => {
    // Validate GHL configuration
    if (!ghlConfig.accessToken || !ghlConfig.locationId) {
      toast.error("Please configure your GHL credentials first");
      setShowConfig(true);
      return;
    }

    setBuilding(true);
    try {
      // Step 1: Generate custom values from session data
      toast.info("Generating custom values...");
      const generateRes = await fetch('/api/ghl/custom-values/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (!generateRes.ok) {
        const error = await generateRes.json();
        throw new Error(error.details?.join(', ') || 'Failed to generate custom values');
      }

      const { mappingId, customValues, warnings } = await generateRes.json();

      // Show warnings if any
      if (warnings && warnings.length > 0) {
        warnings.forEach(warning => toast.warning(warning));
      }

      toast.success(`Generated ${Object.keys(customValues).length} custom values`);

      // Step 2: Push to GoHighLevel
      toast.info("Building your funnel in GoHighLevel...");
      const pushRes = await fetch('/api/ghl/custom-values/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappingId,
          ghlAccessToken: ghlConfig.accessToken,
          ghlLocationId: ghlConfig.locationId
        })
      });

      if (!pushRes.ok) {
        const error = await pushRes.json();
        throw new Error(error.error || 'Failed to build funnel');
      }

      const result = await pushRes.json();

      toast.success(
        `Funnel built successfully! ${result.updatedFields}/${result.totalFields} fields populated (${result.successRate})`
      );

      // Show errors if any
      if (result.errors && result.errors.length > 0) {
        console.error('GHL push errors:', result.errors);
        toast.warning(`${result.errors.length} fields failed. Check console for details.`);
      }

    } catch (err) {
      console.error('Build funnel error:', err);
      toast.error(err.message || "Failed to build funnel. Check your configuration.");
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">GoHighLevel Configuration</h3>
            <button
              onClick={() => setShowConfig(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Access Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={ghlConfig.accessToken}
                onChange={(e) => setGhlConfig({ ...ghlConfig, accessToken: e.target.value })}
                placeholder="Enter your GHL access token"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Location ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ghlConfig.locationId}
                onChange={(e) => setGhlConfig({ ...ghlConfig, locationId: e.target.value })}
                placeholder="Enter your GHL location ID"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Contact ID <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={ghlConfig.contactId}
                onChange={(e) => setGhlConfig({ ...ghlConfig, contactId: e.target.value })}
                placeholder="Leave empty to create custom fields only"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan"
              />
            </div>

            <p className="text-xs text-gray-400">
              Need help? See the <a href="/docs/ghl-setup" className="text-cyan hover:underline">GHL Setup Guide</a>
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleBuildFunnel}
          disabled={building || !sessionId}
          className="flex items-center gap-2 bg-cyan hover:brightness-110 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all text-black"
        >
          <Rocket size={20} />
          {building ? "Building..." : "Build My Funnel"}
        </button>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-all text-white"
          title="Configure GHL credentials"
        >
          <Settings size={20} />
        </button>
      </div>

      {!sessionId && (
        <p className="text-sm text-yellow-500">
          Please save your session first before building your funnel
        </p>
      )}
    </div>
  );
}
