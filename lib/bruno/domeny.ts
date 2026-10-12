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
export const SCIEZKI: Record<Jezyk, { firmy: string; handlowcy: string; rejestracja: string; logowanie: string; bezpieczenstwo: string }> = {
  en: { firmy: "/", handlowcy: "/reps", rejestracja: "/signup", logowanie: "/login", bezpieczenstwo: "/security" },
  pl: { firmy: "/", handlowcy: "/handlowcy", rejestracja: "/rejestracja", logowanie: "/login", bezpieczenstwo: "/bezpieczenstwo" },
};

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
