import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";

// Podgląd nowej LP Bruno AI (6.10): hero z bio-digital.html, reszta z adaptive-learning.html.
// Treść i formularz = /aisaleskontakt. Strona robocza, poza indeksem.
export const metadata: Metadata = {
  title: "Bruno AI: AI sales practice for teams (preview)",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const outfit = Outfit({
  variable: "--font-blp-head",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
});

const inter = Inter({
  variable: "--font-blp-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export default function BrunoLpLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${outfit.variable} ${inter.variable}`}>{children}</div>;
}
