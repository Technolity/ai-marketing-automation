// Script to clean up duplicate approvals in localStorage and database
// Run this in browser console on the vault page to fix corrupted approval data

async function cleanupApprovals() {
    const funnelId = new URLSearchParams(window.location.search).get('funnel_id');
    if (!funnelId) {
        console.error('No funnel_id in URL');
        return;
    }

    console.log('Cleaning up approvals for funnel:', funnelId);

    // Get current approvals from API
    const response = await fetch(`/api/os/approvals?session_id=${funnelId}`);
    const data = await response.json();

    console.log('Current approvals:', data);

    // Deduplicate
    const phase1Clean = [...new Set(data.businessCoreApprovals || [])];
    const phase2Clean = [...new Set(data.funnelAssetsApprovals || [])];

    console.log('Cleaned approvals:', { phase1: phase1Clean, phase2: phase2Clean });

    // Save back to API
    await fetch('/api/os/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: funnelId,
            businessCoreApprovals: phase1Clean,
            funnelAssetsApprovals: phase2Clean
        })
    });

    console.log('✅ Approvals cleaned! Refresh the page.');
}

// Run it
cleanupApprovals();
