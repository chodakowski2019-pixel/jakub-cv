// 8.11: płeć z imienia do sylwetki klienta (bez serwera, działa wszędzie).
export type Plec = "m" | "k";
/** Płeć z imienia (polskie: kończy się na „a” = kobieta, poza wyjątkami). Do sylwetki, gdy brak zapisanej. */
const MESKIE_NA_A = new Set(["kuba", "barnaba", "bonawentura", "kosma", "jarema", "zawisza", "dyzma", "boryna", "nikita", "luca", "andrea"]);
export function plecZImienia(imie: string | null | undefined): Plec {
  const p = String(imie ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return p.endsWith("a") && !MESKIE_NA_A.has(p) ? "k" : "m";
}
