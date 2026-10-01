import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { ROZMOW_DZIENNIE, pobierzKonto, pobierzRozmowy, stanDostepu, zuzyteSekundy, type Kryterium } from "@/lib/bruno/db";
import { NAZWY } from "@/lib/bruno/kryteria";
import { Licznik, Ocena, Pierscien, Slupki, rozmowyNaDni } from "@/components/bruno/statystyki";

export const dynamic = "force-dynamic";

// „Statystyki" (USER_001 1.10): to, co wyleciało z panelu (minuty, rozmowy
// ocenione, średnia, ostatnia) + średnia na każde kryterium rubryki + słupki
// z całego okresu testu.

export default async function BrunoStatystykiPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  const stan = stanDostepu(konto);
  const [zuzyte, wszystkie] = await Promise.all([zuzyteSekundy(email), pobierzRozmowy(email, 500)]);

  const ocenione = wszystkie.filter((r) => r.status === "zakonczona" && r.ocena);
  const srednia = ocenione.length ? Math.round((ocenione.reduce((s, r) => s + (r.ocena ?? 0), 0) / ocenione.length) * 10) / 10 : null;
  const ostatnia = ocenione[0];
  const minutLimit = Math.round(konto.limit_sekund / 60);
  const minutZostalo = Math.max(0, Math.floor((konto.limit_sekund - zuzyte) / 60));

  const kolejnosc: Kryterium["nazwa"][] = ["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"];
  const kryteria = kolejnosc.map((n) => {
    const oceny = ocenione.flatMap((r) => r.feedback?.kryteria?.filter((k) => k.nazwa === n).map((k) => k.ocena) ?? []);
    return { nazwa: n, srednia: oceny.length ? Math.round((oceny.reduce((s, o) => s + o, 0) / oceny.length) * 10) / 10 : null };
  });

  const dniTestu = Math.max(7, Math.min(konto.dni, 14));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem] text-center">
        Twoje <span className="bruno-gradient-tekst">statystyki</span>
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Pierscien wartosc={minutLimit - minutZostalo} max={minutLimit} liczba={`${minutZostalo}`} opis="minut zostało" uwaga={`z ${minutLimit} w teście`} />
        <Licznik liczba={`${ocenione.length}`} opis={ocenione.length === 1 ? "rozmowa oceniona" : "rozmów ocenionych"} uwaga={`${stan.dniZostalo} ${stan.dniZostalo === 1 ? "dzień" : "dni"} dostępu zostało`} />
        <Ocena wartosc={srednia} opis="średnia ocena" uwaga="ze wszystkich ocenionych" />
        <Ocena wartosc={ostatnia?.ocena ?? null} opis="ostatnia ocena" uwaga={ostatnia ? new Date(ostatnia.start).toLocaleDateString("pl-PL") : undefined} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-start">
        <Slupki dni={rozmowyNaDni(wszystkie, dniTestu)} cel={ROZMOW_DZIENNIE} tytul={`Rozmowy w ostatnich ${dniTestu} dniach`} />

        <section className="bruno-szklo rounded-2xl p-4 sm:p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="bruno-h2 text-base">Średnia na kryterium</h2>
            <span className="text-[11px] text-slate-400">skala 1-10</span>
          </div>
          {ocenione.length === 0 ? (
            <p className="text-sm text-slate-600">Pojawi się po pierwszej ocenionej rozmowie.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {kryteria.map((k) => (
                <li key={k.nazwa}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-slate-800 font-medium">{NAZWY[k.nazwa]}</span>
                    <span className="text-slate-600 tabular-nums">{k.srednia ?? "–"}</span>
                  </div>
                  <div className="h-1.5 mt-1 rounded-full bg-cyan-900/10 overflow-hidden" aria-hidden>
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-teal-700" style={{ width: `${((k.srednia ?? 0) / 10) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
