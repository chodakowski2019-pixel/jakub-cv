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

const minutaSlowo = (m: number) => (m === 1 ? "minute" : "minutes");

/**
 * 9.10 (USER_001): mail po rejestracji B2C (/brunorejestracja). 3 bezpłatne rozmowy.
 * 10.10: treść zawsze EN (parametr jezyk zostaje, steruje tylko linkiem ?pl).
 */
export function htmlRejestracja(a: { imie: string | null; email: string; kod: string; jezyk: "en" | "pl"; rozmow: number }) {
  const en = a.jezyk === "en";
  const link = `${bazaUrl()}/bruno${en ? "" : "?pl"}`;
  const linkSrc = linkZeZrodlem(link, "dostep");
  return kopertaBruno({
    naglowek: "Your access is ready",
    tresc: [
      akapit(`${a.imie ? `Hi ${a.imie}, here` : "Here"} are your login details ⤵️`),
      tabelaDostepu({ link, login: a.email, kod: a.kod, etykiety: ["Page", "Login", "Login code"] }),
      tabelaParami([["Free calls", String(a.rozmow)]]),
      przycisk({ tekst: "Log in", link: linkSrc }),
      kroki([
        "Open the page in Chrome and put on headphones.",
        "Before your first call, open “Customize Bruno” and write what you sell, who your customer is and the objections you hear most.",
        "Start a call. Bruno plays your customer.",
      ]),
      akapit("Best,"),
    ].join("\n"),
    drobny: `Bruno AI, Jakub Chodakowski. <a href="https://jakubchodakowski.com/polityka-prywatnosci" style="color:#8a8f98">Privacy Policy</a>`,
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
    naglowek: "Your access is ready",
    tresc: [
      akapit(`${args.imie ? `Hi ${args.imie}, here` : "Here"} are your login details ⤵️`),
      tabelaDostepu({ link, login: args.email, kod: args.kod }),
      tabelaParami([
        ["Access", `${args.dni} ${args.dni === 1 ? "day" : "days"} from your first login`],
        ["Calls", `${rozmow} a day, ${minuty} ${minutaSlowo(minuty)} each`],
        ...(args.fiszekDziennie ? [["Flashcards", `${args.fiszekDziennie} a day`] as [string, string]] : []),
      ]),
      przycisk({ tekst: "Log in", link: linkSrc }),
      kroki([
        "Open the page in Chrome and put on headphones.",
        "Before your first call, open “Customize Bruno” and write what you sell, who your customer is and the objections you hear most. Without this, Bruno doesn't know who to play.",
        "After you log in, a short video shows you around your dashboard.",
      ]),
      akapit("Best,"),
    ].join("\n"),
  });
}

export function htmlPrzypomnienie(args: { imie: string | null; kart: number; rozmowyDzis: number; dniZostalo: number; dziennie?: number }) {
  const link = linkZeZrodlem(`${bazaUrl()}/bruno/panel`, "przypomnienie");
  const zostalo = Math.max(0, (args.dziennie ?? ROZMOW_DZIENNIE) - args.rozmowyDzis);
  const minuty = ROZMOWA_SEKUND / 60;
  return kopertaBruno({
    naglowek: zostalo === 0 ? "Today's plan is done" : `${args.imie ? `${args.imie}, here's t` : "T"}oday's plan`,
    tresc: [
      tabelaParami([
        ["Calls", zostalo === 0 ? "done" : `${zostalo} ${zostalo === 1 ? "call" : "calls"}, ${minuty} ${minutaSlowo(minuty)} each`],
        ["To review", args.kart ? `${args.kart} ${args.kart === 1 ? "topic" : "topics"}` : "nothing"],
        ["Access", `${args.dniZostalo} ${args.dniZostalo === 1 ? "day" : "days"} left`],
      ]),
      args.kart ? akapit("Bruno will start with your weakest topic.") : "",
      przycisk({ tekst: "Talk to Bruno", link }),
    ].join("\n"),
  });
}

/**
 * 10.10 (USER_001): konto free dostaje RAZ DZIENNIE przypomnienie, dopóki nie zrobi do końca 3 bezpłatnych rozmów.
 * Treść zależy od tego, ile zostało; link ze źródłem jak w zwykłym przypomnieniu.
 */
export function htmlPrzypomnienieFree(args: { imie: string | null; zuzyte: number; zostalo: number; zalogowany: boolean }) {
  const link = linkZeZrodlem(`${bazaUrl()}${args.zalogowany ? "/bruno/rozmowa" : "/bruno"}`, "przypomnienie");
  const minuty = ROZMOWA_SEKUND / 60;
  const razem = args.zuzyte + args.zostalo;
  const naglowek =
    args.zuzyte === 0
      ? `${args.imie ? `${args.imie}, y` : "Y"}our first call with Bruno is waiting`
      : `${args.imie ? `${args.imie}, y` : "Y"}ou have ${args.zostalo} free ${args.zostalo === 1 ? "call" : "calls"} left`;
  return kopertaBruno({
    naglowek,
    tresc: [
      tabelaParami([
        ["Free calls", `${args.zuzyte} of ${razem} done`],
        ["One call", `${minuty} ${minutaSlowo(minuty)}`],
        ["What you get", "a coach score, the recording, flashcards from your mistakes"],
      ]),
      akapit(args.zuzyte === 0 ? "Bruno plays your customer. You make the call, he pushes back, and the coach tells you what to fix." : "Every call is a different objection. Bruno remembers where you slipped."),
      przycisk({ tekst: args.zalogowany ? "Talk to Bruno" : "Log in", link }),
    ].join("\n"),
  });
}

/** 10.10: potwierdzenie zakupu Bruno Pro (po webhooku Stripe). */
export function htmlProAktywny(args: { imie: string | null; okres: "miesiac" | "rok" }) {
  const link = linkZeZrodlem(`${bazaUrl()}/bruno/panel`, "inny");
  return kopertaBruno({
    naglowek: `${args.imie ? `${args.imie}, B` : "B"}runo Pro is active`,
    tresc: [
      tabelaParami([
        ["Plan", args.okres === "rok" ? "Bruno Pro, yearly" : "Bruno Pro, monthly"],
        ["Calls", "5 every day, weekends too"],
        ["Features", "all of them: Stats, offer from your website, tomorrow's call, Fire Up"],
        ["Cancel", "anytime, just reply to this email"],
      ]),
      przycisk({ tekst: "Open your dashboard", link }),
      akapit("Best,"),
    ].join("\n"),
  });
}

/** Przypomnienie dla konta bez pierwszego logowania (6.10). Kodu nie wysyłamy ponownie: w bazie jest tylko jego skrót. */
export function htmlNieZalogowany(args: { imie: string | null; dni: number }) {
  const link = linkZeZrodlem(`${bazaUrl()}/bruno`, "niezalogowany");
  const minuty = ROZMOWA_SEKUND / 60;
  return kopertaBruno({
    naglowek: `${args.imie ? `${args.imie}, B` : "B"}runo is waiting for your first call`,
    tresc: [
      tabelaParami([
        ["First call", `${minuty} ${minutaSlowo(minuty)}`],
        ["Access", `${args.dni} ${args.dni === 1 ? "day" : "days"}, counted from your first login`],
        ["Login code", "in the first email, “Your Bruno AI access”"],
      ]),
      przycisk({ tekst: "Log in", link }),
      akapit("Can't find your code? Reply to this email and I'll send a new one."),
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
