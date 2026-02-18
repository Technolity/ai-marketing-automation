'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * ApprovalWatcher Component
 * Monitors section approvals and auto-triggers Funnel Copy generation
 * when all required dependencies are approved
 */
export default function ApprovalWatcher({ funnelId, userId }) {
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    const checkApprovals = async () => {
      try {
        // Fetch approval status from vault
        const res = await fetch(`/api/os/approvals?session_id=${funnelId}`);

        if (!res.ok) {
          console.error('[ApprovalWatcher] Failed to fetch approvals:', res.status);
          return;
        }

        const data = await res.json();

        // Required sections for Funnel Copy generation
        // Phase 1: idealClient, message, story, offer
        // Phase 2: leadMagnet, vsl, bio
        const requiredSections = ['idealClient', 'message', 'story', 'offer', 'leadMagnet', 'vsl', 'bio'];

        // Check if all Phase 1 sections are approved (4 sections)
        const phase1Approved = data.businessCoreApprovals?.length === 4;

        // Check if required Phase 2 sections are approved
        const funnelAssetsApprovals = data.funnelAssetsApprovals || [];
        const phase2Required = ['leadMagnet', 'vsl', 'bio'];
        const phase2Approved = phase2Required.every(section =>
          funnelAssetsApprovals.includes(section)
        );

        const allRequiredApproved = phase1Approved && phase2Approved;

        // Check if Funnel Copy already exists
        const funnelCopyExists = funnelAssetsApprovals.includes('funnelCopy');

        console.log('[ApprovalWatcher] Status:', {
          phase1Approved,
          phase2Approved,
          funnelCopyExists,
          lastCheck,
          funnelAssetsApprovals
        });

        // If all required sections are approved and Funnel Copy doesn't exist yet
        // and we haven't triggered generation yet
        if (allRequiredApproved && !funnelCopyExists && lastCheck !== 'triggered') {
          // Check localStorage for recent trigger (prevent infinite loop on page refresh)
          const lastTriggerKey = `funnelCopy_trigger_${funnelId}`;
          const lastTrigger = localStorage.getItem(lastTriggerKey);
          const now = Date.now();

          // If triggered within last 5 minutes, skip
          if (lastTrigger && (now - parseInt(lastTrigger)) < 300000) {
            console.log('[ApprovalWatcher] Skipping - recently triggered (within 5 mins)');
            return;
          }

          console.log('[ApprovalWatcher] All dependencies approved. Triggering Funnel Copy generation...');

          // Mark as triggered (both state and localStorage)
          setLastCheck('triggered');
          localStorage.setItem(lastTriggerKey, now.toString());

          // Show notification to user
          toast.info('Generating Funnel Copy in background...', {
            description: 'This may take a few minutes. You\'ll be notified when complete.',
            duration: 5000
          });

          // Trigger Funnel Copy generation
          const triggerRes = await fetch('/api/os/generate-funnel-copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              funnel_id: funnelId
            })
          });

          if (!triggerRes.ok) {
            const errorData = await triggerRes.json();
            console.error('[ApprovalWatcher] Generation trigger failed:', errorData);
            toast.error('Failed to start Funnel Copy generation', {
              description: errorData.message || 'Please try again or contact support'
            });
            setLastCheck(null); // Reset so user can retry
            return;
          }

          const triggerData = await triggerRes.json();
          const jobId = triggerData?.jobId;
          console.log('[ApprovalWatcher] Generation job created:', jobId);

          // Start polling for completion — only if we have a valid jobId
          if (jobId) {
            pollGenerationStatus(jobId);
          } else {
            console.warn('[ApprovalWatcher] No jobId returned from generation trigger, skipping polling');
          }
        }
      } catch (error) {
        console.error('[ApprovalWatcher] Error checking approvals:', error);
      }
    };

    // Check on mount
    checkApprovals();

    // Poll every 5 seconds for approval changes
    const interval = setInterval(checkApprovals, 5000);

    return () => clearInterval(interval);
  }, [funnelId, userId, lastCheck]);

  /**
   * Poll the generation job status until completion
   */
  const pollGenerationStatus = async (jobId) => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/os/generation-status?jobId=${jobId}`);

        if (!res.ok) {
          console.error('[ApprovalWatcher] Status polling failed');
          return;
        }

        const job = await res.json();
        console.log('[ApprovalWatcher] Job status:', job.status, `${job.progressPercentage}%`);

        if (job.status === 'completed') {
          clearInterval(poll);

          // Emit custom event for real-time content update (no page refresh!)
          window.dispatchEvent(new CustomEvent('funnelCopyGenerated', {
            detail: { funnelId, jobId }
          }));

          toast.success('Funnel Copy generated successfully!', {
            description: 'Your funnel page copy is now ready',
            duration: 5000
          });

          // Clear the localStorage throttle so future generations work
          const lastTriggerKey = `funnelCopy_trigger_${funnelId}`;
          localStorage.removeItem(lastTriggerKey);

        } else if (job.status === 'failed') {
          clearInterval(poll);
          toast.error('Funnel Copy generation failed', {
            description: job.errorMessage || 'Please try regenerating or contact support',
            duration: 10000
          });
          setLastCheck(null); // Reset so user can retry
        }
      } catch (error) {
        console.error('[ApprovalWatcher] Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes (max generation time)
    setTimeout(() => {
      clearInterval(poll);
      console.log('[ApprovalWatcher] Stopped polling after 5 minutes');
    }, 300000);
  };

  // This component has no UI - just background monitoring
  return null;
}
