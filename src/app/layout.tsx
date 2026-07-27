import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/landing/site-url";
import { PLATFORM } from "@/lib/platform";
import NavigationProgress from "@/components/layout/NavigationProgress";
import MarketingTags from "@/components/marketing/MarketingTags";
import CampaignParamsProvider from "@/components/marketing/CampaignParamsProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${PLATFORM.name} v${PLATFORM.release} — ${PLATFORM.tagline}`,
    template: `%s | ${PLATFORM.shortName} v${PLATFORM.release}`,
  },
  description: PLATFORM.description,
  applicationName: `${PLATFORM.name} v${PLATFORM.release}`,
  authors: [{ name: PLATFORM.name }],
  creator: PLATFORM.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // ServiceOS v3.0 — PWA / Add to Home Screen (ícones gerados por npm run icons:generate)
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PLATFORM.shortName,
  },
  // iOS Safari legado ainda lê apple-mobile-web-app-capable
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f97316" },
    { media: "(prefers-color-scheme: dark)", color: "#ea580c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans antialiased">
        <MarketingTags />
        <Suspense fallback={null}>
          <CampaignParamsProvider />
        </Suspense>
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
