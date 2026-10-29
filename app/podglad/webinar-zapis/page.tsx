import type { Metadata } from "next";
import WebinarLpZapis from "@/components/bruno/webinar-lp-zapis";
import { WEBINAR } from "@/lib/bruno/webinar";

// 29.10 (USER_001): PODGLĄD krótkiej strony zapisu na webinar (wzór stron webinarowych, nie sprzedażowych).
// Noindex. Jeśli wygra, zastępuje components/bruno/webinar-lp.tsx na /webinar.
const tytul = `${WEBINAR.tytul}. Bezpłatny webinar, ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}`;

export const metadata: Metadata = {
  title: `${tytul} | Jakub Chodakowski`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WebinarLpZapis />;
}
