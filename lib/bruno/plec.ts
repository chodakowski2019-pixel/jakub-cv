// 8.11: płeć z imienia do sylwetki klienta (bez serwera, działa wszędzie).
export type Plec = "m" | "k";
/** Płeć z imienia (polskie: kończy się na „a” = kobieta, poza wyjątkami). Do sylwetki, gdy brak zapisanej. */
const MESKIE_NA_A = new Set(["kuba", "barnaba", "bonawentura", "kosma", "jarema", "zawisza", "dyzma", "boryna", "nikita", "luca", "andrea"]);
export function plecZImienia(imie: string | null | undefined): Plec {
  const p = String(imie ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return p.endsWith("a") && !MESKIE_NA_A.has(p) ? "k" : "m";
}

/** 8.11: sylwetka (mężczyzna / kobieta) jako obrazek data:URL, gdy klient prawdziwej firmy nie ma zdjęcia. */
export function sylwetkaUrl(plec: Plec): string {
  const svg =
    plec === "k"
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#f1eef6"/><path d="M11.5 19c0-6.4 3.6-10.5 8.5-10.5s8.5 4.1 8.5 10.5c0 3.6.9 6.3 2 8.2-2.3 1.2-5 1.6-6.8 1.4h-7.4c-1.8.2-4.5-.2-6.8-1.4 1.1-1.9 2-4.6 2-8.2z" fill="#a39cb3"/><circle cx="20" cy="17.5" r="5.6" fill="#c9c3d6"/><path d="M8 40c.8-6.6 5.6-10.4 12-10.4S31.2 33.4 32 40z" fill="#a39cb3"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#eef1f5"/><circle cx="20" cy="16" r="6.4" fill="#9aa3b2"/><path d="M7.5 40c.9-7.4 6-11.6 12.5-11.6S31.6 32.6 32.5 40z" fill="#9aa3b2"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** 8.11: twarz klienta: zdjęcie z profilu → (firma demo) zdjęcie demo → sylwetka. */
export function twarzKlienta(osoba: string | null | undefined, o: { zdjecie?: string | null; plec?: Plec | null; demo?: boolean; demoZdjecie?: (osoba: string | null | undefined) => string | null }): string {
  return o.zdjecie || (o.demo && o.demoZdjecie ? o.demoZdjecie(osoba) : null) || sylwetkaUrl(o.plec ?? plecZImienia(osoba));
}
