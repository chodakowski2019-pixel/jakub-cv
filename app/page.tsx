import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import MarkaPage from "@/components/marka/MarkaPage";

// 22.11.2026 (USER_001: „to ma być jako strona główna jakubchodakowski.com”): strona główna = strona marki osobistej
// (components/marka, wcześniej podgląd /podglad/marka, który teraz przekierowuje tutaj). Indeksowana, canonical „/”.
// Poprzednia strona główna „Szkolenie AI dla firm” (21-22.11) żyje pod /szkolenie-ai-dla-firm.
// Starsze: „Sprzedaż + AI” pod /podglad/glowna, public/home.html (/en).

const outfit = Outfit({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500"], variable: "--mk-head", display: "swap" });
const inter = Inter({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--mk-body", display: "swap" });

// Napis na karcie przeglądarki: „Nauka o AI” (USER_001 22.11).
const TYTUL = "Nauka o AI";
const OPIS = "Jakub Chodakowski uczy, jak zmienić życie i firmę z AI. Bezpłatne webinary online, warsztaty AI dla zespołów, newsletter o AI.";
const OG = "Nauka o AI | Jakub Chodakowski";

export const metadata: Metadata = {
  title: { absolute: TYTUL },
  description: OPIS,
  alternates: { canonical: "/" },
  openGraph: {
    title: OG,
    description: OPIS,
    url: "/",
    type: "website",
    locale: "pl_PL",
    images: [{ url: "/talk-crash-mondays.png", width: 1614, height: 1058, alt: "Jakub Chodakowski prowadzi wystąpienie o AI" }],
  },
  twitter: { card: "summary_large_image", title: OG, description: OPIS, images: ["/talk-crash-mondays.png"] },
};

export default function Home() {
  return (
    <div className={`${outfit.variable} ${inter.variable}`}>
      <MarkaPage />
    </div>
  );
}
