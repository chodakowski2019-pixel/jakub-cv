"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Jezyk } from "@/lib/bruno/i18n";

// 8.11 (USER_001): zakładka Klienci v2. (1) „+ Dodaj klienta” = okno z formularzem (imię i nazwisko, firma, telefon,
// e-mail, etap, wartość, płeć) → /api/bruno/klienci. (2) Kółko klienta: zdjęcie albo sylwetka (mężczyzna / kobieta);
// klik = wgraj zdjęcie (przeglądarka zmniejsza do 320 px JPG) → /api/bruno/klienci/zdjecie.

/** 8.11: kraje do prefiksu telefonu (Polska domyślnie, potem rynki Bruno: UK, Irlandia, USA). */
const PREFIKSY = [
  { kod: "PL", flaga: "🇵🇱", prefiks: "+48" },
  { kod: "GB", flaga: "🇬🇧", prefiks: "+44" },
  { kod: "IE", flaga: "🇮🇪", prefiks: "+353" },
  { kod: "US", flaga: "🇺🇸", prefiks: "+1" },
  { kod: "DE", flaga: "🇩🇪", prefiks: "+49" },
  { kod: "CZ", flaga: "🇨🇿", prefiks: "+420" },
  { kod: "SK", flaga: "🇸🇰", prefiks: "+421" },
  { kod: "UA", flaga: "🇺🇦", prefiks: "+380" },
  { kod: "LT", flaga: "🇱🇹", prefiks: "+370" },
  { kod: "SE", flaga: "🇸🇪", prefiks: "+46" },
  { kod: "NO", flaga: "🇳🇴", prefiks: "+47" },
  { kod: "NL", flaga: "🇳🇱", prefiks: "+31" },
  { kod: "FR", flaga: "🇫🇷", prefiks: "+33" },
  { kod: "ES", flaga: "🇪🇸", prefiks: "+34" },
  { kod: "IT", flaga: "🇮🇹", prefiks: "+39" },
];
/** Numer z prefiksem: wpisany już z „+” albo „00” zostaje, inaczej prefiks z flagi + numer bez zera na początku. */
function zPrefiksem(prefiks: string | undefined, numer: string | undefined): string {
  const n = String(numer ?? "").trim();
  if (!n) return "";
  if (n.startsWith("+")) return n;
  if (n.startsWith("00")) return `+${n.slice(2)}`;
  return `${prefiks || "+48"} ${n.replace(/^0+/, "")}`;
}

const tt = (j: Jezyk) => (en: string, pl: string) => (j === "pl" ? pl : en);

export function Sylwetka({ plec, rozmiar = 40 }: { plec: "m" | "k"; rozmiar?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={rozmiar} height={rozmiar} aria-hidden style={{ display: "block" }}>
      <circle cx="20" cy="20" r="20" fill={plec === "k" ? "#f1eef6" : "#eef1f5"} />
      {plec === "k" ? (
        <>
          <path d="M11.5 19c0-6.4 3.6-10.5 8.5-10.5s8.5 4.1 8.5 10.5c0 3.6.9 6.3 2 8.2-2.3 1.2-5 1.6-6.8 1.4h-7.4c-1.8.2-4.5-.2-6.8-1.4 1.1-1.9 2-4.6 2-8.2z" fill="#a39cb3" />
          <circle cx="20" cy="17.5" r="5.6" fill="#c9c3d6" />
          <path d="M8 40c.8-6.6 5.6-10.4 12-10.4S31.2 33.4 32 40z" fill="#a39cb3" />
        </>
      ) : (
        <>
          <circle cx="20" cy="16" r="6.4" fill="#9aa3b2" />
          <path d="M7.5 40c.9-7.4 6-11.6 12.5-11.6S31.6 32.6 32.5 40z" fill="#9aa3b2" />
        </>
      )}
    </svg>
  );
}

async function zmniejsz(f: File): Promise<Blob> {
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, zle) => { const i = new Image(); i.onload = () => ok(i); i.onerror = zle; i.src = url; });
    const bok = 320;
    const k = Math.min(img.width, img.height);
    const c = document.createElement("canvas");
    c.width = bok;
    c.height = bok;
    c.getContext("2d")!.drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, bok, bok);
    return await new Promise<Blob>((ok, zle) => c.toBlob((b) => (b ? ok(b) : zle(new Error("canvas"))), "image/jpeg", 0.86));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AwatarKlienta({ dealId, zdjecie, plec, imie, jezyk, rozmiar = 40 }: { dealId: number; zdjecie: string | null; plec: "m" | "k"; imie: string; jezyk: Jezyk; rozmiar?: number }) {
  const t = tt(jezyk);
  const router = useRouter();
  const plik = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState(zdjecie);
  const [wgrywam, setWgrywam] = useState(false);
  const wgraj = async (f: File) => {
    setWgrywam(true);
    try {
      const fd = new FormData();
      fd.append("deal_id", String(dealId));
      fd.append("plik", new File([await zmniejsz(f)], "zdjecie.jpg", { type: "image/jpeg" }));
      const r = await fetch("/api/bruno/klienci/zdjecie", { method: "POST", body: fd });
      const j = (await r.json().catch(() => ({}))) as { url?: string; blad?: string };
      if (!r.ok) throw new Error(j.blad || `HTTP ${r.status}`);
      if (j.url) setSrc(j.url);
      router.refresh();
    } catch (e) {
      alert(`${t("Couldn't upload the photo", "Nie udało się wgrać zdjęcia")}: ${String((e as Error)?.message ?? e)}`);
    } finally {
      setWgrywam(false);
      if (plik.current) plik.current.value = "";
    }
  };
  return (
    <button type="button" className="kl2-awatar" style={{ width: rozmiar, height: rozmiar }} onClick={() => plik.current?.click()} title={t(`Upload a photo of ${imie}`, `Wgraj zdjęcie: ${imie}`)} aria-label={t("Upload photo", "Wgraj zdjęcie")} disabled={wgrywam}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" /> : <Sylwetka plec={plec} rozmiar={rozmiar} />}
      <span className="kl2-awatar-plus" aria-hidden>{wgrywam ? "…" : "+"}</span>
      <input ref={plik} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void wgraj(f); }} />
    </button>
  );
}

export type DaneKlienta = { id: number; imie_nazwisko: string; firma: string | null; telefon: string | null; email: string | null; etap_id: number; wartosc: number; plec: "m" | "k" | null };

/** Rozbija zapisany numer na prefiks z listy i resztę (do edycji). */
function rozbijTelefon(tel: string | null): { prefiks: string; numer: string } {
  const n = String(tel ?? "").trim();
  const p = [...PREFIKSY].sort((a, b) => b.prefiks.length - a.prefiks.length).find((x) => n.startsWith(x.prefiks));
  return p ? { prefiks: p.prefiks, numer: n.slice(p.prefiks.length).trim() } : { prefiks: "+48", numer: n };
}

/** 8.11: jeden formularz klienta. Bez `klient` = „+ Dodaj klienta” (POST), z `klient` = „Edytuj” (PATCH). */
export function DodajKlienta({ etapy, jezyk, klient = null, maly = false }: { etapy: { id: number; nazwa: string }[]; jezyk: Jezyk; klient?: DaneKlienta | null; /** 8.11: sam ołówek (wiersz tabeli). */ maly?: boolean }) {
  const t = tt(jezyk);
  const router = useRouter();
  const edycja = Boolean(klient);
  const tel = rozbijTelefon(klient?.telefon ?? null);
  const [otwarte, setOtwarte] = useState(false);
  const [wysylam, setWysylam] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const tytul = edycja ? t("Edit client", "Edytuj klienta") : t("Add client", "Dodaj klienta");
  const wyslij = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBlad(null);
    setWysylam(true);
    const d = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    d.telefon = zPrefiksem(d.prefiks, d.telefon);
    delete d.prefiks;
    try {
      const r = await fetch(edycja ? `/api/bruno/klienci/${klient!.id}` : "/api/bruno/klienci", { method: edycja ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
      const j = (await r.json().catch(() => ({}))) as { blad?: string };
      if (!r.ok) throw new Error(j.blad || `HTTP ${r.status}`);
      setOtwarte(false);
      router.refresh();
    } catch (err) {
      setBlad(String((err as Error)?.message ?? err));
    } finally {
      setWysylam(false);
    }
  };
  return (
    <>
      {edycja ? (
        <button type="button" className={maly ? "kl2-olowek" : "p-btn p-btn-2"} onClick={() => setOtwarte(true)} aria-label={tytul} title={tytul}>
          <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
          {!maly && t("Edit", "Edytuj")}
        </button>
      ) : (
        <button type="button" className="p-btn kl2-dodaj" onClick={() => setOtwarte(true)}>
          <span aria-hidden>+</span> {tytul}
        </button>
      )}
      {otwarte && (
        <div className="kl2-tlo" role="dialog" aria-modal="true" aria-label={tytul} onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) setOtwarte(false); }} onKeyDown={(e) => e.stopPropagation()}>
          <form className="kl2-okno" onSubmit={wyslij}>
            <div className="kl2-okno-hd">
              <h2>{tytul}</h2>
              <button type="button" onClick={() => setOtwarte(false)} aria-label={t("Close", "Zamknij")}>×</button>
            </div>
            <label className="kl2-pole kl2-cale"><span>{t("Full name", "Imię i nazwisko")} *</span><input name="imie_nazwisko" required maxLength={160} autoFocus defaultValue={klient?.imie_nazwisko ?? ""} /></label>
            <label className="kl2-pole kl2-cale"><span>{t("Company", "Firma")}</span><input name="firma" maxLength={160} defaultValue={klient?.firma ?? ""} /></label>
            <label className="kl2-pole"><span>{t("Phone", "Numer telefonu")}</span>
              {/* 8.11 (USER_001): flaga kraju = prefiks; numer bez prefiksu, zapis „+48 600 100 200”. */}
              <span className="kl2-tel">
                <select name="prefiks" defaultValue={tel.prefiks} aria-label={t("Country code", "Prefiks kraju")}>
                  {PREFIKSY.map((p) => <option key={p.kod} value={p.prefiks}>{p.flaga} {p.prefiks}</option>)}
                </select>
                <input name="telefon" type="tel" inputMode="tel" maxLength={30} placeholder="600 100 200" defaultValue={tel.numer} />
              </span>
            </label>
            <label className="kl2-pole"><span>E-mail</span><input name="email" type="email" maxLength={160} defaultValue={klient?.email ?? ""} /></label>
            <label className="kl2-pole"><span>{t("Stage", "Etap")}</span>
              <select name="etap_id" defaultValue={klient?.etap_id ?? etapy[0]?.id}>
                {etapy.map((e) => <option key={e.id} value={e.id}>{e.nazwa}</option>)}
              </select>
            </label>
            <label className="kl2-pole"><span>{t("Expected value (PLN)", "Przewidywana wartość (zł)")}</span><input name="wartosc" inputMode="numeric" placeholder="0" maxLength={12} defaultValue={klient?.wartosc ? String(Math.round(klient.wartosc)) : ""} /></label>
            <fieldset className="kl2-pole kl2-cale kl2-plec">
              <span>{t("Gender", "Płeć")}</span>
              <label><input type="radio" name="plec" value="" defaultChecked={!klient?.plec} /> {t("from first name", "z imienia")}</label>
              <label><input type="radio" name="plec" value="m" defaultChecked={klient?.plec === "m"} /> {t("man", "mężczyzna")}</label>
              <label><input type="radio" name="plec" value="k" defaultChecked={klient?.plec === "k"} /> {t("woman", "kobieta")}</label>
            </fieldset>
            {blad && <p className="kl2-blad">{blad}</p>}
            <div className="kl2-okno-dol">
              <button type="button" className="p-btn p-btn-2" onClick={() => setOtwarte(false)}>{t("Cancel", "Anuluj")}</button>
              <button type="submit" className="p-btn" disabled={wysylam}>{wysylam ? t("Saving…", "Zapisuję…") : edycja ? t("Save", "Zapisz") : tytul}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// 8.11 (USER_001: „do CRM Bruno podłączamy Pipedrive, Excel itd.”): okno „Importuj”. (1) Plik Excel (.xlsx) albo CSV:
// przeglądarka czyta plik, dopasowuje kolumny po nagłówkach, pokazuje ile wierszy → /api/bruno/klienci/import.
// (2) Pipedrive (tylko szef): token API → /api/bruno/integracje/pipedrive (import etapów, klientów, notatek, zadań).

type Pole = "imie_nazwisko" | "firma" | "telefon" | "email" | "etap" | "wartosc";
const DOPASOWANIE: [Pole, RegExp][] = [
  ["email", /e-?mail|mail/i],
  ["telefon", /tel|phone|komórk|komork|numer/i],
  ["firma", /firma|company|organi[sz]a|spółk|spolk/i],
  ["etap", /etap|stage|status/i],
  ["wartosc", /warto|value|kwota|amount|cena/i],
  ["imie_nazwisko", /imi|nazwisk|name|osoba|klient|kontakt|person/i],
];

function parsujCsv(tekst: string): string[][] {
  const pierwsza = tekst.split(/\r?\n/)[0] ?? "";
  const sep = (pierwsza.match(/;/g)?.length ?? 0) > (pierwsza.match(/,/g)?.length ?? 0) ? ";" : pierwsza.includes("\t") ? "\t" : ",";
  const wiersze: string[][] = [];
  let w: string[] = [];
  let pole = "";
  let cudz = false;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (cudz) {
      if (c === '"' && tekst[i + 1] === '"') { pole += '"'; i++; } else if (c === '"') cudz = false; else pole += c;
    } else if (c === '"') cudz = true;
    else if (c === sep) { w.push(pole); pole = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && tekst[i + 1] === "\n") i++; w.push(pole); wiersze.push(w); w = []; pole = ""; }
    else pole += c;
  }
  if (pole || w.length) { w.push(pole); wiersze.push(w); }
  return wiersze.filter((r) => r.some((x) => x.trim()));
}

function naKlientow(tabela: string[][]): { wiersze: Record<Pole, string>[]; kolumny: Partial<Record<Pole, string>> } {
  const [naglowki = [], ...reszta] = tabela;
  const mapa = new Map<number, Pole>();
  const kolumny: Partial<Record<Pole, string>> = {};
  naglowki.forEach((n, i) => {
    const p = DOPASOWANIE.find(([pole, r]) => r.test(n) && !Object.values(Object.fromEntries(mapa)).includes(pole))?.[0];
    if (p) { mapa.set(i, p); kolumny[p] = n; }
  });
  const wiersze = reszta.map((r) => {
    const o = { imie_nazwisko: "", firma: "", telefon: "", email: "", etap: "", wartosc: "" } as Record<Pole, string>;
    r.forEach((v, i) => { const p = mapa.get(i); if (p) o[p] = String(v ?? "").trim(); });
    return o;
  }).filter((o) => o.imie_nazwisko || o.firma);
  return { wiersze, kolumny };
}

export function ImportKlientow({ jezyk, szef }: { jezyk: Jezyk; szef: boolean }) {
  const t = tt(jezyk);
  const router = useRouter();
  const [otwarte, setOtwarte] = useState(false);
  const [plik, setPlik] = useState<{ nazwa: string; wiersze: Record<Pole, string>[]; kolumny: Partial<Record<Pole, string>> } | null>(null);
  const [token, setToken] = useState("");
  const [praca, setPraca] = useState<string | null>(null);
  const [wynik, setWynik] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const nazwyPol: Record<Pole, string> = { imie_nazwisko: t("Full name", "Imię i nazwisko"), firma: t("Company", "Firma"), telefon: t("Phone", "Telefon"), email: "E-mail", etap: t("Stage", "Etap"), wartosc: t("Value", "Wartość") };

  const czytaj = async (f: File) => {
    setBlad(null); setWynik(null);
    try {
      let tabela: string[][];
      if (/\.xlsx$/i.test(f.name)) {
        const { default: readXlsxFile } = await import("read-excel-file");
        tabela = (await readXlsxFile(f)).map((r) => r.map((c) => (c === null ? "" : c instanceof Date ? c.toISOString().slice(0, 10) : String(c))));
      } else {
        tabela = parsujCsv(await f.text());
      }
      const w = naKlientow(tabela);
      if (!w.kolumny.imie_nazwisko && !w.kolumny.firma) throw new Error(t("No name or company column found. First row must hold headers, e.g. „Imię i nazwisko”, „Firma”, „Telefon”, „E-mail”.", "Nie widzę kolumny z imieniem ani firmą. Pierwszy wiersz to nagłówki, np. „Imię i nazwisko”, „Firma”, „Telefon”, „E-mail”."));
      setPlik({ nazwa: f.name, ...w });
    } catch (e) {
      setPlik(null);
      setBlad(String((e as Error)?.message ?? e));
    }
  };
  const importuj = async () => {
    if (!plik) return;
    setPraca(t("Importing…", "Importuję…")); setBlad(null);
    try {
      const r = await fetch("/api/bruno/klienci/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wiersze: plik.wiersze }) });
      const j = (await r.json().catch(() => ({}))) as { dodano?: number; blad?: string };
      if (!r.ok) throw new Error(j.blad || `HTTP ${r.status}`);
      setWynik(t(`Added ${j.dodano} clients.`, `Dodano ${j.dodano} klientów.`)); setPlik(null);
      router.refresh();
    } catch (e) { setBlad(String((e as Error)?.message ?? e)); } finally { setPraca(null); }
  };
  const pipedrive = async () => {
    setPraca(t("Connecting to Pipedrive… (up to 1 min)", "Łączę z Pipedrive… (do 1 min)")); setBlad(null); setWynik(null);
    try {
      const r = await fetch("/api/bruno/integracje/pipedrive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const j = (await r.json().catch(() => ({}))) as { klienci?: number; notatki?: number; zadania?: number; etapy?: number; blad?: string };
      if (!r.ok) throw new Error(j.blad || `HTTP ${r.status}`);
      setWynik(t(`Imported: ${j.klienci} clients, ${j.etapy} stages, ${j.notatki} notes, ${j.zadania} tasks.`, `Zaimportowano: ${j.klienci} klientów, ${j.etapy} etapów, ${j.notatki} notatek, ${j.zadania} zadań.`));
      router.refresh();
    } catch (e) { setBlad(String((e as Error)?.message ?? e)); } finally { setPraca(null); }
  };

  return (
    <>
      <button type="button" className="p-btn p-btn-2" onClick={() => setOtwarte(true)}>{t("Import", "Importuj")}</button>
      {otwarte && (
        <div className="kl2-tlo" role="dialog" aria-modal="true" aria-label={t("Import clients", "Importuj klientów")} onClick={(e) => { if (e.target === e.currentTarget && !praca) setOtwarte(false); }}>
          <div className="kl2-okno">
            <div className="kl2-okno-hd">
              <h2>{t("Import clients", "Importuj klientów")}</h2>
              <button type="button" onClick={() => setOtwarte(false)} disabled={Boolean(praca)} aria-label={t("Close", "Zamknij")}>×</button>
            </div>
            <div className="kl2-cale kl2-sekcja">
              <b>{t("Excel or CSV file", "Plik Excel albo CSV")}</b>
              <span>{t("First row = headers. Bruno matches: full name, company, phone, e-mail, stage, value.", "Pierwszy wiersz = nagłówki. Bruno dopasuje: imię i nazwisko, firma, telefon, e-mail, etap, wartość.")}</span>
              <input type="file" accept=".xlsx,.csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) void czytaj(f); }} disabled={Boolean(praca)} />
              {plik && (
                <div className="kl2-podglad">
                  <span>{plik.nazwa}: <b>{plik.wiersze.length}</b> {t("clients", "klientów")}</span>
                  <span>{(Object.keys(nazwyPol) as Pole[]).map((p) => `${nazwyPol[p]} ${plik.kolumny[p] ? "✓" : "–"}`).join(" · ")}</span>
                  <button type="button" className="p-btn" onClick={importuj} disabled={Boolean(praca) || !plik.wiersze.length}>{t(`Import ${plik.wiersze.length}`, `Importuj ${plik.wiersze.length}`)}</button>
                </div>
              )}
            </div>
            {szef && (
              <div className="kl2-cale kl2-sekcja">
                <b>Pipedrive</b>
                <span>{t("Pipedrive → avatar → Personal preferences → API → Copy. Bruno imports stages, clients, notes and tasks.", "Pipedrive → awatar → Personal preferences → API → Copy. Bruno zaimportuje etapy, klientów, notatki i zadania.")}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="kl2-input" value={token} onChange={(e) => setToken(e.target.value)} placeholder={t("API token (empty = re-import)", "Token API (puste = import ponownie)")} disabled={Boolean(praca)} />
                  <button type="button" className="p-btn" onClick={pipedrive} disabled={Boolean(praca)}>{t("Import", "Importuj")}</button>
                </div>
              </div>
            )}
            {praca && <p className="kl2-cale p-cichy" style={{ margin: 0 }}>{praca}</p>}
            {wynik && <p className="kl2-cale p-ok-t" style={{ margin: 0 }}>{wynik}</p>}
            {blad && <p className="kl2-blad">{blad}</p>}
          </div>
        </div>
      )}
    </>
  );
}

/** 8.11 (USER_001: „żeby wejść w lead, klikam w całość, nie tylko w imię”): wiersz tabeli Klienci = link do karty.
 * Kliknięcia w zdjęcie, telefon i e-mail działają po swojemu (nie otwierają karty). Klawiatura: Enter. */
/** 9.11 (USER_001): w wierszu listy strzałka w kółku = od razu następny etap, x = usuń leada (przekreślony, szary, na dole listy). */
export function SzybkieAkcje({ id, nastepny, usuniety, jezyk }: { id: number; /** nazwa następnego etapu albo null na ostatnim */ nastepny: string | null; usuniety: boolean; jezyk: Jezyk }) {
  const t = (en: string, pl: string) => (jezyk === "pl" ? pl : en);
  const router = useRouter();
  const [trwa, setTrwa] = useState(false);
  const wyslij = async (akcja: "dalej" | "usun" | "przywroc") => {
    if (trwa) return;
    setTrwa(true);
    try {
      const r = await fetch(`/api/bruno/klienci/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ akcja }) });
      if (!r.ok) alert((await r.json().catch(() => ({}))).blad ?? t("Something went wrong.", "Coś poszło nie tak."));
      router.refresh();
    } finally {
      setTrwa(false);
    }
  };
  if (usuniety) {
    const opis = t("Restore lead", "Przywróć leada");
    return (
      <button type="button" className="kl2-olowek" disabled={trwa} onClick={() => wyslij("przywroc")} aria-label={opis} title={opis}>
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 8h8a4 4 0 010 8H8" /><path d="M7 5L4 8l3 3" /></svg>
      </button>
    );
  }
  const dalej = nastepny ? `${t("Move to", "Przenieś do")}: ${nastepny}` : "";
  const usun = t("Remove lead", "Usuń leada");
  return (
    <>
      {nastepny && (
        <button type="button" className="kl2-olowek kl2-dalej" disabled={trwa} onClick={() => wyslij("dalej")} aria-label={dalej} title={dalej}>
          <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 10h12" /><path d="M11 5l5 5-5 5" /></svg>
        </button>
      )}
      <button type="button" className="kl2-olowek kl2-usun" disabled={trwa} onClick={() => wyslij("usun")} aria-label={usun} title={usun}>
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M5 5l10 10M15 5L5 15" /></svg>
      </button>
    </>
  );
}

export function WierszKlienta({ href, opoznienie, usuniety = false, children }: { href: string | null; opoznienie: number; usuniety?: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const idz = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (!href) return;
    if ((e.target as HTMLElement).closest("a, button, input, label")) return;
    if ("metaKey" in e && (e.metaKey || e.ctrlKey)) window.open(href, "_blank");
    else router.push(href);
  };
  return (
    <tr className={[href ? "kl2-wiersz" : "", usuniety ? "kl2-usuniety" : ""].join(" ").trim() || undefined} style={{ animationDelay: `${opoznienie}ms` }} onClick={idz} onKeyDown={(e) => { if (e.key === "Enter") idz(e); }} tabIndex={href ? 0 : undefined} role={href ? "link" : undefined}>
      {children}
    </tr>
  );
}
