// Cytaty do „Ognia przed rozmową" (USER_001 9.10: „jakiś cytat motywacyjny zawsze").
// Źródła: 07-MOCs/Cytaty-Motywacyjne.md (wybór USER_001) + baza wiedzy sprzedaży.
// Bez cytatów z internetu bez źródła: każdy ma autora, którego da się wskazać.

import type { Jezyk } from "./domeny";

export type Cytat = { tekst: string; autor: string };

export const CYTATY: Cytat[] = [
  { tekst: "What matters most is being effective. Before comfort, before a pretty process, before what people think.", autor: "Bernie Ecclestone" },
  { tekst: "Safety doesn't come from walls. It comes from what you know you can build again.", autor: "Sukot, 23.09.2026" },
  { tekst: "We have the right, maybe even the duty, to reshape the universe to our liking.", autor: "Nat Friedman" },
  { tekst: "Selling is helping. The customer can tell if you believe it.", autor: "Szymon Negacz, 17 rules of an effective rep" },
  { tekst: "A rep should state, not suggest.", autor: "Rafał Mazur" },
  { tekst: "No meeting was a good one unless you walk out with a plan: what's next, when, and who does it.", autor: "Szymon Negacz, 12 mistakes reps make" },
  { tekst: "Calm comes from the number of calls you make. This is just one more.", autor: "Szymon Negacz, 13 areas a rep must learn" },
  { tekst: "Don't calm down. Get excited. Fear and excitement are the same heartbeat.", autor: "Alison Wood Brooks, Harvard 2014" },
  { tekst: "The worst you'll hear is \"no.\" One \"no\" is one flashcard.", autor: "Bruno" },
];

/** 11.10: cytaty PL (z fd7de52, 1:1) dla kont PL. */
export const CYTATY_PL: Cytat[] = [
  { tekst: "Najważniejsze: być skutecznym. Przed komfortem, przed ładnym procesem, przed opinią.", autor: "Bernie Ecclestone" },
  { tekst: "Bezpieczeństwo nie bierze się z murów, tylko z tego, co umiesz zbudować od nowa.", autor: "Sukot, 23.09.2026" },
  { tekst: "Mamy prawo, może wręcz obowiązek, przekształcać wszechświat według własnych upodobań.", autor: "Nat Friedman" },
  { tekst: "Sprzedawanie to pomaganie. Klient wyczuje, czy w to wierzysz.", autor: "Szymon Negacz, 17 zasad skutecznego handlowca" },
  { tekst: "Handlowiec ma twierdzić, nie sugerować.", autor: "Rafał Mazur" },
  { tekst: "Nikt nie miał dobrego spotkania, jeśli nie wychodzi z planem: co dalej, kiedy i kto.", autor: "Szymon Negacz, 12 błędów handlowców" },
  { tekst: "Spokój bierze się z liczby rozmów. Ta jest kolejną.", autor: "Szymon Negacz, 13 obszarów nauki handlowca" },
  { tekst: "Nie uspokajaj się. Nakręć się. Strach i ekscytacja to to samo tętno.", autor: "Alison Wood Brooks, Harvard 2014" },
  { tekst: "Najgorsze, co usłyszysz, to „nie”. Jedno „nie” to jedna fiszka.", autor: "Bruno" },
];

/** Talia cytatów w danym języku. */
export function cytatyDla(jezyk: Jezyk | string | null | undefined): Cytat[] {
  return jezyk === "pl" ? CYTATY_PL : CYTATY;
}

/** Cytat dnia: ten sam przez cały dzień dla danego konta, inny jutro. */
export function cytatDnia(email: string, data = new Date(), jezyk: Jezyk | string | null = "en"): Cytat {
  const talia = cytatyDla(jezyk);
  const klucz = `${email}|${data.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" })}`;
  let h = 0;
  for (const c of klucz) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return talia[h % talia.length];
}
