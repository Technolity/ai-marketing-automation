"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyEmail() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        // Supabase handles the hash fragment automatically when the user lands here
        // We just need to check if we have a session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setVerified(true);
            }
        };

        checkSession();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-[#0e0e0f] relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-green-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-[#1b1b1d] p-8 rounded-2xl border border-[#2a2a2d] shadow-2xl text-center relative z-10"
            >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">Email Verified!</h1>
                <p className="text-gray-400 mb-8">
                    Your email has been successfully verified. You can now access your account.
                </p>

                <button
                    onClick={() => router.push("/auth/login")}
                    className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:brightness-110 py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 text-white"
                >
                    Login and Start Now <ArrowRight className="w-5 h-5" />
                </button>
            </motion.div>
        </div>
    );
}
