import type { Metadata } from "next";
import Link from "next/link";
import { Odliczanie } from "./odliczanie";
import { Ranking, type Karta } from "./ranking";
import { Zglos } from "./zglos";
import { Zapis } from "../zapis";
import { DOMENA, PODGLAD } from "@/lib/blog-ai";
import { BAZA_NARZEDZI, CECHY, kategoria } from "@/lib/narzedzia-ai";
import { BAZA_BLACK_WEEK, KONIEC_BLACK_WEEK, START_BLACK_WEEK, sprawdzonoPromocje, statystykaSkanu, wszystkiePromocje } from "@/lib/promocje-ai";

// 25.11.2026 (USER_001: „lec i rob”, wzorzec: blackweek.ai): jedna strona z promocjami Black Week na narzędzia AI.
// Czym się różnimy: każda promocja ma cytat ze strony producenta i datę sprawdzenia, link do naszego wpisu o narzędziu
// (cena dla firm, język polski, dane) i filtry „dla firmy”. Zero zmyślonych rabatów: lista = tylko to, co potwierdza strona producenta.
const TYTUL = "Black Week 2026: promocje na narzędzia AI, sprawdzone";
const OPIS = "Promocje Black Friday i Cyber Monday na narzędzia AI dla firm. Przy każdej: rabat, kod, data końca i cytat ze strony producenta. Sprawdzone 25 listopada 2026.";

export const metadata: Metadata = {
  title: { absolute: `${TYTUL} | Jakub Chodakowski` },
  description: OPIS,
  ...(PODGLAD ? { robots: { index: false, follow: false } } : { alternates: { canonical: `${DOMENA}${BAZA_BLACK_WEEK}` } }),
  openGraph: { title: TYTUL, description: OPIS, type: "website", locale: "pl_PL", url: `${DOMENA}${BAZA_BLACK_WEEK}` },
  twitter: { card: "summary_large_image", title: TYTUL, description: OPIS },
};

const dataPoPolsku = (d: string) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });
const liczba = (s: string) => Number((s.match(/\d+(?:[.,]\d+)?/) ?? ["0"])[0].replace(",", "."));

export default function Page() {
  const promocje = wszystkiePromocje();
  const karty: Karta[] = promocje.map((p) => ({
    slug: p.slug,
    nazwa: p.n.nazwa,
    producent: p.n.producent,
    logo: p.n.logo,
    kategoria: p.n.kategoria,
    kategoriaNazwa: kategoria(p.n.kategoria)?.nazwa ?? "",
    rabat: p.rabat,
    rabatLiczba: liczba(p.rabat),
    opis: p.opis,
    ceny: p.ceny,
    do: p.do,
    doTekst: p.do ? dataPoPolsku(p.do) : "",
    kod: p.kod,
    warunki: p.warunki,
    zrodlo: p.zrodlo,
    cytat: p.cytat,
    link: p.link,
    reklama: p.reklama,
    sprawdzono: dataPoPolsku(sprawdzonoPromocje() || "2026-11-25"),
    cechy: p.n.cechy,
    wygasla: p.wygasla,
  }));
  const slugiKat = [...new Set(karty.map((k) => k.kategoria))];
  const kategorie = slugiKat.map((s) => ({ slug: s, nazwa: kategoria(s)?.nazwa ?? s, ile: karty.filter((k) => k.kategoria === s).length }));
  const cechy = (Object.keys(CECHY) as (keyof typeof CECHY)[]).filter((c) => karty.some((k) => k.cechy.includes(c))).map((c) => ({ slug: c, nazwa: CECHY[c] }));
  const skan = statystykaSkanu();
  const zData = karty.filter((k) => k.do).length;
  const najwiekszy = [...karty].sort((a, b) => b.rabatLiczba - a.rabatLiczba)[0];

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: TYTUL,
    itemListElement: karty.map((k, i) => ({ "@type": "ListItem", position: i + 1, name: `${k.nazwa}: ${k.rabat}`, url: `${DOMENA}${BAZA_NARZEDZI}/${k.slug}` })),
  };
  const faq = [
    ["Skąd wiadomo, że promocje są prawdziwe?", "Każdą wpisuję dopiero po przeczytaniu strony producenta. Przy ofercie jest cytat z tej strony i data sprawdzenia. Jeśli strony nie da się odczytać, promocji nie dodaję."],
    ["Czy te linki są partnerskie?", "Obecnie linki prowadzą na strony producentów, bez prowizji. Gdy któryś będzie linkiem partnerskim, przycisk dostanie gwiazdkę i dopisek „Reklama: link partnerski”."],
    ["Czy kolejność jest płatna?", "Nie. Domyślnie lista idzie od największego rabatu. Płatnych miejsc nie ma."],
    ["Co z promocjami bez daty końca?", "Producent nie podaje wtedy terminu na stronie. Zaznaczam to przy ofercie i sprawdzam ponownie. Kupując, sprawdź cenę i warunki na stronie producenta."],
  ] as const;
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <section className="bai-hero">
        <div className="bai-smuga" aria-hidden />
        <div className="bai-w6 bai-hero-wnetrze">
          <p className="bai-mono bai-brow">Black Week 23-30 listopada 2026</p>
          <h1 className="bai-h1">
            <span>Black Week 2026:</span> <span>promocje na narzędzia AI.</span>
          </h1>
          <p className="bai-lead">
            Przy każdej promocji cytat ze strony producenta, data końca i kod. Obok mój wpis o narzędziu: ile kosztuje wersja dla firm, czy działa po polsku i co z
            danymi.
          </p>
          <p className="bai-mono bai-licznik">
            Promocje: {karty.length} · Z datą końca: {zData}
            {najwiekszy ? ` · Największy rabat: ${najwiekszy.rabat} (${najwiekszy.nazwa})` : ""}
          </p>
          <Odliczanie start={START_BLACK_WEEK} koniec={KONIEC_BLACK_WEEK} />
          <div className="bai-akcje">
            <a href="#ranking" className="bai-przycisk">
              Zobacz promocje
            </a>
            <a href="#zapis" className="bai-drugi-link">
              Promocje na e-mail
            </a>
          </div>
        </div>
      </section>

      <div className="bai-w6 bai-dol">
        <Ranking karty={karty} kategorie={kategorie} cechy={cechy} />

        <div id="zapis">
          <Zapis skad="black-week" />
        </div>

        <section className="bai-skaner" aria-label="Jak sprawdzam promocje">
          <h2 className="bai-h2-maly">Jak to sprawdzam</h2>
          <dl className="bai-fakty">
            <div>
              <dt className="bai-mono">Strony producentów</dt>
              <dd>{skan ? `${skan.odczytane} z ${skan.narzedzi} odczytanych` : "sprawdzane ręcznie"}</dd>
            </div>
            <div>
              <dt className="bai-mono">Ostatni skan</dt>
              <dd>{skan ? dataPoPolsku(skan.skan) : dataPoPolsku(sprawdzonoPromocje() || "2026-11-25")}</dd>
            </div>
            <div>
              <dt className="bai-mono">Na liście</dt>
              <dd>tylko oferty potwierdzone na stronie producenta</dd>
            </div>
            <div>
              <dt className="bai-mono">Kolejność</dt>
              <dd>od największego rabatu, bez płatnych miejsc</dd>
            </div>
          </dl>
          <p className="bai-katalog-zasada">
            Strony, których nie da się odczytać automatycznie (blokady, treść ładowana skryptem), sprawdzam ręcznie albo pomijam. Nie podaję rabatów, których nie potwierdza
            strona producenta. Pełny katalog narzędzi: <Link href={BAZA_NARZEDZI}>wszystkie wpisy</Link>.
          </p>
        </section>

        <Zglos />

        <section className="bai-pytania-bw">
          <h2 className="bai-h2-maly">Pytania</h2>
          {faq.map(([q, a]) => (
            <details key={q} className="bai-bw-zrodlo">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      </div>
    </>
  );
}
