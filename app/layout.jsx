// app/layout.jsx
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/contexts/AuthContext";
import LicenseWrapper from "@/components/LicenseWrapper";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import ConditionalAppShell from "@/components/ConditionalAppShell";

const spaceGrotesk = localFont({
  src: [
    { path: "./fonts/space-grotesk/space-grotesk-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/space-grotesk/space-grotesk-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/space-grotesk/space-grotesk-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/space-grotesk/space-grotesk-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/space-grotesk/space-grotesk-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["Segoe UI", "Helvetica Neue", "Arial", "system-ui", "sans-serif"],
});

const poppins = localFont({
  src: [
    { path: "./fonts/poppins/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/poppins/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
  fallback: ["Segoe UI", "Helvetica Neue", "Arial", "system-ui", "sans-serif"],
});

export const metadata = {
  title: "TedOS | Your Business Built For You",
  description: "God-tier AI system that builds your entire business in 12 minutes. VSL scripts, email sequences, ad campaigns, and complete funnels—deployed instantly.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      signInUrl="/auth/login"
      signUpUrl="/auth/signup"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="en"
        className={cn("dark", "bg-dark", "font-poppins", spaceGrotesk.variable, poppins.variable)}
      >
        <body className="bg-dark text-white font-poppins">
          <AuthProvider>
            <LicenseWrapper>
              <MaintenanceGuard>
                <SubscriptionGuard>
                  <ConditionalAppShell>
                    {children}
                  </ConditionalAppShell>
                </SubscriptionGuard>
              </MaintenanceGuard>
            </LicenseWrapper>
            <Toaster position="bottom-right" theme="dark" />
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
