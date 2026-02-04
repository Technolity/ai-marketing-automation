'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Users, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function JoinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { userId } = useAuth();

    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading'); // loading, valid, invalid, accepted, error
    const [inviteInfo, setInviteInfo] = useState(null);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            return;
        }

        const checkInvite = async () => {
            try {
                const response = await fetch(`/api/team/accept?token=${token}`);
                const data = await response.json();

                if (response.ok && data.valid) {
                    setInviteInfo(data);
                    setStatus('valid');
                } else {
                    setStatus('invalid');
                }
            } catch (error) {
                console.error('Error checking invite:', error);
                setStatus('error');
            }
        };

        checkInvite();
    }, [token]);

    const handleAccept = async () => {
        setAccepting(true);
        try {
            const response = await fetch('/api/team/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to accept invitation');
            }

            setStatus('accepted');
            toast.success('Welcome to the team!');

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error) {
            toast.error(error.message);
            setAccepting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-cyan animate-spin mb-4" />
                <p className="text-gray-400">Verifying invitation...</p>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
                <p className="text-gray-400 max-w-md">
                    This invitation link is invalid, expired, or has already been used.
                </p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-6 px-6 py-2.5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
                >
                    Go Home
                </button>
            </div>
        );
    }

    if (status === 'accepted') {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Team!</h2>
                <p className="text-gray-400">Redirecting to dashboard...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan/20 to-blue-500/20 flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-cyan" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">You're Invited!</h2>

            {inviteInfo?.owner && (
                <p className="text-gray-400 mb-6 max-w-md">
                    <span className="text-white font-medium">{inviteInfo.owner.name}</span>
                    {inviteInfo.owner.business && (
                        <span> from <span className="text-white">{inviteInfo.owner.business}</span></span>
                    )}
                    {' '}has invited you to join their team.
                </p>
            )}

            <p className="text-gray-500 text-sm mb-8">
                Invitation for: <span className="text-cyan">{inviteInfo?.email}</span>
            </p>

            <SignedIn>
                <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="px-8 py-3 bg-gradient-to-r from-cyan to-blue-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                    {accepting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Joining...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Accept Invitation
                        </>
                    )}
                </button>
            </SignedIn>

            <SignedOut>
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm">
                        Please sign in to accept this invitation
                    </p>
                    <SignInButton mode="modal">
                        <button className="px-8 py-3 bg-gradient-to-r from-cyan to-blue-500 text-white font-semibold rounded-lg hover:opacity-90 transition-all">
                            Sign In to Continue
                        </button>
                    </SignInButton>
                </div>
            </SignedOut>
        </div>
    );
}

export default function JoinPage() {
    return (
        <div className="min-h-screen bg-dark flex flex-col">
            {/* Header */}
            <header className="border-b border-white/5 bg-dark/60 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center">
                    <img src="/tedos-logo.png" alt="TedOS" className="h-10 w-auto" />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-lg bg-dark-800 rounded-2xl border border-white/10 p-8">
                    <Suspense fallback={
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan" />
                        </div>
                    }>
                        <JoinContent />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
