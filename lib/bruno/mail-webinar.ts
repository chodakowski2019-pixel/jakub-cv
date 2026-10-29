import { MARKA, akapit, kroki, przycisk, stopkaJakub, tabelaParami } from "./szablon-mail.mjs";
// Rozszerzenie .ts w imporcie: scripts/bruno-webinar.mjs wczytuje ten plik prosto w Node (strip-types), bez bundlera.
import { WEBINAR, webinarLinkGoogle } from "./webinar.ts";

// 27.10 (USER_001): sekwencja maili do zapisanych na webinar (śr 4.11 19:00). Każdy mail niesie link do Zooma.
// Nadawca = Jakub Chodakowski (21.10: na webinarze „nie piszemy o Bruno”), więc koperta bez napisu „BRUNO AI”.
// 29.10 (USER_001, Aniserowicz 02.05-02.07 DOUBLE OPT-IN): M0 = „Potwierdzam zapis »” (bez linku Zoom) → klik = zgoda
// → M0b „Masz miejsce” z linkiem Zoom → „jutro” (3.11 8:00) → „dziś” (4.11 8:00) → „za godzinę” (18:00) → „startujemy” (18:55).
// M1-M5 tylko do potwierdzonych. Po webinarze 3 maile ręcznie skryptem (scripts/bruno-webinar.mjs).
// 29.10 (USER_001): maile wychodzą z jakub@salesbruno.com, nie z hello@jakubchodakowski.com.

export const ADRES_WEBINARU = "jakub@salesbruno.com";
// ⛔ 29.10 TYMCZASOWO: salesbruno.com nie jest zweryfikowana w Resend („The salesbruno.com domain is not verified”, test
// produkcyjny 16:18). Do czasu weryfikacji koperta idzie z hello@jakubchodakowski.com, odpowiedzi (reply-to) trafiają na
// jakub@salesbruno.com. Po weryfikacji domeny: NADAWCA_WEBINARU = `Jakub Chodakowski <${ADRES_WEBINARU}>`.
export const NADAWCA_WEBINARU = "Jakub Chodakowski <hello@jakubchodakowski.com>";
/** Klauzula z pop-upu, powtórzona w mailu potwierdzającym (Aniserowicz 02.07: „bo nie wiemy, kto wpisał adres”). */
export const KLAUZULA_WEBINARU =
  "Zapisując się, wyrażasz zgodę na otrzymywanie od Jakuba Chodakowskiego wiadomości o tym webinarze i o treningu handlowców z AI. Administratorem Twoich danych jest Jakub Chodakowski. Dane będą przetwarzane do celów związanych z webinarem i wysyłką wiadomości. Jeśli to nie Ty podałeś ten adres, po prostu zignoruj tę wiadomość: bez kliknięcia nic więcej nie wyślę.";

const CZCIONKA = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const CZCIONKA_NAGLOWKA = "'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function koperta(a: { naglowek: string; tresc: string; zajawka?: string }) {
  return `<!doctype html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(a.naglowek)}</title></head>
<body style="margin:0;padding:0;background:${MARKA.tlo}">
${a.zajawka ? `<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:${MARKA.tlo}">${esc(a.zajawka)}</span>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${MARKA.tlo};margin:0">
<tr><td align="center" style="padding:36px 16px 40px 16px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="540" style="width:100%;max-width:540px">
    <tr><td align="center" style="padding:0 0 22px 0;font-family:${CZCIONKA};font-size:13px;font-weight:500;line-height:1;letter-spacing:0.22em;color:${MARKA.szary}">WEBINAR&nbsp;·&nbsp;${esc(WEBINAR.dzienKrotko.toUpperCase())}&nbsp;${esc(WEBINAR.data)}&nbsp;·&nbsp;${esc(WEBINAR.godzina)}</td></tr>
    <tr><td style="background:${MARKA.karta};border:1px solid ${MARKA.ramka};border-radius:22px;padding:40px 36px 34px 36px">
      <div style="font-family:${CZCIONKA_NAGLOWKA};font-size:28px;font-weight:500;line-height:1.15;letter-spacing:-0.02em;color:${MARKA.tekst};text-align:center;margin:0 0 26px 0">${esc(a.naglowek)}</div>
      ${a.tresc}
      ${stopkaJakub({ podpis: "CEO" })}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

const hej = (imie: string | null) => (imie ? `Cześć ${esc(imie)},` : "Cześć,");

/** Tabelka „kiedy / gdzie / Zoom ID”, w każdym mailu ta sama. */
function tabelaTerminu() {
  return tabelaParami([
    ["Kiedy", `${WEBINAR.dzien}, ${WEBINAR.dataDluga}, ${WEBINAR.godzina}`],
    ["Gdzie", "Zoom, link w przycisku niżej"],
    ["ID spotkania", WEBINAR.zoomId],
    ["Ile trwa", "60 minut"],
    ["Nagranie", "nie będzie"],
  ]);
}

/** Linki do kalendarza: Google + plik .ics z naszej domeny (data: nie działa w poczcie). */
function kalendarz(baza: string) {
  const styl = `font-family:${CZCIONKA};font-size:14px;color:${MARKA.tekst};text-decoration:underline`;
  return `<p style="margin:0 0 18px 0;font-family:${CZCIONKA};font-size:14px;line-height:1.6;color:${MARKA.szary};text-align:center">Dodaj do kalendarza:
<a href="${esc(webinarLinkGoogle())}" style="${styl}">Google</a> · <a href="${esc(`${baza}/api/bruno/webinar/ics`)}" style="${styl}">Apple / Outlook</a></p>`;
}

export type MailWebinaru = { temat: string; html: string };

/**
 * M0: mail POTWIERDZAJĄCY (double opt-in), od razu po formularzu. Bez linku Zoom.
 * Wg Aniserowicza 02.07: nad przyciskiem powitanie + dzięki + „MUSISZ kliknąć, inaczej nic nie wyślę”; przycisk duży;
 * pod przyciskiem klauzula, kolejne kroki, prośba o kontakty i przeniesienie do Inboxa; pozdrowienia; PS.
 */
export function mailWebinarPotwierdz(a: { imie: string | null; link: string }): MailWebinaru {
  return {
    temat: `Potwierdź zapis na webinar (${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina})`,
    html: koperta({
      naglowek: "Jeszcze jedno kliknięcie",
      zajawka: "Kliknij „Potwierdzam zapis”, a wyślę Ci link do spotkania.",
      tresc: [
        akapit(`${hej(a.imie)} dziękuję za zapis na webinar „${esc(WEBINAR.tytul)}”.`),
        akapit(`<b>Żeby dokończyć zapis, musisz kliknąć przycisk poniżej.</b> Bez tego nie wyślę Ci linku do spotkania ani żadnej innej wiadomości.`),
        przycisk({ tekst: "Potwierdzam zapis »", link: a.link }),
        kroki(
          ["Po kliknięciu od razu dostaniesz mail z linkiem do spotkania na Zoomie i z planem 60 minut.", `Dzień przed (${WEBINAR.dataPLDzienPrzed.slice(8)}.11) i godzinę przed startem przypomnę mailem.`, "Nagrania nie będzie, więc wpisz termin do kalendarza (linki będą w następnym mailu)."],
          { tytul: "Co dalej" },
        ),
        akapit(`Jeśli ta wiadomość trafiła do „Ofert” albo spamu, przenieś ją do głównej skrzynki i dodaj adres <b>${esc(ADRES_WEBINARU)}</b> do kontaktów. Wtedy link i przypomnienia też tam trafią.`),
        akapit("Widzimy się w środę. Pozdrawiam"),
        akapit(`PS Najważniejsze w tym mailu to przycisk wyżej. Bez kliknięcia nie ma miejsca na liście.`),
        akapit(esc(KLAUZULA_WEBINARU), { maly: true }),
      ].join("\n"),
    }),
  };
}

/** M0b: po kliknięciu w link potwierdzający. Link Zoom + kalendarz + plan. (Do 29.10 szło od razu po zapisie.) */
export function mailWebinarPotwierdzenie(a: { imie: string | null; baza: string }): MailWebinaru {
  return {
    temat: `Masz miejsce na webinarze: ${WEBINAR.dzien} ${WEBINAR.data}, ${WEBINAR.godzina}. Link w środku`,
    html: koperta({
      naglowek: "Masz miejsce",
      zajawka: `Link do Zooma w środku. ${WEBINAR.tytul}.`,
      tresc: [
        akapit(`${hej(a.imie)} zapis potwierdzony. Poniżej wszystko, czego potrzebujesz ⤵️`),
        tabelaTerminu(),
        przycisk({ tekst: "Link do Zooma", link: WEBINAR.zoom }),
        kalendarz(a.baza),
        kroki(
          WEBINAR.plan.map(([g, h]) => `<b>${esc(g)}</b> ${esc(h)}`),
          { tytul: "Plan 60 minut" },
        ),
        akapit("Jedna prośba przed webinarem: policz, ile procent planu sprzedaży zrobił Twój zespół w zeszłym miesiącu. Ta liczba przyda się w pierwszych 10 minutach."),
        akapit("Przypomnę mailem dzień przed i godzinę przed startem."),
        akapit("Pozdrawiam"),
      ].join("\n"),
    }),
  };
}

/** M1: dzień przed, rano. */
export function mailWebinarJutro(a: { imie: string | null; baza: string }): MailWebinaru {
  return {
    temat: `Jutro ${WEBINAR.godzina}: ${WEBINAR.tytul.toLowerCase()}`,
    html: koperta({
      naglowek: `Jutro o ${WEBINAR.godzina}`,
      zajawka: "Link do Zooma w środku. 60 minut, bez nagrania.",
      tresc: [
        akapit(`${hej(a.imie)} jutro widzimy się na Zoomie. Nagrania nie będzie, więc zarezerwuj godzinę w kalendarzu.`),
        tabelaTerminu(),
        przycisk({ tekst: "Link do Zooma", link: WEBINAR.zoom }),
        kalendarz(a.baza),
        akapit("Na żywo pokażę rozmowę handlowca z klientem AI. Jeśli chcesz, żeby klient AI był z Twojej branży, odpisz na tego maila jednym zdaniem: co sprzedajecie i jaką obiekcję słyszycie najczęściej."),
        akapit("Pozdrawiam"),
      ].join("\n"),
    }),
  };
}

/** M2: w dniu webinaru, rano. */
export function mailWebinarDzis(a: { imie: string | null; baza: string }): MailWebinaru {
  return {
    temat: `Dziś ${WEBINAR.godzina} na Zoomie: ${WEBINAR.tytul.toLowerCase()}`,
    html: koperta({
      naglowek: `Dziś o ${WEBINAR.godzina}`,
      zajawka: "Link do Zooma w środku. Wejdź 5 minut wcześniej.",
      tresc: [
        akapit(`${hej(a.imie)} dziś o ${WEBINAR.godzina} startujemy. Wejdź 5 minut wcześniej, zaczynam punktualnie.`),
        tabelaTerminu(),
        przycisk({ tekst: "Link do Zooma", link: WEBINAR.zoom }),
        kroki(["Komputer albo telefon z Zoomem (działa też w przeglądarce).", "Słuchawki, jeśli jesteś w biurze.", "Liczba: ile procent planu zrobił zespół w zeszłym miesiącu."], { tytul: "Co przygotować" }),
        akapit("Pozdrawiam"),
      ].join("\n"),
    }),
  };
}

/** M3: godzinę przed startem (Resend scheduledAt). */
export function mailWebinarZaGodzine(a: { imie: string | null }): MailWebinaru {
  return {
    temat: `Za godzinę startujemy (${WEBINAR.godzina}). Link do Zooma`,
    html: koperta({
      naglowek: "Za godzinę",
      zajawka: "Link do Zooma w środku.",
      tresc: [
        akapit(`${hej(a.imie)} o ${WEBINAR.godzina} zaczynam. Link poniżej, ID spotkania ${esc(WEBINAR.zoomId)}.`),
        przycisk({ tekst: "Link do Zooma", link: WEBINAR.zoom }),
        akapit("Do zobaczenia."),
      ].join("\n"),
    }),
  };
}

/** M4: 5 minut przed startem (Resend scheduledAt). */
export function mailWebinarStart(a: { imie: string | null }): MailWebinaru {
  return {
    temat: "Wchodzimy. Link do Zooma",
    html: koperta({
      naglowek: "Startujemy",
      zajawka: "Zoom jest otwarty. Wejdź teraz.",
      tresc: [akapit(`${hej(a.imie)} Zoom jest już otwarty. Wejdź teraz, zaczynam o ${WEBINAR.godzina}.`), przycisk({ tekst: "Wejdź na Zooma", link: WEBINAR.zoom })].join("\n"),
    }),
  };
}

export type GrupaPoWebinarze = "byli" | "wyszli" | "nieprzyszli";

/**
 * M5: dzień po webinarze, 3 grupy (wzór Huzarski, PLAN 16.10): byli do końca / wyszli przed końcem / zapisali się i nie przyszli.
 * Jedno wezwanie: bezpłatna rozmowa demo 20 min, do 5 dni (Negacz, lejek #7). Nagrania NIE wysyłamy.
 */
export function mailWebinarPo(a: { imie: string | null; grupa: GrupaPoWebinarze }): MailWebinaru {
  const demo = przycisk({ tekst: "Umawiam rozmowę demo (20 min)", link: WEBINAR.demo });
  if (a.grupa === "byli")
    return {
      temat: "Dziękuję za wczoraj. Następny krok dla Twojego zespołu",
      html: koperta({
        naglowek: "Dziękuję za wczoraj",
        tresc: [
          akapit(`${hej(a.imie)} dziękuję, że byłeś do końca. Tak jak mówiłem na koniec: przez 5 dni możesz umówić bezpłatną rozmowę demo, 20 minut online.`),
          kroki(["Powiesz mi, co sprzedajecie i na czym handlowcy tracą klienta.", "Klient AI zagra Waszego klienta z Waszą obiekcją, na żywo.", "Ustalimy, czy pilot dla 3 handlowców ma u Was sens. Jeśli nie, mówię to wprost."], { tytul: "Jak wygląda rozmowa" }),
          demo,
          akapit("Terminy są do wtorku 10.11. Potem wracam do zespołów, które już startują."),
          akapit("Pozdrawiam"),
        ].join("\n"),
      }),
    };
  if (a.grupa === "wyszli")
    return {
      temat: "Nie zdążyłeś zobaczyć końcówki. Oto, co tam było",
      html: koperta({
        naglowek: "Końcówka webinaru",
        tresc: [
          akapit(`${hej(a.imie)} widziałem, że wyszedłeś przed końcem. Nagrania nie ma, więc w 3 zdaniach, co było potem:`),
          kroki(["Na żywo: handlowiec rozmawiał z klientem AI, po rozmowie ocena i 3 rzeczy do poprawy.", "Jak wdrożyć 10 minut treningu dziennie tak, żeby zespół robił to sam.", "Następny krok: bezpłatna rozmowa demo 20 min, do 5 dni."]),
          demo,
          akapit("Pozdrawiam"),
        ].join("\n"),
      }),
    };
  return {
    temat: "Nie było Cię wczoraj. Nagrania nie ma, ale jest coś lepszego",
    html: koperta({
      naglowek: "Wczoraj Cię zabrakło",
      tresc: [
        akapit(`${hej(a.imie)} zapisałeś się na wczorajszy webinar, ale Cię nie było. Nagrania nie ma. Jest za to 20 minut na Twój zespół, nie ogólny wykład.`),
        kroki(["Policzymy, ile kosztuje Cię handlowiec, który uczy się na klientach.", "Klient AI zagra Waszego klienta na żywo.", "Powiem wprost, czy to ma u Was sens."], { tytul: "Rozmowa demo online" }),
        demo,
        akapit("Terminy do wtorku 10.11."),
        akapit("Pozdrawiam"),
      ].join("\n"),
    }),
  };
}
