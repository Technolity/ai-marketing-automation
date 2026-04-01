'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, Loader, X as XIcon } from 'lucide-react';

export default function SocialConnections({ onStatusChange }) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState({
    x: null,
    instagram: null,
    facebook: null
  });
  const [connected, setConnected] = useState([]);

  // Fetch connected accounts on mount
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
      <div className="space-y-4 p-4">
        <Loader className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* X (Twitter) */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          {accounts.x ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold text-black">X (Twitter)</p>
                <p className="text-sm text-gray-600">@{accounts.x.username}</p>
              </div>
            </>
          ) : (
            <div>
              <p className="font-semibold text-black">X (Twitter)</p>
              <p className="text-sm text-gray-500">Not connected</p>
            </div>
          )}
        </div>
        <button
          onClick={() => accounts.x ? handleDisconnect('x') : handleConnect('x')}
          className={`px-4 py-2 rounded font-medium ${
            accounts.x
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {accounts.x ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Instagram */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          {accounts.instagram ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold text-black">Instagram</p>
                <p className="text-sm text-gray-600">{accounts.instagram.username}</p>
              </div>
            </>
          ) : (
            <div>
              <p className="font-semibold text-black">Instagram</p>
              <p className="text-sm text-gray-500">Not connected</p>
            </div>
          )}
        </div>
        <button
          onClick={() => accounts.instagram ? handleDisconnect('instagram') : handleConnect('meta')}
          className={`px-4 py-2 rounded font-medium ${
            accounts.instagram
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-pink-600 text-white hover:bg-pink-700'
          }`}
        >
          {accounts.instagram ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Facebook */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          {accounts.facebook ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold text-black">Facebook</p>
                <p className="text-sm text-gray-600">{accounts.facebook.username}</p>
              </div>
            </>
          ) : (
            <div>
              <p className="font-semibold text-black">Facebook</p>
              <p className="text-sm text-gray-500">Not connected</p>
            </div>
          )}
        </div>
        <button
          onClick={() => accounts.facebook ? handleDisconnect('facebook') : handleConnect('meta')}
          className={`px-4 py-2 rounded font-medium ${
            accounts.facebook
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {accounts.facebook ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Note about Meta */}
      {!accounts.instagram && !accounts.facebook && (
        <p className="text-sm text-gray-600">
          Connecting Meta will authorize both Instagram and Facebook. Instagram requires a Business account.
        </p>
      )}
    </div>
  );
}
