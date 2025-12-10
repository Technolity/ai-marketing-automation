// app/auth/signup/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function Signup() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  const handleNext = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      await handleSignup();
    }
  };

  const handleSignup = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      // Create the user in Clerk
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.fullName.split(' ')[0],
        lastName: formData.fullName.split(' ').slice(1).join(' ') || undefined,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
      toast.success("Verification code sent to your email!");

    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error.errors?.[0]?.longMessage || error.message || "Signup failed";

      if (errorMessage.includes("already exists") || errorMessage.includes("already taken")) {
        toast.error("Account already exists. Please log in.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        console.log("Verification result:", result);
        toast.error("Verification incomplete");
      }
    } catch (error) {
      console.error("Verification error:", error);
      const errorMessage = error.errors?.[0]?.longMessage || "Invalid verification code";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e0f]">
        <Loader2 className="w-10 h-10 text-cyan animate-spin" />
      </div>
    );
  }

  // Email verification step
  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#0e0e0f] relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-md w-full relative z-10">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-cyan rounded-xl mx-auto flex items-center justify-center mb-4 shadow-glow-lg">
              <Mail className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-cyan text-glow mb-2">Verify Your Email</h1>
            <p className="text-gray-400">Enter the code we sent to {formData.email}</p>
          </div>

          <div className="bg-[#1b1b1d] p-8 rounded-2xl border border-[#2a2a2d] shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleVerification}>
              <div className="space-y-4">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl px-4 py-4 text-white text-center text-2xl tracking-widest focus:border-cyan focus:outline-none transition-all"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length < 6}
                className="w-full mt-6 bg-cyan hover:brightness-110 disabled:opacity-50 py-4 rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-xl transition-all flex items-center justify-center gap-2 text-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main signup form
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
                      minLength={8}
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500">Minimum 8 characters</p>
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
