import type { Metadata } from "next";
import { redirect } from "next/navigation";
import KontoForm from "@/components/bruno/praca/konto-form";
import { Stopka } from "@/components/bruno/praca/wspolne";
import { Nav } from "@/components/bruno/praca/nav";
import s from "@/components/bruno/praca/praca.module.css";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";

// 17.10 (USER_001): /praca/konto?typ=kandydat|pracodawca&tryb=logowanie|rejestracja. Zalogowany → panel.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Konto | SalesBruno.pl Praca", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (await zalogowanePraca()) redirect("/praca/panel");
  const sp = await searchParams;
  const typ = sp.typ === "pracodawca" ? "pracodawca" : "kandydat";
  const tryb = sp.tryb === "logowanie" ? "logowanie" : "rejestracja";
  return (
    <div className={s.root} lang="pl">
      <Nav />
      <main className={s.stronaKonta}>
        <div className={s.kontoKarta}>
          <KontoForm typ={typ} tryb={tryb} dalej={typeof sp.dalej === "string" && sp.dalej.startsWith("/praca") ? sp.dalej : undefined} />
        </div>
      </main>
      <Stopka />
    </div>
  );
}
