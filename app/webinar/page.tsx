import type { Metadata } from "next";
import WebinarLpZapis from "@/components/bruno/webinar-lp-zapis";
import { WEBINAR } from "@/lib/bruno/webinar";

// 16.10 (USER_001): LP webinaru, salesbruno.com/webinar. 21.10: Bruno = tylko B2B (17.10), więc ta sama wersja „firmy” co /webinar-firmy.
// 21.10: termin i tytuł z lib/bruno/webinar.ts. 27.10: śr 4.11 19:00, temat „100 % planu sprzedaży” (decyzja 27.10).
const tytul = `${WEBINAR.tytul}. Webinar, ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}`;
// 10.11 (USER_001): webinar dla firm wraca (wt 17.11), odbiorca = każdy, kto ma handlowców.
// 16.11 (USER_001): webinar dla handlowców „Obraz siebie = nasze wyniki sprzedażowe”, kolorystyka /academy.
const opis = "60 minut na żywo dla specjalistów ds. sprzedaży. Dlaczego techniki sprzedażowe to tylko 30% sukcesu, dlaczego jedni handlowcy zarabiają więcej, a inni mniej, i jak zmienić swój obraz siebie.";

export const metadata: Metadata = {
  metadataBase: new URL("https://salesbruno.com"),
  // 10.11 (USER_001): na karcie przeglądarki samo „Webinar”. Pełny tytuł zostaje w podglądzie linku (openGraph).
  title: "Webinar",
  description: opis,
  alternates: { canonical: "/webinar" },
  openGraph: {
    title: tytul,
    description: opis,
    url: "/webinar",
    siteName: "Jakub Chodakowski",
    locale: "pl_PL",
    type: "website",
    images: [{ url: "/bruno/webinar-og.png?v=1611b", width: 1200, height: 630, alt: `Webinar, ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}` }],
  },
  robots: { index: false, follow: true },
};

export default function Page() {
  // 29.10 (USER_001: „na podstronie webinar”): krótka strona zapisu wg Aniserowicza, motyw błękitny, double opt-in.
  return <WebinarLpZapis motyw="academy" dziekiUrl="/webinar/dzieki" />;
}
