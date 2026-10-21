// 10/11.10 (USER_001): Bruno ma dwie domeny. salesbruno.com = EN (UK/IE/USA), salesbruno.pl = PL.
// Na jakubchodakowski.com nie zostaje nic z Bruno: stare adresy idą 301 na salesbruno.com (z ?pl na .pl).
// Plik bez zależności serwerowych: czyta go proxy, strony, komponenty w przeglądarce i maile.

export type Jezyk = "en" | "pl";

export const DOMENA: Record<Jezyk, string> = {
  en: "https://salesbruno.com",
  pl: "https://salesbruno.pl",
};

/** Ładne adresy na domenach Bruno (USER_001 11.10). Panel zostaje pod /bruno/... */
// 12.10 (E11): strona „Security & Data” dla firm: app/bezpieczenstwo, EN pod /security.
// 14.10 (USER_001): strona główna = LP dla handlowców (B2C), LP dla firm (B2B) = /wspolpraca (.pl) i /business (.com).
// 17.10 (USER_001): Bruno TYLKO B2B. Strona główna = LP dla firm, LP dla handlowców wyłączona.
// `handlowcy` zostaje jako klucz (stare linki w kodzie), wskazuje na stronę główną firm.
// 21.10 (USER_001): /spotkanie (.pl) i /meeting (.com) = kalendarz spotkania online z USER_001 (app/brunodemo). Było /demo (308).
export const SCIEZKI: Record<Jezyk, { firmy: string; handlowcy: string; rejestracja: string; logowanie: string; bezpieczenstwo: string; demo: string }> = {
  en: { firmy: "/", handlowcy: "/", rejestracja: "/signup", logowanie: "/login", bezpieczenstwo: "/security", demo: "/meeting" },
  pl: { firmy: "/", handlowcy: "/", rejestracja: "/rejestracja", logowanie: "/login", bezpieczenstwo: "/bezpieczenstwo", demo: "/spotkanie" },
};

/** Stare adresy LP (handlowcy sprzed 14.10, firmy sprzed 17.10): przekierowanie 308 na stronę główną. */
export const STARE_HANDLOWCY = ["/reps", "/handlowcy", "/business", "/wspolpraca"];

/** Język z nazwy hosta: salesbruno.pl → pl, salesbruno.com → en, inny host → null. */
export function jezykZHosta(host: string | null | undefined): Jezyk | null {
  const h = (host ?? "").toLowerCase().split(":")[0];
  if (h === "salesbruno.pl" || h.endsWith(".salesbruno.pl")) return "pl";
  if (h === "salesbruno.com" || h.endsWith(".salesbruno.com")) return "en";
  return null;
}

export function jezykLubDomyslny(j: unknown): Jezyk {
  return j === "pl" ? "pl" : "en";
}

/** Pełny adres na domenie danego języka, np. adresBruno("pl", "/bruno/panel"). */
export function adresBruno(j: Jezyk, sciezka = "/"): string {
  return `${DOMENA[j]}${sciezka.startsWith("/") ? sciezka : `/${sciezka}`}`;
}
