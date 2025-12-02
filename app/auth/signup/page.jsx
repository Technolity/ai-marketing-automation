// app/auth/signup/page.jsx
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      toast.success("Account created! Check your email to verify.");
      router.push("/auth/login");
    } catch (error) {
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-dark">
      <div className="max-w-md w-full bg-grayDark p-8 rounded-xl border border-gray-800">
        <h1 className="text-3xl font-bold mb-6">Create Account</h1>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-accentRed focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-accentRed focus:outline-none"
              minLength={6}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accentRed hover:bg-red-700 disabled:bg-gray-600 py-3 rounded-lg font-semibold"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-400">
          Already have an account?{" "}
          <a href="/auth/login" className="text-accentRed hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
