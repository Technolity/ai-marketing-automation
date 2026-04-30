'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, Lock } from 'lucide-react';

/**
 * SlotCard — displays a single funnel slot option inside SlotSelectorModal.
 *
 * Props:
 *   slotIndex   number  — e.g. 3, 4, 5
 *   isSelected  boolean — highlighted border when true
 *   onClick     fn()    — called when the card is clicked (only when not disabled)
 *   isDisabled  boolean — greyed-out, not clickable
 *   lastDeployed string|null — ISO timestamp or null
 */
export default function SlotCard({ slotIndex, isSelected, onClick, isDisabled, lastDeployed }) {
  const prefix = String(slotIndex).padStart(2, '0') + '_';

  const formattedDate = lastDeployed
    ? new Date(lastDeployed).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <motion.button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      className={[
        'w-full text-left rounded-xl border p-4 transition-all duration-200',
        'flex items-center gap-4',
        isDisabled
          ? 'bg-[#0f1419] border-[#1a2330] opacity-40 cursor-not-allowed'
          : isSelected
          ? 'bg-cyan/10 border-cyan cursor-pointer'
          : 'bg-[#0d1217] border-[#1E2A34] hover:border-cyan/40 hover:bg-[#121920] cursor-pointer',
      ].join(' ')}
    >
      {/* Slot number badge */}
      <div
        className={[
          'w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-xl',
          isDisabled
            ? 'bg-[#1E2A34] text-[#4a5a6a]'
            : isSelected
            ? 'bg-cyan text-black'
            : 'bg-[#1E2A34] text-[#B2C0CD]',
        ].join(' ')}
      >
        {slotIndex}
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p className={[
          'font-semibold text-sm',
          isDisabled ? 'text-[#4a5a6a]' : isSelected ? 'text-white' : 'text-[#F4F8FB]',
        ].join(' ')}>
          Slot {slotIndex}
        </p>

        <p className={[
          'text-xs font-mono mt-0.5',
          isDisabled ? 'text-[#3a4a5a]' : 'text-cyan/70',
        ].join(' ')}>
          Prefix: {prefix}
        </p>

        {isDisabled ? (
          <p className="text-[10px] text-[#3a4a5a] mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Contact admin to activate
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

      {/* Selected indicator */}
      {isSelected && !isDisabled && (
        <CheckCircle className="w-5 h-5 text-cyan flex-shrink-0" />
      )}
    </motion.button>
  );
}
