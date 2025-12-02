// components/ExportButton.jsx
"use client";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function ExportButton({ data, filename = "marketing-content" }) {
  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Exported successfully!");
    } catch (err) {
      toast.error("Failed to export");
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-all"
    >
      <Download size={20} />
      Export JSON
    </button>
  );
}
