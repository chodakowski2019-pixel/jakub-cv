"use client";

import { useRouter } from "next/navigation";
import Rezerwacja, { type DaneStartowe } from "@/components/podglad/bruno-lp/rezerwacja";
import s from "@/components/podglad/bruno-lp/bruno-lp.module.css";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 18.10 (USER_001): już tylko kalendarz (bez nagłówka i kafelków).
// 17.10 (USER_001): Bruno tylko B2B. Strona sprzedażowa po rozmowie demo (dawniej cennik Bruno Pro):
// BEZ CEN (cenę USER_001 podaje na rozmowie), tylko to, co Bruno naprawdę ma dziś, i kalendarz USER_001
// (ten sam formularz co na stronie firm, z danymi konta). Zasada: nie obiecujemy funkcji, których nie ma.

export default function ZespolDemo({ dane }: { dane: DaneStartowe }) {
  const { jezyk } = useT();
  const router = useRouter();
  // 18.10 (USER_001): na tej stronie TYLKO kalendarz, bez nagłówka i 6 punktów (opis był w ostatniej chmurce).
  return (
    <div className="flex flex-col gap-8">
      {/* Kalendarz = formularz ze strony firm (wygląd LP), w jasnej karcie. */}
      <div
        id="rozmowa"
        className={`${s.root} bruno-lp-jasne rounded-3xl overflow-hidden`}
        style={{ minHeight: 0, ["--head" as string]: "var(--font-outfit), system-ui, sans-serif", ["--body" as string]: "var(--font-open-sans), system-ui, sans-serif" }}
      >
        <div className="[&>section]:!min-h-0 [&>section]:!pt-10">
          <Rezerwacja jezyk={jezyk === "pl" ? "pl" : "en"} start={dane} zrodlo="bruno-demo" onWstecz={() => router.push("/bruno/panel")} />
        </div>
      </div>
    </div>
  );
}
