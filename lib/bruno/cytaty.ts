// Cytaty do „Ognia przed rozmową" (USER_001 9.10: „jakiś cytat motywacyjny zawsze").
// Źródła: 07-MOCs/Cytaty-Motywacyjne.md (wybór USER_001) + baza wiedzy sprzedaży.
// Bez cytatów z internetu bez źródła: każdy ma autora, którego da się wskazać.

export type Cytat = { tekst: string; autor: string };

export const CYTATY: Cytat[] = [
  { tekst: "What matters most is being effective. Before comfort, before a pretty process, before what people think.", autor: "Bernie Ecclestone" },
  { tekst: "Safety doesn't come from walls. It comes from what you know you can build again.", autor: "Sukot, 23.09.2026" },
  { tekst: "We have the right, maybe even the duty, to reshape the universe to our liking.", autor: "Nat Friedman" },
  { tekst: "Selling is helping. The customer can tell if you believe it.", autor: "Szymon Negacz, 17 zasad skutecznego handlowca" },
  { tekst: "A rep should state, not suggest.", autor: "Rafał Mazur" },
  { tekst: "No meeting was a good one unless you walk out with a plan: what's next, when, and who does it.", autor: "Szymon Negacz, 12 błędów handlowców" },
  { tekst: "Calm comes from the number of calls you make. This is just one more.", autor: "Szymon Negacz, 13 obszarów nauki handlowca" },
  { tekst: "Don't calm down. Get excited. Fear and excitement are the same heartbeat.", autor: "Alison Wood Brooks, Harvard 2014" },
  { tekst: "The worst you'll hear is \"no.\" One \"no\" is one flashcard.", autor: "Bruno" },
];

/** Cytat dnia: ten sam przez cały dzień dla danego konta, inny jutro. */
export function cytatDnia(email: string, data = new Date()): Cytat {
  const klucz = `${email}|${data.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" })}`;
  let h = 0;
  for (const c of klucz) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CYTATY[h % CYTATY.length];
}
