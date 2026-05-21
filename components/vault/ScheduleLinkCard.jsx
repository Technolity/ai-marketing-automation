'use client';

import { useState } from 'react';
import { Link2, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

/**
 * ScheduleLinkCard
 *
 * Props:
 *   funnelId   string   — current funnel
 *   initialUrl string   — pre-filled from user_funnels.schedule_link
 *   onSaved    fn(url)  — called after successful save
 *   saveOnly   bool     — true = save to content only (funnel not yet deployed);
 *                         false = save + push to GHL Builder (default)
 */
export default function ScheduleLinkCard({ funnelId, initialUrl = '', onSaved, saveOnly = false }) {
    const [url, setUrl] = useState(initialUrl);
    const [status, setStatus] = useState('idle'); // idle | saving | success | error
    const [errorMsg, setErrorMsg] = useState('');

    const isValid = url.startsWith('http://') || url.startsWith('https://');

    const handleSave = async () => {
        if (!isValid) {
            setErrorMsg('Please enter a valid URL starting with http:// or https://');
            return;
        }
        if (!funnelId) {
            setErrorMsg('No funnel selected.');
            return;
        }

        setStatus('saving');
        setErrorMsg('');

        try {
            const res = await fetchWithAuth('/api/ghl/update-schedule-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule_link: url, funnel_id: funnelId, save_only: saveOnly }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update schedule link');
            }

            setStatus('success');
            onSaved?.(url);

            if (saveOnly) {
                toast.success('Booking link saved — it\'s now embedded in your campaign content.');
            } else {
                toast.success(
                    `Booking link saved & pushed to Builder (${data.ghl_pushed?.join(', ') || 'done'})`
                );
            }

            setTimeout(() => setStatus('idle'), 4000);
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message);
            toast.error('Failed to save booking link');
        }
    };

    return (
        <div className="rounded-xl border border-[#1E2A34] bg-[#0D1217] p-4">
            <div className="flex items-center gap-2 mb-3">
                <Link2 size={16} className="text-[#16C7E7]" />
                <span className="text-sm font-medium text-[#F4F8FB]">Booking / Schedule Link</span>
            </div>

            <p className="text-xs text-[#B2C0CD] mb-3">
                {saveOnly
                    ? 'Paste your booking URL here. It will be hardcoded into all emails, SMS, and appointment reminders — deploy your funnel first, then come back to push campaigns.'
                    : 'Paste your Calendly, Builder calendar, or booking URL here. Saving will replace the placeholder in all emails, SMS, and appointment reminders and push them to Builder.'
                }
            </p>

            <div className="flex gap-2">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setErrorMsg(''); setStatus('idle'); }}
                    placeholder="https://calendly.com/yourname/30min"
                    className="flex-1 rounded-lg border border-[#1E2A34] bg-[#05080B] px-3 py-2 text-sm text-[#F4F8FB] placeholder-[#B2C0CD]/50 focus:outline-none focus:border-[#16C7E7] transition-colors"
                />
                <button
                    onClick={handleSave}
                    disabled={status === 'saving' || !url}
                    className="flex items-center gap-1.5 rounded-lg bg-[#16C7E7] hover:bg-[#12b0cc] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-[#05080B] transition-colors whitespace-nowrap"
                >
                    {status === 'saving' ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Saving...
                        </>
                    ) : status === 'success' ? (
                        <>
                            <CheckCircle size={14} />
                            Done
                        </>
                    ) : saveOnly ? (
                        'Save to Content'
                    ) : (
                        'Save & Push to Builder'
                    )}
                </button>
            </div>

            {errorMsg && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                    <AlertTriangle size={12} />
                    {errorMsg}
                </div>
            )}

            {status === 'success' && (
                <p className="mt-2 text-xs text-emerald-400">
                    {saveOnly
                        ? '✓ Booking URL embedded in your campaign content. Approve sections when ready.'
                        : '✓ Emails, SMS, and appointment reminders updated with your booking URL.'
                    }
                </p>
            )}
        </div>
    );
}
