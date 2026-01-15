// app/auth/signup/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Lock, ArrowRight, ArrowLeft, Loader2,
  Building2, MapPin, Phone, Globe, Eye, EyeOff, Clock
} from "lucide-react";
import PasswordStrength from "@/components/PasswordStrength";

// Common timezones - simplified list
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST)' },
];

// Country codes for phone
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'IN' },
  { code: '+61', country: 'AU' },
  { code: '+971', country: 'UAE' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' },
  { code: '+86', country: 'CN' },
  { code: '+65', country: 'SG' },
  { code: '+64', country: 'NZ' },
  { code: '+27', country: 'ZA' },
  { code: '+55', country: 'BR' },
  { code: '+52', country: 'MX' },
];

export default function Signup() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Identity
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+1",
    phone: "",
    // Step 2: Business
    businessName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    timezone: "America/New_York",
    // Step 3: Security
    password: ""
  });

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validate current step before proceeding
  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.firstName.trim()) {
          toast.error("First name is required");
          return false;
        }
        if (!formData.lastName.trim()) {
          toast.error("Last name is required");
          return false;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
          toast.error("Valid email is required");
          return false;
        }
        if (!formData.countryCode) {
          toast.error("Country code is required");
          return false;
        }
        return true;
      case 2:
        if (!formData.address.trim()) {
          toast.error("Address is required");
          return false;
        }
        return true;
      case 3:
        if (formData.password.length < 8) {
          toast.error("Password must be at least 8 characters");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    if (step < 3) {
      setStep(step + 1);
    } else {
      await handleSignup();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSignup = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      // Create the user in Clerk with unsafe_metadata for extra fields
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        unsafeMetadata: {
          businessName: formData.businessName,
          phone: formData.phone,
          countryCode: formData.countryCode,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          timezone: formData.timezone
        }
      });

      console.log("Signup result status:", result.status);
      console.log("Created session ID:", result.createdSessionId);

      // With email verification disabled, Clerk should create a session immediately
      // Activate the session and redirect
      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else if (result.status === "complete") {
        // Fallback: if status is complete but no session yet, try to activate
        await setActive({ session: result.createdSessionId });
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        // This shouldn't happen with verification disabled
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

  const stepTitles = {
    1: "Tell us about yourself",
    2: "Your business details",
    3: "Secure your account"
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0e0e0f] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-lg w-full relative z-10">
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
          <p className="text-gray-400">Step {step} of 3 — {stepTitles[step]}</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-cyan' : 'bg-gray-700'
                }`}
            />
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-[#1b1b1d] p-8 rounded-2xl border border-[#2a2a2d] shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleNext}>
            <AnimatePresence mode="wait" initial={false}>
              {/* Step 1: Identity */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* First & Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">First Name *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => updateField('firstName', e.target.value)}
                          className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                          placeholder="John"
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl px-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone with Country Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => updateField('countryCode', e.target.value)}
                        className="w-28 bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl px-3 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                      >
                        {COUNTRY_CODES.map(cc => (
                          <option key={cc.code} value={cc.code}>
                            {cc.code} {cc.country}
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                          placeholder="5551234567"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Business */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Business Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => updateField('businessName', e.target.value)}
                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                        placeholder="Acme Corp"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Street Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                        placeholder="123 Main St"
                        required
                      />
                    </div>
                  </div>

                  {/* City, State, Postal */}
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl px-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl px-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => updateField('postalCode', e.target.value)}
                      className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl px-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                      placeholder="ZIP"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan focus:outline-none transition-all"
                        placeholder="United States"
                      />
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Timezone</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <select
                        value={formData.timezone}
                        onChange={(e) => updateField('timezone', e.target.value)}
                        className="w-full bg-[#0e0e0f] border border-[#2a2a2d] rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan focus:outline-none transition-all appearance-none"
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Password */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Create a Password *</label>
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
                        autoFocus
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl font-semibold text-gray-400 hover:text-white hover:bg-[#2a2a2d] transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-cyan hover:brightness-110 disabled:opacity-50 py-3 rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-xl transition-all flex items-center justify-center gap-2 text-black"
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
