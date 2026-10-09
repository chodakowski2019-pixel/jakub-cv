import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import GlownaPage from "@/components/podglad/glowna/GlownaPage";

// Strona główna jakubchodakowski.com od 9.10 (USER_001: „to będzie strona główna").
// Wcześniej: public/home.html (5.10, zostaje pod /en) i stara strona „transformacja AI"
// (historia w git, commit 9fe396a).

const inter = Inter({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"], variable: "--pgg-inter" });
const serif = Instrument_Serif({ subsets: ["latin", "latin-ext"], weight: "400", style: ["normal", "italic"], variable: "--pgg-serif" });

const TYTUL = "Jakub Chodakowski | Sprzedaż + AI";
const OPIS = "Twoi handlowcy domykają więcej z AI. Zbudowałem Bruno AI, klienta AI, z którym handlowcy ćwiczą rozmowy, zanim zadzwonią do prawdziwego.";

export const metadata: Metadata = {
  title: TYTUL,
  description: OPIS,
  alternates: { canonical: "/" },
  openGraph: { title: TYTUL, description: OPIS, url: "/", type: "website", locale: "pl_PL", images: [{ url: "/profilowe_jakub.png", alt: "Jakub Chodakowski" }] },
  twitter: { card: "summary_large_image", title: TYTUL, description: OPIS, images: ["/profilowe_jakub.png"] },
};

export default function Home() {
  return <GlownaPage fontClass={`${inter.variable} ${serif.variable}`} />;
}
