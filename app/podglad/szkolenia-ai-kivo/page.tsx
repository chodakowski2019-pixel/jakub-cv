import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import SzkoleniaAiPage from "@/components/szkolenia-ai/SzkoleniaAiPage";

// 20.11.2026: PODGLĄD nowej strony sprzedażowej „Szkolenie AI dla firm”. Noindex.
// Po akceptacji zastępuje starą stronę app/szkolenia/page.tsx (z kwietnia 2026).
// 21.11: wygląd wersja 3, ciemny styl wzorowany na szablonie „Dominion”. Kroje: Geist i Geist Mono
// (osobne zmienne z polskimi znakami; globalny Geist Mono z layoutu ma tylko znaki łacińskie).

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--sza-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--sza-mono", display: "swap" });
// 21.11: wersja 4 wyglądu (styl wzorowany na stronie Kivo, wskazanej przez USER_001). Krój Outfit: cienki, geometryczny, z polskimi znakami.
const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--sza-kivo", display: "swap" });

const TYTUL = "Szkolenie AI dla firm. Jeden dzień, zespół do 12 osób | Jakub Chodakowski";
const OPIS = "Warsztat AI dla zespołu: każdy pracuje na swoim laptopie i na zadaniach z firmy. Każdy wychodzi z własnym asystentem AI. Rozkład dnia, cena i wolne terminy.";

export const metadata: Metadata = {
  title: TYTUL,
  description: OPIS,
  robots: { index: false, follow: false },
  openGraph: {
    title: "Szkolenie AI dla firm. Jeden dzień, zespół do 12 osób",
    description: OPIS,
    type: "website",
    locale: "pl_PL",
    images: [{ url: "/talk-crash-mondays.png", width: 1614, height: 1058, alt: "Jakub Chodakowski prowadzi wystąpienie o AI" }],
  },
  twitter: { card: "summary_large_image", title: "Szkolenie AI dla firm. Jeden dzień, zespół do 12 osób", description: OPIS, images: ["/talk-crash-mondays.png"] },
};

export default function Page() {
  // 21.11: wersja 4 wyglądu, styl wzorowany na stronie Kivo (jasna, pomarańcz, szklany pasek). Odłożona: USER_001 wrócił do wersji czarnej z limonką.
  return <SzkoleniaAiPage fontClass={`${geist.variable} ${geistMono.variable} ${outfit.variable}`} motyw="kivo" />;
}
