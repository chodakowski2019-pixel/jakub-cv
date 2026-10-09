// Mail do klienta po umówieniu rozmowy z demo Bruno (USER_001 9.10: „template w stylu tej strony”).
// Styl = LP /brunobusiness: biała karta 22 px zaokrąglenia, „BRUNO AI”
// wersalikami, czarne przyciski-pigułki, pomarańczowy akcent #f08a2b. Po poprawkach USER_001 9.10:
// białe tło, bez zdjęcia, bez „With”, bez LinkedIna i „Need another time?”, wydarzenie „Sales AI x [imię]”.
// Maile nie obsługują SVG ani webfontów pewnie, więc: tabele, style w linii, ikony PNG,
// czcionki z bezpiecznym zapasem (Helvetica/Arial).
// Bez zależności od reszty kodu, żeby dało się go wywołać ze skryptu (node) i z API.

export const DEMO_MINUT_MAIL = 30;

const ESC = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Link „Dodaj do Kalendarza Google” (działa bez logowania do niczego po naszej stronie). */
export function linkGoogleKalendarz(a: { start: string; minut: number; tytul: string; opis: string }): string {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const s = new Date(a.start);
  const e = new Date(s.getTime() + a.minut * 60000);
  const q = new URLSearchParams({ action: "TEMPLATE", text: a.tytul, dates: `${f(s)}/${f(e)}`, details: a.opis });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

const T = {
  en: {
    temat: (kiedy: string) => `Booked: Bruno AI demo, ${kiedy} (UK time)`,
    zajawka: (kiedy: string) => `Your call with Jakub is booked for ${kiedy} (UK time).`,
    h1: "Your call is booked",
    czasUK: "UK time",
    hej: (imie: string) => `Hi ${imie},`,
    wstep: "Thanks for booking. Here is everything you need for our call.",
    dlugosc: "Length",
    minut: `${DEMO_MINUT_MAIL} minutes`,
    gdzie: "Where",
    wideo: "Video call",
    linkPozniej: "I will send the link before the call",
    zKim: "With",
    jakub: "Jakub Chodakowski, Founder of Bruno AI",
    coH: "What happens on the call",
    co: ["I ask about your team and how they sell today.", "You see Bruno live, playing your own customer.", "We decide together if it makes sense for you."],
    dodaj: "Add to Google Calendar",
    zalacznik: "Using Outlook or Apple Calendar? Open the invite attached to this email.",
    inny: "Need another time? Just reply to this email.",
    linkedin: "Connect on LinkedIn",
    stopka: "Bruno AI · AI sales practice for teams",
    tytulKal: "Bruno AI demo with Jakub Chodakowski",
    locale: "en-GB",
  },
  pl: {
    temat: (kiedy: string) => `Umówione: demo Bruno AI, ${kiedy} (czas UK)`,
    zajawka: (kiedy: string) => `Rozmowa z Jakubem umówiona na ${kiedy} (czas UK).`,
    h1: "Rozmowa umówiona",
    czasUK: "czas UK",
    hej: (imie: string) => `Cześć ${imie},`,
    wstep: "Dzięki za zapis. Poniżej wszystko, czego potrzebujesz przed rozmową.",
    dlugosc: "Długość",
    minut: `${DEMO_MINUT_MAIL} minut`,
    gdzie: "Gdzie",
    wideo: "Rozmowa wideo",
    linkPozniej: "link wyślę przed rozmową",
    zKim: "Z kim",
    jakub: "Jakub Chodakowski, założyciel Bruno AI",
    coH: "Jak wygląda rozmowa",
    co: ["Pytam o Twój zespół i o to, jak dziś sprzedaje.", "Widzisz Bruno na żywo, jak gra Waszego klienta.", "Razem decydujemy, czy to ma dla Was sens."],
    dodaj: "Dodaj do Kalendarza Google",
    zalacznik: "Używasz Outlooka albo Kalendarza Apple? Otwórz zaproszenie w załączniku.",
    inny: "Potrzebujesz innej godziny? Odpisz na tego maila.",
    linkedin: "Połączmy się na LinkedInie",
    stopka: "Bruno AI · trening sprzedaży z AI dla zespołów",
    tytulKal: "Demo Bruno AI z Jakubem Chodakowskim",
    locale: "pl-PL",
  },
} as const;

export type MailDemo = { temat: string; html: string; text: string; tytulKal: string; opisKal: string };

/**
 * Potwierdzenie rozmowy dla klienta.
 * baza = adres strony (obrazki), ikonaKalendarza = nadpisanie źródła ikony (np. „cid:…” w teście).
 */
export function mailPotwierdzenieDemo(a: {
  imie: string;
  start: string;
  jezyk: "en" | "pl";
  link?: string | null;
  baza?: string;
  ikonaKalendarza?: string;
}): MailDemo {
  const x = T[a.jezyk];
  const baza = (a.baza ?? "https://jakubchodakowski.com").replace(/\/$/, "");
  const start = new Date(a.start);
  const kiedy = new Intl.DateTimeFormat(x.locale, { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(start);
  const kiedyGora = kiedy.charAt(0).toUpperCase() + kiedy.slice(1);
  const link = a.link?.trim() || null;
  // 9.10 (USER_001): nazwa wydarzenia w kalendarzu = „Sales AI x [imię]”.
  const tytulKal = `Sales AI x ${a.imie}`;
  const opisKal = `${x.minut}. ${x.co.join(" ")}${link ? ` ${link}` : ""}`;
  const gcal = linkGoogleKalendarz({ start: a.start, minut: DEMO_MINUT_MAIL, tytul: tytulKal, opis: opisKal });
  const ikona = a.ikonaKalendarza ?? `${baza}/email/kalendarz.png`;

  const font = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
  const ink = "#111111";
  const muted = "#6b6b6b";
  const linia = "#ececea";

  const wiersz = (etykieta: string, wartosc: string) => `
    <tr>
      <td style="padding:14px 0;border-top:1px solid ${linia};font:400 13px/1.4 ${font};color:${muted};width:96px;vertical-align:top">${ESC(etykieta)}</td>
      <td style="padding:14px 0;border-top:1px solid ${linia};font:600 15px/1.4 ${font};color:${ink}">${wartosc}</td>
    </tr>`;

  const html = `<!doctype html>
<html lang="${a.jezyk}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${ESC(x.h1)}</title></head>
<body style="margin:0;padding:0;background:#ffffff">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#ffffff">${ESC(x.zajawka(kiedy))}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
  <tr><td align="center" style="padding:36px 16px 40px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
      <tr><td align="center" style="padding:0 0 22px;font:500 13px/1 ${font};letter-spacing:0.22em;color:${muted}">BRUNO AI</td></tr>
      <tr><td style="background:#ffffff;border-radius:22px;padding:40px 36px 34px;border:1px solid #ebeae7">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="font:500 32px/1.15 ${font};letter-spacing:-0.02em;color:${ink};padding:0 0 16px">${ESC(x.h1)}</td></tr>
          <tr><td align="center" style="padding:0 0 30px">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="padding:0 10px 0 0;vertical-align:middle"><img src="${ikona}" width="22" height="22" alt="" style="display:block;width:22px;height:22px"></td>
              <td style="font:600 17px/1.3 ${font};color:${ink};vertical-align:middle">${ESC(kiedyGora)} <span style="font-weight:400;color:${muted}">(${ESC(x.czasUK)})</span></td>
            </tr></table>
          </td></tr>
          <tr><td style="font:400 15px/1.6 ${font};color:#333333;padding:0 0 6px">${ESC(x.hej(a.imie))}</td></tr>
          <tr><td style="font:400 15px/1.6 ${font};color:#333333;padding:0 0 20px">${ESC(x.wstep)}</td></tr>
          <tr><td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${wiersz(x.dlugosc, ESC(x.minut))}
              ${wiersz(x.gdzie, link ? `<a href="${ESC(link)}" style="color:${ink};text-decoration:underline">${ESC(x.wideo)}</a>` : ESC(x.wideo))}
            </table>
          </td></tr>
          <tr><td align="center" style="padding:26px 0 14px;font:600 15px/1.4 ${font};color:${ink};border-top:1px solid ${linia}">${ESC(x.coH)}</td></tr>
          ${x.co
            .map(
              (c, i) => `<tr><td style="padding:0 0 10px">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:26px;vertical-align:top;font:600 13px/1.6 ${font};color:#f08a2b">0${i + 1}</td>
              <td style="font:400 15px/1.6 ${font};color:#333333">${ESC(c)}</td>
            </tr></table>
          </td></tr>`,
            )
            .join("")}
          <tr><td align="center" style="padding:24px 0 12px">
            <a href="${ESC(gcal)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font:600 15px/1 ${font};padding:17px 28px;border-radius:999px">${ESC(x.dodaj)}</a>
          </td></tr>
          <tr><td align="center" style="font:400 12.5px/1.5 ${font};color:${muted};padding:0 0 4px">${ESC(x.zalacznik.replace(/\?.*$/, "?"))}<br>${ESC(x.zalacznik.replace(/^[^?]*\?\s*/, ""))}</td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:24px 0 0;font:400 12px/1.6 ${font};color:#9a9a9a">${ESC(x.stopka)}<br><a href="${baza}/brunobusiness" style="color:#9a9a9a">jakubchodakowski.com/brunobusiness</a></td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    x.h1,
    `${kiedyGora} (${x.czasUK})`,
    "",
    x.hej(a.imie),
    x.wstep,
    "",
    `${x.dlugosc}: ${x.minut}`,
    `${x.gdzie}: ${x.wideo}${link ? ` ${link}` : ""}`,
    "",
    x.coH,
    ...x.co.map((c, i) => `${i + 1}. ${c}`),
    "",
    `${x.dodaj}: ${gcal}`,
    "",
    "Jakub Chodakowski",
    "Bruno AI",
  ].join("\n");

  return { temat: x.temat(kiedy), html, text, tytulKal, opisKal };
}
