import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";

// Podgląd portalu ofert pracy dla handlowców (15.10, lejek 1 B2C: alert z ofertami = zbieranie maili).
// Dane = próbka Adzuna z 9.10 (SalesAI/oferty). Strona robocza, poza indeksem, nic nie zapisuje.
export const metadata: Metadata = {
  title: "Sales Jobs by Bruno AI (preview)",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const outfit = Outfit({
  variable: "--font-bof-head",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
});

const inter = Inter({
  variable: "--font-bof-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export default function BrunoOfertyLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${outfit.variable} ${inter.variable}`}>{children}</div>;
}
