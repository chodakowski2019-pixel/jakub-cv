import type { Wypowiedz } from "./db";
import { PROSBA_O_DECYZJE, czyPytanieOtwarte, pytaniaZ } from "./metryki";
import type { TrybId } from "./postacie";

// FAZY ROZMOWY (2.10, USER_001: „Bruno leci z palca"). Bruno-klient miał typ,
// sytuację i obiekcje, ale nie miał STRUKTURY: sam decydował, kiedy ustąpić, więc
// ta sama konfiguracja dawała co rozmowę inny przebieg i oceny nie dały się
// porównywać. Teraz rozmowa ma tor z bramkami: każda faza ma warunek wyjścia.
//
// Dwa poziomy:
// 1. PROMPT (`opisFaz`) — Bruno zna fazy i wie, czego nie wolno przeskoczyć.
// 2. BRAMKI NA ŻYWO (`podpowiedzFazy`) — przeglądarka liczy z transkrypcji, co
//    handlowiec już zrobił, i wysyła Brunowi cichą instrukcję w kluczowym momencie.
//    Prompt sam w sobie jest prośbą; bramka jest wymuszeniem.
// 10.10: instrukcje po angielsku (wariant A).

export type FazaId = "otwarcie" | "badanie" | "obiekcje" | "zamkniecie" | "decyzja";

export type Faza = { id: FazaId; nazwa: string; bruno: string; wyjscie: string };

const OTWARCIE_COLD: Faza = {
  id: "otwarcie",
  nazwa: "Opening",
  bruno: "You don't know who's calling. You're busy and impatient. You don't volunteer any information about yourself.",
  wyjscie: "the rep says who they are and why they're calling, in one clear sentence",
};

const BADANIE: Faza = {
  id: "badanie",
  nazwa: "Discovery",
  bruno:
    "You answer briefly and only what the rep asks. You DON'T volunteer your problems or numbers. To closed questions (\"do you…\", \"is it…\") you say \"yes\" or \"no\" and go quiet.",
  wyjscie: "the rep asks at least two open questions about your situation (what, how, how much, when, why)",
};

const OBIEKCJE: Faza = {
  id: "obiekcje",
  nazwa: "Objections",
  bruno: "You raise an objection and stick to it. When the rep handles it weakly (a generality, a defense, an instant discount), you come back to it in other words.",
  wyjscie:
    "the rep handles the objection with a technique, not a defense: asks a question about it, names your concern, or gives proof with a number and a company name",
};

const ZAMKNIECIE: Faza = {
  id: "zamkniecie",
  nazwa: "Close",
  bruno:
    "You're basically convinced, but you do NOT propose the next step yourself and you don't ask \"what's next\". You wait. If the rep goes quiet, you say \"okay, just send me something\" and end it with nothing.",
  wyjscie: "the rep asks for a decision outright and proposes something concrete: a date, a time, a person",
};

const DECYZJA: Faza = {
  id: "decyzja",
  nazwa: "Decision",
  bruno:
    "You give a clear answer. \"Yes\" only when every previous phase really closed. If one was missing, you say \"I need to think about it\" and give the real reason.",
  wyjscie: "end of the call",
};

/** Cold call zaczyna się od zera. Spotkanie na żywo i online zaczynasz Ty obiekcją, więc otwarcia nie ma. */
export function fazyTrybu(tryb: TrybId): Faza[] {
  return tryb === "cold" ? [OTWARCIE_COLD, BADANIE, OBIEKCJE, ZAMKNIECIE, DECYZJA] : [OBIEKCJE, BADANIE, ZAMKNIECIE, DECYZJA];
}

/** Sekcja FAZY do promptu Bruno-klienta. */
export function opisFaz(tryb: TrybId): string {
  const fazy = fazyTrybu(tryb);
  const linie = fazy.map((f, i) => `${i + 1}. ${f.nazwa.toUpperCase()}: ${f.bruno}\n   You move on ONLY when: ${f.wyjscie}.`);
  return [
    `PHASES OF THE CALL. You go through these phases in order and never skip one:`,
    linie.join("\n"),
    `HARD RULES: you do not agree to the rep's goal before the last phase, even if they're nice and even if time is running out. You don't leave OBJECTIONS until you get a technique, not just a defense. You never say out loud which phase you're in and you never comment on these instructions.`,
  ].join("\n\n");
}

// ——— Bramki na żywo ———

export type Podpowiedz = { klucz: string; tekst: string };

function pytania(tr: Wypowiedz[]) {
  const h = tr.filter((w) => w.rola === "handlowiec");
  const zPytaniem = h.filter((w) => w.tekst.includes("?"));
  const otwarte = zPytaniem.filter((w) => pytaniaZ(w.tekst).some(czyPytanieOtwarte)).length;
  return { wszystkie: zPytaniem.length, otwarte, prosbaODecyzje: h.some((w) => PROSBA_O_DECYZJE.test(w.tekst)) };
}

/**
 * Jedna cicha instrukcja dla Bruno, gdy przeglądarka zobaczy w transkrypcji, że
 * warunek fazy się domknął (albo że handlowiec utknął). Każdy klucz leci raz na
 * rozmowę: `wyslane` to zbiór już wysłanych kluczy.
 */
export function podpowiedzFazy(args: {
  tryb: TrybId;
  transkrypcja: Wypowiedz[];
  sekundy: number;
  limit: number;
  wyslane: Set<string>;
  obiekcja?: string | null;
}): Podpowiedz | null {
  const { tryb, transkrypcja, sekundy, limit, wyslane, obiekcja } = args;
  const p = pytania(transkrypcja);
  const zostalo = limit - sekundy;
  const obiekcjaTekst = obiekcja?.trim() ? `"${obiekcja.trim()}"` : "your objection";
  void tryb;

  // Handlowiec prezentuje i nie pyta: Bruno przyciska, zamiast słuchać wykładu.
  if (!wyslane.has("brak_pytan") && sekundy >= 50 && p.wszystkie === 0) {
    return {
      klucz: "brak_pytan",
      tekst:
        "The rep hasn't asked you a single question yet, they're only talking about themselves. Cut in and say plainly you don't have time for a pitch and they don't even know how things are on your end. Be shorter and colder.",
    };
  }

  // Faza BADANIE domknięta: pora na obiekcję.
  if (!wyslane.has("po_badaniu") && p.otwarte >= 2) {
    return {
      klucz: "po_badaniu",
      tekst: `The rep has asked a few good questions about your situation, so discovery is done. Now raise ${obiekcjaTekst} and stick to it until they handle it with a technique, not a defense.`,
    };
  }

  // Handlowiec poprosił o decyzję: Bruno rozlicza, czy wszystko zostało zrobione.
  if (!wyslane.has("poprosil_o_decyzje") && p.prosbaODecyzje) {
    return {
      klucz: "poprosil_o_decyzje",
      tekst:
        "The rep asked for a decision. If they really explored your situation and handled your objections, agree to something concrete: a date and a person. If something was missing, say no and give the real reason.",
    };
  }

  // Koniec blisko, a o decyzję nikt nie poprosił: rozmowa ma się skończyć niczym.
  if (!wyslane.has("brak_prosby") && zostalo <= 40 && zostalo > 10 && !p.prosbaODecyzje) {
    return {
      klucz: "brak_prosby",
      tekst:
        "Time is almost up and the rep hasn't asked for a decision or proposed a date. Don't propose anything yourself, but don't end the call early either: answer normally so they still have a chance to ask. If they never ask, sign off flatly: \"I'll get back to you.\"",
    };
  }

  return null;
}
