import type { Metadata } from "next";
import { AboutMe } from "@/components/about-me";

// O mnie (USER_001 24.09.2026): dwie osie czasu, praca i nauka/AI, w designie
// oferty PHC. Treść z CV 04.2026 i ze strony głównej. OG własny dla podstrony.

const TYTUL = "O mnie | Jakub Chodakowski";
const OPIS = "Droga zawodowa Jakuba Chodakowskiego: sprzedaż, marketing, startupy i wdrożenia AI. Dwie osie czasu.";

export const metadata: Metadata = {
  title: TYTUL,
  description: OPIS,
  alternates: { canonical: "https://jakubchodakowski.com/aboutme" },
  openGraph: {
    title: TYTUL,
    description: OPIS,
    type: "profile",
    locale: "pl_PL",
    url: "https://jakubchodakowski.com/aboutme",
    images: [{ url: "https://jakubchodakowski.com/jakub.jpg", width: 800, height: 800, alt: "Jakub Chodakowski" }],
  },
  twitter: {
    card: "summary",
    title: TYTUL,
    description: OPIS,
    images: ["https://jakubchodakowski.com/jakub.jpg"],
  },
};

export default function Page() {
  return <AboutMe />;
}
