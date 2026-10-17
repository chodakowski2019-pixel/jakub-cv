import type { Metadata } from "next";
import Lista from "@/components/bruno/praca/lista";
import { Stopka } from "@/components/bruno/praca/wspolne";
import { Nav } from "@/components/bruno/praca/nav";
import s from "@/components/bruno/praca/praca.module.css";
import { CENA_MIESIAC, doListy, ofertyPubliczne, podgladWszystkich } from "@/lib/bruno/praca/oferty";

// 17.10 (USER_001): salesbruno.com/praca = oferty pracy dla handlowców w Polsce.
// Publicznie tylko AKTYWNE (50 zł/mc). Lokalnie ?podglad=wszystkie pokazuje też nieaktywne.
export const dynamic = "force-dynamic";

const tytul = "Praca dla handlowców | Nowoczesny portal pracy w sprzedaży";
const opis = "Oferty pracy dla handlowców, przedstawicieli i doradców klienta. Najnowsze oferty pracy w sprzedaży z całej Polski. Rozmowy z klientem poćwiczysz z AI na SalesBruno.pl.";

export const metadata: Metadata = {
  metadataBase: new URL("https://salesbruno.com"),
  title: `${tytul} | Bruno AI`,
  description: opis,
  alternates: { canonical: "/praca" },
  openGraph: { title: tytul, description: opis, url: "/praca", siteName: "Bruno AI", locale: "pl_PL", type: "website", images: [{ url: "/bruno/og-bruno.png", width: 1200, height: 630 }] },
  // Do startu (pierwsze aktywne ogłoszenia) poza indeksem.
  robots: { index: false, follow: true },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const podglad = podgladWszystkich((await searchParams).podglad);
  const oferty = (await ofertyPubliczne()).map(doListy);
  return (
    <div className={s.root} lang="pl">
      <Nav />
      <header className={s.hero}>
        <span className={s.znaczek}>
          <i className={s.live} /> {oferty.length.toLocaleString("pl-PL")} ofert dla handlowców
        </span>
        <h1 className={`${s.h1} ${s.h1Portal}`}>
          Znajdź pracę <span className={s.pomarancz}>w sprzedaży</span>
          <br />
          dostosowaną do Ciebie
        </h1>
        <p className={s.lead}>Najnowsze oferty pracy z całej Polski</p>
      </header>
      <Lista oferty={oferty} cena={CENA_MIESIAC} teraz={Date.now()} podglad={podglad} />
      <Stopka />
    </div>
  );
}
