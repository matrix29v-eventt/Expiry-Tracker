import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DarkModeInitializer from "@/components/DarkModeInitializer";
import { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Expiry Tracker",
  description: "Never forget product expiry dates",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen font-sans transition-colors duration-300 antialiased bg-white dark:bg-slate-900`}>
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

        <main className="flex-grow p-4 bg-gray-50 dark:bg-slate-900">{children}</main>

        <Footer />
      </body>
    </html>
  );
}