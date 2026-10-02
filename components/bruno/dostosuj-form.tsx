"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Konfig } from "@/lib/bruno/db";
import { POSTACIE, type PostacId } from "@/lib/bruno/postacie";

// „Dostosuj Bruno" (USER_001 30.09): pula obiekcji i opis klienta, które
// Bruno czyta przed rozmową. Na start wypełnia USER_001 z ankiety, tester edytuje.
// Układ 2.10 (USER_001): każde pole = osobna sekcja z numerem, dużym pogrubionym
// nagłówkiem i podpowiedzią pod nim, zamiast małej szarej etykiety.

function Sekcja({ nr, tytul, podpowiedz, htmlFor, children }: { nr: number; tytul: string; podpowiedz?: React.ReactNode; htmlFor?: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-4">
      <span className="hidden sm:grid shrink-0 size-8 place-items-center rounded-full bg-gradient-to-br from-cyan-700 to-teal-700 text-white text-sm font-bold bruno-h2" aria-hidden>
        {nr}
      </span>
      <div className="min-w-0 flex-1">
        <label htmlFor={htmlFor} className="block bruno-h2 text-[17px] sm:text-lg text-slate-900 leading-tight">
          <span className="sm:hidden bruno-gradient-tekst mr-1.5">{nr}.</span>
          {tytul}
        </label>
        {podpowiedz && <p className="text-[13px] text-slate-500 mt-1 mb-3">{podpowiedz}</p>}
        {!podpowiedz && <div className="mb-3" />}
        {children}
      </div>
    </section>
  );
}

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
    <form onSubmit={zapisz} className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-8">
      <Sekcja nr={1} tytul="Co sprzedajesz" htmlFor="produkt" podpowiedz="Produkt albo usługa, dla kogo, ile kosztuje i za co klient płaci.">
        <textarea id="produkt" rows={3} className="bruno-pole" placeholder="np. obsługę roszczeń za służebność przesyłu dla właścicieli gruntów, wynagrodzenie 30 % od wygranej" value={f.produkt} onChange={pole("produkt")} maxLength={1500} />
      </Sekcja>

      <Sekcja nr={2} tytul="Kim jest klient, którego gra Bruno" htmlFor="klient" podpowiedz="Wiek, sytuacja, czego się boi, kto decyduje. Bruno wejdzie w tę rolę.">
        <textarea id="klient" rows={4} className="bruno-pole" placeholder="np. rolnik 55 lat, ma słup na polu od 20 lat, nie ufa kancelariom, boi się kosztów, decyduje z żoną" value={f.klient} onChange={pole("klient")} maxLength={2000} />
      </Sekcja>

      <Sekcja
        nr={3}
        tytul="Obiekcje, które słyszysz najczęściej"
        htmlFor="obiekcje"
        podpowiedz={
          <>
            Jedna na linię. Każda obiekcja to osobna karta powtórek: Bruno wraca do tych, które zbijasz najsłabiej.{" "}
            <span className="font-semibold text-slate-700">{liczbaObiekcji} {liczbaObiekcji === 1 ? "obiekcja" : liczbaObiekcji >= 2 && liczbaObiekcji <= 4 ? "obiekcje" : "obiekcji"}</span>
          </>
        }
      >
        <textarea id="obiekcje" rows={6} className="bruno-pole font-mono text-[14px]" placeholder={"Za drogo\nMuszę to przemyśleć\nMamy już prawnika\nTo nie ma sensu, nic nie wygramy"} value={f.obiekcje} onChange={pole("obiekcje")} maxLength={3000} />
      </Sekcja>

      <Sekcja nr={4} tytul="Co znaczy udana rozmowa" htmlFor="udana" podpowiedz="Jedno zdanie. Na to Bruno zgodzi się dopiero, gdy na to zasłużysz.">
        <input id="udana" className="bruno-pole" placeholder="np. klient zgadza się na spotkanie z pełnomocnikiem w tym tygodniu" value={f.udana_rozmowa} onChange={pole("udana_rozmowa")} maxLength={1000} />
      </Sekcja>

      <Sekcja nr={5} tytul="Skrypt rozmowy" htmlFor="skrypt" podpowiedz="Opcjonalnie. Trener sprawdzi, czy się go trzymasz tam, gdzie warto.">
        <textarea id="skrypt" rows={6} className="bruno-pole text-[14px]" placeholder="Wklej skrypt, jeśli masz." value={f.skrypt} onChange={pole("skrypt")} maxLength={8000} />
      </Sekcja>

      <Sekcja nr={6} tytul="Domyślny typ klienta" podpowiedz="Cztery kolory DISC. Przed każdą rozmową możesz wybrać inny.">
        <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Domyślny typ klienta">
          {(Object.keys(POSTACIE) as PostacId[]).map((id) => {
            const p = POSTACIE[id];
            const wybrany = f.postac === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={wybrany}
                onClick={() => setF((x) => ({ ...x, postac: id }))}
                className={`bruno-szklo rounded-2xl p-4 text-left transition-[transform,border-color,box-shadow] duration-100 active:scale-[0.98] ${wybrany ? "border-cyan-700/60 ring-2 ring-cyan-700/20" : "hover:border-slate-300"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full shrink-0" style={{ background: p.kolor }} aria-hidden />
                    <div className="bruno-h2 text-base">{p.nazwa}</div>
                    <span className="text-xs text-slate-400">{p.krotko}</span>
                  </div>
                  <span className={`size-4 rounded-full border-2 shrink-0 ${wybrany ? "border-cyan-700 bg-cyan-700" : "border-slate-300"}`} aria-hidden />
                </div>
                <div className="text-sm text-slate-600 mt-1">{p.opis}</div>
              </button>
            );
          })}
        </div>
      </Sekcja>

      <div className="flex items-center gap-4 sm:pl-12">
        <button type="submit" disabled={stan === "zapis"} className="bruno-przycisk">{stan === "zapis" ? "Zapisuję..." : "Zapisz"}</button>
        {stan === "ok" && <span className="text-sm text-teal-800">Zapisane. Bruno użyje tego w następnej rozmowie.</span>}
        {stan === "blad" && <span className="text-sm text-red-700">Nie udało się zapisać.</span>}
      </div>
    </form>
  );
}
