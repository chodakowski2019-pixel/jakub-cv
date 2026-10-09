// Etap relacji z klientem i forma zwracania się (9.10). Osobny plik bez Supabase,
// bo czytają go komponenty w przeglądarce (dostosuj-form, kreator Testu) i prompt
// Bruno-klienta (postacie.ts). Wzór: obiekcje.ts.

/** Etap relacji: Bruno ma się trzymać etapu, nie grać „dopiero wybieram", gdy umowa jest podpisana (8.10, rozmowy Aleksandry). */
export type EtapId = "cold" | "oferta" | "umowa" | "klient";
export const ETAPY: Record<EtapId, { nazwa: string; opis: string; bruno: string }> = {
  cold: { nazwa: "Nie zna mnie", opis: "pierwszy kontakt, nic nie wie o ofercie", bruno: "Nie znasz handlowca ani oferty. Wszystko, co wiesz, usłyszysz dopiero w tej rozmowie." },
  oferta: { nazwa: "Dostał ofertę", opis: "zna ofertę, jeszcze nie zdecydował", bruno: "Dostałeś ofertę i ją przeczytałeś, ale nie podjąłeś decyzji. Porównujesz, wahasz się, masz pytania do szczegółów." },
  umowa: {
    nazwa: "Podpisał, chce się wycofać",
    opis: "umowa jest, teraz ma wątpliwości",
    bruno: "UMOWA JEST JUŻ PODPISANA. Nie wybierasz oferty od nowa i nie pytasz „ile to kosztuje”, bo to wiesz. Masz wątpliwości PO decyzji i rozważasz wycofanie się. Handlowiec ma Cię zatrzymać.",
  },
  klient: {
    nazwa: "Jest już klientem",
    opis: "kupił, rozmowa o dokupieniu / przedłużeniu",
    bruno: "Jesteś już klientem tej firmy: znasz ją z praktyki, masz własne doświadczenia (dobre i złe). Rozmowa dotyczy dokupienia albo przedłużenia, nie pierwszego zakupu.",
  },
};
export function etapLubDomyslny(id: string | null | undefined): EtapId {
  return id && id in ETAPY ? (id as EtapId) : "cold";
}

/** Jak klient zwraca się do handlowca (9.10: Bruno mówił „słuchaj”, Aleksandra „proszę pana”, zgrzyt). */
export type RejestrId = "pan" | "ty";
export const REJESTRY: Record<RejestrId, { nazwa: string; opis: string; bruno: string }> = {
  pan: { nazwa: "Pan / Pani", opis: "klient indywidualny, urząd, starsza firma", bruno: "Zwracasz się do handlowca per „pan” / „pani” (forma grzecznościowa), tak jak on do Ciebie. Nie mówisz „słuchaj” ani „ty”." },
  ty: { nazwa: "Na ty", opis: "startup, agencja, branża, w której wszyscy są na ty", bruno: "Zwracasz się do handlowca na „ty” (luźno, jak w startupie albo między znajomymi z branży)." },
};
export function rejestrLubDomyslny(id: string | null | undefined): RejestrId {
  return id === "ty" ? "ty" : "pan";
}
