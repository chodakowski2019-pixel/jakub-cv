import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
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

/**
 * Rodzaj maila = klucz w `bruno_maile` i w `?src=` linku (9.10, E18: „nie wiemy, czy
 * przypomnienia dochodzą i czy ktoś z nich wchodzi"). Wejście z linku ląduje w `bruno_wejscia`.
 */
export type RodzajMaila = "dostep" | "przypomnienie" | "niezalogowany" | "inny";

/** Dopisuje `?src=mail-<rodzaj>` do linku, żeby wejście dało się przypisać do maila. */
export function linkZeZrodlem(link: string, rodzaj: RodzajMaila): string {
  return `${link}${link.includes("?") ? "&" : "?"}src=mail-${rodzaj}`;
}

/** Zapis do `bruno_maile` nigdy nie wywraca wysyłki: błąd logowania tylko do konsoli. */
async function zapiszMail(w: { email: string; rodzaj: RodzajMaila; temat: string; wynik: "wyslany" | "blad" | "pominiety"; resend_id?: string | null; blad?: string | null }) {
  try {
    const { error } = await supabaseAdmin.from("bruno_maile").insert(w);
    if (error) console.error("[bruno mail] log", error.message);
  } catch (e) {
    console.error("[bruno mail] log", e);
  }
}

export async function wyslij(args: { do: string; temat: string; html: string; replyTo?: string; rodzaj?: RodzajMaila }) {
  const rodzaj = args.rodzaj ?? "inny";
  if (!mailDziala()) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[bruno mail] RESEND_API_KEY brak, mail pominięty:", args.temat, "→", args.do);
      await zapiszMail({ email: args.do, rodzaj, temat: args.temat, wynik: "pominiety", blad: "brak RESEND_API_KEY" });
      return { ok: true, pominiety: true };
    }
    await zapiszMail({ email: args.do, rodzaj, temat: args.temat, wynik: "blad", blad: "brak RESEND_API_KEY" });
    throw new Error("Brak RESEND_API_KEY");
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: NADAWCA,
    to: args.do,
    replyTo: args.replyTo,
    subject: args.temat,
    html: args.html,
  });
  if (error) {
    await zapiszMail({ email: args.do, rodzaj, temat: args.temat, wynik: "blad", blad: String(error.message).slice(0, 300) });
    throw new Error(`Resend: ${error.message}`);
  }
  await zapiszMail({ email: args.do, rodzaj, temat: args.temat, wynik: "wyslany", resend_id: data?.id ?? null });
  return { ok: true };
}

const minutaSlowo = (m: number) => (m === 1 ? "minutę" : m < 5 ? "minuty" : "minut");

/**
 * 9.10 (USER_001): mail po rejestracji B2C (/brunorejestracja). 3 bezpłatne rozmowy,
 * EN domyślnie, PL dla rejestracji z ?pl. Link do logowania z językiem i źródłem.
 */
export function htmlRejestracja(a: { imie: string | null; email: string; kod: string; jezyk: "en" | "pl"; rozmow: number }) {
  const en = a.jezyk === "en";
  const link = `${bazaUrl()}/bruno${en ? "" : "?pl"}`;
  const linkSrc = linkZeZrodlem(link, "dostep");
  return kopertaBruno({
    naglowek: en ? "Your access is ready" : "Twój dostęp jest gotowy",
    tresc: [
      akapit(en ? `${a.imie ? `Hi ${a.imie}, here` : "Here"} are your login details ⤵️` : `${a.imie ? `Cześć ${a.imie}, p` : "P"}oniżej znajdziesz dane dostępu ⤵️`),
      tabelaDostepu({ link, login: a.email, kod: a.kod, etykiety: en ? ["Page", "Login", "Login code"] : undefined }),
      tabelaParami([[en ? "Free calls" : "Bezpłatne rozmowy", String(a.rozmow)]]),
      przycisk({ tekst: en ? "Log in" : "Zaloguj się", link: linkSrc }),
      kroki(
        en
          ? ["Open the page in Chrome and put on headphones.", "Before your first call, open “Customize Bruno” and write what you sell, who your customer is and the objections you hear most.", "Start a call. Bruno plays your customer."]
          : ["Otwórz stronę w Chrome i załóż słuchawki.", "Przed pierwszą rozmową wejdź w „Dostosuj Bruno” i wpisz, co sprzedajesz, kim jest klient i jakie obiekcje najczęściej słyszysz.", "Zacznij rozmowę. Bruno gra Twojego klienta."],
      ),
      akapit(en ? "Best," : "Pozdrawiam"),
    ].join("\n"),
    drobny: en ? `Bruno AI, Jakub Chodakowski. <a href="https://jakubchodakowski.com/polityka-prywatnosci" style="color:#8a8f98">Privacy Policy</a>` : undefined,
  });
}

/** Mail z dostępem: link, login i kod w jednej tabelce. */
export function htmlDostep(args: {
  imie: string | null;
  email: string;
  kod: string;
  dni: number;
  rozmowDziennie?: number;
  fiszekDziennie?: number;
}) {
  // Tabelka pokazuje czysty adres (do przepisania), przycisk niesie źródło.
  const link = `${bazaUrl()}/bruno`;
  const linkSrc = linkZeZrodlem(link, "dostep");
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
      przycisk({ tekst: "Zaloguj się", link: linkSrc }),
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
  const link = linkZeZrodlem(`${bazaUrl()}/bruno/panel`, "przypomnienie");
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
  const link = linkZeZrodlem(`${bazaUrl()}/bruno`, "niezalogowany");
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
