// app/auth/login/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email verification state (for 2FA)
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

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

      console.log("Sign in result:", result.status);

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Logged in successfully!");
        router.push("/dashboard");
      } else if (result.status === "needs_second_factor") {
        // Email verification required - send code automatically
        console.log("Sending email verification code...");
        setSendingCode(true);

        try {
          await signIn.prepareSecondFactor({
            strategy: "email_code"
          });
          setNeedsEmailVerification(true);
          toast.success("Verification code sent to your email!");
        } catch (err) {
          console.error("Error sending code:", err);
          toast.error("Failed to send verification code: " + (err.errors?.[0]?.message || err.message));
        } finally {
          setSendingCode(false);
        }
      } else if (result.status === "needs_first_factor") {
        toast.error("Please enter your password.");
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
      } else if (errorCode === "form_identifier_exists" || errorMessage.includes("verification") || errorMessage.includes("verified")) {
        toast.error("This account needs verification. Please signup again or contact support.");
      } else if (error.status === 422) {
        toast.error("Account verification issue. Please signup again with a new account.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: verificationCode
      });

      console.log("Verification result:", result.status);

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Logged in successfully!");
        router.push("/dashboard");
      } else {
        console.log("Verification status:", result.status);
        toast.error("Verification incomplete. Please try again.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      const errorMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Invalid verification code";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!isLoaded) return;
    setSendingCode(true);

    try {
      await signIn.prepareSecondFactor({
        strategy: "email_code"
      });
      toast.success("Verification code resent!");
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Failed to resend code");
    } finally {
      setSendingCode(false);
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

  // Email verification step
  if (needsEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-dark relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan/20 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-md w-full glass-card p-8 rounded-2xl relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-cyan/20 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-cyan" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2 text-center text-cyan text-glow">Verify Your Email</h1>
          <p className="text-center text-gray-400 mb-8">
            We sent a verification code to<br />
            <span className="text-white font-medium">{email}</span>
          </p>

          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-dark/50 border border-gray-700 rounded-xl p-4 text-center text-2xl tracking-widest focus:border-cyan focus:outline-none transition-all"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length < 6}
              className="w-full bg-cyan hover:brightness-110 disabled:opacity-50 py-4 rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-xl transition-all text-black"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify & Login"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={resendCode}
              disabled={sendingCode}
              className="text-cyan hover:underline disabled:opacity-50"
            >
              {sendingCode ? "Sending..." : "Resend code"}
            </button>
          </div>

          <button
            onClick={() => {
              setNeedsEmailVerification(false);
              setVerificationCode("");
            }}
            className="mt-4 w-full text-gray-400 hover:text-white transition-colors"
          >
            ← Back to login
          </button>
        </div>
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

          {/* Forgot Password Link */}
          <div className="text-right">
            <a
              href="/auth/forgot-password"
              className="text-sm text-cyan hover:underline"
            >
              Forgot password?
            </a>
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
      </div>
    </div>
  );
}
