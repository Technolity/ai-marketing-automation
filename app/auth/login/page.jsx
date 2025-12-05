// app/auth/login/page.jsx
"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Login() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);

  // Check if user should stay logged in
  useEffect(() => {
    const checkSession = async () => {
      const shouldStayLoggedIn = localStorage.getItem("stayLoggedIn") === "true";

      if (!shouldStayLoggedIn) {
        // Clear any existing session if user didn't opt to stay logged in
        await supabase.auth.signOut();
      } else {
        // Check if already logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push("/dashboard");
        }
      }
    };
    checkSession();
  }, [supabase, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Save the stay logged in preference
      if (stayLoggedIn) {
        localStorage.setItem("stayLoggedIn", "true");
      } else {
        localStorage.removeItem("stayLoggedIn");
      }

      toast.success("Logged in successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-dark relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-md w-full glass-card p-8 rounded-2xl relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-center text-cyan text-glow">Login to TedOS</h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark/50 border border-gray-700 rounded-xl p-4 focus:border-cyan focus:outline-none transition-all input-glow"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark/50 border border-gray-700 rounded-xl p-4 focus:border-cyan focus:outline-none transition-all input-glow"
              required
            />
          </div>

          {/* Stay Logged In Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="stayLoggedIn"
              checked={stayLoggedIn}
              onChange={(e) => setStayLoggedIn(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-dark/50 text-cyan focus:ring-cyan focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="stayLoggedIn" className="text-gray-300 text-sm cursor-pointer select-none">
              Stay logged in
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan hover:brightness-110 disabled:opacity-50 py-4 rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-xl transition-all text-black"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Don't have an account?{" "}
          <a href="/auth/signup" className="text-cyan hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
