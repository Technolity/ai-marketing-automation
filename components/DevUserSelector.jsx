"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, User } from "lucide-react";

const TEST_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Test User (Basic)', tier: 'basic', icon: '👤' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Premium User', tier: 'premium', icon: '⭐' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Admin User', tier: 'admin', icon: '👑' }
];

export default function DevUserSelector() {
  const { user, switchUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = TEST_USERS.find(u => u.id === user?.id) || TEST_USERS[0];

  useEffect(() => {
    const handleClick = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [isOpen]);

  const handleUserSwitch = (userId) => {
    if (userId !== user?.id) {
      switchUser(userId);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg hover:bg-yellow-500/30 transition-colors"
      >
        <span className="text-lg">{currentUser.icon}</span>
        <div className="flex flex-col items-start">
          <span className="text-xs text-yellow-400 font-medium">DEV MODE</span>
          <span className="text-sm text-white">{currentUser.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-yellow-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[#131314] border border-[#2a2a2d] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          <div className="p-3 bg-yellow-500/10 border-b border-yellow-500/20">
            <p className="text-xs text-yellow-400 font-medium">⚠️ DEV MODE ACTIVE</p>
            <p className="text-xs text-gray-400 mt-1">Switch between test users</p>
          </div>

          <div className="p-2">
            {TEST_USERS.map((testUser) => (
              <button
                key={testUser.id}
                onClick={() => handleUserSwitch(testUser.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  testUser.id === user?.id
                    ? 'bg-cyan/20 border border-cyan/30'
                    : 'hover:bg-[#1a1a1b] border border-transparent'
                }`}
              >
                <span className="text-2xl">{testUser.icon}</span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white">{testUser.name}</div>
                  <div className="text-xs text-gray-400">{testUser.tier}</div>
                </div>
                {testUser.id === user?.id && (
                  <div className="w-2 h-2 rounded-full bg-cyan"></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-2 bg-[#0e0e0f] border-t border-[#2a2a2d]">
            <p className="text-xs text-gray-500 text-center">
              User data will reload on switch
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
