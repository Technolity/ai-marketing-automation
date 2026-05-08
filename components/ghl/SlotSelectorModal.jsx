'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Rocket,
  AlertTriangle,
  CheckCircle,
  Lock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import SlotCard from './SlotCard';
import { buildSlotDisplayOptions } from '@/lib/ghl/slotDisplay';

/**
 * SlotSelectorModal
 *
 * Stage machine: selecting → locking → deploying → done | error
 *
 * Props:
 *   isOpen             boolean
 *   onClose            fn()
 *   funnelId           string
 *   userPlan           'starter' | 'growth' | 'scale'
 *   availableSlots     number[]      — admin-provisioned slots (active status)
 *   takenSlots         number[]      — slots locked by OTHER funnels
 *   currentAssignment  number|null   — slot already locked to THIS funnel
 *   slotOptions        array         — full slot display model from available-slots API
 *   onAssign           fn(slotIndex) — called after slot is assigned (Assign Only)
 *   onSuccess          fn(slotIndex) — called after full deploy completes
 */
export default function SlotSelectorModal({
  isOpen,
  onClose,
  funnelId,
  userPlan = 'starter',
  availableSlots,
  takenSlots = [],
  currentAssignment = null,
  initialSlot = null,
  slotOptions,
  onAssign,
  onSuccess,
}) {
  const resolvedAvailableSlots = availableSlots ?? [3];
  const displaySlots = slotOptions?.length
    ? slotOptions
    : buildSlotDisplayOptions({
        planTier: userPlan,
        allowedSlots: resolvedAvailableSlots,
        assignableSlots: resolvedAvailableSlots,
        takenSlots,
        currentAssignment,
      });
  const selectableSlots = displaySlots.filter((slot) => slot.isSelectable);
  const isStarterSingleSlot = userPlan === 'starter' && selectableSlots.length === 1 && selectableSlots[0]?.slotIndex === 3;

  // When already assigned, start at locking (deploy confirmation). Otherwise selecting.
  const initialStage = currentAssignment !== null ? 'locking' : 'selecting';

  const [stage, setStage] = useState(initialStage);
  const [selectedSlot, setSelectedSlot] = useState(
    currentAssignment !== null ? currentAssignment : (initialSlot ?? null)
  );
  const [deployResult, setDeployResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Sync when modal opens or currentAssignment changes
  useEffect(() => {
    if (isOpen) {
      if (currentAssignment !== null) {
        setSelectedSlot(currentAssignment);
        setStage('locking');
      } else {
        setStage('selecting');
        setSelectedSlot(initialSlot ?? null);
      }
      setDeployResult(null);
      setErrorMessage('');
      setIsAssigning(false);
    }
  }, [isOpen, currentAssignment, initialSlot]);

  // Starter plan: auto-select slot 3 on mount when no assignment yet
  useEffect(() => {
    if (isOpen && isStarterSingleSlot && currentAssignment === null) {
      setSelectedSlot(3);
    }
  }, [isOpen, isStarterSingleSlot, currentAssignment]);

  const selectedPrefix = selectedSlot !== null
    ? String(selectedSlot).padStart(2, '0') + '_'
    : null;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (stage === 'deploying') return;
    onClose?.();
    setTimeout(() => {
      if (currentAssignment !== null) {
        setStage('locking');
        setSelectedSlot(currentAssignment);
      } else {
        setStage('selecting');
        setSelectedSlot(null);
      }
      setDeployResult(null);
      setErrorMessage('');
      setIsAssigning(false);
    }, 300);
  }, [stage, onClose, currentAssignment]);

  const handleSelectSlot = useCallback((slotIndex) => {
    const slot = displaySlots.find((option) => option.slotIndex === slotIndex);
    if (slot && !slot.isSelectable) return;
    setSelectedSlot(slotIndex);
  }, [displaySlots]);

  const handleProceedToLock = useCallback(() => {
    if (selectedSlot === null) return;
    setStage('locking');
  }, [selectedSlot]);

  const handleStarterProceed = useCallback(() => {
    setSelectedSlot(3);
    setStage('locking');
  }, []);

  const handleBackToSelecting = useCallback(() => {
    setStage('selecting');
  }, []);

  const handleRetry = useCallback(() => {
    setStage(currentAssignment !== null ? 'locking' : 'confirming_deploy');
    setErrorMessage('');
  }, [currentAssignment]);

  // POST assign slot then optionally deploy
  const handleAssignSlot = useCallback(async (andDeploy = false) => {
    if (!funnelId || selectedSlot === null) return;
    setIsAssigning(true);
    setErrorMessage('');

    try {
      const assignRes = await fetch('/api/ghl/funnel-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnel_id: funnelId, slot_index: selectedSlot }),
      });

      const assignData = await assignRes.json();

      if (!assignRes.ok) {
        setErrorMessage(assignData?.error || `Server error (${assignRes.status})`);
        setStage('error');
        setIsAssigning(false);
        return;
      }

      if (!andDeploy) {
        onAssign?.(selectedSlot);
        setIsAssigning(false);
        handleClose();
        return;
      }

      // Proceed to deploy
      setIsAssigning(false);
      await runDeploy();
    } catch (err) {
      setErrorMessage(err.message || 'Network error — please try again.');
      setStage('error');
      setIsAssigning(false);
    }
  }, [funnelId, selectedSlot, onAssign, handleClose]);

  // Deploy to the selected (or already-assigned) slot
  const runDeploy = useCallback(async () => {
    const slot = selectedSlot;
    if (!funnelId || slot === null) return;

    setStage('deploying');
    setErrorMessage('');

    try {
      const res = await fetch('/api/ghl/deploy-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId, slot_index: slot }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.error || `Server error (${res.status})`);
        setStage('error');
        return;
      }

      if (!data.success && data.summary?.updated === 0) {
        setErrorMessage(data.message || 'Deploy completed but no values were updated.');
        setStage('error');
        return;
      }

      setDeployResult(data);
      setStage('done');
      onSuccess?.(slot);
    } catch (err) {
      setErrorMessage(err.message || 'Network error — please try again.');
      setStage('error');
    }
  }, [funnelId, selectedSlot, onSuccess]);

  // When already assigned — deploy directly without re-assigning
  const handleDeployExisting = useCallback(async () => {
    await runDeploy();
  }, [runDeploy]);

  // ─── Stage label for header subtitle ─────────────────────────────────────
  const stageLabel = {
    selecting: 'Choose which funnel slot to deploy to',
    locking: currentAssignment !== null
      ? 'Deploy to your locked slot'
      : 'Confirm slot assignment',
    confirming_deploy: 'Confirm deployment',
    deploying: null,
    done: null,
    error: null,
  };

  const stageSubtitleColor = {
    selecting: 'text-[#B2C0CD]',
    locking: 'text-[#B2C0CD]',
    confirming_deploy: 'text-[#B2C0CD]',
    deploying: 'text-cyan',
    done: 'text-emerald-400',
    error: 'text-red-400',
  };

  const subtitleText =
    stage === 'deploying' ? 'Deploying…' :
    stage === 'done' ? 'Deployment complete' :
    stage === 'error' ? 'Deployment failed' :
    stageLabel[stage] ?? '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="slot-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            key="slot-modal-panel"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0D1217] border border-[#1E2A34] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1E2A34]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0D1F25] border border-[#1E2A34] rounded-xl flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-cyan" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#F4F8FB]">Deploy Funnel Slot</h2>
                  <p className={`text-xs mt-0.5 ${stageSubtitleColor[stage] ?? 'text-[#B2C0CD]'}`}>
                    {subtitleText}
                  </p>
                </div>
              </div>

              {stage !== 'deploying' && (
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[#1E2A34] rounded-lg transition-colors text-[#B2C0CD] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-5">

              {/* ── SELECTING stage ── */}
              {stage === 'selecting' && (
                <>
                  {isStarterSingleSlot ? (
                    <div className="space-y-4">
                      <p className="text-sm text-[#B2C0CD]">
                        Your plan includes Slot 3. Click below to proceed.
                      </p>
                      <SlotCard
                        slotIndex={3}
                        isSelected
                        isDisabled={false}
                        onClick={() => {}}
                      />
                      <button
                        onClick={handleStarterProceed}
                        className="w-full py-3 px-4 bg-[#16C7E7] hover:bg-[#12b3d0] rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {displaySlots.map((slot) => {
                          return (
                            <SlotCard
                              key={slot.slotIndex}
                              slotIndex={slot.slotIndex}
                              isSelected={selectedSlot === slot.slotIndex}
                              isDisabled={!slot.isSelectable && !slot.isTakenByOther}
                              disabledLabel={slot.disabledLabel}
                              isTakenByOther={slot.isTakenByOther}
                              isAssignedToThis={slot.isCurrentAssignment}
                              onClick={() => handleSelectSlot(slot.slotIndex)}
                            />
                          );
                        })}
                      </div>

                      <button
                        onClick={handleProceedToLock}
                        disabled={selectedSlot === null}
                        className="w-full py-3 px-4 bg-[#16C7E7] hover:bg-[#12b3d0] rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── LOCKING stage (new assignment confirm) ── */}
              {stage === 'locking' && currentAssignment === null && selectedSlot !== null && (
                <div className="space-y-5">
                  <p className="text-sm font-semibold text-[#F4F8FB]">Confirm Slot Assignment</p>

                  {/* Summary */}
                  <div className="bg-[#121920] border border-[#1E2A34] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#B2C0CD]">Target slot</span>
                      <span className="text-sm font-bold text-[#F4F8FB]">Slot {selectedSlot}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#B2C0CD]">Key prefix</span>
                      <span className="text-sm font-mono text-cyan">{selectedPrefix}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#B2C0CD]">Funnel ID</span>
                      <span className="text-xs text-[#B2C0CD] font-mono truncate max-w-[160px]">{funnelId}</span>
                    </div>
                  </div>

                  {/* Permanent warning */}
                  <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300 leading-relaxed">
                      <span className="font-bold">Permanent assignment.</span> Slot {selectedSlot} will be locked to this funnel. To change it, you must delete this funnel. This action cannot be undone.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleBackToSelecting}
                      disabled={isAssigning}
                      className="flex-1 py-3 px-4 bg-[#1E2A34] hover:bg-[#253340] rounded-xl font-medium text-[#B2C0CD] hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => handleAssignSlot(false)}
                      disabled={isAssigning}
                      className="flex-1 py-3 px-4 bg-[#1E2A34] hover:bg-[#253340] border border-cyan/30 rounded-xl font-medium text-cyan hover:text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      {isAssigning ? 'Assigning…' : 'Assign Only'}
                    </button>
                    <button
                      onClick={() => handleAssignSlot(true)}
                      disabled={isAssigning}
                      className="flex-1 py-3 px-4 bg-[#16C7E7] hover:bg-[#12b3d0] rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                    >
                      {isAssigning ? 'Working…' : 'Assign & Deploy'}
                      {!isAssigning && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* ── LOCKING stage (already assigned — deploy confirm) ── */}
              {stage === 'locking' && currentAssignment !== null && (
                <div className="space-y-5">
                  {/* Locked assignment banner */}
                  <div className="flex items-center gap-3 bg-cyan/5 border border-cyan rounded-xl p-4">
                    <Lock className="w-5 h-5 text-cyan flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-cyan">
                        Slot {currentAssignment} is locked to this funnel
                      </p>
                      <p className="text-xs text-[#B2C0CD] mt-0.5 font-mono">
                        Prefix: {String(currentAssignment).padStart(2, '0')}_
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-[#121920] border border-[#1E2A34] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#B2C0CD]">Deploying to</span>
                      <span className="text-sm font-bold text-[#F4F8FB]">Slot {currentAssignment}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#B2C0CD]">Key prefix</span>
                      <span className="text-sm font-mono text-cyan">
                        {String(currentAssignment).padStart(2, '0')}_
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#B2C0CD]">Funnel ID</span>
                      <span className="text-xs text-[#B2C0CD] font-mono truncate max-w-[160px]">{funnelId}</span>
                    </div>
                  </div>

                  {/* Overwrite warning */}
                  <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300 leading-relaxed">
                      This will overwrite all existing slot values for Slot {currentAssignment} in your connected sub-account. The action cannot be undone.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 bg-[#1E2A34] hover:bg-[#253340] rounded-xl font-medium text-[#B2C0CD] hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeployExisting}
                      className="flex-1 py-3 px-4 bg-[#16C7E7] hover:bg-[#12b3d0] rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Deploy to Slot {currentAssignment}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── DEPLOYING stage ── */}
              {stage === 'deploying' && (
                <div className="py-8 flex flex-col items-center gap-5">
                  <div className="relative w-16 h-16">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border-2 border-cyan/20 border-t-cyan"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-cyan" />
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="font-semibold text-[#F4F8FB]">
                      Deploying to Slot {selectedSlot}
                    </p>
                    <p className="text-xs text-[#B2C0CD]">
                      Pushing vault content to your connected account…
                    </p>
                    <p className="text-[10px] text-[#4a5a6a] mt-2">
                      This typically takes 30–90 seconds. Do not close this window.
                    </p>
                  </div>

                  <div className="w-full h-1.5 bg-[#1E2A34] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full w-1/3 bg-[#16C7E7] rounded-full"
                      animate={{ x: ['0%', '300%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}

              {/* ── DONE stage ── */}
              {stage === 'done' && deployResult && (
                <div className="space-y-5">
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-[#F4F8FB] text-base">
                        Slot {selectedSlot} deployed successfully
                      </p>
                      {deployResult.duration && (
                        <p className="text-xs text-[#B2C0CD] mt-1">
                          Completed in {deployResult.duration}
                        </p>
                      )}
                    </div>
                  </div>

                  {deployResult.summary && (
                    <div className="grid grid-cols-3 gap-3">
                      <StatPill label="Updated" value={deployResult.summary.updated ?? 0} color="text-cyan" />
                      <StatPill label="Not found" value={deployResult.summary.notFound ?? 0} color="text-amber-400" />
                      <StatPill label="Failed" value={deployResult.summary.failed ?? 0} color="text-red-400" />
                    </div>
                  )}

                  {deployResult.notFoundKeys?.length > 0 && (
                    <p className="text-[11px] text-[#4a5a6a] leading-relaxed">
                      {deployResult.notFoundKeys.length} key(s) were not found in your connected account. Run the admin slot provisioning step to create the missing placeholders.
                    </p>
                  )}

                  <button
                    onClick={handleClose}
                    className="w-full py-3 px-4 bg-[#1E2A34] hover:bg-[#253340] rounded-xl font-medium text-[#F4F8FB] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* ── ERROR stage ── */}
              {stage === 'error' && (
                <div className="space-y-5">
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                      <AlertTriangle className="w-7 h-7 text-red-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-[#F4F8FB] text-base">Deployment failed</p>
                      {errorMessage && (
                        <p className="text-xs text-red-400 mt-2 max-w-xs mx-auto leading-relaxed">
                          {errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 bg-[#1E2A34] hover:bg-[#253340] rounded-xl font-medium text-[#B2C0CD] hover:text-white transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleRetry}
                      className="flex-1 py-3 px-4 bg-[#16C7E7] hover:bg-[#12b3d0] rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function StatPill({ label, value, color }) {
  return (
    <div className="bg-[#121920] border border-[#1E2A34] rounded-xl p-3 text-center">
      <p className="text-[10px] uppercase font-bold text-[#4a5a6a] tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}
