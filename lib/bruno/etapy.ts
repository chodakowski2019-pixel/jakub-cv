// Etap relacji z klientem i forma zwracania się (9.10). Osobny plik bez Supabase,
// bo czytają go komponenty w przeglądarce (dostosuj-form, kreator Testu) i prompt
// Bruno-klienta (postacie.ts). Wzór: obiekcje.ts.
// 10.10: teksty po angielsku (wariant A, USER_001).

/** Etap relacji: Bruno ma się trzymać etapu, nie grać „dopiero wybieram", gdy umowa jest podpisana (8.10). */
export type EtapId = "cold" | "oferta" | "umowa" | "klient";
export const ETAPY: Record<EtapId, { nazwa: string; opis: string; bruno: string }> = {
  cold: { nazwa: "Never heard of me", opis: "first contact, knows nothing about the offer", bruno: "You don't know the rep or the offer. Everything you know, you hear in this call." },
  oferta: { nazwa: "Got the proposal", opis: "knows the offer, hasn't decided", bruno: "You received the proposal and read it, but you haven't decided. You're comparing, hesitating, and you have questions about details." },
  umowa: {
    nazwa: "Signed, wants out",
    opis: "contract is signed, now has doubts",
    bruno: "THE CONTRACT IS ALREADY SIGNED. You are not choosing an offer from scratch and you don't ask \"how much is it\", because you know. You have doubts AFTER the decision and you're thinking about backing out. The rep's job is to keep you.",
  },
  klient: {
    nazwa: "Already a customer",
    opis: "bought before, this is about an upsell / renewal",
    bruno: "You are already this company's customer: you know them from experience, good and bad. This call is about buying more or renewing, not a first purchase.",
  },
};
export function etapLubDomyslny(id: string | null | undefined): EtapId {
  return id && id in ETAPY ? (id as EtapId) : "cold";
}

/** Jak klient zwraca się do handlowca: formalnie (Mr./Ms., sir) albo po imieniu. */
export type RejestrId = "pan" | "ty";
export const REJESTRY: Record<RejestrId, { nazwa: string; opis: string; bruno: string }> = {
  pan: { nazwa: "Formal", opis: "corporate, government, older businesses", bruno: "You keep it formal: \"Mr. / Ms.\", \"sir\", full sentences, no slang, no first names unless the rep offers theirs." },
  ty: { nazwa: "First-name basis", opis: "startups, agencies, industries where everyone is casual", bruno: "You keep it casual: first names, contractions, relaxed tone, like two people in the same industry." },
};
export function rejestrLubDomyslny(id: string | null | undefined): RejestrId {
  return id === "ty" ? "ty" : "pan";
}
