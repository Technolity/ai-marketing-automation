'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { X as XIcon, Instagram, Facebook, Loader } from 'lucide-react';

export default function SocialConnections({ onStatusChange }) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState({
    x: null,
    instagram: null,
    facebook: null
  });
  const [connected, setConnected] = useState([]);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  async function fetchConnectedAccounts() {
    try {
      const res = await fetch('/api/social/connected-accounts');
      const data = await res.json();

      if (res.ok) {
        setAccounts(data.accounts);
        setConnected(data.connected);
        onStatusChange?.(data.connected);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(platform) {
    try {
      const res = await fetch(`/api/auth/${platform}/disconnect`, {
        method: 'POST'
      });

      if (res.ok) {
        setAccounts(prev => ({
          ...prev,
          [platform]: null
        }));
        setConnected(prev => prev.filter(p => p !== platform));
        onStatusChange?.(connected.filter(p => p !== platform));
        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`);
      }
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error);
      toast.error(`Failed to disconnect ${platform}`);
    }
  }

  function handleConnect(platform) {
    window.location.href = `/api/auth/${platform}/login`;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader className="h-4 w-4 animate-spin text-gray-500" />
      </div>
    );
  }

  const platforms = [
    {
      key: 'x',
      icon: XIcon,
      color: 'hover:text-black dark:hover:text-white',
      bgColor: 'hover:bg-black/10 dark:hover:bg-white/10'
    },
    {
      key: 'instagram',
      icon: Instagram,
      color: 'hover:text-pink-600',
      bgColor: 'hover:bg-pink-600/10'
    },
    {
      key: 'facebook',
      icon: Facebook,
      color: 'hover:text-blue-600',
      bgColor: 'hover:bg-blue-600/10'
    }
  ];

  return (
    <div className="flex items-center gap-2">
      {platforms.map(({ key, icon: Icon, color, bgColor }) => {
        const isConnected = accounts[key];
        const platformName = key.charAt(0).toUpperCase() + key.slice(1);
        return (
          <div key={key} className="group relative">
            {/* Tooltip */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900/95 backdrop-blur-sm px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-50">
              {isConnected ? `${platformName} connected` : `Connect ${platformName}`}
            </div>

            {/* Button */}
            <button
              onClick={() => isConnected ? handleDisconnect(key) : handleConnect(key)}
              className={`
                relative p-2.5 rounded-lg transition-all duration-200
                bg-white/5 backdrop-blur-sm
                border border-white/10
                ${bgColor}
                cursor-pointer
                ${isConnected ? 'ring-1 ring-white/20 bg-white/10' : ''}
                hover:border-white/20
                active:scale-95
              `}
              title={isConnected ? `Disconnect ${platformName}` : `Connect ${platformName}`}
            >
              {/* Icon */}
              <Icon
                className={`
                  w-5 h-5 transition-all duration-200
                  ${isConnected ? color : 'text-gray-500'}
                `}
              />

              {/* Connected indicator dot */}
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-1 ring-gray-900 shadow-lg" />
              )}
            </button>
          </div>
        );
      })}

      {/* Connection count badge */}
      {connected.length > 0 && (
        <div className="ml-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-gray-400">
            {connected.length}/{3}
          </span>
        </div>
      )}
    </div>
  );
}
