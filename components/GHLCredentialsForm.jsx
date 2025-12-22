"use client";
import { useState, useEffect } from 'react';
import {
  Key,
  MapPin,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * GHL Credentials Management Component
 * Allows users to input, save, and manage their GoHighLevel credentials
 */
export default function GHLCredentialsForm({
  onCredentialsSaved,
  onValidationComplete,
  autoValidate = true
}) {
  const [locationId, setLocationId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  // Load saved credentials on mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const res = await fetch('/api/ghl/credentials');
      const data = await res.json();

      if (data.credentials) {
        setSavedCredentials(data.credentials);
        setLocationId(data.credentials.location_id || '');
        // Don't auto-fill access token for security (make user re-enter)
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const validateCredentials = async (locId, token) => {
    if (!locId || !token) {
      toast.error('Please provide both Location ID and Access Token');
      return false;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      // Test by fetching custom values from GHL
      const response = await fetch(
        `https://services.leadconnectorhq.com/locations/${locId}/customValues`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Version': '2021-07-28'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const result = {
          valid: true,
          message: 'Credentials validated successfully!',
          snapshotValues: data.customValues?.length || 0
        };

        setValidationResult(result);
        toast.success(`Valid! Found ${result.snapshotValues} custom values in your location.`);

        onValidationComplete?.(result);
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = 'Invalid credentials';

        if (response.status === 401) {
          errorMessage = 'Invalid Access Token - please check your credentials';
        } else if (response.status === 403) {
          errorMessage = 'Permission denied - ensure your integration has customValues.read scope';
        } else if (response.status === 404) {
          errorMessage = 'Location not found - verify your Location ID';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded - wait a moment and try again';
        }

        const result = {
          valid: false,
          message: errorMessage,
          status: response.status,
          details: errorText
        };

        setValidationResult(result);
        toast.error(errorMessage);

        onValidationComplete?.(result);
        return false;
      }
    } catch (error) {
      const result = {
        valid: false,
        message: 'Network error - unable to connect to GHL',
        details: error.message
      };

      setValidationResult(result);
      toast.error('Failed to validate credentials');

      onValidationComplete?.(result);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    // Validate first if autoValidate is enabled
    if (autoValidate) {
      const isValid = await validateCredentials(locationId, accessToken);
      if (!isValid) return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/ghl/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          accessToken
        })
      });

      const data = await res.json();

      if (data.success) {
        setSavedCredentials(data.credentials);
        toast.success('Credentials saved successfully!');
        onCredentialsSaved?.(data.credentials);
      } else {
        toast.error(data.error || 'Failed to save credentials');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = savedCredentials && (
    locationId !== savedCredentials.location_id ||
    accessToken !== '' // Access token changed if user entered one
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">GoHighLevel Credentials</h2>
        <p className="text-gray-400 text-sm">
          Connect your GHL account to push generated content to your funnels
        </p>
      </div>

      {/* Saved Status */}
      {savedCredentials && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-semibold">Credentials Saved</p>
              <p className="text-sm text-gray-400 mt-1">
                Last used: {new Date(savedCredentials.last_used_at).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Location: {savedCredentials.location_id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-cyan/10 border border-cyan/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-cyan font-semibold mb-2">How to Get Your Credentials</h3>
            <ol className="text-sm text-gray-300 space-y-2 ml-4">
              <li>
                1. Go to{' '}
                <a
                  href="https://marketplace.gohighlevel.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan hover:underline inline-flex items-center gap-1"
                >
                  GHL Marketplace
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>2. Navigate to "My Apps" → "Private Integrations"</li>
              <li>3. Create a new Private Integration with <strong>customValues.write</strong> and <strong>customValues.read</strong> scopes</li>
              <li>4. Copy the <strong>Location ID</strong> and <strong>Access Token</strong></li>
              <li>5. Paste them below</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Location ID */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan" />
              Location ID
              <span className="text-red-500">*</span>
            </div>
          </label>
          <input
            type="text"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            placeholder="abc123-def456-ghi789..."
            className="w-full px-4 py-3 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your GHL Location ID (found in Settings → Business Profile)
          </p>
        </div>

        {/* Access Token */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan" />
              Access Token (API Key)
              <span className="text-red-500">*</span>
            </div>
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Your GHL Private Integration token"
              className="w-full px-4 py-3 pr-12 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showToken ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your Private Integration Access Token (never share this publicly)
          </p>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`border rounded-lg p-4 ${
            validationResult.valid
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-start gap-3">
              {validationResult.valid ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold ${
                  validationResult.valid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {validationResult.message}
                </p>
                {validationResult.valid && (
                  <p className="text-sm text-gray-400 mt-1">
                    Found {validationResult.snapshotValues} custom values in your GHL location
                  </p>
                )}
                {!validationResult.valid && validationResult.status && (
                  <p className="text-xs text-gray-500 mt-1">
                    Status Code: {validationResult.status}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {autoValidate ? (
            <button
              onClick={handleSave}
              disabled={!locationId || !accessToken || saving || validating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/90 hover:to-blue-500/90 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan/20"
            >
              {saving || validating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {validating ? 'Validating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {hasChanges ? 'Validate & Save' : 'Save Credentials'}
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => validateCredentials(locationId, accessToken)}
                disabled={!locationId || !accessToken || validating}
                className="flex-1 px-6 py-3 bg-cyan/20 hover:bg-cyan/30 border border-cyan disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center justify-center gap-3 transition-all"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Validate
                  </>
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={!locationId || !accessToken || saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/90 hover:to-blue-500/90 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
        <p className="text-xs text-yellow-200">
          <strong>Security:</strong> Your credentials are encrypted and stored securely.
          We never share your credentials with third parties. The access token is only used
          to push content to your GHL account.
        </p>
      </div>
    </div>
  );
}
