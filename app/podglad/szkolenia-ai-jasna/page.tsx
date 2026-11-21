import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SzkoleniaAiPage from "@/components/szkolenia-ai/SzkoleniaAiPage";

// 21.11.2026: PODGLĄD jasnej wersji strony „Szkolenie AI dla firm” (ten sam układ co /podglad/szkolenia-ai,
// jasne tło, limonka jako wypełnienie). Noindex. Do porównania z wersją ciemną.

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--sza-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--sza-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Podgląd: Szkolenie AI dla firm, wersja jasna | Jakub Chodakowski",
  description: "Jasna wersja strony szkolenia AI dla firm. Podgląd do porównania z wersją ciemną.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Szkolenie AI dla firm, wersja jasna (podgląd)",
    description: "Jasna wersja strony szkolenia AI dla firm. Podgląd do porównania z wersją ciemną.",
    type: "website",
    locale: "pl_PL",
  },
};

export default function Page() {
  return <SzkoleniaAiPage fontClass={`${geist.variable} ${geistMono.variable}`} motyw="jasny" />;
}
