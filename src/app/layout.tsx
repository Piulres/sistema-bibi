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
    default: `${PLATFORM.name} ${PLATFORM.version} — ${PLATFORM.tagline}`,
    template: `%s | ${PLATFORM.shortName} ${PLATFORM.version}`,
  },
  description: PLATFORM.description,
  applicationName: PLATFORM.name,
  authors: [{ name: PLATFORM.name }],
  creator: PLATFORM.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e293b" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
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
