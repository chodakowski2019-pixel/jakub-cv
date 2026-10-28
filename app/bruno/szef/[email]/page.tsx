import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { etykiety } from "@/lib/bruno/etykiety";
import { czySzef, handlowcyFirmy, handlowiecFirmy, pobierzFirme, rozmowyZespolu } from "@/lib/bruno/firmy";
import { locale, mnoga } from "@/lib/bruno/i18n";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { postacLubDomyslna } from "@/lib/bruno/postacie";
import { KRYTERIA, ocenyHandlowca, tygodnieRozmow, statystykiHandlowca, statystykiZespolu } from "@/lib/bruno/zespol";
import { MiniWykres, RadarHandlowca, RozmowyTygodniowo } from "@/components/bruno/zespol-wykresy";
import { Kafelek, Naglowek, OcenaKolko, Trend } from "@/components/bruno/zespol-widok";

export const dynamic = "force-dynamic";

// 25.10 (USER_001): PROFIL HANDLOWCA w panelu szefa: liczby, 5 kryteriów, słupki 14 dni, lista rozmów
// (klient, obiekcja, ocena, najsłabsze, poprawka). Klik w rozmowę = pełny feedback + transkrypcja.

export default async function BrunoSzefHandlowiecPage({ params }: { params: Promise<{ email: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto || !czySzef(konto)) redirect("/bruno/panel");
  const { email: surowy } = await params;
  const handlowiec = await handlowiecFirmy(konto.firma_id!, decodeURIComponent(surowy).toLowerCase());
  if (!handlowiec) notFound();
  // 28.10: cały zespół (30 dni) do średniej zespołu na radarze.
  const [firma, zespol, { t, jezyk }] = await Promise.all([pobierzFirme(konto.firma_id), handlowcyFirmy(konto.firma_id!), tSerwer()]);
  const rozmowyWszystkie = await rozmowyZespolu(zespol.map((h) => h.email), 30);
  const rozmowy = rozmowyWszystkie.filter((r) => r.email === handlowiec.email);
  const { NAZWY, POSTACIE } = etykiety(jezyk);
  const s = statystykiHandlowca(handlowiec, rozmowy);
  const sredniaZespolu = zespol.length > 1 ? statystykiZespolu(zespol.map((h) => statystykiHandlowca(h, rozmowyWszystkie.filter((r) => r.email === h.email)))).kryteria : null;

  return (
    <div className="flex flex-col gap-6 bsz">
      <div>
        <Link href="/bruno/szef" className="text-sm text-slate-500 hover:text-slate-900">← {t("Team", "Zespół")}</Link>
        <div className="mt-2">
          <Naglowek firma={firma} tytul={s.imie} akcent="" podtytul={firma?.nazwa ?? undefined} zdjecie={s.zdjecie} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kafelek liczba={s.rozmow30} opis={t("calls in 30 days", "rozmów w 30 dni")} uwaga={t(`${s.rozmow7} in the last 7`, `${s.rozmow7} w ostatnich 7`)} />
        <Kafelek liczba={s.srednia} dec={1} opis={t("average score", "średnia ocena")} uwaga={t("out of 10", "na 10")} opoznienie={120} />
        <Kafelek liczba={s.najlepsza} opis={t("best call", "najlepsza rozmowa")} uwaga={t("out of 10", "na 10")} opoznienie={240} />
        {/* 28.10 (USER_001: „ładniej”): kafelek trendu = pigułka ze zmianą + mini-wykres ocen + opis. */}
        <div className="bruno-szklo rounded-2xl p-4 sm:p-5 bsz-kafelek bsz-trend">
          <div className="bsz-trend-gora">
            <Trend v={s.trend} jezyk={jezyk} />
            <MiniWykres oceny={ocenyHandlowca(handlowiec.email, rozmowy)} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 leading-tight">{t("Trend", "Trend")}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{t("last 3 calls vs the 3 before", "3 ostatnie rozmowy vs 3 poprzednie")}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* 28.10 (USER_001): tygodniowo zamiast 14 dni. */}
        <RozmowyTygodniowo tygodnie={tygodnieRozmow(rozmowy, 8)} jezyk={jezyk} tytul={t("Calls per week", "Rozmowy tygodniowo")} />
        {/* 28.10 (USER_001): radar 5 kryteriów zamiast listy z paskami. */}
        <RadarHandlowca kryteria={s.kryteria} zespol={sredniaZespolu} nazwy={NAZWY} kolejnosc={KRYTERIA} jezyk={jezyk} najslabsze={s.najslabsze} />
      </div>

      <section className="bruno-szklo rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 flex items-baseline justify-between">
          <h2 className="bruno-h2 text-base">{t("Calls", "Rozmowy")}</h2>
          <span className="text-[11px] text-slate-400">{rozmowy.length} {mnoga(jezyk, rozmowy.length, ["in 30 days", "in 30 days"], ["w 30 dni", "w 30 dni", "w 30 dni"])}</span>
        </div>
        <ul className="bsz-lista">
          {rozmowy.map((r, i) => (
            <li key={r.id} style={{ animationDelay: `${60 + i * 40}ms` }}>
              <Link href={`/bruno/szef/${encodeURIComponent(handlowiec.email)}/${r.id}`} className="bsz-rozmowa">
                <OcenaKolko ocena={r.ocena ?? null} rozmiar={48} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-slate-900 font-medium">
                    {new Date(r.start).toLocaleString(locale(jezyk), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {t("customer", "klient")} {POSTACIE[postacLubDomyslna(r.postac)].nazwa.toLowerCase()}
                    {r.obiekcja ? ` · „${r.obiekcja.split(" | ")[0]}”` : ""}
                  </span>
                  <span className="block text-[12px] text-slate-500 truncate">
                    {r.feedback?.najslabsze ? <span className="bsz-pigulka mr-2">{NAZWY[r.feedback.najslabsze]}</span> : null}
                    {r.feedback?.poprawka ?? ""}
                  </span>
                </span>
                <span className="text-slate-400 text-lg" aria-hidden>›</span>
              </Link>
            </li>
          ))}
          {rozmowy.length === 0 && <li className="p-6 text-sm text-slate-600">{t("No calls in the last 30 days.", "Brak rozmów w ostatnich 30 dniach.")}</li>}
        </ul>
      </section>
    </div>
  );
}
