'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, Lock } from 'lucide-react';

/**
 * SlotCard — displays a single funnel slot option inside SlotSelectorModal.
 *
 * Props:
 *   slotIndex        number       — e.g. 3, 4, 5
 *   isSelected       boolean      — highlighted border when true
 *   onClick          fn()         — called when the card is clicked (only when not disabled)
 *   isDisabled       boolean      — not provisioned by admin; greyed-out, not clickable
 *   lastDeployed     string|null  — ISO timestamp or null
 *   isTakenByOther   boolean      — slot assigned to a DIFFERENT funnel; not selectable
 *   isAssignedToThis boolean      — this is the locked slot for the CURRENT funnel; read-only display
 */
export default function SlotCard({
  slotIndex,
  isSelected,
  onClick,
  isDisabled,
  disabledLabel,
  lastDeployed,
  isTakenByOther = false,
  isAssignedToThis = false,
}) {
  const prefix = String(slotIndex).padStart(2, '0') + '_';

  const formattedDate = lastDeployed
    ? new Date(lastDeployed).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const isNotClickable = isDisabled || isTakenByOther || isAssignedToThis;

  const handleClick = isNotClickable ? undefined : onClick;

  // Resolve className sets based on priority: assignedToThis > takenByOther > disabled > selected > normal
  const containerClass = [
    'w-full text-left rounded-xl border p-4 transition-all duration-200',
    'flex items-center gap-4',
    isAssignedToThis
      ? 'bg-cyan/5 border-cyan cursor-default'
      : isTakenByOther
      ? 'bg-red-950/30 border-red-900/40 opacity-50 cursor-not-allowed'
      : isDisabled
      ? 'bg-[#0f1419] border-[#1a2330] opacity-40 cursor-not-allowed'
      : isSelected
      ? 'bg-cyan/10 border-cyan cursor-pointer'
      : 'bg-[#0d1217] border-[#1E2A34] hover:border-cyan/40 hover:bg-[#121920] cursor-pointer',
  ].join(' ');

  const badgeClass = [
    'w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-xl',
    isAssignedToThis
      ? 'bg-cyan/20 text-cyan'
      : isTakenByOther
      ? 'bg-red-900/30 text-red-400'
      : isDisabled
      ? 'bg-[#1E2A34] text-[#4a5a6a]'
      : isSelected
      ? 'bg-cyan text-black'
      : 'bg-[#1E2A34] text-[#B2C0CD]',
  ].join(' ');

  const titleClass = [
    'font-semibold text-sm',
    isAssignedToThis
      ? 'text-cyan'
      : isTakenByOther
      ? 'text-red-300'
      : isDisabled
      ? 'text-[#4a5a6a]'
      : isSelected
      ? 'text-white'
      : 'text-[#F4F8FB]',
  ].join(' ');

  const prefixClass = [
    'text-xs font-mono mt-0.5',
    isDisabled ? 'text-[#3a4a5a]' : 'text-cyan/70',
  ].join(' ');

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={isNotClickable ? {} : { scale: 1.02 }}
      whileTap={isNotClickable ? {} : { scale: 0.98 }}
      className={containerClass}
    >
      {/* Slot number badge */}
      <div className={badgeClass}>
        {slotIndex}
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p className={titleClass}>
          Slot {slotIndex}
        </p>

        <p className={prefixClass}>
          Prefix: {prefix}
        </p>

        {isAssignedToThis ? (
          <p className="text-[10px] text-cyan mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Assigned to this funnel
          </p>
        ) : isTakenByOther ? (
          <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Taken by another funnel
          </p>
        ) : isDisabled ? (
          <p className="text-[10px] text-[#3a4a5a] mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {disabledLabel || 'Not provisioned'}
          </p>
        ) : formattedDate ? (
          <p className="text-[10px] text-[#B2C0CD] mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last deployed {formattedDate}
          </p>
        ) : (
          <p className="text-[10px] text-[#4a5a6a] mt-1">Never deployed</p>
        )}
      </div>

      {/* Right indicator */}
      {isAssignedToThis && (
        <Lock className="w-5 h-5 text-cyan flex-shrink-0" />
      )}
      {isTakenByOther && (
        <Lock className="w-5 h-5 text-red-500/60 flex-shrink-0" />
      )}
      {isSelected && !isDisabled && !isAssignedToThis && !isTakenByOther && (
        <CheckCircle className="w-5 h-5 text-cyan flex-shrink-0" />
      )}
    </motion.button>
  );
}
