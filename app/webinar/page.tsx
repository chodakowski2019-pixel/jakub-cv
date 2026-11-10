import type { Metadata } from "next";
import WebinarLpZapis from "@/components/bruno/webinar-lp-zapis";
import { WEBINAR } from "@/lib/bruno/webinar";

// 16.10 (USER_001): LP webinaru, salesbruno.com/webinar. 21.10: Bruno = tylko B2B (17.10), więc ta sama wersja „firmy” co /webinar-firmy.
// 21.10: termin i tytuł z lib/bruno/webinar.ts. 27.10: śr 4.11 19:00, temat „100 % planu sprzedaży” (decyzja 27.10).
const tytul = `${WEBINAR.tytul} Bezpłatny webinar, ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}`;
// 10.11 (USER_001): webinar dla firm wraca (wt 17.11), odbiorca = każdy, kto ma handlowców.
const opis = "60 minut na żywo dla właścicieli firm i szefów sprzedaży. Dlaczego handlowcy nie sprzedają, na którym etapie uciekają klienci i jak widzieć pracę zespołu w liczbach. Rozmowa handlowca z klientem AI na żywo.";

export const metadata: Metadata = {
  metadataBase: new URL("https://salesbruno.com"),
  title: `${tytul} | Jakub Chodakowski`,
  description: opis,
  alternates: { canonical: "/webinar" },
  openGraph: {
    title: tytul,
    description: opis,
    url: "/webinar",
    siteName: "Jakub Chodakowski",
    locale: "pl_PL",
    type: "website",
    images: [{ url: "/bruno/webinar-og.png?v=1011", width: 1200, height: 630, alt: `Webinar, ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}` }],
  },
  robots: { index: false, follow: true },
};

export default function Page() {
  // 29.10 (USER_001: „na podstronie webinar”): krótka strona zapisu wg Aniserowicza, motyw błękitny, double opt-in.
  return <WebinarLpZapis motyw="elmatic" dziekiUrl="/webinar/dzieki" />;
}
