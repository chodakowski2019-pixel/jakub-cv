"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Konfig } from "@/lib/bruno/db";
import { POSTACIE, type PostacId } from "@/lib/bruno/postacie";

// „Dostosuj Bruno" (USER_001 30.09): pula obiekcji i opis klienta, które
// Bruno czyta przed rozmową. Na start wypełnia USER_001 z ankiety, tester edytuje.

export default function DostosujForm({ start }: { start: Konfig }) {
  const router = useRouter();
  const [f, setF] = useState({
    produkt: start.produkt,
    klient: start.klient,
    obiekcje: start.obiekcje,
    udana_rozmowa: start.udana_rozmowa,
    skrypt: start.skrypt,
    postac: start.postac as PostacId,
  });
  const [stan, setStan] = useState<"idle" | "zapis" | "ok" | "blad">("idle");

  const pole = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  const zapisz = async (e: React.FormEvent) => {
    e.preventDefault();
    setStan("zapis");
    const res = await fetch("/api/bruno/konfig", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setStan(res.ok ? "ok" : "blad");
    if (res.ok) router.refresh();
  };

  const liczbaObiekcji = f.obiekcje.split(/\r?\n/).filter((l) => l.trim().length >= 3).length;

  return (
    <form onSubmit={zapisz} className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
      <div>
        <label className="bruno-etykieta" htmlFor="produkt">Co sprzedajesz</label>
        <textarea id="produkt" rows={3} className="bruno-pole" placeholder="np. obsługę roszczeń za służebność przesyłu dla właścicieli gruntów, wynagrodzenie 30 % od wygranej" value={f.produkt} onChange={pole("produkt")} maxLength={1500} />
      </div>
      <div>
        <label className="bruno-etykieta" htmlFor="klient">Kim jest klient, którego gra Bruno</label>
        <textarea id="klient" rows={4} className="bruno-pole" placeholder="np. rolnik 55 lat, ma słup na polu od 20 lat, nie ufa kancelariom, boi się kosztów, decyduje z żoną" value={f.klient} onChange={pole("klient")} maxLength={2000} />
      </div>
      <div>
        <label className="bruno-etykieta" htmlFor="obiekcje">
          Obiekcje, które słyszysz najczęściej <span className="font-normal text-slate-400">(jedna na linię, {liczbaObiekcji} {liczbaObiekcji === 1 ? "obiekcja" : "obiekcji"})</span>
        </label>
        <textarea id="obiekcje" rows={6} className="bruno-pole font-mono text-[14px]" placeholder={"Za drogo\nMuszę to przemyśleć\nMamy już prawnika\nTo nie ma sensu, nic nie wygramy"} value={f.obiekcje} onChange={pole("obiekcje")} maxLength={3000} />
        <p className="text-xs text-slate-400 mt-1">Każda obiekcja to osobna karta powtórek. Bruno wraca do tych, które zbijasz najsłabiej.</p>
      </div>
      <div>
        <label className="bruno-etykieta" htmlFor="udana">Co znaczy udana rozmowa</label>
        <input id="udana" className="bruno-pole" placeholder="np. klient zgadza się na spotkanie z pełnomocnikiem w tym tygodniu" value={f.udana_rozmowa} onChange={pole("udana_rozmowa")} maxLength={1000} />
      </div>
      <div>
        <label className="bruno-etykieta" htmlFor="skrypt">Skrypt rozmowy <span className="font-normal text-slate-400">(opcjonalnie)</span></label>
        <textarea id="skrypt" rows={6} className="bruno-pole text-[14px]" placeholder="Wklej skrypt, jeśli masz. Trener sprawdzi, czy się go trzymasz tam, gdzie warto." value={f.skrypt} onChange={pole("skrypt")} maxLength={8000} />
      </div>

      <fieldset>
        <legend className="bruno-etykieta mb-2">Domyślna postać Bruno <span className="font-normal text-slate-400">(przed każdą rozmową możesz wybrać inną)</span></legend>
        <div className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(POSTACIE) as PostacId[]).map((id) => {
            const p = POSTACIE[id];
            const wybrany = f.postac === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={wybrany}
                onClick={() => setF((x) => ({ ...x, postac: id }))}
                className={`bruno-szklo rounded-2xl p-4 text-left transition-[transform,border-color,box-shadow] duration-100 active:scale-[0.98] ${wybrany ? "border-cyan-700/60 ring-2 ring-cyan-700/20" : "hover:border-slate-300"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="bruno-h2 text-base">{p.nazwa}</div>
                  <span className={`size-4 rounded-full border-2 shrink-0 ${wybrany ? "border-cyan-700 bg-cyan-700" : "border-slate-300"}`} aria-hidden />
                </div>
                <div className="text-sm text-slate-600 mt-1">{p.opis}</div>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={stan === "zapis"} className="bruno-przycisk">{stan === "zapis" ? "Zapisuję..." : "Zapisz"}</button>
        {stan === "ok" && <span className="text-sm text-teal-800">Zapisane. Bruno użyje tego w następnej rozmowie.</span>}
        {stan === "blad" && <span className="text-sm text-red-700">Nie udało się zapisać.</span>}
      </div>
    </form>
  );
}
