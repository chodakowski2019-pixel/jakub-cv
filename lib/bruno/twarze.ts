// 4.11 (USER_001: „w kółkach też ich zdjęcia, znajdź jakieś tak jak z handlowcami”): zdjęcia KLIENTÓW z CRM.
// CRM nie ma zdjęć, więc demo dostaje stałą twarz z puli public/bruno/klienci (portrety do makiet z randomuser.me,
// 24 kobiety k1-k24 + 24 mężczyzn m1-m24). Płeć z polskiego imienia (kończy się na „a” = kobieta, wyjątki niżej),
// wybór deterministyczny (ten sam klient = ta sama twarz). Bez serwera, działa też w komponentach klienta.

const MESKIE_NA_A = new Set(["kuba", "barnaba", "kosma", "bonawentura", "jarema", "sasza"]);
const ILE = 24;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h >>> 0);
}

export function plecZImienia(imieNazwisko: string | null | undefined): "k" | "m" {
  const imie = String(imieNazwisko ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!imie) return "m";
  if (MESKIE_NA_A.has(imie)) return "m";
  return imie.endsWith("a") ? "k" : "m";
}

/** Ścieżka do zdjęcia klienta. Null, gdy brak osoby (deal tylko z firmą). */
export function zdjecieKlienta(osoba: string | null | undefined): string | null {
  const n = String(osoba ?? "").trim();
  if (!n) return null;
  return `/bruno/klienci/${plecZImienia(n)}${(hash(n.toLowerCase()) % ILE) + 1}.jpg`;
}
