// app/auth/login/page.jsx
"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          // Check if admin - redirect to appropriate dashboard
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

          if (profile?.is_admin) {
            // Admin trying to use user login - redirect to admin
            router.replace("/admin/overview");
          } else {
            // Regular user - redirect to user dashboard
            router.replace("/dashboard");
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        if (mounted) setChecking(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
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

      // Check if the user is an admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      if (profile?.is_admin) {
        // Admin trying to login through user portal - redirect to admin
        toast.info("You're an admin! Redirecting to admin panel...");
        window.location.href = "/admin/overview";
      } else {
        toast.success("Logged in successfully!");
        window.location.href = "/dashboard";
      }
    } catch (error) {
      toast.error(error.message || "Login failed");
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="w-10 h-10 border-4 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark/50 border border-gray-700 rounded-xl p-4 pr-12 focus:border-cyan focus:outline-none transition-all input-glow"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan hover:brightness-110 disabled:opacity-50 py-4 rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-xl transition-all text-black"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
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
