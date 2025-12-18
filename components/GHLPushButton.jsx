// components/GHLPushButton.jsx
"use client";
import { useState } from "react";
import { Rocket, Settings, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function GHLPushButton({ sessionId, minimal = false }) {
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

  // Render logic
  const renderConfigModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#1b1b1d] rounded-2xl border border-[#2a2a2d] p-6 max-w-md w-full shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">GHL Configuration</h3>
          <button
            onClick={() => setShowConfig(false)}
            className="p-2 hover:bg-[#2a2a2d] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Access Token <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={ghlConfig.accessToken}
              onChange={(e) => setGhlConfig({ ...ghlConfig, accessToken: e.target.value })}
              placeholder="Enter your GHL access token"
              className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan/50 focus:border-cyan outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ghlConfig.locationId}
              onChange={(e) => setGhlConfig({ ...ghlConfig, locationId: e.target.value })}
              placeholder="Enter your GHL location ID"
              className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan/50 focus:border-cyan outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contact ID <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={ghlConfig.contactId}
              onChange={(e) => setGhlConfig({ ...ghlConfig, contactId: e.target.value })}
              placeholder="Leave empty to create custom fields only"
              className="w-full px-4 py-3 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan/50 focus:border-cyan outline-none transition-all"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setShowConfig(false)}
              className="flex-1 px-4 py-3 bg-[#2a2a2d] hover:bg-[#3a3a3d] rounded-xl font-medium text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { setShowConfig(false); handleBuildFunnel(); }}
              className="flex-1 px-4 py-3 bg-cyan hover:brightness-110 text-black rounded-xl font-bold transition-all"
            >
              Save & Build
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (minimal) {
    return (
      <>
        {showConfig && renderConfigModal()}
        <button
          onClick={handleBuildFunnel}
          disabled={building || !sessionId}
          className="p-2 hover:bg-[#2a2a2d] rounded-lg text-gray-400 hover:text-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={building ? "Building..." : "Push to GoHighLevel"}
        >
          {building ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
        </button>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Configuration Panel used to be inline, now using modal for consistency or inline? 
          Keeping original inline behavior for non-minimal to avoid breaking other pages?
          Actually, modal is better everywhere. Let's upgrade standard view too?
          For now, just implementing minimal flow as requested, but reusing modal logic would be nice.
          I'll stick to replacing the return entirely to support both cleanly.
      */}
      {showConfig && renderConfigModal()}

      <div className="flex gap-3">
        <button
          onClick={handleBuildFunnel}
          disabled={building || !sessionId}
          className="flex items-center gap-2 bg-cyan hover:brightness-110 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold transition-all text-black shadow-lg shadow-cyan/20"
        >
          {building ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket size={20} />}
          {building ? "Building..." : "Build My Funnel"}
        </button>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 bg-[#2a2a2d] hover:bg-[#3a3a3d] px-4 py-3 rounded-xl font-semibold transition-all text-white border border-[#3a3a3d]"
          title="Configure GHL credentials"
        >
          <Settings size={20} />
        </button>
      </div>

      {!sessionId && (
        <p className="text-sm text-yellow-500 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
          ⚠️ Please save your session first before building your funnel
        </p>
      )}
    </div>
  );
}
