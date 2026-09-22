import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  // USER_001 2026-09-19: marka osobista sprzedaje SEO dla klinik prywatnych.
  // Stara pozycja (wdrozenia AI) zostala, ale jako podstrona /ai.
  title: "Nowi pacjenci w Twoim gabinecie | Jakub Chodakowski",
  description:
    "Buduje klinikom prywatnym wlasny kanal pacjentow z Google. Pozycjonowanie na zabieg i miasto, tresci, analityka i raport co miesiac.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
