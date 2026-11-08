"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Jezyk } from "@/lib/bruno/i18n";

// 8.11 (USER_001): zakładka Klienci v2. (1) „+ Dodaj klienta” = okno z formularzem (imię i nazwisko, firma, telefon,
// e-mail, etap, wartość, płeć) → /api/bruno/klienci. (2) Kółko klienta: zdjęcie albo sylwetka (mężczyzna / kobieta);
// klik = wgraj zdjęcie (przeglądarka zmniejsza do 320 px JPG) → /api/bruno/klienci/zdjecie.

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

export function DodajKlienta({ etapy, jezyk }: { etapy: { id: number; nazwa: string }[]; jezyk: Jezyk }) {
  const t = tt(jezyk);
  const router = useRouter();
  const [otwarte, setOtwarte] = useState(false);
  const [wysylam, setWysylam] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const wyslij = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBlad(null);
    setWysylam(true);
    const d = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch("/api/bruno/klienci", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
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
      <button type="button" className="p-btn kl2-dodaj" onClick={() => setOtwarte(true)}>
        <span aria-hidden>+</span> {t("Add client", "Dodaj klienta")}
      </button>
      {otwarte && (
        <div className="kl2-tlo" role="dialog" aria-modal="true" aria-label={t("Add client", "Dodaj klienta")} onClick={(e) => { if (e.target === e.currentTarget) setOtwarte(false); }}>
          <form className="kl2-okno" onSubmit={wyslij}>
            <div className="kl2-okno-hd">
              <h2>{t("Add client", "Dodaj klienta")}</h2>
              <button type="button" onClick={() => setOtwarte(false)} aria-label={t("Close", "Zamknij")}>×</button>
            </div>
            <label className="kl2-pole kl2-cale"><span>{t("Full name", "Imię i nazwisko")} *</span><input name="imie_nazwisko" required maxLength={160} autoFocus /></label>
            <label className="kl2-pole kl2-cale"><span>{t("Company", "Firma")}</span><input name="firma" maxLength={160} /></label>
            <label className="kl2-pole"><span>{t("Phone", "Numer telefonu")}</span><input name="telefon" type="tel" maxLength={40} /></label>
            <label className="kl2-pole"><span>E-mail</span><input name="email" type="email" maxLength={160} /></label>
            <label className="kl2-pole"><span>{t("Stage", "Etap")}</span>
              <select name="etap_id" defaultValue={etapy[0]?.id}>
                {etapy.map((e) => <option key={e.id} value={e.id}>{e.nazwa}</option>)}
              </select>
            </label>
            <label className="kl2-pole"><span>{t("Expected value (PLN)", "Przewidywana wartość (zł)")}</span><input name="wartosc" inputMode="numeric" placeholder="0" maxLength={12} /></label>
            <fieldset className="kl2-pole kl2-cale kl2-plec">
              <span>{t("Photo outline", "Sylwetka")}</span>
              <label><input type="radio" name="plec" value="" defaultChecked /> {t("from first name", "z imienia")}</label>
              <label><input type="radio" name="plec" value="m" /> {t("man", "mężczyzna")}</label>
              <label><input type="radio" name="plec" value="k" /> {t("woman", "kobieta")}</label>
            </fieldset>
            {blad && <p className="kl2-blad">{blad}</p>}
            <div className="kl2-okno-dol">
              <button type="button" className="p-btn p-btn-2" onClick={() => setOtwarte(false)}>{t("Cancel", "Anuluj")}</button>
              <button type="submit" className="p-btn" disabled={wysylam}>{wysylam ? t("Saving…", "Zapisuję…") : t("Add client", "Dodaj klienta")}</button>
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
