// app/auth/signup/page.jsx
"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function Signup() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  const handleNext = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      await handleSignup();
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });

      if (error) throw error;

      toast.success("Account created! Please check your email to verify.");
      router.push("/auth/login");
    } catch (error) {
      if (error.message.includes("already registered") || error.message.includes("User already exists")) {
        toast.error("Account already exists. Please log in.");
      } else {
        toast.error(error.message || "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0e0e0f] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-cyan rounded-xl mx-auto flex items-center justify-center mb-4 shadow-glow-lg">
            <span className="font-bold text-black text-xl">T</span>
          </div>
          <h1 className="text-3xl font-bold text-cyan text-glow mb-2">Initialize TedOS</h1>
          <p className="text-gray-400">Step {step} of 3</p>
        </div>

        <div className="bg-[#1b1b1d] p-8 rounded-2xl border border-[#2a2a2d] shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleNext}>
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <label className="block text-sm font-medium text-gray-300">What's your name?</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-4 text-white focus:border-cyan focus:outline-none transition-all"
                      placeholder="John Doe"
                      required
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <label className="block text-sm font-medium text-gray-300">What's your email?</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-4 text-white focus:border-cyan focus:outline-none transition-all"
                      placeholder="john@example.com"
                      required
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <label className="block text-sm font-medium text-gray-300">Create a password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-4 text-white focus:border-cyan focus:outline-none transition-all"
                      placeholder="••••••••"
                      minLength={6}
                      required
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-4 rounded-xl font-semibold text-gray-400 hover:text-white hover:bg-[#2a2a2d] transition-all"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-cyan hover:brightness-110 disabled:opacity-50 py-4 rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-xl transition-all flex items-center justify-center gap-2 text-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
                  </>
                ) : (
                  <>
                    {step === 3 ? "Create Account" : "Continue"} <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <a href="/auth/login" className="text-cyan hover:text-cyan font-medium transition-colors">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
