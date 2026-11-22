import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import MarkaPage from "@/components/marka/MarkaPage";

// 22.11.2026 (USER_001): PODGLĄD strony marki osobistej Jakub Chodakowski. Noindex.
// Wybór na starcie (firma albo człowiek), paski rozwijane jak FAQ, newsletter. Styl salesbruno.pl.
// Strona główna jakubchodakowski.com (strona szkoleń) bez zmian, dopóki USER_001 nie zdecyduje.

const outfit = Outfit({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500"], variable: "--mk-head", display: "swap" });
const inter = Inter({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--mk-body", display: "swap" });

export const metadata: Metadata = {
  // 22.11 (USER_001): napis na karcie przeglądarki „Nauka o AI”. Ikona karty = limonkowa kula (app/icon.svg).
  title: "Nauka o AI",
  description: "Uczę AI prosto i po polsku. Szkolenia dla firm, bezpłatne webinary, podcast i newsletter o AI.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className={`${outfit.variable} ${inter.variable}`}>
      <MarkaPage />
    </div>
  );
}
