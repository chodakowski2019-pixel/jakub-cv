"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Konfig } from "@/lib/bruno/db";
import { etapLubDomyslny, rejestrLubDomyslny, type EtapId, type RejestrId } from "@/lib/bruno/etapy";
import { etykiety } from "@/lib/bruno/etykiety";
import { useT } from "@/components/bruno/jezyk-kontekst";

// „Dostosuj Bruno" (USER_001 30.09): pula obiekcji i opis klienta, które
// Bruno czyta przed rozmową. Na start wypełnia USER_001 z ankiety, tester edytuje.
// Układ 2.10 (USER_001): każde pole = osobna sekcja z numerem, dużym pogrubionym
// nagłówkiem i podpowiedzią pod nim. Bez „udanej rozmowy" (cel wybiera się przed
// każdym testem) i bez „domyślnego typu klienta" (też wybierany przed testem).
// Zapis częściowy: pola nieobecne w formularzu zostają w bazie bez zmian.
//
// 9.10 (rozmowy Aleksandry): etap relacji, forma zwracania się, obiekcje z wyjaśnieniem
// po „ | ", i moduł płatny „Oferta ze strony / PDF" (Claude wypełnia pola z materiałów firmy).
//
// 12.10 (USER_001): (1) zapis AUTOMATYCZNY po każdej zmianie (bez przycisku „Zapisz”),
// (2) oferta ze strony / PDF wypełnia pola OD RAZU, bez „Zastąp / Dopisz” (handlowiec może poprawić),
// PDF rusza zaraz po wybraniu pliku, adres po Enter albo po wyjściu z pola, (3) w trakcie czytania
// kółko postępu zamiast „Czytam…”, (4) wybór: klient to firma (B2B) czy osoba (B2C), domyślnie B2C.

function Sekcja({ nr, tytul, podpowiedz, htmlFor, children }: { nr: number; tytul: string; podpowiedz?: React.ReactNode; htmlFor?: string; children: React.ReactNode }) {
  return (
    // 14.10 (USER_001, telefon): więcej przerwy pod każdą sekcją.
    <section className="flex gap-4 pb-4 sm:pb-0">
      <span className="hidden sm:grid shrink-0 size-8 place-items-center rounded-full bg-gradient-to-br from-cyan-700 to-teal-700 text-white text-sm font-bold bruno-h2" aria-hidden>
        {nr}
      </span>
      <div className="min-w-0 flex-1">
        <label htmlFor={htmlFor} className="block bruno-h2 text-[17px] sm:text-lg text-slate-900 leading-tight">
          <span className="sm:hidden bruno-gradient-tekst mr-1.5">{nr}.</span>
          {tytul}
        </label>
        {podpowiedz && <p className="bruno-opis text-[13px] text-slate-500 mt-1 mb-3">{podpowiedz}</p>}
        {/* 14.10 (telefon): podpowiedź jest schowana (bruno-opis), więc odstęp pod tytułem zawsze. */}
        <div className="mb-3 sm:hidden" />
        {!podpowiedz && <div className="mb-3 hidden sm:block" />}
        {children}
      </div>
    </section>
  );
}

/** Kółko postępu przy czytaniu oferty: rośnie szybko, zwalnia do 95 % (czas odpowiedzi modelu jest nieznany). */
function KolkoPostepu({ etykieta }: { etykieta: string }) {
  const [postep, setPostep] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setPostep(Math.min(0.95, 1 - Math.exp(-(Date.now() - t0) / 9000))), 150);
    return () => clearInterval(id);
  }, []);
  const r = 18;
  const obwod = 2 * Math.PI * r;
  return (
    <div className="inline-flex items-center gap-3" role="status" aria-live="polite">
      <div className="relative size-12 shrink-0">
        <svg viewBox="0 0 44 44" className="size-full -rotate-90" aria-hidden>
          <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(212,175,90,0.18)" strokeWidth="4" />
          <circle cx="22" cy="22" r={r} fill="none" stroke="#d4af5a" strokeWidth="4" strokeLinecap="round" strokeDasharray={obwod} strokeDashoffset={obwod * (1 - postep)} style={{ transition: "stroke-dashoffset 150ms linear" }} />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums">{Math.round(postep * 100)}%</span>
      </div>
      <span className="text-sm text-slate-600">{etykieta}</span>
    </div>
  );
}

type Propozycja = { produkt?: string; klient?: string; obiekcje?: string; skrypt?: string; zrodlo?: string };
type Segment = "b2b" | "b2c";

export default function DostosujForm({ start, oferta }: { start: Konfig; oferta: boolean }) {
  const router = useRouter();
  const { t, jezyk, mnoga } = useT();
  const { ETAPY, REJESTRY } = etykiety(jezyk);
  const [f, setF] = useState({
    segment: (start.segment === "b2b" ? "b2b" : "b2c") as Segment,
    produkt: start.produkt,
    klient: start.klient,
    obiekcje: start.obiekcje,
    skrypt: start.skrypt,
    etap: etapLubDomyslny(start.etap) as EtapId,
    rejestr: rejestrLubDomyslny(start.rejestr) as RejestrId,
  });
  const [stan, setStan] = useState<"idle" | "zmiana" | "zapis" | "ok" | "blad">("idle");

  // Zapis automatyczny: 700 ms po ostatniej zmianie. Pierwsze wejście (dane z bazy) nie zapisuje.
  const pierwszy = useRef(true);
  const ostatni = useRef<string>(JSON.stringify(f));
  useEffect(() => {
    const teraz = JSON.stringify(f);
    if (pierwszy.current) {
      pierwszy.current = false;
      return;
    }
    if (teraz === ostatni.current) return;
    setStan("zmiana");
    const id = setTimeout(async () => {
      setStan("zapis");
      try {
        const res = await fetch("/api/bruno/konfig", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        if (!res.ok) throw new Error();
        ostatni.current = teraz;
        setStan("ok");
        router.refresh();
      } catch {
        setStan("blad");
      }
    }, 700);
    return () => clearTimeout(id);
  }, [f, router]);

  // Import oferty: adres strony albo PDF → Claude → pola wypełnione od razu.
  const [url, setUrl] = useState("");
  const plik = useRef<HTMLInputElement | null>(null);
  const [importStan, setImportStan] = useState<"idle" | "czyta" | "ok" | "blad">("idle");
  const [importBlad, setImportBlad] = useState<string | null>(null);
  const [zrodlo, setZrodlo] = useState<string | null>(null);

  const pole = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  const importuj = async () => {
    if (importStan === "czyta") return;
    const file = plik.current?.files?.[0] ?? null;
    if (!url.trim() && !file) {
      setImportBlad(t("Enter a website address or pick a PDF file.", "Podaj adres strony albo wybierz plik PDF."));
      setImportStan("blad");
      return;
    }
    setImportStan("czyta");
    setImportBlad(null);
    try {
      const fd = new FormData();
      if (url.trim()) fd.append("url", url.trim());
      if (file) fd.append("plik", file);
      const res = await fetch("/api/bruno/oferta", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.blad ?? t("Couldn't read the offer.", "Nie udało się odczytać oferty."));
      const p = d.propozycja as Propozycja;
      // Od razu do pól (zastępuje), bez akceptacji. Puste pola z propozycji nie kasują tego, co już jest.
      setF((x) => ({
        ...x,
        produkt: p.produkt?.trim() || x.produkt,
        klient: p.klient?.trim() || x.klient,
        obiekcje: p.obiekcje?.trim() || x.obiekcje,
        skrypt: p.skrypt?.trim() || x.skrypt,
      }));
      setZrodlo(p.zrodlo ?? null);
      setImportStan("ok");
      if (plik.current) plik.current.value = "";
    } catch (e) {
      setImportBlad(e instanceof Error ? e.message : t("Couldn't read the offer.", "Nie udało się odczytać oferty."));
      setImportStan("blad");
    }
  };

  const wyglądaNaAdres = (u: string) => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+/i.test(u.trim());

  const liczbaObiekcji = f.obiekcje.split(/\r?\n/).filter((l) => l.trim().length >= 3).length;

  const statusZapisu =
    stan === "zmiana" || stan === "zapis" ? (
      <span className="text-sm text-slate-500 inline-flex items-center gap-2">
        <span className="bruno-kolko-ladowania" style={{ borderColor: "rgba(212,175,90,0.3)", borderTopColor: "#d4af5a" }} aria-hidden />
        {t("Saving...", "Zapisuję...")}
      </span>
    ) : stan === "ok" ? (
      <span className="text-sm text-teal-800">{t("Saved. Bruno will use this in your next call.", "Zapisane. Bruno użyje tego w następnej rozmowie.")}</span>
    ) : stan === "blad" ? (
      <span className="text-sm text-red-700">{t("Couldn't save. Check your connection and change the field again.", "Nie udało się zapisać. Sprawdź połączenie i zmień pole jeszcze raz.")}</span>
    ) : (
      <span className="text-sm text-slate-500">{t("Everything you type saves automatically.", "Wszystko, co wpiszesz, zapisuje się samo.")}</span>
    );

  return (
    <form onSubmit={(e) => e.preventDefault()} className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-8">
      {/* 0. Oferta ze strony / PDF */}
      <section className="flex gap-4">
        <span className="hidden sm:grid shrink-0 size-8 place-items-center rounded-full bg-slate-900 text-white text-sm font-bold bruno-h2" aria-hidden>
          {oferta ? "AI" : "🔒"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="bruno-h2 text-[17px] sm:text-lg text-slate-900 leading-tight">
            {t("Import your offer from a website or PDF", "Wczytaj ofertę ze strony albo z PDF")} {/* 14.10 (USER_001): bez „(wypełnia pola 2-4)”. */}{!oferta && <span className="text-xs font-normal text-slate-400">(Bruno Pro)</span>}
          </div>
          {oferta ? (
            <>
              <p className="bruno-opis text-[13px] text-slate-500 mt-1 mb-3">{t("Paste your website address or pick a PDF. Bruno reads it and fills in what you sell, who the customer is, and the objections. You can edit anything after.", "Wklej adres strony albo wybierz PDF. Bruno przeczyta i wypełni: co sprzedajecie, kim jest klient, jakie obiekcje padają. Potem możesz wszystko poprawić.")}</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  id="oferta-url"
                  className="bruno-pole flex-1"
                  placeholder={t("https://yourcompany.com/offer", "https://twojafirma.pl/oferta")}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      importuj();
                    }
                  }}
                  onBlur={() => {
                    if (wyglądaNaAdres(url) && importStan !== "czyta") importuj();
                  }}
                  inputMode="url"
                  disabled={importStan === "czyta"}
                />
                <input id="oferta-plik" ref={plik} type="file" accept="application/pdf" className="bruno-pole flex-1 text-sm" onChange={importuj} disabled={importStan === "czyta"} />
                {importStan === "czyta" ? (
                  <KolkoPostepu etykieta={t("Reading", "Czytam")} />
                ) : (
                  <button type="button" onClick={importuj} className="bruno-przycisk-2 whitespace-nowrap">
                    {t("Import", "Wczytaj")}
                  </button>
                )}
              </div>
              {importStan === "blad" && importBlad && <p className="text-sm text-red-700 mt-2">{importBlad}</p>}
              {importStan === "ok" && (
                <p className="text-sm text-teal-800 mt-2">
                  {t("Done. Fields 2-4 are filled in from:", "Gotowe. Pola 2-4 wypełnione z:")} <b>{zrodlo ?? t("your materials", "materiałów")}</b>. {t("Check them and fix anything that's off.", "Sprawdź je i popraw, co trzeba.")}
                </p>
              )}
            </>
          ) : (
            <p className="bruno-opis text-[13px] text-slate-500 mt-1">
              {t(
                "With full access, you paste your website address or an offer PDF. Bruno fills in the fields below and knows your offer during the call.",
                "W pełnym dostępie wklejasz adres strony albo PDF z ofertą, a Bruno sam wypełnia pola niżej i zna Waszą ofertę w rozmowie.",
              )}{" "}
              <Link href="/bruno/odblokuj" className="underline">{t("Unlock", "Odblokuj")}</Link>.
            </p>
          )}
        </div>
      </section>

      {/* 1. Segment: firma czy osoba (12.10, USER_001), domyślnie B2C. Jeden wybór. */}
      <Sekcja nr={1} tytul={t("Who do you sell to?", "Komu sprzedajesz?")} podpowiedz={t("Bruno plays a different customer for a company than for a private person.", "Bruno gra inaczej firmę, a inaczej osobę prywatną.")}>
        <div className="flex flex-wrap gap-x-6 gap-y-2" role="radiogroup" aria-label={t("Who do you sell to?", "Komu sprzedajesz?")}>
          {(
            [
              ["b2c", t("Private people (B2C)", "Osobom prywatnym (B2C)")],
              ["b2b", t("Companies (B2B)", "Firmom (B2B)")],
            ] as [Segment, string][]
          ).map(([id, nazwa]) => (
            <label key={id} className="inline-flex items-center gap-2.5 text-[15px] text-slate-900 cursor-pointer select-none">
              <input
                type="checkbox"
                className="size-5 rounded cursor-pointer"
                style={{ accentColor: "#d4af5a" }}
                checked={f.segment === id}
                onChange={() => setF((x) => ({ ...x, segment: id }))}
                role="radio"
                aria-checked={f.segment === id}
              />
              {nazwa}
            </label>
          ))}
        </div>
      </Sekcja>

      <Sekcja nr={2} tytul={t("What you sell", "Co sprzedajesz")} htmlFor="produkt" podpowiedz={t("Your product or service, who it's for, what it costs, and what the customer pays for. Bruno sticks to what's here. He won't make up other plans or prices.", "Produkt albo usługa, dla kogo, ile kosztuje i za co klient płaci. Bruno trzyma się tylko tego, co tu jest: nie wymyśla innych modeli ani cen.")}>
        <textarea id="produkt" rows={3} className="bruno-pole" placeholder={t("e.g. we handle utility easement claims for landowners, 30% fee only if we win", "np. obsługę roszczeń za służebność przesyłu dla właścicieli gruntów, wynagrodzenie 30 % od wygranej")} value={f.produkt} onChange={pole("produkt")} maxLength={1500} />
      </Sekcja>

      <Sekcja nr={3} tytul={t("Who the customer is (Bruno plays this role)", "Kim jest klient, którego gra Bruno")} htmlFor="klient" podpowiedz={t("Age, situation, fears, who makes the call. Bruno will play this person.", "Wiek, sytuacja, czego się boi, kto decyduje. Bruno wejdzie w tę rolę.")}>
        <textarea id="klient" rows={4} className="bruno-pole" placeholder={t("e.g. 55-year-old farmer, has had a power pole on his land for 20 years, doesn't trust lawyers, worried about costs, decides with his wife", "np. rolnik 55 lat, ma słup na polu od 20 lat, nie ufa kancelariom, boi się kosztów, decyduje z żoną")} value={f.klient} onChange={pole("klient")} maxLength={2000} />
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <label className="text-sm text-slate-600" htmlFor="etap">
            {t("Where this customer is right now", "Na jakim etapie jest ten klient")}
            <select id="etap" className="bruno-pole mt-1" value={f.etap} onChange={pole("etap")}>
              {(Object.keys(ETAPY) as EtapId[]).map((id) => (
                <option key={id} value={id}>{ETAPY[id].nazwa}: {ETAPY[id].opis}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600" htmlFor="rejestr">
            {t("How the customer talks to you", "Jak klient zwraca się do Ciebie")}
            <select id="rejestr" className="bruno-pole mt-1" value={f.rejestr} onChange={pole("rejestr")}>
              {(Object.keys(REJESTRY) as RejestrId[]).map((id) => (
                <option key={id} value={id}>{REJESTRY[id].nazwa}: {REJESTRY[id].opis}</option>
              ))}
            </select>
          </label>
        </div>
      </Sekcja>

      <Sekcja
        nr={4}
        tytul={t("Objections (one per line)", "Obiekcje, które słyszysz najczęściej")}
        htmlFor="obiekcje"
        podpowiedz={
          jezyk === "pl" ? (
            <>
              Jedna na linię. Po „ | ” możesz dopisać, co klient ma na myśli, np. <span className="font-mono">Będziemy oddawać pieniądze | boi się zwrotu dotacji</span>. Każda obiekcja to osobna karta powtórek.{" "}
              <span className="font-semibold text-slate-700">{liczbaObiekcji} {mnoga(liczbaObiekcji, ["objection", "objections"], ["obiekcja", "obiekcje", "obiekcji"])}</span>
            </>
          ) : (
            <>
              The ones you hear most. After a <span className="font-mono">|</span> you can add what the customer really means, e.g. <span className="font-mono">We'll have to pay it back | worried about returning the grant</span>. Each objection becomes its own review card.{" "}
              <span className="font-semibold text-slate-700">{liczbaObiekcji} {liczbaObiekcji === 1 ? "objection" : "objections"}</span>
            </>
          )
        }
      >
        <textarea id="obiekcje" rows={6} className="bruno-pole font-mono text-[14px]" placeholder={t("Too expensive | comparing with a competitor's $3,000 offer\nI need to think about it\nWe already have a lawyer\nThere's no point, we won't win", "Za drogo | porównuje z ofertą konkurenta za 3 000 zł\nMuszę to przemyśleć\nMamy już prawnika\nTo nie ma sensu, nic nie wygramy")} value={f.obiekcje} onChange={pole("obiekcje")} maxLength={3000} />
      </Sekcja>

      <Sekcja nr={5} tytul={t("Script", "Skrypt rozmowy")} htmlFor="skrypt" podpowiedz={t("Optional. The coach checks if you stick to it where it matters.", "Opcjonalnie. Trener sprawdzi, czy się go trzymasz tam, gdzie warto.")}>
        <textarea id="skrypt" rows={6} className="bruno-pole text-[14px]" placeholder={t("Paste your script if you have one.", "Wklej skrypt, jeśli masz.")} value={f.skrypt} onChange={pole("skrypt")} maxLength={8000} />
      </Sekcja>

      <div className="flex flex-wrap items-center gap-4 sm:pl-12">
        {statusZapisu}
        {/* 11.10 (USER_001): przejście do rozmowy po prawej. 12.10: zawsze widoczne, bo zapis jest automatyczny. */}
        <Link href="/bruno/rozmowa" className="bruno-przycisk sm:ml-auto" aria-disabled={stan === "zapis" || stan === "zmiana"}>
          {t("Start a call with Bruno →", "Zacznij rozmowę z Bruno →")}
        </Link>
      </div>
    </form>
  );
}
