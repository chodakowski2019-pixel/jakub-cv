"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/bruno/jezyk-kontekst";
import { OBSZARY, PYTANIA, SKALA, braki, type Obszar, type Odpowiedzi } from "@/lib/bruno/ankieta";

// 21.10 (USER_001): ankieta Mazura przed treningiem i co 30 dni. 4 kroki do przeklikania:
// pasek postępu u góry, na raz widać 1 blok. Jak w formularzu spotkania (21.10): przycisk zawsze
// aktywny, brakujące pytania w kroku = czerwony tytuł + przewinięcie do pierwszego.

const CZERWONY = "#ff6b6b";

export default function AnkietaForm() {
  const { t, jezyk } = useT();
  const router = useRouter();
  const [o, setO] = useState<Odpowiedzi>({});
  const [probowal, setProbowal] = useState(false);
  const [krok, setKrok] = useState(0);
  const [stan, setStan] = useState<"idle" | "zapis" | "blad">("idle");
  const [blad, setBlad] = useState<string | null>(null);
  const brak = new Set(probowal ? braki(o) : []);
  const ustaw = (id: string, v: string | number) => setO((x) => ({ ...x, [id]: v }));

  const bloki = (Object.keys(OBSZARY) as Obszar[]).map((ob) => ({ ob, pytania: PYTANIA.filter((p) => p.obszar === ob) }));
  const ostatni = krok === bloki.length - 1;
  const przed = bloki.slice(0, krok).reduce((n, b) => n + b.pytania.length, 0);
  const brakWKroku = braki(o).filter((id) => bloki[krok].pytania.some((p) => p.id === id)).length;
  const komplet = brakWKroku === 0;

  const wyslij = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    const wKroku = new Set(bloki[krok].pytania.map((p) => p.id));
    const b = braki(o).filter((id) => wKroku.has(id));
    if (b.length) {
      setProbowal(true);
      document.getElementById(`pyt-${b[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setProbowal(false);
    if (!ostatni) {
      setKrok((k) => k + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStan("zapis");
    const res = await fetch("/api/bruno/ankieta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ odpowiedzi: o }) });
    const d = (await res.json().catch(() => null)) as { ok?: boolean; blad?: string } | null;
    if (res.ok && d?.ok) {
      window.scrollTo({ top: 0 });
      router.refresh();
      return;
    }
    setBlad(d?.blad ?? t("Could not save. Try again.", "Nie udało się zapisać. Spróbuj ponownie."));
    setStan("blad");
  };

  let nr = przed;

  return (
    <form onSubmit={wyslij} noValidate className="flex flex-col gap-6 max-w-2xl w-full mx-auto">
      {/* Jeden pasek w 4 odcinkach, układ inline (21.10: klasy siatki nie zadziałały w układzie Bruno, odcinki stanęły w kolumnie). */}
      <div className="pt-2 pb-1">
        <div className="flex items-center justify-between text-xs opacity-70 mb-2">
          <span>{OBSZARY[bloki[krok].ob][jezyk]}</span>
          <span>{krok + 1} / {bloki.length}</span>
        </div>
        <div role="progressbar" aria-valuemin={1} aria-valuemax={bloki.length} aria-valuenow={krok + 1} style={{ display: "flex", gap: 6 }}>
          {bloki.map((b, i) => (
            <div key={b.ob} className="bruno-pasek-tlo" style={{ flex: 1, height: 6, borderRadius: 999, overflow: "hidden" }}>
              <div className="bruno-pasek" style={{ height: "100%", borderRadius: 999, width: i <= krok ? "100%" : "0%", transition: "width .5s" }} />
            </div>
          ))}
        </div>
      </div>

      {[bloki[krok]].map(({ ob, pytania }) => (
        <section key={ob} className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          {/* 21.10 USER: pierwszy blok bez tytułu, nagłówek strony mówi już „17 pytań o Twoje podejście do sprzedaży”. */}
          {ob !== "sprzedaz" && <h2 className="bruno-h1 text-xl sm:text-2xl">{OBSZARY[ob][jezyk]}</h2>}
          {pytania.map((p) => {
            nr += 1;
            const zly = brak.has(p.id);
            const etykieta = (
              <span className="block text-base sm:text-lg font-semibold leading-snug" style={zly ? { color: CZERWONY } : undefined}>
                {nr}. {p.tekst[jezyk]}
              </span>
            );
            return (
              <div key={p.id} id={`pyt-${p.id}`} className="flex flex-col gap-2 scroll-mt-24 bruno-pytanie" data-gotowe={o[p.id] !== undefined && o[p.id] !== "" ? "1" : undefined}>
                {p.typ === "skala" && (
                  <fieldset>
                    <legend className="bruno-etykieta">{etykieta}</legend>
                    {/* 21.10 USER: kółka z cyframi, wybrane złote i większe, podpis pod każdym. */}
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mt-3">
                      {SKALA.map((s, i) => {
                        const v = i + 1;
                        const on = o[p.id] === v;
                        return (
                          <button key={v} type="button" aria-pressed={on} aria-label={s[jezyk]} onClick={() => ustaw(p.id, v)} className="bruno-kolo-wybor" data-on={on ? "1" : undefined}>
                            <span className="bruno-kolo" aria-hidden>{v}</span>
                            <span className="bruno-kolo-podpis">{i === 0 || i === SKALA.length - 1 ? s[jezyk] : ""}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
                {p.typ === "wybor" && (
                  <fieldset>
                    <legend className="bruno-etykieta">{etykieta}</legend>
                    <div className="flex flex-col sm:flex-row gap-2 mt-1">
                      {p.opcje?.map((x) => (
                        <button
                          key={x.id}
                          type="button"
                          aria-pressed={o[p.id] === x.id}
                          onClick={() => ustaw(p.id, x.id)}
                          className={`${o[p.id] === x.id ? "bruno-przycisk" : "bruno-przycisk-2"} text-sm px-4 py-2.5 flex-1`}
                        >
                          {x.tekst[jezyk]}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                {p.typ === "tekst" && (
                  <>
                    <label className="bruno-etykieta" htmlFor={`in-${p.id}`}>{etykieta}</label>
                    <textarea id={`in-${p.id}`} className="bruno-pole" rows={3} maxLength={1000} value={String(o[p.id] ?? "")} onChange={(e) => ustaw(p.id, e.target.value)} />
                  </>
                )}
                {p.typ === "liczba" && (
                  <>
                    <label className="bruno-etykieta" htmlFor={`in-${p.id}`}>{etykieta}</label>
                    <input id={`in-${p.id}`} className="bruno-pole" type="number" inputMode="numeric" min={0} max={100000} placeholder={t("e.g. 30", "np. 30")} value={String(o[p.id] ?? "")} onChange={(e) => ustaw(p.id, e.target.value)} />
                  </>
                )}
              </div>
            );
          })}
        </section>
      ))}

      {blad && <p className="text-sm text-center" style={{ color: CZERWONY }} role="alert">{blad}</p>}
      <div className="flex gap-2">
        {krok > 0 && (
          <button type="button" onClick={() => { setProbowal(false); setKrok((k) => k - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="bruno-przycisk-2 text-base py-3 px-5">
            ← {t("Back", "Wstecz")}
          </button>
        )}
        {komplet ? (
          <button type="submit" disabled={stan === "zapis"} className={`bruno-przycisk text-base py-3 flex-1 ${stan === "zapis" ? "bruno-czeka" : ""}`} aria-busy={stan === "zapis"}>
            {stan === "zapis" && <span className="bruno-kolko" aria-hidden />}
            {stan === "zapis" ? t("Saving...", "Zapisuję...") : ostatni ? t("See my result →", "Pokaż mój wynik →") : t("Next →", "Dalej →")}
          </button>
        ) : (
          <p className="flex-1 self-center text-center text-sm opacity-60">
            {t("Answer all questions:", "Odpowiedz na wszystkie pytania:")} {bloki[krok].pytania.length - brakWKroku} / {bloki[krok].pytania.length}
          </p>
        )}
      </div>
    </form>
  );
}
