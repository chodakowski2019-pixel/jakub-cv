import type { Metadata } from "next";
import Link from "next/link";
import SzukajHandlowca from "@/components/bruno/praca/szukaj-handlowca";
import WynikSzukania from "@/components/bruno/praca/wynik-szukania";
import g from "@/components/bruno/praca/gielda.module.css";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";

// 12.11 (USER_001: „wyszukiwarka będzie publiczna, jako podstrona »wyszukiwarka«”): salesbruno.pl/wyszukiwarka
// (proxy: /wyszukiwarka → /brunopraca/wyszukiwarka). Bez logowania: kula Bruno, „Opisz, jakiego handlowca szukasz”,
// wynik z kartami bez kontaktu i zakupem kontaktów. Zalogowana firma ma tu też kontakty z konta. Na razie poza indeksem.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL("https://salesbruno.pl"),
  title: "Wyszukiwarka handlowców | Sales Bruno",
  description: "Opisz, jakiego handlowca szukasz. Zobaczysz, ilu sprawdzonych handlowców pasuje. Płacisz tylko za kontakty.",
  alternates: { canonical: "/wyszukiwarka" },
  robots: { index: false, follow: false },
};

const ADRES = "/wyszukiwarka?q=";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = (await searchParams).q;
  const opis = typeof q === "string" ? q : "";
  const konto = await zalogowanePraca();
  const firma = konto?.typ === "pracodawca" ? konto : null;
  return (
    <div className={g.publiczna}>
      <header className={g.publicznaGora}>
        <Link href="/wyszukiwarka" className={g.publicznaLogo}>Sales Bruno</Link>
        <Link href={konto ? "/praca/panel" : "/login"} className="p-btn p-btn-2 p-btn-s">
          {konto ? "Mój panel" : "Zaloguj się"}
        </Link>
      </header>
      <main className={g.publicznaTresc}>
        {opis ? <WynikSzukania opis={opis} kontoId={firma?.id ?? null} naKoncie={firma?.kontakty ?? 0} adres={ADRES} /> : <SzukajHandlowca imie="" adres={ADRES} />}
      </main>
    </div>
  );
}
