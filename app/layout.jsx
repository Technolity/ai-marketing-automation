// app/layout.jsx
import "./globals.css";
import { Toaster } from "sonner";
import AppNavbar from "@/components/AppNavbar";

export const metadata = {
  title: "AI Marketing Automation | Build Funnels in Minutes",
  description: "AI-powered platform that generates complete marketing funnels, VSL scripts, and campaigns",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppNavbar />

        <main className="pt-16">
          {children}
        </main>

        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
