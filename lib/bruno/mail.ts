import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { ROZMOWA_SEKUND, ROZMOW_DZIENNIE } from "./db";
import { DOMENA, jezykLubDomyslny } from "./domeny";
import { mnoga } from "./i18n";
import { akapit, kopertaBruno, kroki, przycisk, tabelaDostepu, tabelaParami } from "./szablon-mail.mjs";

// Maile Bruno AI przez Resend z hello@jakubchodakowski.com (jak reszta repo).
// Przypomnienia mailem, nie SMS: Twilio nie jest darmowy (USER_001 30.09).
// 11.10 (USER_001): Bruno w dwóch językach. Każdy mail do użytkownika ma wersję PL (konto `jezyk` = "pl"),
// teksty PL z fd7de52; nowe maile (free, Pro) przetłumaczone. Maile do Jakuba zostają PL.

const NADAWCA = "Bruno AI <hello@jakubchodakowski.com>";
export const SKRZYNKA_JAKUBA = "chodakowski2019@gmail.com";

/** 11.10: linki w mailach na domenę języka konta (salesbruno.com / salesbruno.pl), nie na jakubchodakowski.com. */
export function bazaUrl(jezyk?: string | null) {
  return DOMENA[jezykLubDomyslny(jezyk)];
}

export function mailDziala() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Rodzaj maila = klucz w `bruno_maile` i w `?src=` linku (9.10, E18: „nie wiemy, czy
 * przypomnienia dochodzą i czy ktoś z nich wchodzi"). Wejście z linku ląduje w `bruno_wejscia`.
 */
export type RodzajMaila = "dostep" | "przypomnienie" | "niezalogowany" | "webinar" | "inny";

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

export async function wyslij(args: {
  do: string;
  temat: string;
  html: string;
  replyTo?: string;
  rodzaj?: RodzajMaila;
  zalaczniki?: { filename: string; content: Buffer }[];
  /** 27.10: inny nadawca (webinar = „Jakub Chodakowski <hello@…>”, bez „Bruno AI”). */
  od?: string;
  /** 27.10: wysyłka zaplanowana w Resend (ISO 8601), np. przypomnienie godzinę przed webinarem. */
  scheduledAt?: string;
}): Promise<{ ok: true; pominiety?: boolean; id?: string | null }> {
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
    from: args.od ?? NADAWCA,
    to: args.do,
    replyTo: args.replyTo,
    subject: args.temat,
    html: args.html,
    // 17.10: załączniki (CV kandydata z salesbruno.com/praca).
    ...(args.zalaczniki?.length ? { attachments: args.zalaczniki } : {}),
    ...(args.scheduledAt ? { scheduledAt: args.scheduledAt } : {}),
  });
  if (error) {
    await zapiszMail({ email: args.do, rodzaj, temat: args.temat, wynik: "blad", blad: String(error.message).slice(0, 300) });
    throw new Error(`Resend: ${error.message}`);
  }
  await zapiszMail({ email: args.do, rodzaj, temat: args.temat, wynik: "wyslany", resend_id: data?.id ?? null });
  return { ok: true, id: data?.id ?? null };
}

const minutaSlowo = (m: number) => (m === 1 ? "minute" : "minutes");
/** PL w bierniku („po 3 minuty”, „3 minuty”). */
const minutaSlowoPL = (m: number) => (m === 1 ? "minutę" : m < 5 ? "minuty" : "minut");
const czyPL = (j: string | null | undefined) => jezykLubDomyslny(j) === "pl";

/**
 * 9.10 (USER_001): mail po rejestracji B2C (/brunorejestracja). 3 bezpłatne rozmowy.
 * 10.10: treść EN. 11.10: jezyk = "pl" daje polską treść (z fd7de52) i link na salesbruno.pl.
 */
export function htmlRejestracja(a: { imie: string | null; email: string; kod: string; jezyk: "en" | "pl"; rozmow: number }) {
  const en = a.jezyk === "en";
  const link = `${bazaUrl(a.jezyk)}/login`;
  const linkSrc = linkZeZrodlem(link, "dostep");
  if (!en)
    return kopertaBruno({
      jezyk: "pl",
      naglowek: "Twój dostęp jest gotowy",
      tresc: [
        akapit(`${a.imie ? `Cześć ${a.imie}, p` : "P"}oniżej znajdziesz dane dostępu ⤵️`),
        tabelaDostepu({ link, login: a.email, kod: a.kod, jezyk: "pl" }),
        tabelaParami([["Bezpłatne rozmowy", String(a.rozmow)]]),
        przycisk({ tekst: "Zaloguj się", link: linkSrc }),
        kroki([
          "Otwórz stronę w Chrome i załóż słuchawki.",
          "Przed pierwszą rozmową wejdź w „Dostosuj Bruno” i wpisz, co sprzedajesz, kim jest klient i jakie obiekcje najczęściej słyszysz.",
          "Zacznij rozmowę. Bruno gra Twojego klienta.",
        ]),
        akapit("Pozdrawiam"),
      ].join("\n"),
    });
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
  });
}

/**
 * 17.10 (USER_001): Bruno tylko B2B. Mail po akceptacji prośby o dostęp w Adminie:
 * konto demo = 1 rozmowa po 3 min, Bruno prowadzi krok po kroku (chmurki), na końcu rozmowa z Jakubem.
 */
// 21.10: kod null = klient ustawił hasło przy rejestracji, w mailu zamiast kodu „hasło z rejestracji”.
export function htmlDostepDemo(a: { imie: string | null; email: string; kod: string | null; jezyk: "en" | "pl" }) {
  const link = `${bazaUrl(a.jezyk)}/login`;
  const linkSrc = linkZeZrodlem(link, "dostep");
  const minuty = ROZMOWA_SEKUND / 60;
  if (a.jezyk === "pl")
    return kopertaBruno({
      jezyk: "pl",
      naglowek: "Twój dostęp do Bruno jest gotowy",
      tresc: [
        akapit(`${a.imie ? `Cześć ${a.imie}, p` : "P"}oniżej znajdziesz dane dostępu ⤵️`),
        tabelaDostepu({ link, login: a.email, kod: a.kod ?? "hasło z rejestracji", jezyk: "pl", etykiety: ["Strona", "Login", a.kod ? "Kod logowania" : "Hasło"] }),
        tabelaParami([["Rozmowa demo", `1 po ${minuty} ${minutaSlowoPL(minuty)}`]]),
        przycisk({ tekst: "Zaloguj się", link: linkSrc }),
        kroki([
          "Otwórz stronę w Chrome na komputerze i załóż słuchawki.",
          "Bruno poprowadzi Cię krok po kroku: co sprzedajesz, jaki klient, potem rozmowa.",
          "Po rozmowie zobaczysz ocenę i co poprawić.",
        ]),
        akapit("Pozdrawiam"),
      ].join("\n"),
    });
  return kopertaBruno({
    naglowek: "Your Bruno access is ready",
    tresc: [
      akapit(`${a.imie ? `Hi ${a.imie}, here` : "Here"} are your login details ⤵️`),
      tabelaDostepu({ link, login: a.email, kod: a.kod ?? "your sign-up password", etykiety: ["Page", "Login", a.kod ? "Login code" : "Password"] }),
      tabelaParami([["Demo call", `1, ${minuty} ${minutaSlowo(minuty)}`]]),
      przycisk({ tekst: "Log in", link: linkSrc }),
      kroki([
        "Open the page in Chrome on a computer and put on headphones.",
        "Bruno walks you through it step by step: what you sell, the customer, then the call.",
        "After the call you see your score and what to fix.",
      ]),
      akapit("Best,"),
    ].join("\n"),
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
  jezyk?: string | null;
}) {
  // Tabelka pokazuje czysty adres (do przepisania), przycisk niesie źródło.
  const link = `${bazaUrl(args.jezyk)}/login`;
  const linkSrc = linkZeZrodlem(link, "dostep");
  const minuty = ROZMOWA_SEKUND / 60;
  const rozmow = args.rozmowDziennie ?? ROZMOW_DZIENNIE;
  // Układ = wzorzec USER_001 z 2.10: powitanie, tabelka dostępu, warunki,
  // wyśrodkowany przycisk, ponumerowane kroki, „Pozdrawiam".
  if (czyPL(args.jezyk))
    return kopertaBruno({
      jezyk: "pl",
      naglowek: "Twój dostęp jest gotowy",
      tresc: [
        akapit(`${args.imie ? `Cześć ${args.imie}, p` : "P"}oniżej znajdziesz dane dostępu ⤵️`),
        tabelaDostepu({ link, login: args.email, kod: args.kod, jezyk: "pl" }),
        tabelaParami([
          ["Dostęp", `${args.dni} ${mnoga("pl", args.dni, ["", ""], ["dzień", "dni", "dni"])} od pierwszego logowania`],
          ["Rozmowy", `${rozmow} dziennie po ${minuty} ${minutaSlowoPL(minuty)}`],
          ...(args.fiszekDziennie ? [["Fiszki", `${args.fiszekDziennie} dziennie`] as [string, string]] : []),
        ]),
        przycisk({ tekst: "Zaloguj się", link: linkSrc }),
        kroki([
          "Otwórz stronę w Chrome i załóż słuchawki.",
          "Przed pierwszą rozmową wejdź w „Dostosuj Bruno” i wpisz, co sprzedajesz, kim jest klient i jakie obiekcje najczęściej słyszysz. Bez tego Bruno nie wie, kogo udawać.",
          "Po zalogowaniu włączy się krótki film, który oprowadza po panelu.",
        ]),
        akapit("Pozdrawiam"),
      ].join("\n"),
    });
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

export function htmlPrzypomnienie(args: { imie: string | null; jezyk?: string | null; kart: number; rozmowyDzis: number; dniZostalo: number; dziennie?: number }) {
  const link = linkZeZrodlem(`${bazaUrl(args.jezyk)}/bruno/panel`, "przypomnienie");
  const zostalo = Math.max(0, (args.dziennie ?? ROZMOW_DZIENNIE) - args.rozmowyDzis);
  const minuty = ROZMOWA_SEKUND / 60;
  if (czyPL(args.jezyk))
    return kopertaBruno({
      jezyk: "pl",
      naglowek: zostalo === 0 ? "Plan na dziś zrobiony" : `${args.imie ? `${args.imie}, p` : "P"}lan na dziś`,
      tresc: [
        tabelaParami([
          ["Rozmowy", zostalo === 0 ? "zrobione" : `${zostalo} po ${minuty} ${minutaSlowoPL(minuty)}`],
          ["Do powtórki", args.kart ? `${args.kart} ${mnoga("pl", args.kart, ["", ""], ["temat", "tematy", "tematów"])}` : "nic"],
          ["Dostęp", `${args.dniZostalo} ${args.dniZostalo === 1 ? "dzień" : "dni"}`],
        ]),
        args.kart ? akapit("Bruno zacznie od najsłabszego tematu.") : "",
        przycisk({ tekst: "Rozmawiaj z Bruno", link }),
      ].join("\n"),
    });
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
export function htmlPrzypomnienieFree(args: { imie: string | null; jezyk?: string | null; zuzyte: number; zostalo: number; zalogowany: boolean }) {
  const link = linkZeZrodlem(`${bazaUrl(args.jezyk)}${args.zalogowany ? "/bruno/rozmowa" : "/login"}`, "przypomnienie");
  const minuty = ROZMOWA_SEKUND / 60;
  const razem = args.zuzyte + args.zostalo;
  if (czyPL(args.jezyk)) {
    const n = args.zostalo;
    const ile = n === 1 ? "została Ci 1 bezpłatna rozmowa" : `${mnoga("pl", n, ["", ""], ["", "zostały", "zostało"])} Ci ${n} ${mnoga("pl", n, ["", ""], ["", "bezpłatne rozmowy", "bezpłatnych rozmów"])}`;
    return kopertaBruno({
      jezyk: "pl",
      naglowek:
        args.zuzyte === 0
          ? `${args.imie ? `${args.imie}, Twoja` : "Twoja"} pierwsza rozmowa z Bruno czeka`
          : args.imie
            ? `${args.imie}, ${ile}`
            : ile.charAt(0).toUpperCase() + ile.slice(1),
      tresc: [
        tabelaParami([
          // 17.10: konto demo (1 rozmowa) = „Rozmowa demo”.
          razem === 1 ? ["Rozmowa demo", "1, czeka na Ciebie"] : ["Bezpłatne rozmowy", `${args.zuzyte} z ${razem} zrobione`],
          ["Jedna rozmowa", `${minuty} ${minutaSlowoPL(minuty)}`],
          ["Co dostajesz", "ocenę trenera, nagranie, fiszki z Twoich błędów"],
        ]),
        akapit(args.zuzyte === 0 ? "Bruno gra Twojego klienta. Ty dzwonisz, on stawia opór, a trener mówi, co poprawić." : "Każda rozmowa to inna obiekcja. Bruno pamięta, co ostatnio nie zagrało."),
        przycisk({ tekst: args.zalogowany ? "Rozmawiaj z Bruno" : "Zaloguj się", link }),
      ].join("\n"),
    });
  }
  const naglowek =
    args.zuzyte === 0
      ? `${args.imie ? `${args.imie}, y` : "Y"}our first call with Bruno is waiting`
      : `${args.imie ? `${args.imie}, y` : "Y"}ou have ${args.zostalo} free ${args.zostalo === 1 ? "call" : "calls"} left`;
  return kopertaBruno({
    naglowek,
    tresc: [
      tabelaParami([
        razem === 1 ? ["Demo call", "1, waiting for you"] : ["Free calls", `${args.zuzyte} of ${razem} done`],
        ["One call", `${minuty} ${minutaSlowo(minuty)}`],
        ["What you get", "a coach score, the recording, flashcards from your mistakes"],
      ]),
      akapit(args.zuzyte === 0 ? "Bruno plays your customer. You make the call, he pushes back, and the coach tells you what to fix." : "Every call is a different objection. Bruno remembers where you slipped."),
      przycisk({ tekst: args.zalogowany ? "Talk to Bruno" : "Log in", link }),
    ].join("\n"),
  });
}

/** 10.10: potwierdzenie zakupu Bruno Pro (po webhooku Stripe). */
export function htmlProAktywny(args: { imie: string | null; jezyk?: string | null; okres: "miesiac" | "rok" }) {
  const link = linkZeZrodlem(`${bazaUrl(args.jezyk)}/bruno/panel`, "inny");
  // 11.10: ceny PL (USER_001): 250 zł / mies. albo 2 500 zł / rok.
  if (czyPL(args.jezyk))
    return kopertaBruno({
      jezyk: "pl",
      naglowek: `${args.imie ? `${args.imie}, B` : "B"}runo Pro jest aktywne`,
      tresc: [
        tabelaParami([
          ["Plan", args.okres === "rok" ? "Bruno Pro, rocznie (2 500 zł / rok)" : "Bruno Pro, miesięcznie (250 zł / mies.)"],
          ["Rozmowy", "5 dziennie, także w weekendy"],
          ["Funkcje", "wszystkie: Statystyki, oferta z Twojej strony, rozmowa, którą masz jutro, Ogień przed rozmową"],
          args.okres === "rok" ? ["Ważne", "365 dni, jedna płatność, bez odnawiania"] : ["Ważne", "30 dni, jedna płatność, bez odnawiania"],
        ]),
        przycisk({ tekst: "Otwórz panel", link }),
        akapit("Pozdrawiam"),
      ].join("\n"),
    });
  return kopertaBruno({
    naglowek: `${args.imie ? `${args.imie}, B` : "B"}runo Pro is active`,
    tresc: [
      tabelaParami([
        ["Plan", args.okres === "rok" ? "Bruno Pro, yearly" : "Bruno Pro, monthly"],
        ["Calls", "5 every day, weekends too"],
        ["Features", "all of them: Stats, offer from your website, tomorrow's call, Fire Up"],
        args.okres === "rok" ? ["Valid for", "365 days, one payment, no auto-renewal"] : ["Valid for", "30 days, one payment, no auto-renewal"],
      ]),
      przycisk({ tekst: "Open your dashboard", link }),
      akapit("Best,"),
    ].join("\n"),
  });
}

/** 11.10 (USER_001): „Nie pamiętasz hasła?” → hasło tymczasowe, zmiana w Ustawieniach. */
export function htmlNoweHaslo(args: { imie: string | null; haslo: string; jezyk?: string | null }) {
  const link = linkZeZrodlem(`${bazaUrl(args.jezyk)}/login`, "dostep");
  if (czyPL(args.jezyk))
    return kopertaBruno({
      jezyk: "pl",
      naglowek: `${args.imie ? `${args.imie}, t` : "T"}woje nowe hasło`,
      tresc: [
        tabelaParami([["Hasło tymczasowe", args.haslo]]),
        przycisk({ tekst: "Zaloguj się", link }),
        akapit("Po zalogowaniu zmień je w Ustawieniach na swoje. Jeśli to nie Ty prosiłeś o nowe hasło, odpisz na tego maila."),
      ].join("\n"),
    });
  return kopertaBruno({
    naglowek: `${args.imie ? `${args.imie}, y` : "Y"}our new password`,
    tresc: [
      tabelaParami([["Temporary password", args.haslo]]),
      przycisk({ tekst: "Log in", link }),
      akapit("After you log in, change it to your own in Settings. If you didn't ask for a new password, reply to this email."),
    ].join("\n"),
  });
}

/** Przypomnienie dla konta bez pierwszego logowania (6.10). Kodu nie wysyłamy ponownie: w bazie jest tylko jego skrót. */
export function htmlNieZalogowany(args: { imie: string | null; jezyk?: string | null; dni: number }) {
  const link = linkZeZrodlem(`${bazaUrl(args.jezyk)}/login`, "niezalogowany");
  const minuty = ROZMOWA_SEKUND / 60;
  if (czyPL(args.jezyk))
    return kopertaBruno({
      jezyk: "pl",
      naglowek: `${args.imie ? `${args.imie}, B` : "B"}runo czeka na pierwszą rozmowę`,
      tresc: [
        tabelaParami([
          ["Pierwsza rozmowa", `${minuty} ${minutaSlowoPL(minuty)}`],
          ["Dostęp", `${args.dni} ${args.dni === 1 ? "dzień" : "dni"}, liczone od pierwszego logowania`],
          ["Kod logowania", "w pierwszym mailu „Twój dostęp do Bruno AI”"],
        ]),
        przycisk({ tekst: "Zaloguj się", link }),
        akapit("Nie możesz znaleźć kodu? Odpisz na tego maila, wyślę nowy."),
      ].join("\n"),
    });
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

