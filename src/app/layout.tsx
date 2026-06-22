import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/landing/site-url";
import NavigationProgress from "@/components/layout/NavigationProgress";
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
    default: "Sistema Bibi — Gestão Inteligente em Saúde",
    template: "%s | Sistema Bibi",
  },
  description:
    "Plataforma SaaS HealthTech com Pay Per Use, quatro portais integrados, faturamento previsível e white label para clínicas e saúde corporativa.",
  applicationName: "Sistema Bibi",
  authors: [{ name: "Sistema Bibi" }],
  creator: "Sistema Bibi",
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
    { media: "(prefers-color-scheme: light)", color: "#0d9488" },
    { media: "(prefers-color-scheme: dark)", color: "#134e4a" },
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
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
