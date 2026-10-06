import { Resend } from "resend";
import { ROZMOWA_SEKUND, ROZMOW_DZIENNIE } from "./db";
import { akapit, kopertaBruno, kroki, przycisk, tabelaDostepu, tabelaParami } from "./szablon-mail.mjs";

// Maile Bruno AI przez Resend z hello@jakubchodakowski.com (jak reszta repo).
// Przypomnienia mailem, nie SMS: Twilio nie jest darmowy (USER_001 30.09).

const NADAWCA = "Bruno AI <hello@jakubchodakowski.com>";
export const SKRZYNKA_JAKUBA = "chodakowski2019@gmail.com";

export function bazaUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jakubchodakowski.com").replace(/\/$/, "");
}

export function mailDziala() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function wyslij(args: { do: string; temat: string; html: string; replyTo?: string }) {
  if (!mailDziala()) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[bruno mail] RESEND_API_KEY brak, mail pominięty:", args.temat, "→", args.do);
      return { ok: true, pominiety: true };
    }
    throw new Error("Brak RESEND_API_KEY");
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: NADAWCA,
    to: args.do,
    replyTo: args.replyTo,
    subject: args.temat,
    html: args.html,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  return { ok: true };
}

const minutaSlowo = (m: number) => (m === 1 ? "minutę" : m < 5 ? "minuty" : "minut");

/** Mail z dostępem: link, login i kod w jednej tabelce. */
export function htmlDostep(args: {
  imie: string | null;
  email: string;
  kod: string;
  dni: number;
  rozmowDziennie?: number;
  fiszekDziennie?: number;
}) {
  const link = `${bazaUrl()}/bruno`;
  const minuty = ROZMOWA_SEKUND / 60;
  const rozmow = args.rozmowDziennie ?? ROZMOW_DZIENNIE;
  // Układ = wzorzec USER_001 z 2.10: powitanie, tabelka dostępu, warunki,
  // wyśrodkowany przycisk, ponumerowane kroki, „Pozdrawiam".
  return kopertaBruno({
    naglowek: "Twój dostęp jest gotowy",
    tresc: [
      akapit(`${args.imie ? `Cześć ${args.imie}, p` : "P"}oniżej znajdziesz dane dostępu ⤵️`),
      tabelaDostepu({ link, login: args.email, kod: args.kod }),
      tabelaParami([
        ["Dostęp", `${args.dni} dni od pierwszego logowania`],
        ["Rozmowy", `${rozmow} dziennie po ${minuty} ${minutaSlowo(minuty)}`],
        ...(args.fiszekDziennie ? [["Fiszki", `${args.fiszekDziennie} dziennie`] as [string, string]] : []),
      ]),
      przycisk({ tekst: "Zaloguj się", link }),
      kroki([
        "Otwórz stronę w Chrome i załóż słuchawki.",
        'Przed pierwszą rozmową wejdź w „Dostosuj Bruno" i wpisz, co sprzedajesz, kim jest klient i jakie obiekcje najczęściej słyszysz. Bez tego Bruno nie wie, kogo udawać.',
        "Po zalogowaniu włączy się krótki film, który oprowadza po panelu.",
      ]),
      akapit("Pozdrawiam"),
    ].join("\n"),
  });
}

export function htmlPrzypomnienie(args: { imie: string | null; kart: number; rozmowyDzis: number; dniZostalo: number; dziennie?: number }) {
  const link = `${bazaUrl()}/bruno/panel`;
  const zostalo = Math.max(0, (args.dziennie ?? ROZMOW_DZIENNIE) - args.rozmowyDzis);
  const minuty = ROZMOWA_SEKUND / 60;
  return kopertaBruno({
    naglowek: zostalo === 0 ? "Plan na dziś zrobiony" : `${args.imie ? `${args.imie}, p` : "P"}lan na dziś`,
    tresc: [
      tabelaParami([
        ["Rozmowy", zostalo === 0 ? "zrobione" : `${zostalo} po ${minuty} ${minutaSlowo(minuty)}`],
        ["Do powtórki", args.kart ? `${args.kart} ${args.kart === 1 ? "temat" : "tematów"}` : "nic"],
        ["Dostęp", `${args.dniZostalo} ${args.dniZostalo === 1 ? "dzień" : "dni"}`],
      ]),
      args.kart ? akapit("Bruno zacznie od najsłabszego tematu.") : "",
      przycisk({ tekst: "Rozmawiaj z Bruno", link }),
    ].join("\n"),
  });
}

/** Przypomnienie dla konta bez pierwszego logowania (6.10). Kodu nie wysyłamy ponownie: w bazie jest tylko jego skrót. */
export function htmlNieZalogowany(args: { imie: string | null; dni: number }) {
  const link = `${bazaUrl()}/bruno`;
  const minuty = ROZMOWA_SEKUND / 60;
  return kopertaBruno({
    naglowek: `${args.imie ? `${args.imie}, B` : "B"}runo czeka na pierwszą rozmowę`,
    tresc: [
      tabelaParami([
        ["Pierwsza rozmowa", `${minuty} ${minutaSlowo(minuty)}`],
        ["Dostęp", `${args.dni} dni, liczone od pierwszego logowania`],
        ["Kod logowania", "w pierwszym mailu „Twój dostęp do Bruno AI”"],
      ]),
      przycisk({ tekst: "Zaloguj się", link }),
      akapit("Nie możesz znaleźć kodu? Odpisz na tego maila, wyślę nowy."),
    ].join("\n"),
  });
}

export function htmlWiadomosc(args: { email: string; imie: string | null; firma: string | null; tekst: string }) {
  return `
    <h2>Bruno AI: wiadomość z dymka w panelu</h2>
    <p><b>Od:</b> ${args.imie ?? ""} ${args.firma ? `(${args.firma})` : ""} &lt;${args.email}&gt;</p>
    <blockquote style="border-left:3px solid #0e7490;margin:12px 0;padding:6px 12px;white-space:pre-wrap">${args.tekst.replace(/</g, "&lt;")}</blockquote>
    <p style="margin-top:16px">Kliknij „Odpowiedz": reply-to = tester, odpowiedź trafi prosto do niego.</p>
  `;
}

export function htmlZainteresowany(args: { email: string; imie: string | null; firma: string | null; wiadomosc: string; rozmow: number; sredniaOcena: number | null }) {
  return `
    <h2>Bruno AI: „Chcę pełen dostęp"</h2>
    <p><b>Kto:</b> ${args.imie ?? ""} ${args.firma ? `(${args.firma})` : ""} &lt;${args.email}&gt;</p>
    <p><b>Rozmów w teście:</b> ${args.rozmow}${args.sredniaOcena !== null ? `, średnia ocena ${args.sredniaOcena}/10` : ""}</p>
    ${args.wiadomosc ? `<p><b>Wiadomość:</b><br>${args.wiadomosc.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>` : ""}
    <p style="margin-top:16px">Obiecane: kontakt do 3 dni roboczych. Odpisz z tego maila (reply-to = klient) i umów rozmowę.</p>
  `;
}
