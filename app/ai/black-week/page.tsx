import type { Metadata } from "next";
import { Odliczanie } from "./odliczanie";
import { Ranking, type Karta } from "./ranking";
import { Zglos } from "./zglos";
import { Zapis } from "../zapis";
import { DOMENA, PODGLAD } from "@/lib/blog-ai";
import { BAZA_NARZEDZI, CECHY, kategoria, wszystkieNarzedzia } from "@/lib/narzedzia-ai";
import { BAZA_BLACK_WEEK, KONIEC_BLACK_WEEK, START_BLACK_WEEK, sprawdzonoPromocje, wszystkiePromocje } from "@/lib/promocje-ai";

// 25.11.2026 (USER_001: „lec i rob”, wzorzec: blackweek.ai): jedna strona z promocjami Black Week na narzędzia AI.
// Czym się różnimy: każda promocja ma cytat ze strony producenta i datę sprawdzenia, link do naszego wpisu o narzędziu
// (cena dla firm, język polski, dane). Zero zmyślonych rabatów: lista = tylko to, co potwierdza strona producenta.
//
// Wersja 2 tego samego dnia (USER_001: „popraw ux/ui tego”). Konwencja: TABLICA. Pierwszy ekran = nagłówek + czarna tablica
// (odliczanie i 4 liczby), niżej promocje w wierszach jak w tabeli (da się przejrzeć 9 ofert bez czytania akapitów),
// szczegóły pod „Warunki i źródło”. Wyszukiwarka + jeden rząd zakładek zamiast trzech rzędów filtrów. Kolory i kroje katalogu bez zmian.
const TYTUL = "Black Week 2026: promocje na narzędzia AI, sprawdzone";
const OPIS = "Promocje Black Friday i Cyber Monday na narzędzia AI dla firm. Przy każdej: rabat, kod, data końca i cytat ze strony producenta. Sprawdzone 25 listopada 2026.";

export const metadata: Metadata = {
  title: { absolute: `${TYTUL} | Jakub Chodakowski` },
  description: OPIS,
  ...(PODGLAD ? { robots: { index: false, follow: false } } : { alternates: { canonical: `${DOMENA}${BAZA_BLACK_WEEK}` } }),
  openGraph: { title: TYTUL, description: OPIS, type: "website", locale: "pl_PL", url: `${DOMENA}${BAZA_BLACK_WEEK}` },
  twitter: { card: "summary_large_image", title: TYTUL, description: OPIS },
};

const TZ = "Europe/Warsaw";
const dzienMiesiac = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", timeZone: TZ });
const pelnaData = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });

export default function Page() {
  const promocje = wszystkiePromocje();
  const sprawdzono = sprawdzonoPromocje() || "2026-11-25";
  const karty: Karta[] = promocje.map((p) => ({
    slug: p.slug,
    nazwa: p.n.nazwa,
    logo: p.n.logo,
    kategoria: p.n.kategoria,
    kategoriaNazwa: kategoria(p.n.kategoria)?.nazwa ?? "",
    rabatPrzed: p.rabatPrzed,
    rabatLiczba: p.rabatLiczba,
    opis: p.opis,
    ceny: p.ceny,
    do: p.do,
    doTekst: p.do ? dzienMiesiac(p.do) : "",
    koniec: p.koniec,
    kody: p.kody,
    warunki: p.warunki,
    zrodlo: p.zrodlo,
    cytat: p.cytat,
    link: p.link,
    reklama: p.reklama,
    cechy: p.n.cechy.map((c) => CECHY[c]),
  }));
  const slugiKat = [...new Set(karty.map((k) => k.kategoria))];
  const kategorie = slugiKat.map((s) => ({ slug: s, nazwa: kategoria(s)?.nazwa ?? s, ile: karty.filter((k) => k.kategoria === s).length }));
  // Do wyszukiwarki: narzędzia z katalogu, które nie mają teraz promocji.
  const zPromocja = new Set(karty.map((k) => k.slug));
  const katalog = wszystkieNarzedzia()
    .filter((n) => !zPromocja.has(n.slug))
    .map((n) => ({ slug: n.slug, nazwa: n.nazwa }));
  const najwiekszy = [...karty].sort((a, b) => b.rabatLiczba - a.rabatLiczba)[0];
  const zKodem = karty.filter((k) => k.kody.length > 0).length;

  const liczby: [string, string][] = [
    ["Promocje na liście", String(karty.length)],
    ["Największy rabat", najwiekszy ? `${najwiekszy.rabatLiczba}% · ${najwiekszy.nazwa}` : "brak"],
    ["Z kodem rabatowym", String(zKodem)],
    ["Narzędzia w katalogu", String(wszystkieNarzedzia().length)],
    ["Ostatnie sprawdzenie", dzienMiesiac(sprawdzono)],
  ];

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: TYTUL,
    itemListElement: promocje.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: `${p.n.nazwa}: ${p.rabat}`, url: `${DOMENA}${BAZA_NARZEDZI}/${p.slug}` })),
  };
  const faq = [
    ["Skąd wiadomo, że promocje są prawdziwe?", "Każdą wpisuję dopiero po przeczytaniu strony producenta. Przy ofercie jest cytat z tej strony. Jeśli strony nie da się odczytać, promocji nie dodaję."],
    ["Czy te linki są partnerskie?", "Obecnie linki prowadzą na strony producentów, bez prowizji. Gdy któryś będzie linkiem partnerskim, przycisk dostanie gwiazdkę i dopisek „Reklama: link partnerski”."],
    ["Czy kolejność jest płatna?", "Nie. Domyślnie lista idzie od największego rabatu. Płatnych miejsc nie ma."],
    ["Co z promocjami bez daty końca?", "Producent nie podaje wtedy terminu na stronie. Zaznaczam to przy ofercie. Przed zakupem warto sprawdzić cenę i warunki na stronie producenta."],
  ] as const;
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* ── PIERWSZY EKRAN: nagłówek + czarna tablica ── */}
      <section className="bai-hero bai-bw-hero">
        <div className="bai-w6 bai-bw-hero-wnetrze">
          <div>
            <p className="bai-mono bai-brow">Black Week · 23-30 listopada 2026</p>
            <h1 className="bai-h1 bai-bw-h1">
              <span>Promocje na narzędzia AI.</span> <span>Tylko sprawdzone.</span>
            </h1>
            <p className="bai-lead">Każdą ofertę czytam na stronie producenta. Przy każdej jest rabat, kod, termin i cytat ze źródła.</p>
            <div className="bai-akcje">
              <a href="#ranking" className="bai-przycisk">
                Zobacz {karty.length} promocji
              </a>
              <a href="#zapis" className="bai-drugi-link">
                Wyślij mi nowe na e-mail
              </a>
            </div>
          </div>

          <aside className="bai-tablica" aria-label="Black Week w liczbach">
            <Odliczanie start={START_BLACK_WEEK} koniec={KONIEC_BLACK_WEEK} />
            <dl className="bai-tab-liczby">
              {liczby.map(([e, w]) => (
                <div key={e}>
                  <dt>{e}</dt>
                  <dd>{w}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <div className="bai-w6 bai-bw-dol">
        <Ranking karty={karty} kategorie={kategorie} katalog={katalog} />
        <p className="bai-of-stopka">
          Sprawdzone u producentów: {pelnaData(sprawdzono)}. Kolejność od największego rabatu, bez płatnych miejsc. Ceny i warunki ustala producent.
        </p>

        <div id="zapis">
          <Zapis skad="black-week" ciemny />
        </div>

        {/* ── PYTANIA + ZGŁOSZENIE ── */}
        <div className="bai-bw-koniec">
          <section aria-labelledby="bw-pytania">
            <h2 id="bw-pytania" className="bai-h2-maly">
              Pytania
            </h2>
            <div className="bai-faq">
              {faq.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </section>
          <Zglos />
        </div>
      </div>
    </>
  );
}
