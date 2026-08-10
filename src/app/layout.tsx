import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Istanbul",
  description: "Trip companion — budget, expenses, settlement and itinerary.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Istanbul",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The app is a fixed-width mobile layout; pinch-zoom only breaks it.
  maximumScale: 1,
  userScalable: false,
  themeColor: "#08080a",
  viewportFit: "cover",
};

import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-canvas text-ink font-sans">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
