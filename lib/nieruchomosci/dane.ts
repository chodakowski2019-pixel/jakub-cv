import gus from "./gus.json";

// 26.11.2026 (USER_001): projekt Nieruchomości na jakubchodakowski.com/nieruchomosci. Na start: ceny mieszkań z transakcji
// z GUS (Bank Danych Lokalnych). Dane pobiera scripts/nieruchomosci-gus.mjs do gus.json. Kolejne źródła: lista ZRODLA niżej.
export const BAZA_NIERUCHOMOSCI = "/nieruchomosci";

export type Rok = { m2?: number; m2Pierwotny?: number; m2Wtorny?: number; transakcje?: number };
export type Jednostka = {
  id: string;
  poziom: "kraj" | "wojewodztwo" | "miasto" | "powiat";
  nazwa: string;
  slug: string;
  wojewodztwo: string | null;
  lata: Record<string, Rok>;
};

export const GUS = gus as { zrodlo: string; pobrano: string; ostatniRok: number; jednostki: Jednostka[] };
export const OSTATNI_ROK = GUS.ostatniRok;

export const wszystkieJednostki = () => GUS.jednostki;
export const jednostka = (slug: string) => GUS.jednostki.find((j) => j.slug === slug);
export const polska = () => jednostka("polska")!;
export const wojewodztwa = () => GUS.jednostki.filter((j) => j.poziom === "wojewodztwo");
export const wojewodztwoJednostki = (j: Jednostka) =>
  j.poziom === "wojewodztwo" ? j : GUS.jednostki.find((w) => w.poziom === "wojewodztwo" && w.nazwa === j.wojewodztwo);
export const wPowiatachWojewodztwa = (woj: string) => GUS.jednostki.filter((j) => j.wojewodztwo === woj);

export const rok = (j: Jednostka, r = OSTATNI_ROK) => j.lata[String(r)] ?? {};
export function zmiana(j: Jednostka, r = OSTATNI_ROK): number | null {
  const teraz = rok(j, r).m2;
  const przed = rok(j, r - 1).m2;
  return teraz && przed ? ((teraz - przed) / przed) * 100 : null;
}

export const NAZWA_POZIOMU: Record<Jednostka["poziom"], string> = {
  kraj: "Kraj",
  wojewodztwo: "Województwo",
  miasto: "Miasto na prawach powiatu",
  powiat: "Powiat",
};
export const tytulJednostki = (j: Jednostka) => (j.poziom === "wojewodztwo" ? `województwo ${j.nazwa}` : j.nazwa);

export { liczba, proc, zl } from "./format";

// Źródła danych projektu. stan: "na stronie" = dane już są na stronie, "następne" = do podłączenia.
export const ZRODLA: { nazwa: string; co: string; url: string; stan: "na stronie" | "następne" }[] = [
  { nazwa: "GUS, Bank Danych Lokalnych", co: "Mediana ceny za m² z transakcji, rynek pierwotny i wtórny, liczba sprzedanych mieszkań, 380 powiatów od 2010", url: "https://bdl.stat.gov.pl", stan: "na stronie" },
  { nazwa: "Rejestr Cen Nieruchomości (RCN)", co: "Ceny z aktów notarialnych: mieszkania, domy, działki, z adresem i metrażem", url: "https://www.geoportal.gov.pl", stan: "następne" },
  { nazwa: "Ceny mieszkań od deweloperów", co: "Ceny każdego mieszkania w ofercie dewelopera, aktualizowane codziennie", url: "https://dane.gov.pl", stan: "następne" },
  { nazwa: "GUNB, rejestr pozwoleń na budowę", co: "Wnioski, pozwolenia i zgłoszenia budowy: adres, rodzaj budynku, data", url: "https://wyszukiwarka.gunb.gov.pl", stan: "następne" },
  { nazwa: "NBP, baza cen mieszkań", co: "Ceny ofertowe i transakcyjne w 17 miastach, co kwartał", url: "https://nbp.pl/publikacje/cykliczne-materialy-analityczne-nbp/rynek-nieruchomosci/", stan: "następne" },
  { nazwa: "Geoportal i plany miejscowe", co: "Działki, granice, budynki, plany zagospodarowania, uzbrojenie terenu", url: "https://www.geoportal.gov.pl", stan: "następne" },
  { nazwa: "Wody Polskie, mapy powodziowe", co: "Obszary zagrożone powodzią", url: "https://wody.isok.gov.pl", stan: "następne" },
  { nazwa: "Licytacje komornicze", co: "Mieszkania i domy z licytacji: cena wywoławcza, termin", url: "https://licytacje.komornik.pl", stan: "następne" },
];
