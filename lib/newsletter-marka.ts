// 22.11.2026: newsletter marki Jakub Chodakowski (strona główna jakubchodakowski.com).
// Wzór: zapisy na webinar Bruno (app/api/bruno/webinar): double opt-in, mail „Potwierdź zapis”, wypisanie jednym kliknięciem.
// Tabela: jc_newsletter (supabase/jc_newsletter.sql). Wysyłka przez Resend z hello@jakubchodakowski.com (domena zweryfikowana).
// Treść maili: proste zdania, bez myślników, bez zmyślonych obietnic (nie ma jeszcze stałego rytmu wysyłki ani materiałów).

import { Resend } from "resend";

export const NADAWCA_NEWSLETTERA = "Jakub Chodakowski <hello@jakubchodakowski.com>";
export const ADRES_ODPOWIEDZI = "hello@jakubchodakowski.com";
export const SKRZYNKA_JAKUBA = "chodakowski2019@gmail.com";

import { KLAUZULA } from "./newsletter-klauzula";
import { WEBINAR_RODZICE } from "./webinar-rodzice";
export { KLAUZULA };

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const F = "Inter,-apple-system,Segoe UI,Arial,sans-serif";
const p = (t: string) => `<p style="margin:0 0 16px 0;font-family:${F};font-size:16px;line-height:1.6;color:#1a1a1a">${t}</p>`;
const przycisk = (tekst: string, link: string) =>
  `<p style="margin:24px 0 28px 0"><a href="${esc(link)}" style="display:inline-block;background:#0b0b0b;color:#ffffff;font-family:${F};font-size:16px;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:999px">${esc(tekst)}</a></p>`;

function koperta(a: { tresc: string; zajawka: string; wypisz?: string }) {
  const stopka = a.wypisz
    ? `<p style="margin:28px 0 0 0;font-family:${F};font-size:13px;line-height:1.6;color:#777777">Ta wiadomość przyszła, bo ten adres został zapisany na newsletter na jakubchodakowski.com. <a href="${esc(a.wypisz)}" style="color:#777777;text-decoration:underline">Wypisz się</a> (jedno kliknięcie, bez pytań).</p>`
    : "";
  return `<!doctype html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>Newsletter</title></head>
<body style="margin:0;padding:0;background:#ffffff">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#ffffff">${esc(a.zajawka)}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;margin:0"><tr><td align="left" style="padding:28px 20px 40px 20px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px"><tr><td style="text-align:left">
${a.tresc}
${p("Pozdrawiam<br><b>Jakub Chodakowski</b>")}
${stopka}
</td></tr></table>
</td></tr></table>
</body>
</html>`;
}

/** Mail 1: „Potwierdź zapis” (double opt-in). Bez treści marketingowej. `w` = zapis na konkretny webinar (np. dla rodziców). */
export function mailPotwierdz(link: string, w?: { imie?: string | null; webinar: string }) {
  const powitanie = w?.imie ? `Cześć ${esc(w.imie)},` : "Cześć,";
  return {
    temat: w ? "Potwierdź zapis na webinar dla rodziców" : "Potwierdź zapis na newsletter o AI",
    html: koperta({
      zajawka: "Jedno kliknięcie i jesteś na liście.",
      tresc: [
        p(powitanie),
        w
          ? p(`dziękuję za zapis na ${esc(w.webinar)}${WEBINAR_RODZICE.start ? ` (${esc(WEBINAR_RODZICE.terminTekst)}, online)` : ""}. Żeby go dokończyć, kliknij przycisk poniżej. Wtedy wyślę ${WEBINAR_RODZICE.start ? "link" : "termin i link"} do spotkania. Bez kliknięcia nic więcej nie wyślę.`)
          : p("dziękuję za zapis na newsletter o AI. Żeby go dokończyć, kliknij przycisk poniżej. Bez kliknięcia nic więcej nie wyślę."),
        przycisk("Potwierdzam zapis", link),
        `<p style="margin:0 0 20px 0;font-family:${F};font-size:13px;line-height:1.6;color:#777777">${esc(KLAUZULA)} Jeśli ten adres nie jest Twój, zignoruj tę wiadomość.</p>`,
      ].join("\n"),
    }),
  };
}

/** Mail 2: po potwierdzeniu. Krótko: co dalej + link do wypisania. */
export function mailWitaj(a: { baza: string; wypisz: string; webinar: boolean; rodzice?: boolean; imie?: string | null }) {
  return {
    temat: a.rodzice ? "Masz miejsce na webinarze dla rodziców" : "Jesteś na liście. Newsletter o AI",
    html: koperta({
      zajawka: "Zapis potwierdzony.",
      wypisz: a.wypisz,
      tresc: [
        p(a.imie ? `Cześć ${esc(a.imie)},` : "Cześć,"),
        a.rodzice
          ? p(WEBINAR_RODZICE.start ? `zapis potwierdzony, masz miejsce na webinarze dla rodziców o AI i zawodach przyszłości: ${esc(WEBINAR_RODZICE.terminTekst)}, online. Link do spotkania przyjdzie w osobnym mailu. Będę też pisać o tym, co AI zmienia w pracy i w życiu.` : "zapis potwierdzony, masz miejsce na webinarze dla rodziców o AI i zawodach przyszłości. Termin i link do spotkania przyjdą w osobnym mailu. Do tego czasu będę też pisać o tym, co AI zmienia w pracy i w życiu.")
          : p("zapis potwierdzony. Będę pisać o tym, co AI zmienia w pracy i w życiu, na przykładach z wiadomości. Prosto i bez żargonu."),
        a.rodzice
          ? ""
          : a.webinar
          ? p("Informacja o najbliższym bezpłatnym webinarze przyjdzie w osobnym mailu, razem z terminem.")
          : p("Raz w miesiącu prowadzę bezpłatny webinar online, 60 minut. Zaproszenie przyjdzie mailem."),
        p(`Na początek: <a href="${esc(`${a.baza}/ai`)}" style="color:#1a1a1a">katalog narzędzi AI</a> i <a href="${esc(`${a.baza}/blog`)}" style="color:#1a1a1a">blog o AI</a>.`),
        p("Masz pytanie? Odpisz na tego maila. Czytam wszystko sam."),
      ].join("\n"),
    }),
  };
}

/** Wysyłka przez Resend. Lokalnie bez RESEND_API_KEY zwraca `pominiety` (bez udawania sukcesu). */
export async function wyslijMail(a: { do: string; temat: string; html: string; replyTo?: string }): Promise<"wyslany" | "pominiety"> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[newsletter] RESEND_API_KEY brak, mail pominięty:", a.temat, "→", a.do);
    return "pominiety";
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: NADAWCA_NEWSLETTERA, to: a.do, replyTo: a.replyTo ?? ADRES_ODPOWIEDZI, subject: a.temat, html: a.html });
  if (error) throw new Error(`Resend: ${error.message}`);
  return "wyslany";
}
