import type { Metadata } from "next";
import WebinarLp from "@/components/bruno/webinar-lp";
import { WEBINAR } from "@/lib/bruno/webinar";

// 16.10 (USER_001): LP webinaru dla WŁAŚCICIELI FIRM i szefów sprzedaży. Adres: salesbruno.com/webinar-firmy.
// 21.10: termin i tytuł z lib/bruno/webinar.ts (śr 28.10 19:00, tytuł z zaproszeń na LinkedIn).
const tytul = `${WEBINAR.tytul}. Bezpłatny webinar, ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}`;
const opis = "60 minut na żywo dla właścicieli firm i dyrektorów sprzedaży. Jak zespół może ćwiczyć rozmowy z AI, a nie na Waszych klientach.";

export const metadata: Metadata = {
  metadataBase: new URL("https://salesbruno.com"),
  title: `${tytul} | Jakub Chodakowski`,
  description: opis,
  alternates: { canonical: "/webinar-firmy" },
  openGraph: {
    title: tytul,
    description: opis,
    url: "/webinar-firmy",
    siteName: "Jakub Chodakowski",
    locale: "pl_PL",
    type: "website",
    images: [{ url: "/bruno/webinar-firmy-og.png?v=2810", width: 1200, height: 630, alt: `Webinar, ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}` }],
  },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <WebinarLp wersja="firmy" />;
}
