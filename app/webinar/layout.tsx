import type { Viewport } from "next";
import { Outfit, Inter, Poppins, Geist, DM_Mono } from "next/font/google";

// Czcionki jak LP Bruno (app/brunoai/layout.tsx).
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const outfit = Outfit({ variable: "--font-blp-head", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });
// 29.10: Poppins do motywu „elmatic” (USER_001: wszystkie strony webinaru w stylu Elmatic).
const poppins = Poppins({ variable: "--font-elm", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });
const inter = Inter({ variable: "--font-blp-body", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

// 16.11: Geist + DM Mono do motywu „academy” (kolorystyka salesbruno.pl/academy).
const geist = Geist({ variable: "--font-baza", subsets: ["latin", "latin-ext"] });
const mono = DM_Mono({ variable: "--font-baza-mono", subsets: ["latin", "latin-ext"], weight: ["400", "500"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${outfit.variable} ${inter.variable} ${poppins.variable} ${geist.variable} ${mono.variable}`}>{children}</div>;
}
