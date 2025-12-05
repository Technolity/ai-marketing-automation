"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Intake() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e0f]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
        <p className="text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
