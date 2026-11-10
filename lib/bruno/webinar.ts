// 21.10 (USER_001): termin webinaru. Jedno miejsce dla LP, metadanych, maili i kalendarza.
// 27.10 (USER_001): NOWY TERMIN śr 4.11 19:00 czasu polskiego (Zoom ustawiony na 4.11 19:00 Warszawa) i NOWY TEMAT
// dla właścicieli firm: „Jak sprawić, żeby handlowcy robili 100 % planu sprzedaży” (zastępuje „Jak zwiększyć sprzedaż…”).
// CET = UTC+1 (od 25.10), więc start 18:00 UTC. Koniec ok. 20:00.
// 31.10 (USER_001: „nie robimy tego dla b2b, w to miejsce wejdzie ten”): webinar B2B ODWOŁANY, ten sam termin i Zoom
// = webinar dla grupy A (chcą ZOSTAĆ handlowcami, badanie SalesAI/sprzedaz/badanie-b2c/). Nowy klucz, żeby testowe
// zapisy B2B z 29.10 nie dostawały maili A. Po potwierdzeniu zapisu uczestnik robi test predyspozycji (przed webinarem).
// 10.11 (USER_001: „będziemy robić webinary sprzedażowe o Bruno AI”): webinar DLA FIRM wraca, wt 17.11 19:00 czasu polskiego
// (CET = UTC+1, start 18:00 UTC). Odbiorca: każdy, kto ma handlowców (liczba obojętna). Nowy klucz, nowy Zoom od USER_001.
export const WEBINAR = {
  /** Klucz webinaru w bazie (`bruno_webinar_zapisy.webinar`). */
  klucz: "2026-11-17-firmy",
  start: Date.UTC(2026, 10, 17, 18, 0, 0),
  koniec: Date.UTC(2026, 10, 17, 19, 0, 0),
  dzien: "wtorek",
  dzienKrotko: "wt",
  /** „Widzimy się we wtorek.” (maile). */
  dzienWe: "we wtorek",
  data: "17.11",
  dataDluga: "17 listopada",
  /** Data PL dnia webinaru i dnia przed (do crona), format en-CA = RRRR-MM-DD. */
  dataPL: "2026-11-17",
  dataPLDzienPrzed: "2026-11-16",
  godzina: "19:00",
  ics: "20261117T180000Z",
  icsKoniec: "20261117T190000Z",
  // 10.11 (USER_001: „dobre!”): tytuł = pytanie właściciela. Temat w Zoomie zmienia USER_001 ręcznie.
  tytul: "Masz handlowców i nie wiesz, dlaczego nie sprzedają?",
  /** Druga linia pod tytułem (szara). */
  podtytul: "Dowiesz się, jak to zmienić.",
  // 10.11 (USER_001): link Zoom od USER_001.
  zoom: "https://us05web.zoom.us/j/89634931441?pwd=3uCuaZZaWivaaCfaA0naLy7lL4NAPI.1",
  zoomId: "896 3493 1441",
  /** Test predyspozycji po potwierdzeniu zapisu (31.10, webinar dla przyszłych handlowców). Webinar dla firm: bez testu. */
  test: false,
  /** Następny krok po webinarze: spotkanie online 20 min z demo (Negacz: na końcu jedno wezwanie). */
  demo: "https://salesbruno.pl/spotkanie?src=webinar",
  /** Strona zapisu (do maili i postów). */
  lp: "https://salesbruno.pl/webinar",
  /** Plan 60 minut (LP + mail potwierdzenia). */
  // 10.11: plan pod właściciela: kontrola i liczby (wniosek z Ewatex 28.10 i Mauricio 29.10), słowo „szkolenie” odstrasza.
  plan: [
    // Każdy punkt kończy się efektem „dzięki temu…” (Popiel M8 L01).
    ["19:00", "3 powody, dla których handlowcy nie sprzedają", "Nie umie, nie chce albo system nie działa. Dzięki temu rozpoznasz, który problem masz u siebie, zanim zatrudnisz kogoś nowego."],
    ["19:15", "Na jakich etapach uciekają klienci", "Lejek sprzedaży etap po etapie i handlowiec po handlowcu. Dzięki temu wiesz, co naprawić najpierw."],
    ["19:30", "Na żywo: handlowiec kontra klient AI", "AI gra trudnego klienta. Po rozmowie ocena i 3 rzeczy do poprawy. Dzięki temu zobaczysz, jak handlowiec ćwiczy rozmowę przed spotkaniem z prawdziwym klientem."],
    ["19:45", "Bruno AI: poprawia wyniki sprzedażowe handlowców", "Kto ćwiczył, kto nie domyka, kto robi postęp. Dzięki temu rozmowa z handlowcem zaczyna się od liczb."],
    ["20:00", "Pytania i co dalej", "Pytasz o swój zespół. Odpowiadam na żywo."],
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
