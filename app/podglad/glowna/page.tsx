import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import GlownaPage from "@/components/podglad/glowna/GlownaPage";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  variable: "--pgg-inter",
});
const serif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--pgg-serif",
});

export const metadata: Metadata = {
  title: "Podgląd: strona główna (Bloom)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GlownaPage fontClass={`${inter.variable} ${serif.variable}`} />;
}
