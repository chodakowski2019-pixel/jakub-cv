// 11.10: role z ekranu profilu (/bruno/start). Wartości stałe (zapis w bazie), etykiety w języku konta.
// Plik bez zależności serwerowych (czyta go formularz w przeglądarce i trasa API).
// 12.10 (USER_001): kolejność właściciel → dyrektor → manager → handlowiec → inne; „Inne” = własne pole (rola_inna).

export const ROLE = ["owner", "sales_director", "team_lead", "rep", "other"] as const;
export type Rola = (typeof ROLE)[number];

export const ROLE_ETYKIETY: Record<Rola, { en: string; pl: string }> = {
  owner: { en: "Business Owner", pl: "Właściciel firmy" },
  sales_director: { en: "Sales Director", pl: "Dyrektor sprzedaży" },
  team_lead: { en: "Sales Manager", pl: "Manager sprzedaży" },
  rep: { en: "Sales Rep", pl: "Handlowiec" },
  other: { en: "Other", pl: "Inne" },
};
