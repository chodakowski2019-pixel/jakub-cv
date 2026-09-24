import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // USER_001 2026-09-24: powrot do strony o AI na glownej. SEO dla klinik
  // (z 22.09) zostalo jako podstrona /seo.
  title: "Jakub Chodakowski | AI Implementation Specialist",
  description:
    "I help companies implement AI into their everyday business processes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Merge 22.09: strona glowna jest po polsku (SEO dla klinik), ale /en dalej
  // istnieje z czerwcowego przelacznika PL/EN, wiec jezyk bierzemy z naglowka.
  const locale = (await headers()).get("x-locale") ?? "pl";
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
