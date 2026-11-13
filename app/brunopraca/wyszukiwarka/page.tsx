import type { Metadata } from "next";
import Link from "next/link";
import SzukajTrzy from "@/components/bruno/praca/szukaj-trzy";
import WynikWyszukiwarki from "@/components/bruno/praca/wynik-wyszukiwarki";
import g from "@/components/bruno/praca/gielda.module.css";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";

// 12.11 (USER_001: „wyszukiwarka będzie publiczna, jako podstrona »wyszukiwarka«”): salesbruno.pl/wyszukiwarka
// (proxy: /wyszukiwarka → /brunopraca/wyszukiwarka). Bez logowania. 12.11 wieczór (USER_001): start = jedno okienko z 3 źródłami
// (link do oferty, PDF, opis), potem ładujące kółko i wynik: liczba dopasowanych + 3 karty z zamazanym zdjęciem,
// zakup paczki (149 zł), subskrypcji (290 zł / mies.) albo gwarancji (990 zł). Na razie poza indeksem.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL("https://salesbruno.pl"),
  title: "Wyszukiwarka handlowców | Sales Bruno",
  description: "Link do oferty, PDF albo opis. Wyszukiwarka pokazuje, ilu handlowców pasuje, i trzech najlepiej dopasowanych.",
  alternates: { canonical: "/wyszukiwarka" },
  robots: { index: false, follow: false },
};

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
        {opis ? <WynikWyszukiwarki opis={opis} kontoId={firma?.id ?? null} /> : <SzukajTrzy />}
      </main>
    </div>
  );
}
