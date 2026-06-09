"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useSignIn } from "@clerk/nextjs";
import { CheckCircle2, Copy, Check, ArrowRight, KeyRound, Mail } from "lucide-react";

const DEFAULT_PASSWORD = "TedOS@123!";

// ─── Clerk v4 invitation ticket auto sign-in ──────────────────────────────────
// When a user clicks the Clerk invitation email, Clerk redirects them to the
// invitation `redirectUrl` (set to `${NEXT_PUBLIC_APP_URL}/welcome` in
// app/api/webhooks/ghl-provisioning/route.js) with the ticket appended as the
// `__clerk_ticket` query param (and an account status in `__clerk_status`).
//
// The GHL provisioning webhook creates the Clerk user WITH a password already
// set before sending the invitation, so the account status is `sign_in`. We
// therefore consume the ticket via the classic v4 SignIn resource:
//   const res = await signIn.create({ strategy: 'ticket', ticket });
//   if (res.status === 'complete') await setActive({ session: res.createdSessionId });
//
// Verified against Context7 Clerk docs (`/clerk/clerk-docs`), guide:
//   guides/development/custom-flows/authentication/application-invitations
// which documents the `ticket` strategy + the
//   status === COMPLETE && createdSessionId → setActive(createdSessionId)
// completion pattern. The newer `signIn.ticket()` / `signIn.finalize()` calls in
// the same docs are the beta "future" resource API and are NOT available in
// @clerk/nextjs ^4.31.8 — do not use them here.

export default function WelcomePage() {
    const { user, isLoaded } = useUser();
    const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [copiedField, setCopiedField] = useState(null);
    // Tracks the ticket auto sign-in: 'idle' | 'signing-in' | 'failed'
    const [ticketState, setTicketState] = useState("idle");
    // Guard so the ticket sign-in only fires once per mount (StrictMode-safe).
    const ticketAttempted = useRef(false);

    const ticket = searchParams?.get("__clerk_ticket") || null;

    // ── Ticket auto sign-in ───────────────────────────────────────────────────
    useEffect(() => {
        if (!isLoaded || !signInLoaded) return;
        // Already signed in → nothing to do (also covers post-success rerenders).
        if (user) return;
        // No ticket and no session → gate to /sign-in (see gate effect below).
        if (!ticket) return;
        // Only attempt once.
        if (ticketAttempted.current) return;
        ticketAttempted.current = true;

        const runTicketSignIn = async () => {
            setTicketState("signing-in");
            console.log("[activation] ticket sign-in start");
            try {
                const res = await signIn.create({ strategy: "ticket", ticket });
                if (res.status === "complete") {
                    await setActive({ session: res.createdSessionId });
                    // useUser() will re-render with the new session; log without PII.
                    console.log("[activation] ticket sign-in complete");
                    setTicketState("idle");
                } else {
                    console.warn(
                        "[activation] ticket sign-in incomplete status=",
                        res.status
                    );
                    setTicketState("failed");
                }
            } catch (err) {
                console.error(
                    "[activation] ticket sign-in failed:",
                    err?.errors?.[0]?.message || err?.message || "unknown error"
                );
                setTicketState("failed");
            }
        };

        runTicketSignIn();
    }, [isLoaded, signInLoaded, user, ticket, signIn, setActive]);

    // ── Gate ──────────────────────────────────────────────────────────────────
    // Redirect to /sign-in ONLY when there is neither an active session NOR a
    // ticket to consume. With a ticket present we let the auto sign-in run.
    useEffect(() => {
        if (!isLoaded) return;
        if (user) return;
        if (ticket) return; // ticket path handles auth; don't bounce away
        router.replace("/sign-in");
    }, [isLoaded, user, ticket, router]);

    // Log the authenticated userId once available (never the password).
    useEffect(() => {
        if (user) {
            console.log("[activation] authenticated userId=", user.id);
        }
    }, [user]);

    const copyToClipboard = async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            // fallback — silently ignore
        }
    };

    const email = user?.primaryEmailAddress?.emailAddress || "";

    // Loading: still booting Clerk, OR a ticket sign-in is in flight, OR we have
    // a ticket but the session hasn't materialised yet.
    const ticketPending = !!ticket && !user && ticketState !== "failed";
    if (!isLoaded || ticketState === "signing-in" || (!user && ticketPending)) {
        return (
            <div className="min-h-screen bg-[#0f0f10] flex flex-col items-center justify-center gap-4">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {ticket && (
                    <p className="text-gray-500 text-sm">Activating your account…</p>
                )}
            </div>
        );
    }

    // Ticket sign-in failed and there is no session → let the user sign in
    // manually, but still show their credentials so they can copy them.
    if (!user && ticketState === "failed") {
        return (
            <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Welcome to TedOS
                    </h1>
                    <p className="text-gray-500 text-sm mb-6">
                        We couldn’t sign you in automatically. Use the password below to
                        sign in.
                    </p>
                    <div className="bg-[#111113] border border-[#2a2a2d] rounded-2xl px-5 py-4 mb-6 text-left">
                        <p className="text-[11px] uppercase tracking-wider text-gray-600 mb-0.5">
                            Temporary Password
                        </p>
                        <p className="text-sm font-mono font-medium text-white">
                            {DEFAULT_PASSWORD}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/sign-in")}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Go to Sign In
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // No user yet (gate effect is redirecting to /sign-in) → minimal spinner.
    if (!user) {
        return (
            <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">

                {/* Success badge */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Account activated</span>
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        Welcome to TedOS
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Your account is ready. Here are your login credentials — save them now.
                    </p>
                </div>

                {/* Credentials card */}
                <div className="bg-[#111113] border border-[#2a2a2d] rounded-2xl overflow-hidden mb-4">

                    {/* Email row */}
                    <div className="px-5 py-4 border-b border-[#1f1f22]">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-600 mb-0.5">Email</p>
                                    <p className="text-sm font-medium text-white truncate">{email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(email, "email")}
                                className="flex-shrink-0 p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                                title="Copy email"
                            >
                                {copiedField === "email"
                                    ? <Check className="w-4 h-4 text-green-400" />
                                    : <Copy className="w-4 h-4" />
                                }
                            </button>
                        </div>
                    </div>

                    {/* Password row */}
                    <div className="px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                    <KeyRound className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-600 mb-0.5">Temporary Password</p>
                                    <p className="text-sm font-mono font-medium text-white">{DEFAULT_PASSWORD}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(DEFAULT_PASSWORD, "password")}
                                className="flex-shrink-0 p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                                title="Copy password"
                            >
                                {copiedField === "password"
                                    ? <Check className="w-4 h-4 text-green-400" />
                                    : <Copy className="w-4 h-4" />
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* Warning note */}
                <p className="text-center text-xs text-gray-600 mb-6">
                    Change your password in account settings after signing in.
                </p>

                {/* CTA */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                </button>

            </div>
        </div>
    );
}
