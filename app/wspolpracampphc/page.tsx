import type { Metadata } from "next";
import { BramaKodu } from "@/components/brama-kodu";
import { OfertaStrategia } from "@/components/oferta-strategia";

// Oferta współpracy dla Perfect Hair Clinic, Katowice (USER_001 24.09.2026).
// Adres wysyłamy imiennie, wejście za kodem (BramaKodu). noindex: cena nie
// jest publiczna, a strona bez maila, który do niej prowadzi, nie ma sensu.
//
// OG pisany osobno pod tę stronę: komunikator ma pokazać podgląd o ofercie,
// nie tekst ze strony głównej o AI.

const KOD = "384922";
const KLUCZ = "perfecthair";

export const metadata: Metadata = {
  title: "Oferta współpracy | Jakub Chodakowski",
  description: "Plan marketingu i sprzedaży dla kliniki oraz dla marki osobistej.",
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Oferta współpracy | Jakub Chodakowski",
    description: "Plan marketingu i sprzedaży dla kliniki oraz dla marki osobistej.",
    type: "website",
    locale: "pl_PL",
  },
  twitter: {
    card: "summary",
    title: "Oferta współpracy | Jakub Chodakowski",
    description: "Plan marketingu i sprzedaży dla kliniki oraz dla marki osobistej.",
  },
};

export default function Page() {
  return (
    <BramaKodu kod={KOD} klucz={KLUCZ}>
      <OfertaStrategia klucz={KLUCZ} />
    </BramaKodu>
  );
}
