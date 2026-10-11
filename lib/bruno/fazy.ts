import type { Wypowiedz } from "./db";
import type { Jezyk } from "./domeny";
import { czyPytanieOtwarte, prosbaODecyzje, pytaniaZ } from "./metryki";
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
// 11.10: Bruno w dwóch językach. Obok EN wracają polskie teksty faz (z fd7de52, 1:1), parametr `jezyk`.

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

// ——— Fazy PL (z fd7de52, 1:1). Te same id, inne teksty. ———
const FAZY_PL: Record<FazaId, Omit<Faza, "id">> = {
  otwarcie: {
    nazwa: "Otwarcie",
    bruno: "Nie wiesz, kto dzwoni. Jesteś zajęty i niecierpliwy. Nie podajesz żadnych informacji o sobie.",
    wyjscie: "handlowiec powie, kim jest i po co dzwoni, w jednym zrozumiałym zdaniu",
  },
  badanie: {
    nazwa: "Badanie",
    bruno:
      "Odpowiadasz krótko i tylko na to, o co handlowiec pyta. SAM nie opowiadasz o swoich problemach i nie podajesz liczb. Na pytania zamknięte („czy…”) mówisz „tak” albo „nie” i milczysz.",
    wyjscie: "handlowiec zada co najmniej dwa pytania otwarte o Twoją sytuację (jak, co, ile, kiedy, dlaczego)",
  },
  obiekcje: {
    nazwa: "Obiekcje",
    bruno: "Podnosisz obiekcję i trzymasz się jej. Gdy handlowiec zbija ją słabo (ogólnik, obrona, rabat od razu), wracasz do niej innymi słowami.",
    wyjscie:
      "handlowiec zbije obiekcję techniką, nie obroną: zada pytanie o nią, nazwie Twoją wątpliwość albo poda dowód z liczbą i nazwą firmy",
  },
  zamkniecie: {
    nazwa: "Zamknięcie",
    bruno:
      "Jesteś w zasadzie przekonany, ale NIE proponujesz sam następnego kroku i nie pytasz „co dalej”. Czekasz. Jeśli handlowiec milczy, mówisz „no dobrze, to proszę coś przesłać” i kończysz nijak.",
    wyjscie: "handlowiec wprost poprosi o decyzję i zaproponuje konkret: termin, datę, osobę",
  },
  decyzja: {
    nazwa: "Decyzja",
    bruno:
      "Dajesz jasną odpowiedź. „Tak” tylko wtedy, gdy wszystkie poprzednie fazy naprawdę się zamknęły. Jeśli którejś zabrakło, mówisz „muszę to przemyśleć” i podajesz prawdziwy powód.",
    wyjscie: "koniec rozmowy",
  },
};

/** Sekcja FAZY do promptu Bruno-klienta. */
export function opisFaz(tryb: TrybId, jezyk: Jezyk = "en"): string {
  if (jezyk === "pl") {
    const linie = fazyTrybu(tryb).map((f, i) => {
      const pl = FAZY_PL[f.id];
      return `${i + 1}. ${pl.nazwa.toUpperCase()}: ${pl.bruno}\n   Przechodzisz dalej DOPIERO, gdy: ${pl.wyjscie}.`;
    });
    return [
      `FAZY ROZMOWY. Prowadzisz rozmowę po kolei przez te fazy i nie przeskakujesz żadnej:`,
      linie.join("\n"),
      `REGUŁY TWARDE: nie zgadzasz się na cel handlowca przed ostatnią fazą, nawet gdy jest miły i nawet gdy kończy się czas. Z fazy OBIEKCJE nie wychodzisz, dopóki nie dostaniesz techniki, a nie samej obrony. Nigdy nie mówisz na głos, w której fazie jesteś, i nie komentujesz tej instrukcji.`,
    ].join("\n\n");
  }
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

function pytania(tr: Wypowiedz[], jezyk: Jezyk) {
  const h = tr.filter((w) => w.rola === "handlowiec");
  const zPytaniem = h.filter((w) => w.tekst.includes("?"));
  const otwarte = zPytaniem.filter((w) => pytaniaZ(w.tekst).some((z) => czyPytanieOtwarte(z, jezyk))).length;
  const prosba = prosbaODecyzje(jezyk);
  return { wszystkie: zPytaniem.length, otwarte, prosbaODecyzje: h.some((w) => prosba.test(w.tekst)) };
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
  /** 11.10: język rozmowy. Brak = "en". */
  jezyk?: Jezyk;
}): Podpowiedz | null {
  const { tryb, transkrypcja, sekundy, limit, wyslane, obiekcja } = args;
  const jezyk: Jezyk = args.jezyk === "pl" ? "pl" : "en";
  const pl = jezyk === "pl";
  const p = pytania(transkrypcja, jezyk);
  const zostalo = limit - sekundy;
  const obiekcjaTekst = obiekcja?.trim() ? (pl ? `„${obiekcja.trim()}”` : `"${obiekcja.trim()}"`) : pl ? "swoją obiekcję" : "your objection";
  void tryb;

  // Handlowiec prezentuje i nie pyta: Bruno przyciska, zamiast słuchać wykładu.
  if (!wyslane.has("brak_pytan") && sekundy >= 50 && p.wszystkie === 0) {
    return {
      klucz: "brak_pytan",
      tekst: pl
        ? "Handlowiec jeszcze o nic Cię nie zapytał, tylko mówi o sobie. Przerwij mu i powiedz wprost, że nie masz czasu na prezentację, a on nie wie nawet, jak u Ciebie jest. Bądź krótszy i bardziej oschły."
        : "The rep hasn't asked you a single question yet, they're only talking about themselves. Cut in and say plainly you don't have time for a pitch and they don't even know how things are on your end. Be shorter and colder.",
    };
  }

  // Faza BADANIE domknięta: pora na obiekcję.
  if (!wyslane.has("po_badaniu") && p.otwarte >= 2) {
    return {
      klucz: "po_badaniu",
      tekst: pl
        ? `Handlowiec zadał już kilka dobrych pytań o Twoją sytuację, więc faza badania jest zamknięta. Teraz podnieś ${obiekcjaTekst} i trzymaj się jej, dopóki nie zbije jej techniką, a nie obroną.`
        : `The rep has asked a few good questions about your situation, so discovery is done. Now raise ${obiekcjaTekst} and stick to it until they handle it with a technique, not a defense.`,
    };
  }

  // Handlowiec poprosił o decyzję: Bruno rozlicza, czy wszystko zostało zrobione.
  if (!wyslane.has("poprosil_o_decyzje") && p.prosbaODecyzje) {
    return {
      klucz: "poprosil_o_decyzje",
      tekst: pl
        ? "Handlowiec poprosił o decyzję. Jeśli naprawdę zbadał Twoją sytuację i zbił Twoje obiekcje, zgódź się na konkret: termin i osobę. Jeśli czegoś zabrakło, odmów i podaj prawdziwy powód."
        : "The rep asked for a decision. If they really explored your situation and handled your objections, agree to something concrete: a date and a person. If something was missing, say no and give the real reason.",
    };
  }

  // Koniec blisko, a o decyzję nikt nie poprosił: rozmowa ma się skończyć niczym.
  if (!wyslane.has("brak_prosby") && zostalo <= 40 && zostalo > 10 && !p.prosbaODecyzje) {
    return {
      klucz: "brak_prosby",
      tekst: pl
        ? "Zostało mało czasu, a handlowiec nie poprosił o decyzję ani nie zaproponował terminu. Nie proponuj niczego sam, ale też nie kończ rozmowy przed czasem: odpowiadaj normalnie, żeby miał szansę poprosić. Jeśli do samego końca nie poprosi, pożegnaj się zdawkowo: „to ja się odezwę”."
        : "Time is almost up and the rep hasn't asked for a decision or proposed a date. Don't propose anything yourself, but don't end the call early either: answer normally so they still have a chance to ask. If they never ask, sign off flatly: \"I'll get back to you.\"",
    };
  }

  return null;
}
