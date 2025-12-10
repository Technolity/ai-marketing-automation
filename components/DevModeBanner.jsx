"use client";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function DevModeBanner() {
  const { user } = useAuth();

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
        <p className="text-sm text-yellow-400">
          <span className="font-semibold">DEV MODE:</span> Authentication disabled - Current user: {user?.email || '11111111-1111-1111-1111-111111111111@test.com'}
        </p>
      </div>
    </div>
  );
}
