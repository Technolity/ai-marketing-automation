// app/layout.jsx
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import AppNavbar from "@/components/AppNavbar";
import MainLayout from "@/components/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";

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
      <html lang="en" className="bg-dark">
        <body className="bg-dark text-white">
          <AuthProvider>
            <AppNavbar />
            <MainLayout>
              {children}
            </MainLayout>
            <Toaster position="bottom-right" theme="dark" />
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
