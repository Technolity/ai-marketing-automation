'use client';

import { Lock, Info } from 'lucide-react';
import { useState } from 'react';

/**
 * SlotAssignmentBadge — compact inline badge shown when a funnel slot is locked.
 *
 * Props:
 *   slotIndex    number  — the locked slot number (e.g. 4)
 *   assignedAt   string  — ISO timestamp
 *   funnelId     string
 *   onRedeploy   fn()    — called when "Re-Deploy" is clicked
 *   isDeploying  boolean — disables Re-Deploy while a deploy is in progress
 */
export default function SlotAssignmentBadge({
  slotIndex,
  assignedAt,
  funnelId,
  onRedeploy,
  isDeploying = false,
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const funnelNumber = slotIndex - 2;

  const formattedDate = assignedAt
    ? new Date(assignedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="bg-[#0D1217] border border-[#1E2A34] rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
      {/* Left: lock icon + funnel label + locked pill */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Lock className="w-4 h-4 text-cyan flex-shrink-0" />
        <span className="font-bold text-white text-sm">
          Funnel {funnelNumber}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan text-cyan">
          Locked
        </span>
      </div>

      {/* Middle: assigned date */}
      {formattedDate && (
        <span className="text-sm text-[#4a5a6a] flex-1 min-w-0">
          Assigned {formattedDate}
        </span>
      )}

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        {/* Info tooltip button */}
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="p-1.5 rounded-lg text-[#4a5a6a] hover:text-[#B2C0CD] hover:bg-[#1E2A34] transition-all duration-200 cursor-pointer"
            aria-label="Slot assignment info"
          >
            <Info className="w-4 h-4" />
          </button>

          {showTooltip && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#121920] border border-[#1E2A34] rounded-lg px-3 py-2 text-xs text-[#B2C0CD] shadow-xl z-10 whitespace-normal">
              Delete this funnel to reassign the slot.
              <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#1E2A34]" />
            </div>
          )}
        </div>

        {/* Re-Deploy button */}
        <button
          type="button"
          onClick={onRedeploy}
          disabled={isDeploying}
          className="bg-[#0D1217] border border-[#1E2A34] hover:border-[#2a3a44] hover:bg-[#121920] text-[#F4F8FB] rounded-lg px-4 py-2 font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isDeploying ? 'Deploying…' : 'Push Updates'}
        </button>
      </div>
    </div>
  );
}
