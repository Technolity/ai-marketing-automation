"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User, Building2, MapPin, Phone, Globe, Clock, Loader2, FileCheck
} from "lucide-react";
import LicenseAgreementModal from "@/components/LicenseAgreementModal";

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

export default function Onboarding() {
  const router = useRouter();
  const { session, loading: authLoading, refreshProfile } = useAuth();
  const { user } = useUser();

  const isSignedIn = !!session;
  const isLoaded = !authLoading;

  const [licenseAccepted, setLicenseAccepted] = useState(false);
  const [checkingLicense, setCheckingLicense] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    businessName: "",
    phone: "",
    countryCode: "+1",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    timezone: "America/New_York"
  });

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/auth/login");
    }
  }, [isSignedIn, isLoaded, router]);

  // Check if user has already accepted the license
  useEffect(() => {
    if (isSignedIn) {
      checkLicenseStatus();
    }
  }, [isSignedIn]);

  // Populate names from Clerk user if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || ""
      }));
    }
  }, [user]);

  const checkLicenseStatus = async () => {
    try {
      const response = await fetch("/api/users/accept-license");
      const data = await response.json();

      if (data.licenseAccepted) {
        setLicenseAccepted(true);
      }
    } catch (error) {
      console.error("Error checking license status:", error);
    } finally {
      setCheckingLicense(false);
    }
  };

  const handleAcceptLicense = async () => {
    try {
      const response = await fetch("/api/users/accept-license", {
        method: "POST"
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to accept license");
      }

      console.log("License accepted successfully:", result);
      setLicenseAccepted(true);
      toast.success("License agreement accepted!");

    } catch (error) {
      console.error("Error accepting license:", error);
      toast.error(error.message || "Failed to accept license");
      throw error; // Re-throw so modal can handle loading state
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the API to save profile and trigger Pabbly
      const response = await fetch("/api/profile/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save profile");
      }

      await refreshProfile();
      toast.success("Profile saved successfully!");
      router.push("/dashboard");

    } catch (error) {
      console.error("Profile save error:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth and license
  if (!isLoaded || checkingLicense) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e0f]">
        <Loader2 className="w-10 h-10 text-cyan animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* EULA Modal - only shows if license not accepted */}
      <LicenseAgreementModal
        isOpen={!licenseAccepted}
        onAccept={handleAcceptLicense}
      />

      {/* Profile Form - only shows after license accepted */}
      {licenseAccepted && (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0e0e0f] relative overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/10 rounded-full blur-[150px] pointer-events-none" />

          <div className="max-w-2xl w-full relative z-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-4">
                <img
                  src="/tedos-logo.png"
                  alt="TedOS"
                  className="h-14 w-auto object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-cyan text-glow mb-2">
                Complete Your Profile
              </h1>
              <p className="text-gray-400">
                Tell us about yourself and your business
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-[#1b1b1d] p-8 rounded-2xl border border-[#2a2a2d] shadow-2xl backdrop-blur-xl">
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Name Fields */}
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
                    />
                  </div>
                </div>

                {/* Phone */}
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

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan hover:brightness-110 disabled:opacity-50 py-3 rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-xl transition-all flex items-center justify-center gap-2 text-black"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Saving Profile...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-5 h-5" /> Save My Profile
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
