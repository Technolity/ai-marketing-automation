"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "@/lib/icons";

const PLATFORM_LABELS = {
  twitter:   "X (Twitter)",
  instagram: "Instagram",
  facebook:  "Facebook",
};

const PLATFORM_COLORS = {
  twitter:   "text-gray-300",
  instagram: "text-pink-400",
  facebook:  "text-blue-400",
};

/**
 * BufferConnection
 *
 * Shows the current Buffer connection status and provides connect / disconnect actions.
 * Displayed in the daily-leads page header area.
 *
 * Props:
 *   onStatusChange(connected: bool) — called after connect/disconnect
 */
export default function BufferConnection({ onStatusChange }) {
  const [loading, setLoading]         = useState(true);
  const [connected, setConnected]     = useState(false);
  const [profiles, setProfiles]       = useState([]);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetchWithAuth("/api/social/accounts");
      const data = await res.json();
      if (res.ok) {
        setConnected(data.connected);
        setProfiles(data.profiles || []);
        onStatusChange?.(data.connected);
      }
    } catch {
      // Non-fatal — the panel just shows nothing
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleConnect = () => {
    window.location.href = "/api/auth/buffer/login";
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect your Buffer account? You won't be able to post to social media until you reconnect.")) return;
    setDisconnecting(true);
    try {
      const res = await fetchWithAuth("/api/auth/buffer/disconnect", { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to disconnect.");
      }
      setConnected(false);
      setProfiles([]);
      onStatusChange?.(false);
      toast.success("Buffer account disconnected.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-subtle bg-charcoal">
        <Loader2 className="w-3.5 h-3.5 text-gray-600 animate-spin" />
        <span className="text-[10px] text-gray-600">Checking connection…</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan/20 bg-cyan/[0.05] text-xs font-medium text-cyan hover:bg-cyan/10 transition-colors cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
        </svg>
        Connect Social Accounts
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Connected profiles */}
      <div className="flex items-center gap-1.5">
        {profiles.length > 0 ? (
          profiles.map(p => (
            <span
              key={p.id}
              className={`flex items-center gap-1 text-[10px] font-semibold ${PLATFORM_COLORS[p.service] || "text-gray-400"}`}
            >
              <CheckCircle className="w-3 h-3" />
              {PLATFORM_LABELS[p.service] || p.service}
            </span>
          ))
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-cyan font-semibold">
            <CheckCircle className="w-3 h-3" />
            Buffer connected
          </span>
        )}
      </div>

      {/* Disconnect */}
      <button
        onClick={handleDisconnect}
        disabled={disconnecting}
        className="text-[9px] font-semibold uppercase tracking-widest text-gray-600 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40"
      >
        {disconnecting ? "Disconnecting…" : "Disconnect"}
      </button>
    </div>
  );
}
