import type { Metadata, Viewport } from "next";
import { Poppins, Open_Sans } from "next/font/google";

// Podstrona /aisalesbrief: ankieta wdrożeniowa SalesAI (USER_001 2026-09-28).
// To NIE jest lead form (/aisaleskontakt). Tu wchodzi firma, która już
// powiedziała "tak" na pilotaż, i opisuje swojego klienta oraz swoją rozmowę
// sprzedażową, żeby AI mogła zagrać jej realnego kupującego.
//
// noindex: link dostaje konkretna firma mailem, nie ma być w Google.

export const metadata: Metadata = {
  title: "Ankieta wdrożeniowa | Trening handlowców z AI",
  description:
    "Opisz swojego klienta i swoją rozmowę sprzedażową. Na tej podstawie ustawiam trening dla Twojego zespołu.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export default function AiSalesBriefLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${poppins.variable} ${openSans.variable}`}>{children}</div>;
}
