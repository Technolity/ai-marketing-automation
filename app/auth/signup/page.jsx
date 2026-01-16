// app/auth/signup/page.jsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Signup is disabled - redirect all users to login
 */
export default function Signup() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page - signup is disabled
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-cyan animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Redirecting to login...</p>
      </div>
    </div>
  );
}
