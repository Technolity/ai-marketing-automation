/**
 * Real-time Sync Utility
 * Uses Supabase real-time subscriptions for collaborative editing
 * Syncs vault_content_fields changes across multiple browser windows
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Subscribe to vault content field changes for a specific funnel
 * @param {string} funnelId - The funnel ID to subscribe to
 * @param {function} onUpdate - Callback when a field is updated
 * @returns {function} Unsubscribe function
 */
export function subscribeToVaultChanges(funnelId, onUpdate) {
    if (!funnelId) {
        console.warn('[RealtimeSync] No funnelId provided, skipping subscription');
        return () => {};
    }

    // Create Supabase client from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[RealtimeSync] Missing Supabase environment variables');
        return () => {};
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create a unique channel for this funnel
    const channelName = `vault-${funnelId}`;

    console.log('[RealtimeSync] Subscribing to channel:', channelName);

    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'vault_content_fields',
                filter: `funnel_id=eq.${funnelId}`
            },
            (payload) => {
                console.log('[RealtimeSync] Field updated:', {
                    section: payload.new.section_id,
                    field: payload.new.field_id,
                    timestamp: new Date().toISOString()
                });

                // Call the update callback with the new field data
                if (onUpdate && typeof onUpdate === 'function') {
                    onUpdate(payload.new);
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'vault_content_fields',
                filter: `funnel_id=eq.${funnelId}`
            },
            (payload) => {
                console.log('[RealtimeSync] Field inserted:', {
                    section: payload.new.section_id,
                    field: payload.new.field_id
                });

                if (onUpdate && typeof onUpdate === 'function') {
                    onUpdate(payload.new);
                }
            }
        )
        .subscribe((status) => {
            console.log('[RealtimeSync] Subscription status:', status);
        });

    // Return unsubscribe function
    return () => {
        console.log('[RealtimeSync] Unsubscribing from channel:', channelName);
        supabase.removeChannel(channel);
    };
}

/**
 * Subscribe to vault content (section-level) changes
 * @param {string} funnelId - The funnel ID to subscribe to
 * @param {function} onUpdate - Callback when a section is updated
 * @returns {function} Unsubscribe function
 */
export function subscribeToVaultSections(funnelId, onUpdate) {
    if (!funnelId) {
        console.warn('[RealtimeSync] No funnelId provided, skipping subscription');
        return () => {};
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[RealtimeSync] Missing Supabase environment variables');
        return () => {};
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const channelName = `vault-sections-${funnelId}`;

    console.log('[RealtimeSync] Subscribing to sections channel:', channelName);

    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: '*', // All events: INSERT, UPDATE, DELETE
                schema: 'public',
                table: 'vault_content',
                filter: `funnel_id=eq.${funnelId}`
            },
            (payload) => {
                console.log('[RealtimeSync] Section changed:', {
                    event: payload.eventType,
                    section: payload.new?.section_id || payload.old?.section_id
                });

                if (onUpdate && typeof onUpdate === 'function') {
                    onUpdate({
                        event: payload.eventType,
                        data: payload.new || payload.old
                    });
                }
            }
        )
        .subscribe((status) => {
            console.log('[RealtimeSync] Section subscription status:', status);
        });

    return () => {
        console.log('[RealtimeSync] Unsubscribing from sections channel:', channelName);
        supabase.removeChannel(channel);
    };
}

/**
 * Subscribe to generation job updates
 * @param {string} jobId - The job ID to subscribe to
 * @param {function} onUpdate - Callback when job status changes
 * @returns {function} Unsubscribe function
 */
export function subscribeToJobStatus(jobId, onUpdate) {
    if (!jobId) {
        console.warn('[RealtimeSync] No jobId provided, skipping subscription');
        return () => {};
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[RealtimeSync] Missing Supabase environment variables');
        return () => {};
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const channelName = `job-${jobId}`;

    console.log('[RealtimeSync] Subscribing to job channel:', channelName);

    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'generation_jobs',
                filter: `id=eq.${jobId}`
            },
            (payload) => {
                console.log('[RealtimeSync] Job status updated:', {
                    jobId: payload.new.id,
                    status: payload.new.status,
                    progress: payload.new.progress_percentage
                });

                if (onUpdate && typeof onUpdate === 'function') {
                    onUpdate(payload.new);
                }
            }
        )
        .subscribe((status) => {
            console.log('[RealtimeSync] Job subscription status:', status);
        });

    return () => {
        console.log('[RealtimeSync] Unsubscribing from job channel:', channelName);
        supabase.removeChannel(channel);
    };
}

export default {
    subscribeToVaultChanges,
    subscribeToVaultSections,
    subscribeToJobStatus
};
