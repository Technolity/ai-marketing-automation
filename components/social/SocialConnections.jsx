'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const PLATFORMS = [
  {
    key: 'x',
    label: 'X',
    hoverColor: 'hover:text-white',
    hoverBg: 'hover:bg-white/10',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: 'instagram',
    label: 'Instagram',
    hoverColor: 'hover:text-pink-400',
    hoverBg: 'hover:bg-pink-500/10',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    key: 'facebook',
    label: 'Facebook',
    hoverColor: 'hover:text-blue-400',
    hoverBg: 'hover:bg-blue-500/10',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

export default function SocialConnections({ onStatusChange }) {
  const [loading, setLoading]   = useState(true);
  const [accounts, setAccounts] = useState({ x: null, instagram: null, facebook: null });
  const [connected, setConnected] = useState([]);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/social/connected-accounts');
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts);
        setConnected(data.connected);
        onStatusChange?.(data.connected);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleConnect(platform) {
    // Open OAuth in a new window (popup)
    const width = 600, height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      `/api/auth/social/connect?platform=${platform}`,
      `connect_${platform}`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    setConnecting(platform);

    // Poll until popup closes, then refresh accounts
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setConnecting(null);
        // Give PostForMe a moment to register the connection
        setTimeout(() => fetchAccounts(), 1500);
      }
    }, 800);
  }

  async function handleDisconnect(platform) {
    try {
      const res = await fetch('/api/auth/social/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      if (res.ok) {
        setAccounts(prev => ({ ...prev, [platform]: null }));
        const updated = connected.filter(p => p !== platform);
        setConnected(updated);
        onStatusChange?.(updated);
        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || `Failed to disconnect ${platform}`);
      }
    } catch (err) {
      toast.error(`Failed to disconnect ${platform}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {PLATFORMS.map(({ key, label, icon, hoverColor, hoverBg }) => {
        const isConnected = !!accounts[key];
        const isConnecting = connecting === key;
        return (
          <div key={key} className="group relative">
            {/* Tooltip */}
            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900/95 backdrop-blur-sm px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-50 border border-white/10">
              {isConnecting ? `Connecting ${label}…` : isConnected ? `${label} connected · click to disconnect` : `Connect ${label}`}
            </div>

            <button
              onClick={() => isConnected ? handleDisconnect(key) : handleConnect(key)}
              disabled={isConnecting}
              className={`
                relative p-2.5 rounded-lg transition-all duration-200
                bg-white/5 backdrop-blur-sm border border-white/10
                ${hoverBg} ${hoverColor}
                cursor-pointer active:scale-95
                ${isConnected ? 'ring-1 ring-white/20 bg-white/[0.08]' : ''}
                ${isConnecting ? 'opacity-50 cursor-wait' : ''}
                hover:border-white/20
              `}
            >
              <span className={`block transition-all duration-200 ${isConnected ? hoverColor.replace('hover:', '') : 'text-gray-500'}`}>
                {icon}
              </span>

              {/* Connected dot */}
              {isConnected && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-1 ring-gray-900 shadow-lg" />
              )}

              {/* Connecting spinner */}
              {isConnecting && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-1 ring-gray-900 bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        );
      })}

      {/* Connected count badge */}
      {connected.length > 0 && (
        <div className="ml-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
          <span className="text-[11px] font-medium text-gray-400">{connected.length}/3</span>
        </div>
      )}
    </div>
  );
}
