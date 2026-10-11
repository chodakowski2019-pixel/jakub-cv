// 11.10: role z ekranu profilu (/bruno/start). Wartości stałe (zapis w bazie), etykiety w języku konta.
// Plik bez zależności serwerowych (czyta go formularz w przeglądarce i trasa API).

export const ROLE = ["sales_director", "team_lead", "owner", "rep", "other"] as const;
export type Rola = (typeof ROLE)[number];

export const ROLE_ETYKIETY: Record<Rola, { en: string; pl: string }> = {
  sales_director: { en: "Sales Director", pl: "Dyrektor sprzedaży" },
  team_lead: { en: "Sales Team Lead", pl: "Kierownik zespołu sprzedaży" },
  owner: { en: "Business Owner", pl: "Właściciel firmy" },
  rep: { en: "Sales Rep", pl: "Handlowiec" },
  other: { en: "Other", pl: "Inne" },
};
