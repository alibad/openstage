import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Arabic, Instrument_Serif } from "next/font/google";
import { Suspense } from "react";
import { FeedbackWidgetLoader } from "@/components/feedback-widget/FeedbackWidgetLoader";
import { Toaster } from "sonner";
import { BrandProvider } from "@/lib/brand";
import { BrandScopeForRoute } from "@/components/brand/brand-scope-for-route";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  axes: ["opsz"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Openstage",
    template: "%s — Openstage",
  },
  description: "Immersive, scroll-based presentations powered by React",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Openstage",
    locale: "en_US",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Openstage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${notoSansArabic.variable} antialiased`}>
        <BrandProvider>
          <Suspense>
            <BrandScopeForRoute>{children}</BrandScopeForRoute>
          </Suspense>
          <FeedbackWidgetLoader />
          <Toaster position="bottom-left" richColors />
        </BrandProvider>
      </body>
    </html>
  );
}
