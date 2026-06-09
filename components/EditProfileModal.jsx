"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { User, Building2, Loader2, X, FileCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * EditProfileModal
 * Lets the user update first/last name + legal business name.
 * Pre-fills from GET /api/user/profile, saves via the canonical
 * POST /api/profile/save (which syncs both Supabase + Clerk), then
 * calls refreshProfile() and dispatches a `profile:updated` event so
 * other UI (e.g. the business-name gate) can re-check without reload.
 */
export default function EditProfileModal({ open, onClose }) {
  const { refreshProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [businessNameSkipped, setBusinessNameSkipped] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", businessName: "" });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load current profile each time the modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (cancelled) return;
        setForm({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          businessName: data.business_name || ""
        });
        setBusinessNameSkipped(!data.business_name);
      } catch (err) {
        if (!cancelled) {
          console.error("[EditProfileModal] Load error:", err);
          toast.error("Could not load your profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [open]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    if (!businessNameSkipped && !form.businessName.trim()) {
      toast.error("Please enter your legal business name, or check the box if you don't have one yet.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        businessName: businessNameSkipped ? null : form.businessName.trim()
      };

      const res = await fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save profile");

      await refreshProfile();
      // Notify other UI (e.g. Phase 3 business-name gate) to re-check without reload
      window.dispatchEvent(new CustomEvent("profile:updated"));

      toast.success("Profile updated");
      onClose?.();
    } catch (err) {
      console.error("[EditProfileModal] Save error:", err);
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="ep-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={saving ? undefined : onClose}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="ep-panel"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-auto w-full max-w-md rounded-2xl border border-[#2a2a2d] bg-[#1b1b1d] p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Edit profile"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/[0.07] bg-[#111213] text-[#8b8b93] transition-colors hover:text-white disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-cyan" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">First Name *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          value={form.firstName}
                          onChange={(e) => updateField("firstName", e.target.value)}
                          className="w-full rounded-xl border border-[#2a2a2d] bg-[#0e0e0f] py-3 pl-12 pr-4 text-white transition-all focus:border-cyan focus:outline-none"
                          placeholder="John"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">Last Name *</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                        className="w-full rounded-xl border border-[#2a2a2d] bg-[#0e0e0f] px-4 py-3 text-white transition-all focus:border-cyan focus:outline-none"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">
                      Legal Business Name {!businessNameSkipped && "*"}
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        value={businessNameSkipped ? "" : form.businessName}
                        onChange={(e) => updateField("businessName", e.target.value)}
                        className="w-full rounded-xl border border-[#2a2a2d] bg-[#0e0e0f] py-3 pl-12 pr-4 text-white transition-all focus:border-cyan focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Acme Corp"
                        required={!businessNameSkipped}
                        disabled={businessNameSkipped}
                      />
                    </div>
                    <label className="mt-2 flex cursor-pointer select-none items-center gap-2 text-xs text-gray-400">
                      <input
                        type="checkbox"
                        checked={businessNameSkipped}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBusinessNameSkipped(checked);
                          if (checked) updateField("businessName", "");
                        }}
                        className="h-4 w-4 rounded border-[#2a2a2d] bg-[#0e0e0f] accent-cyan focus:ring-cyan"
                      />
                      I don&apos;t have a registered business name yet
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="flex-1 rounded-xl border border-[#2a2a2d] bg-[#0e0e0f] py-3 font-medium text-gray-300 transition-colors hover:text-white disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan py-3 font-bold text-black shadow-glow-lg transition-all hover:brightness-110 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-5 w-5" /> Save
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
