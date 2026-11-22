// 22.11.2026 (USER_001: „webinar będzie w najbliższą środę o 19:00”): JEDNO miejsce na termin webinaru dla rodziców.
// Czytają go: strona /webinardlarodzicow (components/webinar-rodzice), maile zapisu (lib/newsletter-marka.ts).
// Kolejny termin = zmiana tylko tutaj. null = „termin podam mailem”.
export const WEBINAR_RODZICE = {
  tytul: "webinar dla rodziców o AI i zawodach przyszłości",
  /** Start, czas polski (listopad = UTC+1). */
  start: new Date("2026-11-25T19:00:00+01:00") as Date | null,
  /** Do maili i stron, gdy start jest ustawiony. */
  terminTekst: "środa, 25 listopada, 19:00",
};
