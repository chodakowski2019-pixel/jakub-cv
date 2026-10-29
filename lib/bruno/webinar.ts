// 21.10 (USER_001): termin webinaru. Jedno miejsce dla LP, metadanych, maili i kalendarza.
// 27.10 (USER_001): NOWY TERMIN śr 4.11 19:00 czasu polskiego (Zoom ustawiony na 4.11 19:00 Warszawa) i NOWY TEMAT
// dla właścicieli firm: „Jak sprawić, żeby handlowcy robili 100 % planu sprzedaży” (zastępuje „Jak zwiększyć sprzedaż…”).
// CET = UTC+1 (od 25.10), więc start 18:00 UTC. Koniec ok. 20:00.
export const WEBINAR = {
  /** Klucz webinaru w bazie (`bruno_webinar_zapisy.webinar`). */
  klucz: "2026-11-04",
  start: Date.UTC(2026, 10, 4, 18, 0, 0),
  koniec: Date.UTC(2026, 10, 4, 19, 0, 0),
  dzien: "środa",
  dzienKrotko: "śr",
  data: "4.11",
  dataDluga: "4 listopada",
  /** Data PL dnia webinaru i dnia przed (do crona), format en-CA = RRRR-MM-DD. */
  dataPL: "2026-11-04",
  dataPLDzienPrzed: "2026-11-03",
  godzina: "19:00",
  ics: "20261104T180000Z",
  icsKoniec: "20261104T190000Z",
  // 29.10 (USER_001: „tytuł zmieniamy”): wzór Popiela „Jak [korzyść] bez [ból]”. Zastępuje „…planu sprzedaży dzięki AI” (27.10).
  // Temat w Zoomie zmienia USER_001 ręcznie. Grafiki (OG, post, reklamy) przerobione 29.10.
  tytul: "Jak sprawić, żeby handlowcy robili 100 % planu, bez siedzenia obok każdego z nich",
  /** Druga linia pod tytułem (szara). 29.10: właściciel chce KONTROLI w liczbach (rozmowa z Mauricio). */
  podtytul: "Bez pilnowania ich.", // 29.10 (USER_001)
  // 27.10 (USER_001): link Zoom ustawiony przez USER_001.
  zoom: "https://us05web.zoom.us/j/81028613140?pwd=6DyIsCre9Ufkias6LaP8erbpvbSFZt.1",
  zoomId: "810 2861 3140",
  /** Bezpłatna rozmowa demo po webinarze (Negacz, lejek #7: ostatnie 5-10 min = konsultacja do 5 dni). */
  demo: "https://salesbruno.pl/demo?src=webinar",
  /** Strona zapisu (do maili i postów). */
  lp: "https://salesbruno.pl/webinar",
  /** Plan 60 minut (LP + mail potwierdzenia). */
  // 29.10 (USER_001, rozmowa z Mauricio): plan pod właściciela / dyrektora: kontrola, dane, czas szefa, „nikt nie będzie z tego korzystał”.
  plan: [
    // Każdy punkt kończy się efektem „dzięki temu…” (Popiel M8 L01).
    ["19:00", "Dlaczego nie wiesz, co handlowcy mówią klientom", "3 powody, dla których zespół nie robi planu: nie umie, nie chce, system nie działa. Dzięki temu przestaniesz leczyć wszystko jednym szkoleniem i rozpoznasz, który problem masz u siebie."],
    ["19:12", "4 sposoby na wyszkolenie zespołu", "Trener z zewnątrz, szef szkoli sam, słuchanie nagrań, trening z AI. Cena, ile Twoich godzin zjada, czy efekt zostaje. Dzięki temu wybierzesz świadomie, nie z przyzwyczajenia."],
    ["19:30", "Na żywo: handlowiec kontra klient AI", "AI gra trudnego klienta z branży. Po 3 minutach ocena: otwarcie, pytania, obiekcje, zamknięcie. Dzięki temu zobaczysz, jak wygląda ocena, zanim jej zaufasz u siebie."],
    ["19:42", "Panel szefa: kontrola bez pilnowania", "Kto ćwiczył dziś, kto od tygodnia nie, kto nie domyka, kto rośnie. Dzięki temu rozmowa 1:1 zaczyna się od liczb, nie od „jak idzie?”."],
    ["19:50", "Pytania i co dalej", "Pytasz o swój zespół. Odpowiadam na żywo."],
  ] as [string, string, string][],
};

/** Tytuł wydarzenia w kalendarzu uczestnika. */
export const WEBINAR_TYTUL_KALENDARZA = `Webinar: ${WEBINAR.tytul.toLowerCase()}`;

/** Link „Dodaj do Kalendarza Google” z linkiem Zoom w opisie. */
export function webinarLinkGoogle(): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: WEBINAR_TYTUL_KALENDARZA,
    dates: `${WEBINAR.ics}/${WEBINAR.icsKoniec}`,
    details: `Link do Zooma: ${WEBINAR.zoom}\nProwadzi Jakub Chodakowski. Nagrania nie będzie.`,
    location: WEBINAR.zoom,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** Treść pliku .ics (Apple Calendar, Outlook) z linkiem Zoom i przypomnieniem 30 min przed. */
export function webinarIcs(): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jakub Chodakowski//Webinar//PL",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:webinar-${WEBINAR.ics}@salesbruno.com`,
    "DTSTAMP:20261027T120000Z",
    `DTSTART:${WEBINAR.ics}`,
    `DTEND:${WEBINAR.icsKoniec}`,
    `SUMMARY:${WEBINAR_TYTUL_KALENDARZA}`,
    `DESCRIPTION:Link do Zooma: ${WEBINAR.zoom}\\nProwadzi Jakub Chodakowski. Nagrania nie będzie.`,
    `LOCATION:${WEBINAR.zoom}`,
    `URL:${WEBINAR.zoom}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Webinar za 30 minut",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Dzisiejsza data czasu polskiego jako RRRR-MM-DD (do porównania z `dataPL`). */
export function dataPLDzis(teraz = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).format(teraz);
}
