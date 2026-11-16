// 21.10 (USER_001): termin webinaru. Jedno miejsce dla LP, metadanych, maili i kalendarza.
// 27.10 (USER_001): NOWY TERMIN śr 4.11 19:00 czasu polskiego (Zoom ustawiony na 4.11 19:00 Warszawa) i NOWY TEMAT
// dla właścicieli firm: „Jak sprawić, żeby handlowcy robili 100 % planu sprzedaży” (zastępuje „Jak zwiększyć sprzedaż…”).
// CET = UTC+1 (od 25.10), więc start 18:00 UTC. Koniec ok. 20:00.
// 31.10 (USER_001: „nie robimy tego dla b2b, w to miejsce wejdzie ten”): webinar B2B ODWOŁANY, ten sam termin i Zoom
// = webinar dla grupy A (chcą ZOSTAĆ handlowcami, badanie SalesAI/sprzedaz/badanie-b2c/). Nowy klucz, żeby testowe
// zapisy B2B z 29.10 nie dostawały maili A. Po potwierdzeniu zapisu uczestnik robi test predyspozycji (przed webinarem).
// 10.11 (USER_001: „będziemy robić webinary sprzedażowe o Bruno AI”): webinar DLA FIRM wraca, wt 17.11 19:00 czasu polskiego
// (CET = UTC+1, start 18:00 UTC). Odbiorca: każdy, kto ma handlowców (liczba obojętna). Nowy klucz, nowy Zoom od USER_001.
// 16.11 (USER_001): webinar dla firm odwołany (2/30 zapisów). Nowy temat DLA HANDLOWCÓW: „Obraz siebie = nasze wyniki sprzedażowe”
// (szkolenie z mentalu). 16.11 (USER_001: „w czwartek jest”): czw 19.11 19:00 czasu polskiego (CET, start 18:00 UTC), nowy klucz.
// Link Zoom stary (z 10.11), do potwierdzenia przez USER_001.
export const WEBINAR = {
  /** Klucz webinaru w bazie (`bruno_webinar_zapisy.webinar`). */
  klucz: "2026-11-19-obraz-siebie",
  start: Date.UTC(2026, 10, 19, 18, 0, 0),
  koniec: Date.UTC(2026, 10, 19, 19, 0, 0),
  dzien: "czwartek",
  dzienKrotko: "czw",
  /** „Widzimy się we wtorek.” (maile). */
  dzienWe: "w czwartek",
  data: "19.11",
  dataDluga: "19 listopada",
  /** Data PL dnia webinaru i dnia przed (do crona), format en-CA = RRRR-MM-DD. */
  dataPL: "2026-11-19",
  dataPLDzienPrzed: "2026-11-18",
  godzina: "19:00",
  ics: "20261119T180000Z",
  icsKoniec: "20261119T190000Z",
  // 10.11 (USER_001: „dobre!”): tytuł = pytanie właściciela. Temat w Zoomie zmienia USER_001 ręcznie.
  tytul: "Obraz siebie = wyniki sprzedażowe",
  /** Druga linia pod tytułem (szara). */
  podtytul: "Dowiesz się, jak go zmienić.",
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
  // 16.11 (USER_001): przedziały czasowe (podział minut = propozycja agenta); na końcu szkolenie z hipnozy i sesja Q&A.
  plan: [
    // Każdy punkt kończy się efektem „dzięki temu…” (Popiel M8 L01).
    ["19:00-19:10", "Skąd różnica w zarobkach handlowców", "Koło 40 / 30 / 30: obraz siebie, sposób myślenia, techniki. Dzięki temu wiesz, nad czym pracować najpierw."],
    ["19:10-19:20", "Obraz siebie: sprzedajesz tyle, na ile się czujesz", "Dlaczego znasz techniki, a w rozmowie o nich zapominasz. Dzięki temu przestajesz szukać kolejnego skryptu."],
    ["19:20-19:35", "Telefon, odmowa, cena: co dzieje się w głowie", "Strach przed telefonem, odmowa brana do siebie i cena, z której się tłumaczysz. Dzięki temu rozpoznasz to u siebie."],
    ["19:35-19:45", "Jak zmienia się obraz siebie", "Od czego zacząć pracę nad obrazem siebie. Dzięki temu wiesz, co robić dalej."],
    ["19:45-19:50", "Szkolenie z hipnozy", "4 indywidualne spotkania online po 50 minut. Dzięki temu wiesz, jak dalej pracować nad obrazem siebie."],
    ["19:50-20:00", "Sesja Q&A", "Pytasz o swoją sytuację. Odpowiadam na żywo."],
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
