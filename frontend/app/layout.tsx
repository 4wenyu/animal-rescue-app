import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import ChatbotMount from "@/src/components/chat/ChatbotMount";
import { PreviewBanner } from "@/src/components/preview/PreviewBanner";
import { resolveLocale } from "@/src/lib/localeCode";
import { getSiteMode, isPreviewMode } from "@/lib/siteMode";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const preview = isPreviewMode();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: preview
    ? "RescueHub — private preview"
    : "RescueHub — Animal Welfare Platform",
  description: preview
    ? "Private preview of RescueHub. Sample animals — not a live shelter. Try adoption, lost-pet chat, and the staff desk."
    : "A legally compliant multi-tenant SaaS platform for animal rescues, municipal shelters, corporate sponsors, and the general public.",
  robots: preview ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: {
    title: preview ? "RescueHub (private preview)" : "RescueHub",
    description:
      "Find a missing pet, meet an animal who needs a home, or run a legally honest shelter desk.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const lang = resolveLocale(jar.get("rescuehub_locale")?.value);

  return (
    <html
      lang={lang}
      data-site-mode={getSiteMode()}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Skip to main content (WCAG 2.4.1 Bypass Blocks) — visible on focus */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        {preview ? <PreviewBanner /> : null}
        <Providers>{children}</Providers>
        {/* Global chatbot — client-only lazy load, unmounted on routes with
            their own chat surface (see src/components/chat/ChatbotMount.tsx). */}
        <ChatbotMount />
      </body>
    </html>
  );
}