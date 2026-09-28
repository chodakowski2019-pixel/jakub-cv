import type { Metadata, Viewport } from "next";
import { Poppins, Open_Sans } from "next/font/google";

// Podstrona /aisaleskontakt: lead form projektu SalesAI (USER_001 2026-09-28).
// Cel: zebrać kontakty do dyrektorów i managerów sprzedaży na bezpłatny pilotaż.
// Grupa docelowa z researchu 28.09: zespół handlowy 5-40 osób, decydent = szef
// sprzedaży albo właściciel małej firmy. HR świadomie pominięte.

export const metadata: Metadata = {
  title: "Trening handlowców z AI | Jakub Chodakowski",
  description:
    "Handlowcy coachowani co tydzień robią 76% planu, raz na kwartał 47%. Buduję narzędzie, które tę cotygodniową powtórkę robi za szefa sprzedaży. Szukam firm na bezpłatny pilotaż.",
  alternates: { canonical: "https://jakubchodakowski.com/aisaleskontakt" },
  openGraph: {
    title: "Trening handlowców z AI | Jakub Chodakowski",
    description:
      "Na jednego szefa sprzedaży przypada 12 handlowców. Nikt nie usiądzie z każdym co tydzień. Narzędzie robi tę powtórkę za Ciebie.",
    url: "https://jakubchodakowski.com/aisaleskontakt",
    type: "website",
  },
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

export default function AiSalesKontaktLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${poppins.variable} ${openSans.variable}`}>{children}</div>;
}
