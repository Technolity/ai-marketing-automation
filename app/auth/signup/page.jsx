// app/auth/signup/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import PasswordStrength from "@/components/PasswordStrength";

export default function Signup() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/onboarding");
    }
  }, [isSignedIn, router]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    // Basic validation
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error("Valid email is required");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // Create the user in Clerk with minimal data
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password
      });

      console.log("Signup result status:", result.status);
      console.log("Created session ID:", result.createdSessionId);

      // With email verification disabled, Clerk should create a session immediately
      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        toast.success("Account created successfully!");
        // Redirect to onboarding instead of dashboard
        router.push("/onboarding");
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Account created successfully!");
        router.push("/onboarding");
      } else {
        console.error("Unexpected signup state:", result);
        toast.error("Signup incomplete. Please contact support.");
      }

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

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e0f]">
        <Loader2 className="w-10 h-10 text-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0e0e0f] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/tedos-logo.png"
              alt="TedOS"
              className="h-14 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-cyan text-glow mb-2">Initialize TedOS</h1>
          <p className="text-gray-400">Create your account to get started</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1b1b1d] p-8 rounded-2xl border border-[#2a2a2d] shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                  placeholder="john@example.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-12 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrength password={formData.password} />
              <p className="text-xs text-gray-500 mt-2">Minimum 8 characters</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan hover:brightness-110 disabled:opacity-50 py-3 rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-xl transition-all flex items-center justify-center gap-2 text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
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
