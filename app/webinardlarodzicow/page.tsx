import type { Metadata } from "next";
import WebinarRodzice from "@/components/webinar-rodzice/WebinarRodzice";

// 22.11.2026 (USER_001): strona zapisu na bezpłatny webinar dla rodziców o AI i zawodach przyszłości.
// Szablon salesbruno.pl/webinar (components/bruno/webinar-lp-zapis.tsx), teksty i kolory marki. Jak strony webinarów Bruno: noindex.
const OPIS = "Bezpłatny webinar online dla rodziców: które zawody AI zmieni, a które zyskają, jakich umiejętności szukają pracodawcy i jak rozmawiać z dzieckiem o wyborze szkoły.";

export const metadata: Metadata = {
  title: { absolute: "Webinar dla rodziców" },
  description: OPIS,
  alternates: { canonical: "/webinardlarodzicow" },
  openGraph: {
    title: "Jaki zawód ma przyszłość w erze AI? Webinar dla rodziców",
    description: OPIS,
    url: "/webinardlarodzicow",
    siteName: "Jakub Chodakowski",
    locale: "pl_PL",
    type: "website",
    images: [{ url: "/talk-crash-mondays.png", width: 1614, height: 1058, alt: "Jakub Chodakowski prowadzi wystąpienie o AI" }],
  },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <WebinarRodzice />;
}
