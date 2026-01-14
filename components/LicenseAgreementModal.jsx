"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle, Loader2, ScrollText } from 'lucide-react';

/**
 * LicenseAgreementModal
 * 
 * A full-screen mandatory modal that displays the TedOS EULA.
 * Users must scroll through and check the agreement checkbox before proceeding.
 */
export default function LicenseAgreementModal({ isOpen, onAccept }) {
    const [isChecked, setIsChecked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const scrollContainerRef = useRef(null);

    // Track if user has scrolled to the bottom
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
            if (isAtBottom) {
                setHasScrolledToBottom(true);
            }
        }
    };

    const handleAccept = async () => {
        if (!isChecked || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/users/accept-license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                onAccept?.();
            } else {
                console.error('Failed to accept license');
            }
        } catch (error) {
            console.error('Error accepting license:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-4xl max-h-[90vh] mx-4 bg-[#0e0e0f] border border-[#2a2a2d] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[#2a2a2d] bg-gradient-to-r from-cyan/10 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-cyan/20 rounded-xl flex items-center justify-center">
                                <ScrollText className="w-6 h-6 text-cyan" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">TedOS™ End User License Agreement</h2>
                                <p className="text-gray-400 text-sm mt-1">Please read and accept the terms to continue</p>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable License Content */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-6 text-gray-300 text-sm leading-relaxed space-y-6"
                        style={{ maxHeight: 'calc(90vh - 280px)' }}
                    >
                        <LicenseContent />
                    </div>

                    {/* Scroll indicator */}
                    {!hasScrolledToBottom && (
                        <div className="px-6 py-2 bg-gradient-to-t from-[#0e0e0f] to-transparent text-center">
                            <p className="text-gray-500 text-xs animate-pulse">↓ Scroll down to read the full agreement</p>
                        </div>
                    )}

                    {/* Footer with Checkbox and Accept Button */}
                    <div className="p-6 border-t border-[#2a2a2d] bg-[#0a0a0b] space-y-4">
                        <label className={`flex items-start gap-3 ${hasScrolledToBottom ? 'cursor-pointer group' : 'cursor-not-allowed opacity-50'}`}>
                            <div className="relative mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => hasScrolledToBottom && setIsChecked(e.target.checked)}
                                    disabled={!hasScrolledToBottom}
                                    className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${!hasScrolledToBottom
                                        ? 'border-gray-700 bg-gray-800/50'
                                        : isChecked
                                            ? 'bg-cyan border-cyan'
                                            : 'border-gray-600 group-hover:border-gray-500'
                                    }`}>
                                    {isChecked && <CheckCircle className="w-4 h-4 text-black" />}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className={`${hasScrolledToBottom ? 'text-gray-300 group-hover:text-white' : 'text-gray-500'} transition-colors`}>
                                    I have read the Licensing Policy and Agree with it
                                </span>
                                {!hasScrolledToBottom && (
                                    <span className="text-xs text-amber-500 mt-1">
                                        ⚠️ Please scroll to the bottom to read the full agreement
                                    </span>
                                )}
                            </div>
                        </label>

                        <button
                            onClick={handleAccept}
                            disabled={!isChecked || isSubmitting}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${isChecked && !isSubmitting
                                ? 'bg-gradient-to-r from-cyan to-cyan/80 text-black hover:shadow-glow-lg cursor-pointer'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    I Accept - Continue to TedOS
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * The full license content component
 */
function LicenseContent() {
    return (
        <>
            <p className="text-gray-400 italic">
                This End User License Agreement ("EULA") governs access to and use of the TedOS™ software platform and related services (the "Platform"). This EULA is entered into by and between Transformation Network LLC, doing business as Ted McGrath Brands (or its applicable operating entity) ("Company," "we," or "us") and the individual accessing or using the Platform on behalf of a business or commercial entity ("User," "you").
            </p>

            <Section title="1. Acceptance of This EULA">
                <p>By scrolling through and clicking "I Accept," and by accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by this EULA. Acceptance of this EULA is a condition precedent to accessing login credentials or using the Platform.</p>
                <p className="mt-2 font-medium text-white">If you do not agree to this EULA, you may not access or use the Platform.</p>
            </Section>

            <Section title="2. Relationship to Subscription Agreement">
                <p>This EULA governs how the Platform may be accessed and used.</p>
                <p className="mt-2">All commercial, financial, and contractual terms, including subscription fees, billing, refunds, termination, limitation of liability, governing law, venue, and dispute resolution, are governed exclusively by the applicable TedOS™ Software Subscription Agreement entered into between the Company and the Customer (the "Subscription Agreement").</p>
                <p className="mt-2">In the event of any conflict between this EULA and the Subscription Agreement, the Subscription Agreement shall control.</p>
            </Section>

            <Section title="3. License Grant (Operational Scope)">
                <p>Subject to compliance with this EULA and the Subscription Agreement, the Company grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform solely for internal business purposes on behalf of the Customer.</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                    <li>This license grants access only, not ownership. All rights not expressly granted are reserved by the Company.</li>
                    <li>The license may be suspended, limited, or revoked as described in this EULA.</li>
                </ul>
            </Section>

            <Section title="4. Account Access, Credentials, and Security">
                <p>You are responsible for:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                    <li>Maintaining the confidentiality of login credentials</li>
                    <li>All activity that occurs under your account</li>
                    <li>Ensuring that access is limited to authorized users within the Customer's organization</li>
                    <li>You may not share credentials with unauthorized users or third parties.</li>
                </ul>
                <p className="mt-2">The Company may suspend or restrict access if it reasonably believes that account security has been compromised or misuse is occurring.</p>
            </Section>

            <Section title="5. Acceptable Use Restrictions">
                <p>You may not, directly or indirectly:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                    <li>Use bots, scripts, crawlers, scrapers, or automated tools to access the Platform</li>
                    <li>Reverse engineer, decompile, disassemble, or attempt to derive source code or system architecture</li>
                    <li>Conduct load testing, stress testing, or performance testing without written authorization</li>
                    <li>Interfere with or disrupt the integrity or performance of the Platform</li>
                    <li>Circumvent access controls, rate limits, or technical safeguards</li>
                    <li>Use the Platform to build, support, or enhance a competing product or service</li>
                </ul>
                <p className="mt-2 font-medium text-yellow-400">Any such activity constitutes a material violation of this EULA.</p>
            </Section>

            <Section title="6. AI-Specific Use Restrictions">
                <p>The Platform may include artificial intelligence or machine-learning components. You may not:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                    <li>Train, fine-tune, or develop competing AI models using Platform outputs</li>
                    <li>Systematically extract, harvest, or compile AI responses or prompts</li>
                    <li>Represent AI outputs as professional, legal, medical, financial, or other regulated advice</li>
                    <li>Rely on AI outputs as a substitute for independent professional judgment</li>
                </ul>
                <p className="mt-2 italic text-gray-500">AI outputs are probabilistic in nature and may be inaccurate, incomplete, or inconsistent.</p>
            </Section>

            <Section title="7. Monitoring, Enforcement, and Technical Remedies">
                <p>The Company may monitor Platform usage for security, compliance, abuse prevention, and system optimization.</p>
                <p className="mt-2">If the Company reasonably determines that this EULA has been violated or that usage poses a risk to the Platform or other users, it may take technical action, including:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                    <li>Throttling usage</li>
                    <li>Limiting features</li>
                    <li>Suspending access</li>
                    <li>Locking accounts</li>
                </ul>
                <p className="mt-2">Such actions are technical remedies, not contractual termination, and may be taken without prior notice where appropriate.</p>
            </Section>

            <Section title="8. Modifications to the Platform">
                <p>The Company may modify, update, enhance, remove, or discontinue features, workflows, interfaces, or AI behavior at any time.</p>
                <p className="mt-2">The Company does not guarantee the continued availability of any specific feature or functionality.</p>
            </Section>

            <Section title="9. Intellectual Property Protection">
                <p>The Platform, including all software, models, algorithms, systems, interfaces, and underlying technology, is and remains the exclusive intellectual property of the Company.</p>
                <p className="mt-2">You may not copy, reproduce, distribute, create derivative works from, or otherwise exploit the Platform except as expressly permitted under this EULA and the Subscription Agreement.</p>
            </Section>

            <Section title="10. Software and AI Disclaimers">
                <p>The Platform is provided "as is" and "as available."</p>
                <p className="mt-2">The Company makes no warranties regarding uptime, accuracy, completeness, reliability, or fitness for a particular purpose.</p>
                <p className="mt-2 font-medium text-white">You acknowledge that decisions made using the Platform or its outputs are made at your own risk.</p>
            </Section>

            <Section title="11. Suspension vs. Termination">
                <p>Suspension of access under this EULA is a technical control mechanism and does not constitute termination of the Subscription Agreement.</p>
                <p className="mt-2">Termination rights and consequences are governed solely by the Subscription Agreement.</p>
                <p className="mt-2">Suspension does not relieve payment obligations already incurred.</p>
            </Section>

            <Section title="12. Updates to This EULA">
                <p>The Company may update this EULA from time to time. Updated versions will be posted within the Platform or otherwise made available prior to access.</p>
                <p className="mt-2">Continued use of the Platform after an update constitutes acceptance of the revised EULA.</p>
            </Section>

            <Section title="13. Contact Information">
                <p>Questions regarding this EULA may be directed to the Company through the support channels designated within the Platform or on the Company's website.</p>
            </Section>

            <Section title="14. Severability and Survival">
                <p>If any provision of this EULA is held unenforceable, the remaining provisions shall remain in full force and effect.</p>
                <p className="mt-2">Sections relating to intellectual property, disclaimers, enforcement, and limitations shall survive suspension or termination of access.</p>
            </Section>

            <div className="mt-8 p-4 bg-cyan/10 border border-cyan/30 rounded-lg">
                <p className="text-center text-cyan font-medium">End of License Agreement</p>
            </div>
        </>
    );
}

/**
 * Section component for consistent styling
 */
function Section({ title, children }) {
    return (
        <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <div className="text-gray-300">{children}</div>
        </div>
    );
}
