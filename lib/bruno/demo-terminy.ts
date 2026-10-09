// Terminy rozmów sprzedażowych z demo Bruno (USER_001 9.10): 3 sloty dziennie,
// poniedziałek, środa, czwartek, tylko bieżący miesiąc. Godziny w czasie UK
// (rynek docelowy), przeglądarka pokazuje je w strefie odwiedzającego.
// Bez Kalendarza Google: zajętość = tabela bruno_demo (status „umowione”).
// USER_001 trzyma te godziny wolne w swoim kalendarzu.

export const DEMO_MINUT = 30;
export const STREFA_DEMO = "Europe/London";
/** Godziny w czasie UK: 10:00, 12:00, 14:00 (= 11:00, 13:00, 15:00 w Polsce). */
export const GODZINY_UK = [10, 12, 14];
/** Poniedziałek, środa, czwartek (getUTCDay: 1, 3, 4). */
export const DNI_TYGODNIA = [1, 3, 4];
/** Najkrótszy czas od zapisu do rozmowy. */
export const MIN_GODZIN_WCZESNIEJ = 12;

/** Przesunięcie strefy (minuty) w danej chwili, np. Londyn latem = +60. */
function przesuniecie(strefa: string, chwila: Date): number {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: strefa, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const c = Object.fromEntries(f.formatToParts(chwila).map((p) => [p.type, p.value]));
  const jakoUtc = Date.UTC(Number(c.year), Number(c.month) - 1, Number(c.day), Number(c.hour), Number(c.minute), Number(c.second));
  return Math.round((jakoUtc - chwila.getTime()) / 60000);
}

/** Godzina h:00 danego dnia w strefie → chwila UTC. */
function wStrefie(rok: number, miesiac: number, dzien: number, h: number, strefa: string): Date {
  const zgrubnie = new Date(Date.UTC(rok, miesiac, dzien, h));
  const off = przesuniecie(strefa, zgrubnie);
  const wynik = new Date(zgrubnie.getTime() - off * 60000);
  // Druga iteracja na wypadek zmiany czasu tego dnia.
  const off2 = przesuniecie(strefa, wynik);
  return off2 === off ? wynik : new Date(zgrubnie.getTime() - off2 * 60000);
}

/** Wszystkie sloty od teraz do końca bieżącego miesiąca (czas UK), bez filtra zajętości. */
export function slotyMiesiaca(teraz = new Date()): string[] {
  const c = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: STREFA_DEMO, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(teraz).map((p) => [p.type, p.value]),
  );
  const rok = Number(c.year);
  const miesiac = Number(c.month) - 1;
  const ostatni = new Date(Date.UTC(rok, miesiac + 1, 0)).getUTCDate();
  const granica = teraz.getTime() + MIN_GODZIN_WCZESNIEJ * 3600_000;
  const sloty: string[] = [];
  for (let d = Number(c.day); d <= ostatni; d++) {
    const dzienTyg = new Date(Date.UTC(rok, miesiac, d)).getUTCDay();
    if (!DNI_TYGODNIA.includes(dzienTyg)) continue;
    for (const h of GODZINY_UK) {
      const t = wStrefie(rok, miesiac, d, h, STREFA_DEMO);
      if (t.getTime() >= granica) sloty.push(t.toISOString());
    }
  }
  return sloty;
}

/** Plik .ics (zaproszenie do kalendarza) dla jednej rozmowy. */
export function zaproszenieIcs(a: { start: string; tytul: string; opis: string; organizator: string; uczestnik: string; uid: string }): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const s = new Date(a.start);
  const e = new Date(s.getTime() + DEMO_MINUT * 60000);
  const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bruno AI//Demo//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${a.uid}@jakubchodakowski.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(s)}`,
    `DTEND:${fmt(e)}`,
    `SUMMARY:${esc(a.tytul)}`,
    `DESCRIPTION:${esc(a.opis)}`,
    `ORGANIZER;CN=Jakub Chodakowski:mailto:${a.organizator}`,
    `ATTENDEE;CN=${esc(a.uczestnik)};RSVP=TRUE:mailto:${a.uczestnik}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
