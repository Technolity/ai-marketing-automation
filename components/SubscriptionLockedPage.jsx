"use client";
import { motion } from "framer-motion";
import { LockKeyhole, Calendar, ArrowRight, Mail } from "lucide-react";

/**
 * SubscriptionLockedPage
 *
 * Full-screen page shown when a user's subscription has expired,
 * been cancelled, or been suspended due to non-payment.
 */
export default function SubscriptionLockedPage({ status, periodEnd, cancelledAt }) {
    const paymentUrl = 'https://app.tedos.ai/settings/billings';
    const isCancelled = status === 'cancelled';
    const isSuspended = status === 'suspended';

    const title = isCancelled
        ? 'Subscription Cancelled'
        : isSuspended
            ? 'Subscription Suspended'
            : 'Subscription Expired';

    const description = isCancelled
        ? 'Your TedOS subscription has been cancelled. Manage your subscription to regain access.'
        : isSuspended
            ? 'Your subscription payment is overdue. Please manage your billing to restore access.'
            : 'Your billing period has ended. Manage your billing to continue using TedOS.';

    const dateLabel = isCancelled && cancelledAt
        ? `Cancelled on ${new Date(cancelledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
        : periodEnd
            ? `Period ended ${new Date(periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
            : null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0a0a0b] flex items-center justify-center overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-red-500/5 via-transparent to-transparent animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-purple-500/5 via-transparent to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative text-center px-6 max-w-lg"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto mb-8 w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500/20 to-purple-500/20 border border-red-500/20 flex items-center justify-center"
                >
                    <LockKeyhole className="w-12 h-12 text-red-400" />
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
                >
                    {title}
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-gray-400 text-lg mb-6 leading-relaxed"
                >
                    {description}
                </motion.p>

                {/* Date indicator */}
                {dateLabel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1b1b1d] border border-[#2a2a2d] mb-8"
                    >
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-400">{dateLabel}</span>
                    </motion.div>
                )}

                {/* CTA buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center mb-10"
                >
                    <a
                        href={paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan to-cyan/80 text-black font-semibold hover:opacity-90 transition-opacity"
                    >
                        Manage Billing
                        <ArrowRight className="w-4 h-4" />
                    </a>
                    <a
                        href="mailto:waris@scalezmedia.com"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1b1b1d] border border-[#2a2a2d] text-gray-300 font-medium hover:border-gray-500 transition-colors"
                    >
                        <Mail className="w-4 h-4" />
                        Contact Support
                    </a>
                </motion.div>

                {/* Admin link */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="text-sm text-gray-600"
                >
                    Are you an administrator?{' '}
                    <a href="/admin" className="text-cyan hover:underline inline-flex items-center gap-1">
                        Go to admin portal
                        <ArrowRight className="w-3 h-3" />
                    </a>
                </motion.p>
            </motion.div>
        </div>
    );
}
