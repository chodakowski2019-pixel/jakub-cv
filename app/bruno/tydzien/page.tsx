import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { kartyDoPowtorki, limitDzienny, pobierzKonto, pobierzRozmowy, stanDostepu } from "@/lib/bruno/db";
import { etykiety } from "@/lib/bruno/etykiety";
import { locale } from "@/lib/bruno/i18n";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { postacLubDomyslna } from "@/lib/bruno/postacie";
import { KRYTERIA, statystykiHandlowca } from "@/lib/bruno/zespol";
import { OcenaKolko } from "@/components/bruno/zespol-widok";

export const dynamic = "force-dynamic";

// 28.10 (USER_001: „w narzędziach dodajmy podsumowanie tygodnia: rozmowy z tygodnia i panel, nad czym pracować
// w następnym tygodniu”). Tydzień = pn-nd (Europe/Warsaw). Liczby vs poprzedni tydzień. Plan na następny tydzień
// liczony z danych: 2 najsłabsze kryteria, poprawki Bruno z tego tygodnia, obiekcje z oceną ≤ 6, fiszki do powtórki.

const kluczPL = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
const poniedzialek = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return kluczPL(d);
};
const plusDni = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return kluczPL(d);
};

export default async function BrunoTydzienPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto || !stanDostepu(konto).aktywny) redirect("/bruno/panel");
  const { t, jezyk } = await tSerwer();
  const { NAZWY, POSTACIE } = etykiety(jezyk);
  const loc = locale(jezyk);

  const tenPon = poniedzialek(kluczPL(new Date()));
  const poprzPon = plusDni(tenPon, -7);
  const nastPon = plusDni(tenPon, 7);
  const [wszystkie, karty, { count: fiszekTydzien }] = await Promise.all([
    pobierzRozmowy(email, 300),
    kartyDoPowtorki(email, 50, konto.jezyk),
    // Początek tygodnia w Polsce (zimą +01:00, latem +02:00; godzina różnicy nie zmienia liczby fiszek).
    supabaseAdmin.from("bruno_fiszki").select("id", { count: "exact", head: true }).eq("email", email).gte("utworzono", `${tenPon}T00:00:00+01:00`),
  ]);
  const zakonczone = wszystkie.filter((r) => r.status === "zakonczona");
  const dzien = (r: { start: string }) => kluczPL(new Date(r.start));
  const tenTydzien = zakonczone.filter((r) => dzien(r) >= tenPon && dzien(r) < nastPon).sort((a, b) => b.start.localeCompare(a.start));
  const poprzedni = zakonczone.filter((r) => dzien(r) >= poprzPon && dzien(r) < tenPon);
  const s1 = statystykiHandlowca(konto, tenTydzien);
  const s0 = statystykiHandlowca(konto, poprzedni);

  const data = (iso: string, opcje: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => new Date(`${iso}T12:00:00`).toLocaleDateString(loc, opcje);
  const liczba = (v: number, dec = 1) => v.toLocaleString(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const roznica = (a: number | null, b: number | null, dec = 1) => (a === null || b === null ? null : a - b);
  const Zmiana = ({ v, dec = 1, po = "" }: { v: number | null; dec?: number; po?: string }) =>
    v === null ? <small className="btw-zmiana" data-k="brak">{t("no data from last week", "brak danych z poprzedniego tygodnia")}</small> : (
      <small className="btw-zmiana" data-k={v > 0.05 ? "gora" : v < -0.05 ? "dol" : "zero"}>
        {v > 0 ? "▲ +" : v < 0 ? "▼ " : "= "}{liczba(v, dec)}{po} {t("vs last week", "vs poprzedni tydzień")}
      </small>
    );

  // Nad czym pracować: kryteria od najsłabszego (z oceną w tym tygodniu).
  const kryteriaTydzien = KRYTERIA.filter((k) => s1.kryteria[k] !== null).sort((a, b) => (s1.kryteria[a] as number) - (s1.kryteria[b] as number));
  const slabe = kryteriaTydzien.slice(0, 2);
  // Poprawki Bruno z tego tygodnia (najnowsze, bez powtórek).
  const poprawki = [...new Set(tenTydzien.map((r) => r.feedback?.poprawka?.trim()).filter((p): p is string => Boolean(p)))].slice(0, 3);
  // Obiekcje, które szły słabo (średnia ≤ 6 w tym tygodniu).
  const obiekcjeMapa = new Map<string, number[]>();
  for (const r of tenTydzien) for (const o of r.feedback?.obiekcje_ocena ?? []) obiekcjeMapa.set(o.obiekcja, [...(obiekcjeMapa.get(o.obiekcja) ?? []), o.ocena]);
  const slabeObiekcje = [...obiekcjeMapa.entries()].map(([o, oc]) => ({ obiekcja: o, srednia: oc.reduce((a, b) => a + b, 0) / oc.length })).filter((o) => o.srednia <= 6).sort((a, b) => a.srednia - b.srednia).slice(0, 2);
  const planRozmow = limitDzienny(konto) * 5;
  const klient = (id: string | null) => (jezyk === "pl" ? `klient ${POSTACIE[postacLubDomyslna(id)].nazwa.toLowerCase()}` : `${POSTACIE[postacLubDomyslna(id)].nazwa} customer`);

  return (
    <div className="flex flex-col gap-5 btw">
      <div className="btw-naglowek">
        <div>
          <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]"><span className="bruno-gradient-tekst">{t("Week review", "Podsumowanie tygodnia")}</span></h1>
          <p className="text-slate-500 mt-1">{data(tenPon)} – {data(plusDni(tenPon, 6), { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <Link href="/bruno/rozmowa" className="btw-btn">{t("Talk to Bruno", "Rozmawiaj")}</Link>
      </div>

      <div className="btw-kafelki">
        <div className="btw-kafelek"><b>{s1.rozmow30}</b><span>{t("calls this week", "rozmów w tym tygodniu")}</span><Zmiana v={s1.rozmow30 - s0.rozmow30} dec={0} /></div>
        <div className="btw-kafelek"><b>{s1.srednia === null ? "–" : liczba(s1.srednia)}</b><span>{t("average score", "średnia ocena")}</span><Zmiana v={roznica(s1.srednia, s0.srednia)} /></div>
        <div className="btw-kafelek"><b>{s1.najlepsza ?? "–"}</b><span>{t("best call", "najlepsza rozmowa")}</span><small className="btw-zmiana" data-k="zero">{t("out of 10", "na 10")}</small></div>
        <div className="btw-kafelek"><b>{fiszekTydzien ?? 0}</b><span>{t("flashcards answered", "fiszek odpowiedzianych")}</span><small className="btw-zmiana" data-k="zero">{karty.length} {t("due for review", "do powtórki")}</small></div>
      </div>

      <div className="btw-uklad">
        <section className="btw-karta">
          <div className="btw-hd"><h2>{t("Calls this week", "Rozmowy z tygodnia")}</h2><span>{tenTydzien.length}</span></div>
          {tenTydzien.length === 0 ? (
            <p className="btw-pusto">{t("No calls this week yet.", "W tym tygodniu nie było jeszcze rozmów.")} <Link href="/bruno/rozmowa">{t("Make the first one", "Zrób pierwszą")}</Link>.</p>
          ) : (
            <ul className="btw-lista">
              {tenTydzien.map((r) => (
                <li key={r.id}>
                  <Link href={`/bruno/feedback/${r.id}`}>
                    <OcenaKolko ocena={r.ocena ?? null} rozmiar={44} />
                    <span className="min-w-0 flex-1">
                      <b>{new Date(r.start).toLocaleString(loc, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" })} · {klient(r.postac)}</b>
                      <small>{r.feedback?.najslabsze ? <em>{NAZWY[r.feedback.najslabsze]}</em> : null}{r.feedback?.poprawka ?? (r.ocena === null ? t("not scored", "bez oceny") : "")}</small>
                    </span>
                    <i>›</i>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="btw-karta btw-plan">
          <div className="btw-hd"><h2>{t("Work on next week", "Nad czym pracować w następnym tygodniu")}</h2><span>{data(nastPon)} – {data(plusDni(nastPon, 6))}</span></div>
          <ol className="btw-plan-lista">
            {slabe.map((k) => (
              <li key={k}>
                <b>{NAZWY[k]}: {liczba(s1.kryteria[k] as number)}/10</b>
                <span>
                  {s0.kryteria[k] !== null ? t(`Last week ${liczba(s0.kryteria[k] as number)}. `, `W poprzednim tygodniu ${liczba(s0.kryteria[k] as number)}. `) : ""}
                  {t("Weakest area this week. Goal: +1 point.", "Najsłabsze kryterium tego tygodnia. Cel: +1 punkt.")}
                </span>
              </li>
            ))}
            {slabeObiekcje.map((o) => (
              <li key={o.obiekcja}>
                <b>{t("Objection", "Obiekcja")} „{o.obiekcja}”: {liczba(o.srednia)}/10</b>
                <span>{t("Practice this one in drills before the next call.", "Przećwicz ją w treningu przed następną rozmową.")}</span>
              </li>
            ))}
            {poprawki.map((p) => (
              <li key={p}>
                <b>{t("Bruno's tip", "Poprawka od Bruno")}</b>
                <span>{p}</span>
              </li>
            ))}
            <li>
              <b>{t("Plan", "Plan")}: {planRozmow} {t("calls", "rozmów")} · {karty.length} {t("flashcards", "fiszek")}</b>
              <span>{t(`${limitDzienny(konto)} calls a day with Bruno and the flashcards due for review.`, `${limitDzienny(konto)} rozmów dziennie z Bruno i fiszki do powtórki.`)}</span>
            </li>
          </ol>
          {slabe.length === 0 && poprawki.length === 0 && <p className="btw-pusto">{t("Make a call this week and Bruno will build the plan from it.", "Zrób rozmowę w tym tygodniu, a Bruno ułoży z niej plan.")}</p>}
          <div className="btw-plan-btns">
            <Link href="/bruno/trening" className="btw-btn">{t("Drills", "Trening")}</Link>
            <Link href="/bruno/rozmowa" className="btw-btn btw-btn-2">{t("Talk to Bruno", "Rozmawiaj")}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
