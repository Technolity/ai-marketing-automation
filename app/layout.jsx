// app/layout.jsx
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/contexts/AuthContext";
import LicenseWrapper from "@/components/LicenseWrapper";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Space_Grotesk, Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import ConditionalAppShell from "@/components/ConditionalAppShell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
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
      <html lang="en" className={cn("dark", "bg-dark", "font-poppins", spaceGrotesk.variable, poppins.variable)}>
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
