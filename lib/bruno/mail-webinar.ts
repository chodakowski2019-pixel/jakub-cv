// Rozszerzenie .ts w imporcie: scripts/bruno-webinar.mjs wczytuje ten plik prosto w Node (strip-types), bez bundlera.
import { WEBINAR, webinarLinkGoogle } from "./webinar.ts";

// 27.10 (USER_001): sekwencja maili do zapisanych na webinar (śr 4.11 19:00).
// 29.10 (USER_001, Aniserowicz / Mailketing 02.05-02.07) DOUBLE OPT-IN: M0 = „Potwierdzam zapis »” (bez linku Zoom) → klik = zgoda
// → M0b „Masz miejsce” z linkiem Zoom → M1 „jutro” (3.11 8:00) → M2 „dziś” (4.11 8:00) → M3 „za godzinę” (18:00) → M4 „startujemy” (18:55).
// M1-M5 tylko do potwierdzonych i niewypisanych. Po webinarze 3 maile ręcznie skryptem (scripts/bruno-webinar.mjs).
// 29.10 v2 (USER_001: „dokładnie tak, jak mówi Aniserowicz”), lekcje 04-03, 04-06, 04-07, 08-02, 02-07, 01-05, 10-03:
//   - mail wygląda jak mail od kolegi: tekst, bez szablonu, kart, kolumn, nagłówków-banerów i zdjęć; HTML tylko do linków,
//   - jeden CTA = pogrubiony link w osobnej linii, kończony », nigdy goły adres; przycisk tylko w mailu potwierdzającym,
//   - powitanie „Cześć Imię,” (nigdy „Witam”), 1 myśl = 1 akapit, pogrubione słowa-klucze, wyliczenia jako punkty,
//   - zakończenie: pozdrowienia + podpis, PS w każdym mailu (prośba o odpowiedź / najważniejsze jeszcze raz),
//   - w każdym mailu link „Wypisz się” (1 klik, ze wszystkiego) + dane nadawcy,
//   - mail potwierdzający: powitanie, „musisz kliknąć”, duży przycisk, klauzula, co dalej, kontakty / Inbox, PS; zero marketingu.
// 29.10 (USER_001): maile wychodzą z jakub@salesbruno.com (koperta tymczasowo hello@, patrz niżej).

export const ADRES_WEBINARU = "jakub@salesbruno.com";
// 29.10: salesbruno.com zweryfikowana w Resend (USER_001, Auto configure przez Vercel DNS). Koperta i reply-to = jakub@salesbruno.com.
export const NADAWCA_WEBINARU = `Jakub Chodakowski <${ADRES_WEBINARU}>`;
/** Klauzula z pop-upu, powtórzona w mailu potwierdzającym (Aniserowicz 02-07: „bo nie wiemy, kto wpisał adres”). */
export const KLAUZULA_WEBINARU =
  "Zapisując się, wyrażasz zgodę na otrzymywanie od Jakuba Chodakowskiego wiadomości o tym webinarze i o szkoleniach sprzedaży z AI. Administratorem Twoich danych jest Jakub Chodakowski. Dane będą przetwarzane do celów związanych z webinarem i wysyłką wiadomości. Jeśli to nie Ty podałeś ten adres, po prostu zignoruj tę wiadomość: bez kliknięcia nic więcej nie wyślę.";

const F = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hej = (imie: string | null) => (imie ? `Cześć ${esc(imie)},` : "Cześć,");

/** Akapit zwykłego tekstu (HTML dozwolony: <b>, <a>). */
const p = (html: string) => `<p style="margin:0 0 18px 0;font-family:${F};font-size:16px;line-height:1.6;color:#111111">${html}</p>`;
/** Jedyne wezwanie w mailu: pogrubiony link w osobnej linii, ze strzałkami » (Aniserowicz 04-06, 02-04). */
const linia = (tekst: string, link: string) =>
  `<p style="margin:0 0 22px 0;font-family:${F};font-size:17px;line-height:1.5"><a href="${esc(link)}" style="font-weight:700;color:#111111;text-decoration:underline">${esc(tekst)} »</a></p>`;
/** Wyliczenie jako punkty (04-03: czytelnik skanuje). */
const lista = (punkty: string[]) =>
  `<ul style="margin:0 0 18px 0;padding:0 0 0 22px">${punkty.map((x) => `<li style="margin:0 0 8px 0;font-family:${F};font-size:16px;line-height:1.55;color:#111111">${x}</li>`).join("")}</ul>`;
const ps = (html: string) => p(`<b>PS</b> ${html}`);
/** Duży, kolorowy przycisk: tylko w mailu potwierdzającym (02-07: „duży, wyraźny, nie da się przegapić”). */
const przyciskPotwierdz = (tekst: string, link: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 26px 0"><tr><td style="background:#f08a2b;border-radius:10px"><a href="${esc(link)}" style="display:inline-block;padding:18px 34px;font-family:${F};font-size:18px;font-weight:700;line-height:1;color:#111111;text-decoration:none">${esc(tekst)} »</a></td></tr></table>`;

/**
 * Koperta „jak mail od kolegi”: białe tło, tekst od lewej, bez nagłówka i karty. Na dole podpis, dane nadawcy
 * i link wypisania (gdy jest token). Zajawka = ukryty tekst podglądu w skrzynce.
 */
function koperta(a: { tresc: string; zajawka?: string; wypisz?: string; bezPodpisu?: boolean; ps?: string }) {
  // 29.10 (USER_001): bez linii „Jakub Chodakowski, NIP · e-mail” pod PS; zostaje tylko „Wypisz się”, gdy jest token.
  const stopka = [
    a.wypisz
      ? `<p style="margin:28px 0 0 0;font-family:${F};font-size:13px;line-height:1.6;color:#777777">Dostajesz tę wiadomość, bo zapisałeś się na webinar na salesbruno.pl. Nie chcesz więcej wiadomości o webinarze? <a href="${esc(a.wypisz)}" style="color:#777777;text-decoration:underline">Wypisz się</a> (jedno kliknięcie, bez pytań).</p>`
      : "",
  ].join("");
  return `<!doctype html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>Webinar</title></head>
<body style="margin:0;padding:0;background:#ffffff">
${a.zajawka ? `<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#ffffff">${esc(a.zajawka)}</span>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;margin:0"><tr><td align="left" style="padding:28px 20px 40px 20px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px"><tr><td style="text-align:left">
${a.tresc}
${a.bezPodpisu ? "" : p("Pozdrawiam<br><b>Jakub</b>")}
${a.ps ? ps(a.ps) : ""}
${stopka}
</td></tr></table>
</td></tr></table>
</body>
</html>`;
}

export type MailWebinaru = { temat: string; html: string };
// 31.10: `test` = link do testu predyspozycji (strona „Masz miejsce” z tokenem), tylko gdy uczestnik go jeszcze nie zrobił.
type Odbiorca = { imie: string | null; baza: string; wypisz?: string; test?: string };

/** Linki do kalendarza w jednej linii (Google + .ics z naszej domeny; data: nie działa w poczcie). */
const kalendarz = (baza: string) =>
  p(`Wpisz do kalendarza: <a href="${esc(webinarLinkGoogle())}" style="color:#111111">Google</a> albo <a href="${esc(`${baza}/api/bruno/webinar/ics`)}" style="color:#111111">Apple / Outlook</a>. Nagrania nie będzie.`);

/**
 * M0: mail POTWIERDZAJĄCY (double opt-in), od razu po formularzu. Bez linku Zoom, zero marketingu.
 * Aniserowicz 02-07: nad przyciskiem powitanie + dzięki + „MUSISZ kliknąć, inaczej nic nie wyślę”; przycisk duży; pod
 * przyciskiem klauzula, kolejne kroki, prośba o kontakty i przeniesienie do Inboxa; pozdrowienia; PS.
 */
export function mailWebinarPotwierdz(a: { imie: string | null; link: string }): MailWebinaru {
  return {
    temat: `Potwierdź zapis na webinar (${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina})`,
    html: koperta({
      ps: "Najważniejsze w tym mailu to przycisk wyżej. Bez kliknięcia nie ma miejsca na liście.",
      zajawka: "Kliknij „Potwierdzam zapis”, a wyślę Ci link do spotkania.",
      tresc: [
        p(`${hej(a.imie)}`),
        p(`dziękuję za zapis na webinar „${esc(WEBINAR.tytul)}”.`),
        p(`<b>Żeby dokończyć zapis, musisz kliknąć przycisk poniżej.</b> Bez tego nie wyślę Ci linku do spotkania ani żadnej innej wiadomości.`),
        przyciskPotwierdz("Potwierdzam zapis", a.link),
        p("<b>Co dalej:</b>"),
        lista([
          "Po kliknięciu od razu zobaczysz link do spotkania na Zoomie i krótki test (4 pytania), który omówię na webinarze.",
          `Dzień przed (${WEBINAR.dataPLDzienPrzed.slice(8)}.11) i godzinę przed startem przypomnę mailem.`,
          "Nagrania nie będzie, więc wpisz termin do kalendarza (linki będą w następnym mailu).",
        ]),
        p(`Jeśli ta wiadomość trafiła do „Ofert” albo spamu, przenieś ją do głównej skrzynki i dodaj adres <b>${ADRES_WEBINARU}</b> do kontaktów. Wtedy link i przypomnienia też tam trafią.`),
        p("Widzimy się w środę."),
      ].join("\n"),
    }),
  };
}

/**
 * M0b: po kliknięciu w link potwierdzający. Link Zoom + kalendarz + plan + jedna konkretna rzecz do zrobienia przed
 * webinarem (Aniserowicz 04-14: pierwszy mail po potwierdzeniu ma dać wartość od razu, nie tylko logistykę).
 */
export function mailWebinarPotwierdzenie(a: Odbiorca): MailWebinaru {
  return {
    temat: `Masz miejsce na webinarze: ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}. Link w środku`,
    html: koperta({
      ps: `Jeśli ten mail wylądował w „Ofertach” albo spamie, przenieś go do głównej skrzynki i dodaj <b>${ADRES_WEBINARU}</b> do kontaktów. Przypomnienia przyjdą stąd.`,
      zajawka: `Link do Zooma w środku. ${WEBINAR.tytul}.`,
      wypisz: a.wypisz,
      tresc: [
        p(hej(a.imie)),
        p(`zapis potwierdzony. Widzimy się <b>${esc(WEBINAR.dzien)}, ${esc(WEBINAR.dataDluga)}, o ${esc(WEBINAR.godzina)}</b> na Zoomie (ID spotkania ${esc(WEBINAR.zoomId)}, 60 minut).`),
        linia("Link do spotkania na Zoomie", WEBINAR.zoom),
        p(`<a href="${esc(WEBINAR.zoom)}" style="font-size:13px;color:#555555;word-break:break-all">${esc(WEBINAR.zoom)}</a>`),
        kalendarz(a.baza),
        p("<b>Plan 60 minut:</b>"),
        lista(WEBINAR.plan.map(([g, h]) => `<b>${esc(g)}</b> ${esc(h)}`)),
        a.test
          ? p(`Zanim się spotkamy, zrób jedną rzecz: <b>test „Jakim jesteś handlowcem?”</b>, 4 pytania. Na początku webinaru omawiam wyniki. <a href="${esc(a.test)}" style="color:#111111;font-weight:700">Robię test »</a>`)
          : p("Twój wynik testu już mam. Na początku webinaru powiem, co z niego wynika."),
      ].join("\n"),
    }),
  };
}

/** M1: dzień przed, rano. Jeden CTA (link Zoom), prośba o odpowiedź w PS. */
export function mailWebinarJutro(a: Odbiorca): MailWebinaru {
  return {
    temat: `Jutro ${WEBINAR.godzina}: ${WEBINAR.tytul.toLowerCase()}`,
    html: koperta({
      ps: a.test
        ? `Nie masz jeszcze wyniku testu (4 pytania), a od niego zaczynam: <a href="${esc(a.test)}" style="color:#111111;font-weight:700">robię test »</a>`
        : "Odpisz na tego maila jednym zdaniem: <b>co Cię najbardziej powstrzymuje przed pracą w sprzedaży</b>. Czytam każdą odpowiedź i odpowiem na webinarze.",
      zajawka: "Link do Zooma w środku. 60 minut, bez nagrania.",
      wypisz: a.wypisz,
      tresc: [
        p(hej(a.imie)),
        p(`jutro o <b>${esc(WEBINAR.godzina)}</b> widzimy się na Zoomie. Nagrania nie będzie, więc zarezerwuj godzinę w kalendarzu.`),
        linia("Link do spotkania na Zoomie", WEBINAR.zoom),
        kalendarz(a.baza),
        p("Na żywo pokażę pierwszą rozmowę z klientem AI, który mówi „nie mam czasu” i „muszę się zastanowić”. Zobaczysz, że tego da się nauczyć."),
      ].join("\n"),
    }),
  };
}

/** M2: w dniu webinaru, rano. */
export function mailWebinarDzis(a: Odbiorca): MailWebinaru {
  return {
    temat: `Dziś ${WEBINAR.godzina} na Zoomie: ${WEBINAR.tytul.toLowerCase()}`,
    html: koperta({
      ps: "Wejdź 5 minut wcześniej. Pierwsze 10 minut to najważniejsza część.",
      zajawka: "Link do Zooma w środku. Wejdź 5 minut wcześniej.",
      wypisz: a.wypisz,
      tresc: [
        p(hej(a.imie)),
        p(`dziś o <b>${esc(WEBINAR.godzina)}</b> startujemy. Zaczynam punktualnie.`),
        linia("Link do spotkania na Zoomie", WEBINAR.zoom),
        p("<b>Co przygotować:</b>"),
        lista([
          "Komputer albo telefon z Zoomem (działa też w przeglądarce).",
          "Słuchawki.",
          a.test ? `Wynik testu „Jakim jesteś handlowcem?”: <a href="${esc(a.test)}" style="color:#111111">zrób go teraz, 4 pytania</a>.` : "Twój wynik testu, który już zrobiłeś.",
        ]),
      ].join("\n"),
    }),
  };
}

/** M3: godzinę przed startem (Resend scheduledAt). */
export function mailWebinarZaGodzine(a: { imie: string | null; wypisz?: string }): MailWebinaru {
  return {
    temat: `Za godzinę startujemy (${WEBINAR.godzina}). Link do Zooma`,
    html: koperta({
      zajawka: "Link do Zooma w środku.",
      wypisz: a.wypisz,
      tresc: [p(hej(a.imie)), p(`o <b>${esc(WEBINAR.godzina)}</b> zaczynam. Link poniżej.`), linia("Link do spotkania na Zoomie", WEBINAR.zoom)].join("\n"),
      ps: `ID spotkania, gdyby Zoom pytał: ${esc(WEBINAR.zoomId)}.`,
    }),
  };
}

/** M4: 5 minut przed startem (Resend scheduledAt). */
export function mailWebinarStart(a: { imie: string | null; wypisz?: string }): MailWebinaru {
  return {
    temat: "Wchodzimy. Link do Zooma",
    html: koperta({
      zajawka: "Zoom jest otwarty. Wejdź teraz.",
      wypisz: a.wypisz,
      bezPodpisu: true,
      tresc: [p(hej(a.imie)), p(`Zoom jest już otwarty, zaczynam o ${esc(WEBINAR.godzina)}.`), linia("Wchodzę na Zooma", WEBINAR.zoom), p("Do zobaczenia za chwilę,<br><b>Jakub</b>")].join("\n"),
    }),
  };
}

export type GrupaPoWebinarze = "byli" | "wyszli" | "nieprzyszli";

/**
 * M5: dzień po webinarze, 3 grupy (wzór Huzarski, PLAN 16.10): byli do końca / wyszli przed końcem / zapisali się i nie przyszli.
 * 31.10 (USER_001): webinar dla grupy A, więc jedno wezwanie = szkolenie 3 mies. z gwarancją pracy (WEBINAR.oferta).
 * Nagrania NIE wysyłamy. Bez sztucznych terminów (UOKiK): cena i warunki jak na stronie szkolenia.
 */
export function mailWebinarPo(a: { imie: string | null; grupa: GrupaPoWebinarze; wypisz?: string }): MailWebinaru {
  const oferta = linia("Zobacz szkolenie i swoją ścieżkę", WEBINAR.oferta);
  const warunki = lista([
    "3 miesiące treningu rozmów z klientem AI, ścieżka pod Twoją branżę.",
    "Egzamin i certyfikat, gdy zdasz na 80 %.",
    "Łączymy Cię z firmą. Brak oferty pracy w 30 dni od certyfikatu = zwrot całej kwoty.",
  ]);
  if (a.grupa === "byli")
    return {
      temat: "Dziękuję za wczoraj. Twój następny krok",
      html: koperta({
        ps: "Masz pytanie o swoją sytuację? Odpisz na tego maila, odpowiadam sam.",
        wypisz: a.wypisz,
        tresc: [
          p(hej(a.imie)),
          p("dziękuję, że byłeś do końca. Tak jak mówiłem: jeśli chcesz wejść do sprzedaży w 3 miesiące, a nie uczyć się na prawdziwych klientach, masz to w szkoleniu:"),
          warunki,
          oferta,
        ].join("\n"),
      }),
    };
  if (a.grupa === "wyszli")
    return {
      temat: "Nie zdążyłeś zobaczyć końcówki. Oto, co tam było",
      html: koperta({
        ps: "Masz pytanie? Odpisz na tego maila.",
        wypisz: a.wypisz,
        tresc: [
          p(hej(a.imie)),
          p("widziałem, że wyszedłeś przed końcem. Nagrania nie ma, więc w skrócie: na koniec pokazałem plan na 3 miesiące, od zera do pierwszej pracy w sprzedaży:"),
          warunki,
          oferta,
        ].join("\n"),
      }),
    };
  return {
    temat: "Nie było Cię wczoraj. Nagrania nie ma, ale jest plan",
    html: koperta({
      ps: "Masz pytanie o swoją sytuację? Odpisz na tego maila.",
      wypisz: a.wypisz,
      tresc: [
        p(hej(a.imie)),
        p("zapisałeś się na wczorajszy webinar, ale Cię nie było. Nagrania nie ma. Najważniejsze w skrócie: jak w 3 miesiące wejść do sprzedaży bez doświadczenia."),
        warunki,
        oferta,
      ].join("\n"),
    }),
  };
}
