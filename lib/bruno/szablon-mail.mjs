// Szablon maili Bruno AI. JEDNO ŹRÓDŁO dla całego projektu:
//  - aplikacja (lib/bruno/mail.ts, wysyłka przez Resend),
//  - skrypty draftów (scripts/bruno-drafty-dostep.mjs, Gmail API).
// Dlatego to .mjs, a nie .ts: skrypty node importują ten sam plik, więc mail
// z panelu i draft z hello@ nigdy się nie rozjadą.
//
// 14.10 (USER_001: „podoba mi się design ze strony salesbruno.com, prosty, jasny,
// nowoczesny”): wygląd = LP /brunoai (components/podglad/bruno-lp/bruno-lp.module.css)
// i mail demo (mail-demo.ts): jasne tło #f6f6f5, biała karta 22 px, „BRUNO AI”
// wersalikami z odstępem, nagłówek cienki i duży, cienkie kreski, czarna
// pigułka, pomarańczowe numery 01 / 02 / 03. Było: turkus z panelu (#0e7490).
//
// Zasady HTML dla poczty: tylko tabele i style wpisane w atrybut (Gmail wycina
// <style>), żadnego flexa ani gridu, czcionki z bezpiecznym zapasem.

/** Paleta LP Bruno (bruno-lp.module.css). */
export const MARKA = {
  tlo: "#f6f6f5",
  karta: "#ffffff",
  ramka: "#ebeae7",
  linia: "#ececea",
  panel: "#f3f3f1",
  tekst: "#0b0b0b",
  tekst2: "#333333",
  szary: "#6b6b6b",
  jasnySzary: "#9a9a9a",
  akcent: "#f08a2b",
  przycisk: "#111111",
};

export const LINK_PANELU = "https://jakubchodakowski.com/bruno";
export const ZDJECIE = "https://jakubchodakowski.com/jakub.jpg?v=2";

// Outfit = nagłówki LP; poczta go nie ma, więc zapas systemowy. Inter na LP = treść.
const CZCIONKA_NAGLOWKA = "'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const CZCIONKA = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Zwykły akapit treści. */
export function akapit(tekst, { maly = false } = {}) {
  const rozmiar = maly ? "13px" : "15px";
  const kolor = maly ? MARKA.szary : MARKA.tekst2;
  return `<p style="margin:0 0 14px 0;font-family:${CZCIONKA};font-size:${rozmiar};line-height:1.6;color:${kolor}">${tekst}</p>`;
}

/**
 * Dane do logowania: jasny panel z zaokrągleniem, etykiety wersalikami, kod duży.
 * 11.10: `jezyk` = "pl" daje polskie etykiety (Strona / Login / Kod logowania), domyślnie EN.
 * @param {{ link?: string, login: string, kod: string, etykiety?: string[], jezyk?: string|null }} dane
 */
export function tabelaDostepu({ link = LINK_PANELU, login, kod, jezyk = "en", etykiety = jezyk === "pl" ? ["Strona", "Login", "Kod logowania"] : ["Page", "Login", "Login code"] }) {
  const etykieta = `font-family:${CZCIONKA};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${MARKA.szary};padding:0 0 4px 0`;
  const wartosc = `font-family:${CZCIONKA};font-size:15px;font-weight:600;color:${MARKA.tekst};padding:0 0 16px 0;word-break:break-all`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px 0;background:${MARKA.panel};border-radius:16px">
<tr><td style="padding:20px 22px 4px 22px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="${etykieta}">${esc(etykiety[0])}</td></tr>
    <tr><td style="${wartosc}"><a href="${esc(link)}" style="color:${MARKA.tekst};text-decoration:underline">${esc(link.replace(/^https?:\/\//, ""))}</a></td></tr>
    <tr><td style="${etykieta}">${esc(etykiety[1])}</td></tr>
    <tr><td style="${wartosc}">${esc(login)}</td></tr>
    <tr><td style="${etykieta}">${esc(etykiety[2])}</td></tr>
    <tr><td style="font-family:${CZCIONKA_NAGLOWKA};font-size:32px;font-weight:500;letter-spacing:0.2em;color:${MARKA.tekst};padding:2px 0 18px 0">${esc(kod)}</td></tr>
  </table>
</td></tr>
</table>`;
}

/** Wiersze „co / ile”: etykieta szara z lewej, wartość pogrubiona, cienka kreska między wierszami. @param {Array<[string,string]>} wiersze */
export function tabelaParami(wiersze) {
  const lewa = `font-family:${CZCIONKA};font-size:13px;line-height:1.5;color:${MARKA.szary};padding:13px 14px 13px 0;border-top:1px solid ${MARKA.linia};vertical-align:top;white-space:nowrap`;
  const prawa = `font-family:${CZCIONKA};font-size:15px;line-height:1.5;font-weight:600;color:${MARKA.tekst};padding:13px 0;border-top:1px solid ${MARKA.linia};vertical-align:top`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px 0;border-bottom:1px solid ${MARKA.linia}">
${wiersze.map(([a, b]) => `<tr><td style="${lewa}">${esc(a)}</td><td style="${prawa}">${esc(b)}</td></tr>`).join("\n")}
</table>`;
}

/**
 * Przycisk akcji: czarna pigułka jak na LP. Domyślnie WYŚRODKOWANY (USER_001 2.10).
 * @param {{ tekst: string, link: string, srodek?: boolean }} a
 */
export function przycisk({ tekst, link, srodek = true }) {
  const przycisk = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto"><tr>
<td style="background:${MARKA.przycisk};border-radius:999px"><a href="${esc(link)}" style="display:inline-block;padding:17px 30px;font-family:${CZCIONKA};font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:999px">${esc(tekst)}</a></td>
</tr></table>`;
  if (!srodek) return `<div style="margin:4px 0 24px 0">${przycisk}</div>`;
  // Wyśrodkowanie przez align na komórce: działa też w Outlooku, gdzie
  // margin:auto na tabeli bywa ignorowany.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 26px 0"><tr><td align="center">${przycisk}</td></tr></table>`;
}

/**
 * Ponumerowane kroki „co zrobić”: numery 01 / 02 / 03 na pomarańczowo jak na LP.
 * Numeracja liczy się sama, więc skreślenie kroku nie zostawia dziury (wpadka 2.10).
 * @param {string[]} punkty
 * @param {{ tytul?: string|null }} [o]
 */
export function kroki(punkty, { tytul = null } = {}) {
  const lista = punkty.filter(Boolean);
  if (!lista.length) return "";
  const naglowek = tytul
    ? `<tr><td colspan="2" style="padding:0 0 12px 0;font-family:${CZCIONKA};font-size:15px;font-weight:600;color:${MARKA.tekst}">${esc(tytul)}</td></tr>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0">
${naglowek}${lista
    .map(
      (t, i) => `<tr>
<td style="width:30px;vertical-align:top;padding:0 0 12px 0;font-family:${CZCIONKA};font-size:13px;line-height:1.7;font-weight:600;color:${MARKA.akcent}">0${i + 1}</td>
<td style="vertical-align:top;padding:0 0 12px 0;font-family:${CZCIONKA};font-size:15px;line-height:1.6;color:${MARKA.tekst2}">${t}</td>
</tr>`,
    )
    .join("\n")}
</table>`;
}

/**
 * Podpis: zdjęcie, cienka kreska, imię i rola. Układ ze wzorca 17.09 (zdjęcie,
 * pionowa kreska, imię, bez telefonu), kolory z LP (kreska czarna, rola szara).
 */
export function stopkaJakub({ podpis = "Bruno AI" } = {}) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0 0"><tr>
<td style="vertical-align:middle;padding-right:14px"><img src="${ZDJECIE}" width="56" height="56" alt="Jakub Chodakowski" style="border-radius:50%;display:block"></td>
<td style="width:1px;background:${MARKA.tekst};font-size:0;line-height:0">&nbsp;</td>
<td style="vertical-align:middle;padding-left:14px;font-family:${CZCIONKA};font-size:14px;line-height:1.5;color:${MARKA.tekst}"><strong>Jakub Chodakowski</strong><br><span style="color:${MARKA.szary}">${esc(podpis)}</span></td>
</tr></table>`;
}

/**
 * Koperta jak LP: jasne tło, „BRUNO AI” nad kartą, biała karta 22 px, duży cienki
 * nagłówek na środku, treść, podpis, pod kartą drobny druk.
 * 11.10: `jezyk` = "pl" daje polską stopkę prawną („Polityka prywatności”), domyślnie EN.
 * 14.10: `zajawka` = tekst podglądu w skrzynce (ukryty), `tytul` = <title>.
 * @param {{ tresc: string, naglowek?: string|null, stopka?: string, drobny?: string|null, jezyk?: string|null, zajawka?: string|null }} a
 */
export function kopertaBruno({ tresc, naglowek = null, stopka = stopkaJakub(), drobny = null, jezyk = "en", zajawka = null }) {
  const pl = jezyk === "pl";
  // 15.10 (USER_001): bez stopki prawnej pod kartą (NIP, polityka, domena). Drobny druk tylko, gdy mail poda go sam.
  return `<!doctype html>
<html lang="${pl ? "pl" : "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(naglowek ?? "Bruno AI")}</title></head>
<body style="margin:0;padding:0;background:${MARKA.tlo}">
${zajawka ? `<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:${MARKA.tlo}">${esc(zajawka)}</span>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${MARKA.tlo};margin:0">
<tr><td align="center" style="padding:36px 16px 40px 16px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="540" style="width:100%;max-width:540px">
    <tr><td align="center" style="padding:0 0 22px 0;font-family:${CZCIONKA};font-size:13px;font-weight:500;line-height:1;letter-spacing:0.22em;color:${MARKA.szary}">BRUNO&nbsp;AI</td></tr>
    <tr><td style="background:${MARKA.karta};border:1px solid ${MARKA.ramka};border-radius:22px;padding:40px 36px 34px 36px">
      ${naglowek ? `<div style="font-family:${CZCIONKA_NAGLOWKA};font-size:30px;font-weight:500;line-height:1.15;letter-spacing:-0.02em;color:${MARKA.tekst};text-align:center;margin:0 0 26px 0">${esc(naglowek)}</div>` : ""}
      ${tresc}
      ${stopka}
    </td></tr>
${drobny ? `    <tr><td align="center" style="padding:24px 10px 0 10px;font-family:${CZCIONKA};font-size:12px;line-height:1.6;color:${MARKA.jasnySzary}">${drobny}</td></tr>\n` : ""}  </table>
</td></tr>
</table>
</body>
</html>`;
}
