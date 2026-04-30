'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Rocket,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import SlotCard from './SlotCard';

// ─── Plan → allowed slots ───────────────────────────────────────────────────
const PLAN_SLOTS = {
  starter: [3],
  growth: [3, 4, 5],
  scale: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

// All possible slots across every plan (displayed so users can see what they're missing)
const ALL_SLOTS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// ─── State machine stages ────────────────────────────────────────────────────
// idle → selecting → confirming → pushing → done | error
// (idle is when isOpen=false; selecting is the first visible state)

/**
 * SlotSelectorModal
 *
 * Props:
 *   isOpen          boolean
 *   onClose         fn()
 *   funnelId        string
 *   userPlan        'starter' | 'growth' | 'scale'
 *   availableSlots  number[]  — slot indices that have 'active' status (admin-provisioned)
 *                              Defaults to [3] when not provided.
 *   onSuccess       fn(slotIndex)
 *
 * API contract (POST /api/ghl/deploy-workflow):
 *   body: { funnelId, slot_index }
 *   response: { success, message, summary: { updated, notFound, failed }, duration, updatedKeys, notFoundKeys }
 */
export default function SlotSelectorModal({
  isOpen,
  onClose,
  funnelId,
  userPlan = 'starter',
  availableSlots,
  onSuccess,
}) {
  const resolvedAvailableSlots = availableSlots ?? [3];
  const planSlots = PLAN_SLOTS[userPlan] ?? [3];

  // ─── Local state ──────────────────────────────────────────────────────────
  const [stage, setStage] = useState('selecting'); // selecting | confirming | pushing | done | error
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [deployResult, setDeployResult] = useState(null); // API response on success
  const [errorMessage, setErrorMessage] = useState('');

  // ─── Derived ──────────────────────────────────────────────────────────────
  const isStarterSingleSlot = userPlan === 'starter' && planSlots.length === 1;
  const selectedPrefix = selectedSlot !== null
    ? String(selectedSlot).padStart(2, '0') + '_'
    : null;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (stage === 'pushing') return; // prevent close during push
    onClose?.();
    // Reset after animation completes
    setTimeout(() => {
      setStage('selecting');
      setSelectedSlot(null);
      setDeployResult(null);
      setErrorMessage('');
    }, 300);
  }, [stage, onClose]);

  const handleSelectSlot = useCallback((slotIndex) => {
    setSelectedSlot(slotIndex);
  }, []);

  const handleProceedToConfirm = useCallback(() => {
    if (selectedSlot === null) return;
    setStage('confirming');
  }, [selectedSlot]);

  // Starter plan: skip selection, go straight to confirm with slot 3
  const handleStarterConfirm = useCallback(() => {
    setSelectedSlot(3);
    setStage('confirming');
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setStage('selecting');
  }, []);

  const handleDeploy = useCallback(async () => {
    if (!funnelId || selectedSlot === null) return;

    setStage('pushing');
    setErrorMessage('');

    try {
      const res = await fetch('/api/ghl/deploy-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId, slot_index: selectedSlot }),
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
      onSuccess?.(selectedSlot);
    } catch (err) {
      setErrorMessage(err.message || 'Network error — please try again.');
      setStage('error');
    }
  }, [funnelId, selectedSlot, onSuccess]);

  const handleRetry = useCallback(() => {
    setStage('confirming');
    setErrorMessage('');
  }, []);

  // ─── Render helpers ───────────────────────────────────────────────────────

  // Determine which slots to show in the grid.
  // Show all slots known to the plan; grey out ones not yet provisioned by admin.
  const displaySlots = ALL_SLOTS.filter((s) => planSlots.includes(s));

  // ─── Render ───────────────────────────────────────────────────────────────
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
                <div className="w-10 h-10 bg-gradient-to-br from-cyan/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-cyan" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#F4F8FB]">Push to GHL Builder</h2>
                  {stage === 'selecting' && (
                    <p className="text-xs text-[#B2C0CD] mt-0.5">
                      Choose which funnel slot to deploy to
                    </p>
                  )}
                  {stage === 'confirming' && (
                    <p className="text-xs text-[#B2C0CD] mt-0.5">
                      Confirm deployment details
                    </p>
                  )}
                  {stage === 'pushing' && (
                    <p className="text-xs text-cyan mt-0.5">Deploying…</p>
                  )}
                  {stage === 'done' && (
                    <p className="text-xs text-emerald-400 mt-0.5">Deployment complete</p>
                  )}
                  {stage === 'error' && (
                    <p className="text-xs text-red-400 mt-0.5">Deployment failed</p>
                  )}
                </div>
              </div>

              {stage !== 'pushing' && (
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[#1E2A34] rounded-lg transition-colors text-[#B2C0CD] hover:text-white"
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
                    /* Starter: single slot — no grid needed */
                    <div className="space-y-4">
                      <p className="text-sm text-[#B2C0CD]">
                        Your plan includes Slot 3. Click below to deploy your vault content.
                      </p>
                      <SlotCard
                        slotIndex={3}
                        isSelected
                        isDisabled={false}
                        onClick={() => {}}
                      />
                      <button
                        onClick={handleStarterConfirm}
                        className="w-full py-3 px-4 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* Growth / Scale: slot grid */
                    <div className="space-y-4">
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {displaySlots.map((s) => {
                          const isProvisioned = resolvedAvailableSlots.includes(s);
                          return (
                            <SlotCard
                              key={s}
                              slotIndex={s}
                              isSelected={selectedSlot === s}
                              isDisabled={!isProvisioned}
                              onClick={() => handleSelectSlot(s)}
                            />
                          );
                        })}
                      </div>

                      <button
                        onClick={handleProceedToConfirm}
                        disabled={selectedSlot === null}
                        className="w-full py-3 px-4 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── CONFIRMING stage ── */}
              {stage === 'confirming' && selectedSlot !== null && (
                <div className="space-y-5">
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
                      <span className="text-sm text-[#B2C0CD]">Funnel</span>
                      <span className="text-xs text-[#B2C0CD] font-mono truncate max-w-[160px]">{funnelId}</span>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300 leading-relaxed">
                      This will overwrite all existing custom values for Slot {selectedSlot} in your
                      GHL sub-account. The action cannot be undone.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelConfirm}
                      className="flex-1 py-3 px-4 bg-[#1E2A34] hover:bg-[#253340] rounded-xl font-medium text-[#B2C0CD] hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleDeploy}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2"
                    >
                      Deploy
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── PUSHING stage ── */}
              {stage === 'pushing' && (
                <div className="py-8 flex flex-col items-center gap-5">
                  {/* Spinner ring */}
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
                      Pushing vault content to GHL custom values…
                    </p>
                    <p className="text-[10px] text-[#4a5a6a] mt-2">
                      This typically takes 30–90 seconds. Do not close this window.
                    </p>
                  </div>

                  {/* Animated progress bar (indeterminate) */}
                  <div className="w-full h-1.5 bg-[#1E2A34] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full w-1/3 bg-gradient-to-r from-cyan to-blue-600 rounded-full"
                      animate={{ x: ['0%', '300%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}

              {/* ── DONE stage ── */}
              {stage === 'done' && deployResult && (
                <div className="space-y-5">
                  {/* Success banner */}
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

                  {/* Stats */}
                  {deployResult.summary && (
                    <div className="grid grid-cols-3 gap-3">
                      <StatPill
                        label="Updated"
                        value={deployResult.summary.updated ?? 0}
                        color="text-cyan"
                      />
                      <StatPill
                        label="Not found"
                        value={deployResult.summary.notFound ?? 0}
                        color="text-amber-400"
                      />
                      <StatPill
                        label="Failed"
                        value={deployResult.summary.failed ?? 0}
                        color="text-red-400"
                      />
                    </div>
                  )}

                  {/* Not-found hint */}
                  {deployResult.notFoundKeys?.length > 0 && (
                    <p className="text-[11px] text-[#4a5a6a] leading-relaxed">
                      {deployResult.notFoundKeys.length} key(s) were not found in your GHL
                      sub-account. Run the admin bulk-create step to provision missing placeholders.
                    </p>
                  )}

                  <button
                    onClick={handleClose}
                    className="w-full py-3 px-4 bg-[#1E2A34] hover:bg-[#253340] rounded-xl font-medium text-[#F4F8FB] transition-colors"
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
                      className="flex-1 py-3 px-4 bg-[#1E2A34] hover:bg-[#253340] rounded-xl font-medium text-[#B2C0CD] hover:text-white transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleRetry}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan/90 hover:to-blue-700 rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2"
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

// ─── Internal helper ─────────────────────────────────────────────────────────

function StatPill({ label, value, color }) {
  return (
    <div className="bg-[#121920] border border-[#1E2A34] rounded-xl p-3 text-center">
      <p className="text-[10px] uppercase font-bold text-[#4a5a6a] tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}
