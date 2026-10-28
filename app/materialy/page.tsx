import type { Metadata } from "next";
import { PrezentacjaInwestorBruno } from "@/components/bruno/prezentacja/inwestor";

// Prezentacja inwestorska Bruno AI (28.10.2026), wzór: deck Gabi (/spotkanie
// w zwiazki-lp). Adres wysyłamy sami, konkretnej osobie. Strona za hasłem
// (bramka w komponencie klienckim), noindex, zero linków z serwisu, brak
// w sitemapie. Nazwa adresu celowo neutralna.

export const metadata: Metadata = {
  title: "Materiały",
  description: "Materiał na spotkanie.",
  robots: { index: false, follow: false, nocache: true },
};

export default function Materialy() {
  return <PrezentacjaInwestorBruno />;
}
