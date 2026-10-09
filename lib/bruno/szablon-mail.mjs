// Szablon maili Bruno AI. JEDNO ŹRÓDŁO dla całego projektu:
//  - aplikacja (lib/bruno/mail.ts, wysyłka przez Resend),
//  - skrypty draftów (scripts/bruno-drafty-dostep.mjs, Gmail API).
// Dlatego to .mjs, a nie .ts: skrypty node importują ten sam plik, więc mail
// z panelu i draft z hello@ nigdy się nie rozjadą.
//
// Zasady HTML dla poczty: tylko tabele i style wpisane w atrybut (Gmail wycina
// <style>), żadnego flexa ani gridu, gradient zawsze z zapasowym kolorem tła.

/** Paleta panelu Bruno (app/bruno/bruno.css). */
export const MARKA = {
  akcent: "#0e7490",
  akcent2: "#0f766e",
  jasny: "#22d3ee",
  tekst: "#0f172a",
  szary: "#64748b",
  ramka: "#e2e8f0",
  tlo: "#f1f5f9",
  kafel: "#ecfeff",
  kafelRamka: "#a5f3fc",
};

export const LINK_PANELU = "https://jakubchodakowski.com/bruno";
export const ZDJECIE = "https://jakubchodakowski.com/jakub.jpg?v=1";

const CZCIONKA = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Zwykły akapit treści. */
export function akapit(tekst, { maly = false } = {}) {
  const rozmiar = maly ? "13px" : "15px";
  const kolor = maly ? MARKA.szary : MARKA.tekst;
  return `<p style="margin:0 0 14px 0;font-family:${CZCIONKA};font-size:${rozmiar};line-height:1.6;color:${kolor}">${tekst}</p>`;
}

/**
 * Tabelka z danymi do logowania. Kod dostaje własny, wyróżniony wiersz.
 * @param {{ link?: string, login: string, kod: string, etykiety?: string[] }} dane
 */
export function tabelaDostepu({ link = LINK_PANELU, login, kod, etykiety = ["Strona", "Login", "Kod logowania"] }) {
  const etykieta = `font-family:${CZCIONKA};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MARKA.szary};padding:0 0 4px 0`;
  const wartosc = `font-family:${CZCIONKA};font-size:15px;font-weight:600;color:${MARKA.tekst};padding:0 0 14px 0;word-break:break-all`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 18px 0;background:${MARKA.kafel};border:1px solid ${MARKA.kafelRamka};border-radius:14px">
<tr><td style="padding:18px 20px 4px 20px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="${etykieta}">${esc(etykiety[0])}</td></tr>
    <tr><td style="${wartosc}"><a href="${esc(link)}" style="color:${MARKA.akcent};text-decoration:none">${esc(link)}</a></td></tr>
    <tr><td style="${etykieta}">${esc(etykiety[1])}</td></tr>
    <tr><td style="${wartosc}">${esc(login)}</td></tr>
    <tr><td style="${etykieta}">${esc(etykiety[2])}</td></tr>
    <tr><td style="font-family:${CZCIONKA};font-size:30px;font-weight:700;letter-spacing:0.22em;color:${MARKA.akcent};padding:2px 0 16px 0">${esc(kod)}</td></tr>
  </table>
</td></tr>
</table>`;
}

/** Tabelka „co / ile" na dowolne pary. @param {Array<[string,string]>} wiersze */
export function tabelaParami(wiersze) {
  const kom = `font-family:${CZCIONKA};font-size:14px;line-height:1.5;color:${MARKA.tekst};padding:9px 0;border-bottom:1px solid ${MARKA.ramka}`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 18px 0">
${wiersze
  .map(
    ([a, b]) =>
      `<tr><td style="${kom};color:${MARKA.szary};padding-right:14px;white-space:nowrap">${esc(a)}</td><td style="${kom};font-weight:600;text-align:right">${esc(b)}</td></tr>`,
  )
  .join("\n")}
</table>`;
}

/**
 * Przycisk akcji. Domyślnie WYŚRODKOWANY (USER_001 2.10).
 * @param {{ tekst: string, link: string, srodek?: boolean }} a
 */
export function przycisk({ tekst, link, srodek = true }) {
  const przycisk = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto"><tr>
<td style="background:${MARKA.akcent};border-radius:12px"><a href="${esc(link)}" style="display:inline-block;padding:13px 26px;font-family:${CZCIONKA};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${esc(tekst)}</a></td>
</tr></table>`;
  if (!srodek) return `<div style="margin:4px 0 20px 0">${przycisk}</div>`;
  // Wyśrodkowanie przez align na komórce: działa też w Outlooku, gdzie
  // margin:auto na tabeli bywa ignorowany.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 22px 0"><tr><td align="center">${przycisk}</td></tr></table>`;
}

/**
 * Ponumerowane kroki „co zrobić". Numeracja liczy się sama, więc skreślenie
 * kroku nie zostawia dziury w numerach (wpadka w mailu do Kariny 2.10).
 * @param {string[]} punkty
 */
export function kroki(punkty) {
  return punkty
    .filter(Boolean)
    .map((t, i) => akapit(`${i + 1}. ${t}`))
    .join("\n");
}

/**
 * Stopka ze zdjęciem. Układ jak we wzorcu zatwierdzonym 17.09 (zdjęcie, pionowa
 * kreska, imię, bez telefonu), ale kreska w kolorze Bruna, nie bordowa.
 */
export function stopkaJakub({ podpis = "Bruno AI" } = {}) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0 0"><tr>
<td style="vertical-align:middle;padding-right:12px"><img src="${ZDJECIE}" width="64" height="64" alt="Jakub Chodakowski" style="border-radius:50%;display:block"></td>
<td style="width:3px;background:${MARKA.akcent};border-radius:2px;font-size:0;line-height:0">&nbsp;</td>
<td style="vertical-align:middle;padding-left:12px;font-family:${CZCIONKA};font-size:14px;line-height:1.5;color:${MARKA.tekst}"><strong>Jakub Chodakowski</strong><br><span style="color:${MARKA.szary}">${esc(podpis)}</span></td>
</tr></table>`;
}

/**
 * Koperta: szare tło, biała karta, pasek gradientu u góry, znak „BRUNO AI",
 * treść, stopka i drobny druk.
 * @param {{ tresc: string, naglowek?: string|null, stopka?: string, drobny?: string }} a
 */
export function kopertaBruno({ tresc, naglowek = null, stopka = stopkaJakub(), drobny = null }) {
  const pasek = `background:${MARKA.akcent};background:linear-gradient(90deg,${MARKA.jasny} 0%,${MARKA.akcent} 55%,${MARKA.akcent2} 100%)`;
  const stopkaPrawna =
    drobny ??
    `Bruno AI, Jakub Chodakowski, NIP 6711845485. <a href="https://jakubchodakowski.com/polityka-prywatnosci" style="color:${MARKA.szary}">Polityka prywatności</a>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${MARKA.tlo};margin:0;padding:24px 0">
<tr><td align="center" style="padding:0 12px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;background:#ffffff;border:1px solid ${MARKA.ramka};border-radius:18px;overflow:hidden">
    <tr><td style="${pasek};height:5px;font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:26px 28px 4px 28px">
      <div style="font-family:${CZCIONKA};font-size:13px;font-weight:700;letter-spacing:0.16em;color:${MARKA.akcent}">BRUNO&nbsp;AI</div>
      ${naglowek ? `<div style="font-family:${CZCIONKA};font-size:22px;font-weight:700;line-height:1.3;color:${MARKA.tekst};margin:10px 0 16px 0">${esc(naglowek)}</div>` : '<div style="height:14px;font-size:0">&nbsp;</div>'}
    </td></tr>
    <tr><td style="padding:0 28px 26px 28px">
      ${tresc}
      ${stopka}
    </td></tr>
  </table>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px">
    <tr><td style="padding:14px 10px 0 10px;font-family:${CZCIONKA};font-size:11px;line-height:1.5;color:${MARKA.szary};text-align:center">${stopkaPrawna}</td></tr>
  </table>
</td></tr>
</table>`;
}
