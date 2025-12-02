// app/layout.jsx
import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "AI Marketing Automation | Build Funnels in Minutes",
  description: "AI-powered platform that generates complete marketing funnels, VSL scripts, and campaigns",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <a href="/" className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">AI</span>
              <span className="text-accentRed">Funnel</span>
            </a>
            <div className="flex gap-8 items-center">
              <a href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Dashboard
              </a>
              <a
                href="/auth/login"
                className="text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-full transition-all border border-white/5"
              >
                Login
              </a>
            </div>
          </div>
        </nav>

        <main className="pt-16">
          {children}
        </main>

        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
