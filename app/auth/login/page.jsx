// app/auth/login/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      console.log("Sign in result:", JSON.stringify(result, null, 2));

      if (result.status === "complete") {
        // Set the session as active
        await setActive({ session: result.createdSessionId });

        toast.success("Logged in successfully!");
        router.push("/dashboard");
      } else if (result.status === "needs_first_factor") {
        // This shouldn't happen with password auth, but handle it
        console.log("needs_first_factor - supportedFirstFactors:", result.supportedFirstFactors);
        toast.error("Please enter your password.");
      } else if (result.status === "needs_second_factor") {
        // Log details to understand why 2FA is required
        console.log("needs_second_factor - supportedSecondFactors:", result.supportedSecondFactors);
        toast.error("Two-factor authentication required. Check Clerk dashboard to disable 2FA for this user.");
      } else if (result.status === "needs_new_password") {
        toast.error("Password reset required.");
      } else {
        console.log("Sign in status:", result.status, result);
        toast.error(`Login status: ${result.status}. Check console for details.`);
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorCode = error.errors?.[0]?.code;
      const errorMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || error.message || "Login failed";

      if (errorCode === "form_password_incorrect") {
        toast.error("Incorrect password.");
      } else if (errorCode === "form_identifier_not_found") {
        toast.error("No account with this email.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <Loader2 className="w-10 h-10 text-cyan animate-spin" />
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
                <Loader2 className="w-5 h-5 animate-spin" />
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
