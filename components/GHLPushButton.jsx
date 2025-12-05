// components/GHLPushButton.jsx
"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

export default function GHLPushButton({ data }) {
  const [pushing, setPushing] = useState(false);

  const handlePush = async () => {
    setPushing(true);
    try {
      const res = await fetch('/api/ghl/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('Push failed');

      const result = await res.json();
      toast.success("Successfully pushed to GoHighLevel!");
    } catch (err) {
      toast.error("Failed to push to GHL. Check your API keys.");
    } finally {
      setPushing(false);
    }
  };

  return (
    <button
      onClick={handlePush}
      disabled={pushing}
      className="flex items-center gap-2 bg-accentRed hover:bg-red-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-all"
    >
      <Send size={20} />
      {pushing ? "Pushing..." : "Push to GoHighLevel"}
    </button>
  );
}
