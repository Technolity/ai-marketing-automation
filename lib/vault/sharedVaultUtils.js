/**
 * Shared Vault Utilities
 * 
 * Reusable functions for vault field components to handle feedback saves.
 */

import { fetchWithAuth } from '@/lib/fetchWithAuth';

/**
 * Handle saving AI feedback to vault fields.
 * Supports both single field and batch multi-field save.
 * 
 * @param {Object} params - Parameters object
 * @param {Object} params.feedbackData - Data from FeedbackChatModal { refinedContent, subSection }
 * @param {string} params.funnelId - Funnel ID
 * @param {string} params.sectionId - Section ID (e.g., 'offer', 'facebookAds')
 * @param {Function} params.fetchFields - Function to refresh fields after save
 * @param {Function} params.setSectionApproved - State setter for section approval
 * @param {Function} params.setFeedbackModalOpen - State setter to close modal
 * @param {Function} params.setSelectedField - State setter to clear selected field
 * @returns {Promise<boolean>} True if save succeeded
 */
export async function saveVaultFeedback({
    feedbackData,
    funnelId,
    sectionId,
    fetchFields,
    setSectionApproved,
    setFeedbackModalOpen,
    setSelectedField
}) {
    const refinedContent = feedbackData?.refinedContent || feedbackData;
    const subSection = feedbackData?.subSection;

    if (!refinedContent) {
        console.error('[saveVaultFeedback] No refined content to save');
        return false;
    }

    try {
        // Import feedback utils
        const { flattenAIResponseToFields } = await import('@/lib/vault/feedbackUtils');

        // Flatten AI response to field IDs
        const flatFields = flattenAIResponseToFields(refinedContent, sectionId);

        console.log(`[saveVaultFeedback] Section: ${sectionId}, Fields:`, Object.keys(flatFields));

        // If subSection specified and exists in flatFields, only save that field
        if (subSection && subSection !== 'all' && flatFields[subSection]) {
            console.log('[saveVaultFeedback] Saving single field:', subSection);

            const response = await fetchWithAuth('/api/os/vault-field', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId,
                    field_id: subSection,
                    field_value: flatFields[subSection]
                })
            });

            if (!response.ok) throw new Error('Failed to save field');

        } else if (Object.keys(flatFields).length > 0) {
            // Batch save all fields via new API
            console.log('[saveVaultFeedback] Batch saving', Object.keys(flatFields).length, 'fields');

            const response = await fetchWithAuth('/api/os/vault-section-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnel_id: funnelId,
                    section_id: sectionId,
                    fields: flatFields
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save fields');
            }

            const result = await response.json();
            console.log('[saveVaultFeedback] Batch save result:', result);
        }

        // Refresh fields from database
        if (fetchFields) await fetchFields();

        // Reset section approval
        if (setSectionApproved) setSectionApproved(false);

        // Close modal
        if (setFeedbackModalOpen) setFeedbackModalOpen(false);
        if (setSelectedField) setSelectedField(null);

        return true;

    } catch (error) {
        console.error('[saveVaultFeedback] Error:', error);
        const { toast } = await import('sonner');
        toast.error('Failed to save feedback: ' + error.message);
        return false;
    }
}
