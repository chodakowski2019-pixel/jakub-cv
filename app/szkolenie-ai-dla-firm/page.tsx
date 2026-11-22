import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SzkoleniaAiPage from "@/components/szkolenia-ai/SzkoleniaAiPage";

// 22.11.2026: strona „Szkolenie AI dla firm” przeniesiona ze strony głównej pod /szkolenie-ai-dla-firm,
// bo stroną główną została strona marki osobistej (USER_001: „to ma być jako strona główna jakubchodakowski.com”).
// Adres = fraza z Planera Google („szkolenie ai dla firm”, 100 do 1 tys. wyszukiwań/mc). Indeksowana, w mapie witryny.
// Od 21.11.2026 do 22.11.2026 ta strona była stroną główną (USER_001 21.11: „to ma być strona główna”).
// Wersja czarna z limonką (motyw="ciemny"), ta sama co podgląd /podglad/szkolenia-ai.
// Poprzednia strona główna (od 9.10, „Sprzedaż + AI”, components/podglad/glowna/GlownaPage) zostaje pod /podglad/glowna;
// starsze: public/home.html (/en) i strona „transformacja AI” (historia w git, commit 9fe396a).
// Kroje Geist i Geist Mono z polskimi znakami (globalny Geist Mono z layoutu ma tylko znaki łacińskie).

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--sza-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--sza-mono", display: "swap" });

const TYTUL = "Szkolenie AI dla firm | Jakub Chodakowski";
const OPIS = "Warsztat AI dla zespołu do 12 osób: każdy pracuje na swoim laptopie i na zadaniach z firmy. Rozkład dnia, cena i wolne terminy.";
const OG = "Szkolenie AI dla firm. Jeden dzień, zespół do 12 osób";

export const metadata: Metadata = {
  title: { absolute: TYTUL },
  description: OPIS,
  alternates: { canonical: "/szkolenie-ai-dla-firm" },
  openGraph: {
    title: OG,
    description: OPIS,
    url: "/szkolenie-ai-dla-firm",
    type: "website",
    locale: "pl_PL",
    images: [{ url: "/talk-crash-mondays.png", width: 1614, height: 1058, alt: "Jakub Chodakowski prowadzi wystąpienie o AI" }],
  },
  twitter: { card: "summary_large_image", title: OG, description: OPIS, images: ["/talk-crash-mondays.png"] },
};

export default function SzkolenieAiDlaFirm() {
  return <SzkoleniaAiPage fontClass={`${geist.variable} ${geistMono.variable}`} motyw="ciemny" />;
}
