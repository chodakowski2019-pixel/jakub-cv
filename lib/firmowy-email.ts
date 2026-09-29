// Firmowy adres e-mail = nie z darmowej skrzynki. Używane po obu stronach:
// w formularzu /aisaleskontakt (podpowiedź na żywo) i w endpointcie (twarde 400).
// Lista = najpopularniejsze darmowe domeny PL + światowe. Nie jest kompletna,
// łapie 95 % przypadków; resztę odsiewa ręczna weryfikacja.
const DARMOWE = new Set([
  "gmail.com",
  "googlemail.com",
  "wp.pl",
  "o2.pl",
  "onet.pl",
  "onet.eu",
  "op.pl",
  "vp.pl",
  "poczta.onet.pl",
  "interia.pl",
  "interia.eu",
  "poczta.fm",
  "tlen.pl",
  "gazeta.pl",
  "spoko.pl",
  "go2.pl",
  "buziaczek.pl",
  "autograf.pl",
  "outlook.com",
  "outlook.pl",
  "hotmail.com",
  "hotmail.pl",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.pl",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "aol.com",
  "gmx.com",
  "gmx.de",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
]);

export function firmowyEmail(email: string): boolean {
  const czesci = email.trim().toLowerCase().split("@");
  if (czesci.length !== 2) return false;
  const domena = czesci[1];
  if (!domena.includes(".")) return false;
  return !DARMOWE.has(domena);
}
