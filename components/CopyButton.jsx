// components/CopyButton.jsx
"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={18} className="text-green-400" />
      ) : (
        <Copy size={18} className="text-gray-300" />
      )}
    </button>
  );
}
