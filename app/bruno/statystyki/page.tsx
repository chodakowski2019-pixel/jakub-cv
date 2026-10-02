import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { limitDzienny, pobierzKonto, pobierzRozmowy, stanDostepu, zuzyteSekundy, type Kryterium } from "@/lib/bruno/db";
import { NAZWY } from "@/lib/bruno/kryteria";
import { postepScenariuszy } from "@/lib/bruno/scenariusze";
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
  const [zuzyte, wszystkie, scenariusze] = await Promise.all([zuzyteSekundy(email), pobierzRozmowy(email, 500), postepScenariuszy(email)]);

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
        <Slupki dni={rozmowyNaDni(wszystkie, dniTestu)} cel={limitDzienny(konto)} tytul={`Rozmowy w ostatnich ${dniTestu} dniach`} />

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

      {/* Ten sam scenariusz = ten sam egzamin (2.10). Dowód postępu, nie średnia ze wszystkiego. */}
      <section className="bruno-szklo rounded-2xl p-4 sm:p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="bruno-h2 text-base">Ten sam scenariusz</h2>
          <span className="text-[11px] text-slate-400">pierwsza → ostatnia próba</span>
        </div>
        {scenariusze.length === 0 ? (
          <p className="text-sm text-slate-600">
            Pojawi się, gdy powtórzysz rozmowę z tym samym ustawieniem kreatora (ten sam tryb, typ klienta, cel i obiekcje). Dopiero dwa podejścia do tego samego
            egzaminu pokazują postęp.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {scenariusze.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 border-b border-cyan-900/10 last:border-0 pb-3 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 font-medium truncate">{s.nazwa}</p>
                  <p className="text-[11px] text-slate-500">
                    {s.proby} {s.proby === 1 ? "próba" : s.proby < 5 ? "próby" : "prób"} · najlepsza {s.najlepsza}/10
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 tabular-nums">
                  <span className="text-sm text-slate-500">{s.pierwsza}</span>
                  <span className="text-slate-400" aria-hidden>
                    →
                  </span>
                  <span className="text-lg font-semibold text-slate-900">{s.ostatnia}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      s.zmiana > 0 ? "bg-teal-900/10 text-teal-800" : s.zmiana < 0 ? "bg-rose-900/10 text-rose-800" : "bg-slate-900/5 text-slate-600"
                    }`}
                  >
                    {s.zmiana > 0 ? `+${s.zmiana}` : s.zmiana}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
