"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Konfig } from "@/lib/bruno/db";
import { ETAPY, REJESTRY, etapLubDomyslny, rejestrLubDomyslny, type EtapId, type RejestrId } from "@/lib/bruno/etapy";

// „Dostosuj Bruno" (USER_001 30.09): pula obiekcji i opis klienta, które
// Bruno czyta przed rozmową. Na start wypełnia USER_001 z ankiety, tester edytuje.
// Układ 2.10 (USER_001): każde pole = osobna sekcja z numerem, dużym pogrubionym
// nagłówkiem i podpowiedzią pod nim. Bez „udanej rozmowy" (cel wybiera się przed
// każdym testem) i bez „domyślnego typu klienta" (też wybierany przed testem).
// Zapis częściowy: pola nieobecne w formularzu zostają w bazie bez zmian.
//
// 9.10 (rozmowy Aleksandry): etap relacji, forma zwracania się, obiekcje z wyjaśnieniem
// po „ | ", i moduł płatny „Oferta ze strony / PDF" (Claude wypełnia pola z materiałów firmy).

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

type Propozycja = { produkt?: string; klient?: string; obiekcje?: string; skrypt?: string; zrodlo?: string };

export default function DostosujForm({ start, oferta }: { start: Konfig; oferta: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({
    produkt: start.produkt,
    klient: start.klient,
    obiekcje: start.obiekcje,
    skrypt: start.skrypt,
    etap: etapLubDomyslny(start.etap) as EtapId,
    rejestr: rejestrLubDomyslny(start.rejestr) as RejestrId,
  });
  const [stan, setStan] = useState<"idle" | "zapis" | "ok" | "blad">("idle");

  // Import oferty (moduł płatny): adres strony albo PDF → Claude → propozycja pól → handlowiec akceptuje.
  const [url, setUrl] = useState("");
  const plik = useRef<HTMLInputElement | null>(null);
  const [importStan, setImportStan] = useState<"idle" | "czyta" | "blad">("idle");
  const [importBlad, setImportBlad] = useState<string | null>(null);
  const [propozycja, setPropozycja] = useState<Propozycja | null>(null);

  const pole = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  const zapisz = async (e: React.FormEvent) => {
    e.preventDefault();
    setStan("zapis");
    const res = await fetch("/api/bruno/konfig", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setStan(res.ok ? "ok" : "blad");
    if (res.ok) router.refresh();
  };

  const importuj = async () => {
    const file = plik.current?.files?.[0] ?? null;
    if (!url.trim() && !file) {
      setImportBlad("Podaj adres strony albo wybierz plik PDF.");
      setImportStan("blad");
      return;
    }
    setImportStan("czyta");
    setImportBlad(null);
    setPropozycja(null);
    try {
      const fd = new FormData();
      if (url.trim()) fd.append("url", url.trim());
      if (file) fd.append("plik", file);
      const res = await fetch("/api/bruno/oferta", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.blad ?? "Nie udało się odczytać oferty.");
      setPropozycja(d.propozycja);
      setImportStan("idle");
    } catch (e) {
      setImportBlad(e instanceof Error ? e.message : "Nie udało się odczytać oferty.");
      setImportStan("blad");
    }
  };

  const przyjmij = (tryb: "zastap" | "dopisz") => {
    if (!propozycja) return;
    setF((x) => {
      const polacz = (stare: string, nowe?: string) => {
        if (!nowe?.trim()) return stare;
        if (tryb === "zastap" || !stare.trim()) return nowe.trim();
        return `${stare.trim()}\n${nowe.trim()}`;
      };
      return { ...x, produkt: polacz(x.produkt, propozycja.produkt), klient: polacz(x.klient, propozycja.klient), obiekcje: polacz(x.obiekcje, propozycja.obiekcje), skrypt: polacz(x.skrypt, propozycja.skrypt) };
    });
    setPropozycja(null);
    setStan("idle");
  };

  const liczbaObiekcji = f.obiekcje.split(/\r?\n/).filter((l) => l.trim().length >= 3).length;

  return (
    <form onSubmit={zapisz} className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-8">
      {/* 0. Oferta ze strony / PDF (moduł płatny) */}
      <section className="flex gap-4">
        <span className="hidden sm:grid shrink-0 size-8 place-items-center rounded-full bg-slate-900 text-white text-sm font-bold bruno-h2" aria-hidden>
          {oferta ? "AI" : "🔒"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="bruno-h2 text-[17px] sm:text-lg text-slate-900 leading-tight">
            Wczytaj ofertę ze strony albo z PDF <span className="text-xs font-normal text-slate-400">{oferta ? "(wypełnia pola niżej)" : "(Bruno Pro)"}</span>
          </div>
          {oferta ? (
            <>
              <p className="text-[13px] text-slate-500 mt-1 mb-3">Bruno przeczyta Waszą stronę albo ofertę i wypełni pola 1-3: co sprzedajecie, kim jest klient, jakie obiekcje padają. Ty sprawdzasz i zapisujesz.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input id="oferta-url" className="bruno-pole flex-1" placeholder="https://twojafirma.pl/oferta" value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" />
                <input id="oferta-plik" ref={plik} type="file" accept="application/pdf" className="bruno-pole flex-1 text-sm" />
                <button type="button" onClick={importuj} disabled={importStan === "czyta"} className="bruno-przycisk-2 whitespace-nowrap">
                  {importStan === "czyta" ? "Czytam..." : "Wczytaj"}
                </button>
              </div>
              {importStan === "blad" && importBlad && <p className="text-sm text-red-700 mt-2">{importBlad}</p>}
              {propozycja && (
                <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4 text-sm flex flex-col gap-2">
                  <div className="font-semibold text-slate-900">Propozycja z: {propozycja.zrodlo ?? "materiałów"}</div>
                  {propozycja.produkt && <div><span className="text-slate-500">Co sprzedajesz:</span> {propozycja.produkt}</div>}
                  {propozycja.klient && <div><span className="text-slate-500">Klient:</span> {propozycja.klient}</div>}
                  {propozycja.obiekcje && <div><span className="text-slate-500">Obiekcje:</span> <pre className="whitespace-pre-wrap font-sans inline">{propozycja.obiekcje}</pre></div>}
                  <div className="flex flex-wrap gap-2 mt-1">
                    <button type="button" onClick={() => przyjmij("zastap")} className="bruno-przycisk">Zastąp pola</button>
                    <button type="button" onClick={() => przyjmij("dopisz")} className="bruno-przycisk-2">Dopisz do pól</button>
                    <button type="button" onClick={() => setPropozycja(null)} className="text-slate-500 underline px-2">Odrzuć</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-[13px] text-slate-500 mt-1">
              W pełnym dostępie wklejasz adres strony albo PDF z ofertą, a Bruno sam wypełnia pola niżej i zna Waszą ofertę w rozmowie.{" "}
              <Link href="/bruno/odblokuj" className="underline">Odblokuj</Link>.
            </p>
          )}
        </div>
      </section>

      <Sekcja nr={1} tytul="Co sprzedajesz" htmlFor="produkt" podpowiedz="Produkt albo usługa, dla kogo, ile kosztuje i za co klient płaci. Bruno trzyma się tylko tego, co tu jest: nie wymyśla innych modeli ani cen.">
        <textarea id="produkt" rows={3} className="bruno-pole" placeholder="np. obsługę roszczeń za służebność przesyłu dla właścicieli gruntów, wynagrodzenie 30 % od wygranej" value={f.produkt} onChange={pole("produkt")} maxLength={1500} />
      </Sekcja>

      <Sekcja nr={2} tytul="Kim jest klient, którego gra Bruno" htmlFor="klient" podpowiedz="Wiek, sytuacja, czego się boi, kto decyduje. Bruno wejdzie w tę rolę.">
        <textarea id="klient" rows={4} className="bruno-pole" placeholder="np. rolnik 55 lat, ma słup na polu od 20 lat, nie ufa kancelariom, boi się kosztów, decyduje z żoną" value={f.klient} onChange={pole("klient")} maxLength={2000} />
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <label className="text-sm text-slate-600" htmlFor="etap">
            Na jakim etapie jest ten klient
            <select id="etap" className="bruno-pole mt-1" value={f.etap} onChange={pole("etap")}>
              {(Object.keys(ETAPY) as EtapId[]).map((id) => (
                <option key={id} value={id}>{ETAPY[id].nazwa}: {ETAPY[id].opis}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600" htmlFor="rejestr">
            Jak klient zwraca się do Ciebie
            <select id="rejestr" className="bruno-pole mt-1" value={f.rejestr} onChange={pole("rejestr")}>
              {(Object.keys(REJESTRY) as RejestrId[]).map((id) => (
                <option key={id} value={id}>{REJESTRY[id].nazwa}: {REJESTRY[id].opis}</option>
              ))}
            </select>
          </label>
        </div>
      </Sekcja>

      <Sekcja
        nr={3}
        tytul="Obiekcje, które słyszysz najczęściej"
        htmlFor="obiekcje"
        podpowiedz={
          <>
            Jedna na linię. Po „ | ” możesz dopisać, co klient ma na myśli, np. <span className="font-mono">Będziemy oddawać pieniądze | boi się zwrotu dotacji</span>. Każda obiekcja to osobna karta powtórek.{" "}
            <span className="font-semibold text-slate-700">{liczbaObiekcji} {liczbaObiekcji === 1 ? "obiekcja" : liczbaObiekcji >= 2 && liczbaObiekcji <= 4 ? "obiekcje" : "obiekcji"}</span>
          </>
        }
      >
        <textarea id="obiekcje" rows={6} className="bruno-pole font-mono text-[14px]" placeholder={"Za drogo | porównuje z ofertą konkurenta za 3 000 zł\nMuszę to przemyśleć\nMamy już prawnika\nTo nie ma sensu, nic nie wygramy"} value={f.obiekcje} onChange={pole("obiekcje")} maxLength={3000} />
      </Sekcja>

      <Sekcja nr={4} tytul="Skrypt rozmowy" htmlFor="skrypt" podpowiedz="Opcjonalnie. Trener sprawdzi, czy się go trzymasz tam, gdzie warto.">
        <textarea id="skrypt" rows={6} className="bruno-pole text-[14px]" placeholder="Wklej skrypt, jeśli masz." value={f.skrypt} onChange={pole("skrypt")} maxLength={8000} />
      </Sekcja>

      <div className="flex items-center gap-4 sm:pl-12">
        <button type="submit" disabled={stan === "zapis"} className="bruno-przycisk">{stan === "zapis" ? "Zapisuję..." : "Zapisz"}</button>
        {stan === "ok" && <span className="text-sm text-teal-800">Zapisane. Bruno użyje tego w następnej rozmowie.</span>}
        {stan === "blad" && <span className="text-sm text-red-700">Nie udało się zapisać.</span>}
      </div>
    </form>
  );
}
