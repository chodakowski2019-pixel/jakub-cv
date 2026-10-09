// Cytaty do „Ognia przed rozmową" (USER_001 9.10: „jakiś cytat motywacyjny zawsze").
// Źródła: 07-MOCs/Cytaty-Motywacyjne.md (wybór USER_001) + baza wiedzy sprzedaży.
// Bez cytatów z internetu bez źródła: każdy ma autora, którego da się wskazać.

export type Cytat = { tekst: string; autor: string };

export const CYTATY: Cytat[] = [
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

/** Cytat dnia: ten sam przez cały dzień dla danego konta, inny jutro. */
export function cytatDnia(email: string, data = new Date()): Cytat {
  const klucz = `${email}|${data.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" })}`;
  let h = 0;
  for (const c of klucz) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CYTATY[h % CYTATY.length];
}
