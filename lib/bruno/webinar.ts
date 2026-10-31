// 21.10 (USER_001): termin webinaru. Jedno miejsce dla LP, metadanych, maili i kalendarza.
// 27.10 (USER_001): NOWY TERMIN śr 4.11 19:00 czasu polskiego (Zoom ustawiony na 4.11 19:00 Warszawa) i NOWY TEMAT
// dla właścicieli firm: „Jak sprawić, żeby handlowcy robili 100 % planu sprzedaży” (zastępuje „Jak zwiększyć sprzedaż…”).
// CET = UTC+1 (od 25.10), więc start 18:00 UTC. Koniec ok. 20:00.
// 31.10 (USER_001: „nie robimy tego dla b2b, w to miejsce wejdzie ten”): webinar B2B ODWOŁANY, ten sam termin i Zoom
// = webinar dla grupy A (chcą ZOSTAĆ handlowcami, badanie SalesAI/sprzedaz/badanie-b2c/). Nowy klucz, żeby testowe
// zapisy B2B z 29.10 nie dostawały maili A. Po potwierdzeniu zapisu uczestnik robi test predyspozycji (przed webinarem).
export const WEBINAR = {
  /** Klucz webinaru w bazie (`bruno_webinar_zapisy.webinar`). */
  klucz: "2026-11-04-kursy",
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
  // 31.10: grupa A. Wzór Popiela „Jak [korzyść] bez [ból]”: ból nr 1 = brak doświadczenia (33 cytaty), nr 4 = „wciskanie kitu” (19).
  tytul: "Jak zostać handlowcem w 3 miesiące", // 31.10: jak temat w Zoomie
  /** Druga linia pod tytułem (szara). */
  podtytul: "Bez wciskania kitu.",
  // 27.10 (USER_001): link Zoom ustawiony przez USER_001.
  zoom: "https://us05web.zoom.us/j/81028613140?pwd=6DyIsCre9Ufkias6LaP8erbpvbSFZt.1",
  zoomId: "810 2861 3140",
  /** Następny krok po webinarze: szkolenie 3 mies. z gwarancją pracy (31.10, grupa A). */
  oferta: "https://salesbruno.pl/kursy?src=webinar",
  /** Strona zapisu (do maili i postów). */
  lp: "https://salesbruno.pl/webinar",
  /** Plan 60 minut (LP + mail potwierdzenia). */
  // 29.10 (USER_001, rozmowa z Mauricio): plan pod właściciela / dyrektora: kontrola, dane, czas szefa, „nikt nie będzie z tego korzystał”.
  // 31.10: plan pod grupę A, z lęków z badania (czy się nadam, prowizja na minusie, strach przed telefonem, wciskanie kitu).
  plan: [
    // Każdy punkt kończy się efektem „dzięki temu…” (Popiel M8 L01).
    ["19:00", "Czy nadajesz się do sprzedaży? 3 style handlowca", "Omawiam wyniki testu, który zrobisz przed webinarem: Łowca, Doradca, Negocjator. Dzięki temu wiesz, w jakiej sprzedaży odnajdziesz się najlepiej, zanim wyślesz pierwsze CV."],
    ["19:15", "Ile naprawdę zarabia początkujący handlowiec", "Branże, widełki, pensja podstawowa kontra sama prowizja. Dzięki temu wybierzesz firmę z dobrą pensją, uczciwą prowizją i autem służbowym."],
    ["19:30", "Plan na 3 miesiące: od zera do pierwszej pracy", "Co robisz tydzień po tygodniu, egzamin, certyfikat i jak łączymy Cię z firmą. Dzięki temu wiesz dokładnie, gdzie będziesz w 4. miesiącu."],
    ["19:45", "Na żywo: pierwsza rozmowa z klientem AI", "AI gra klienta, który mówi „nie mam czasu” i „muszę się zastanowić”. Po rozmowie ocena i 3 rzeczy do poprawy. Dzięki temu zobaczysz, że strach przed telefonem da się wyćwiczyć, zanim zadzwonisz do prawdziwego klienta."],
    ["20:00", "Pytania", "Pytasz o swoją sytuację. Odpowiadam na żywo."],
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
