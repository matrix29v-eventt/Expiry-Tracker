import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DarkModeInitializer from "@/components/DarkModeInitializer";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Expiry Tracker",
  description: "Never forget product expiry dates",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen font-sans antialiased`}>
        <DarkModeInitializer />

        <Toaster
          position="top-right"
          toastOptions={{
            className: 'dark:!bg-slate-800 dark:!text-white',
            style: {
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: 16,
              fontWeight: 600,
            },
          }}
        />

        <Navbar />

        <main className="flex-grow p-4">{children}</main>

        <Footer />

        <PWAInstallPrompt />
      </body>
    </html>
  );
}