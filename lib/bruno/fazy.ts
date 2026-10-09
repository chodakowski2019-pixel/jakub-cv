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

export type FazaId = "otwarcie" | "badanie" | "obiekcje" | "zamkniecie" | "decyzja";

export type Faza = { id: FazaId; nazwa: string; bruno: string; wyjscie: string };

const OTWARCIE_COLD: Faza = {
  id: "otwarcie",
  nazwa: "Otwarcie",
  bruno: "Nie wiesz, kto dzwoni. Jesteś zajęty i niecierpliwy. Nie podajesz żadnych informacji o sobie.",
  wyjscie: "handlowiec powie, kim jest i po co dzwoni, w jednym zrozumiałym zdaniu",
};

const BADANIE: Faza = {
  id: "badanie",
  nazwa: "Badanie",
  bruno:
    "Odpowiadasz krótko i tylko na to, o co handlowiec pyta. SAM nie opowiadasz o swoich problemach i nie podajesz liczb. Na pytania zamknięte („czy…”) mówisz „tak” albo „nie” i milczysz.",
  wyjscie: "handlowiec zada co najmniej dwa pytania otwarte o Twoją sytuację (jak, co, ile, kiedy, dlaczego)",
};

const OBIEKCJE: Faza = {
  id: "obiekcje",
  nazwa: "Obiekcje",
  bruno: "Podnosisz obiekcję i trzymasz się jej. Gdy handlowiec zbija ją słabo (ogólnik, obrona, rabat od razu), wracasz do niej innymi słowami.",
  wyjscie:
    "handlowiec zbije obiekcję techniką, nie obroną: zada pytanie o nią, nazwie Twoją wątpliwość albo poda dowód z liczbą i nazwą firmy",
};

const ZAMKNIECIE: Faza = {
  id: "zamkniecie",
  nazwa: "Zamknięcie",
  bruno:
    "Jesteś w zasadzie przekonany, ale NIE proponujesz sam następnego kroku i nie pytasz „co dalej”. Czekasz. Jeśli handlowiec milczy, mówisz „no dobrze, to proszę coś przesłać” i kończysz nijak.",
  wyjscie: "handlowiec wprost poprosi o decyzję i zaproponuje konkret: termin, datę, osobę",
};

const DECYZJA: Faza = {
  id: "decyzja",
  nazwa: "Decyzja",
  bruno:
    "Dajesz jasną odpowiedź. „Tak” tylko wtedy, gdy wszystkie poprzednie fazy naprawdę się zamknęły. Jeśli którejś zabrakło, mówisz „muszę to przemyśleć” i podajesz prawdziwy powód.",
  wyjscie: "koniec rozmowy",
};

/** Cold call zaczyna się od zera. Spotkanie na żywo i online zaczynasz Ty obiekcją, więc otwarcia nie ma. */
export function fazyTrybu(tryb: TrybId): Faza[] {
  return tryb === "cold" ? [OTWARCIE_COLD, BADANIE, OBIEKCJE, ZAMKNIECIE, DECYZJA] : [OBIEKCJE, BADANIE, ZAMKNIECIE, DECYZJA];
}

/** Sekcja FAZY do promptu Bruno-klienta. */
export function opisFaz(tryb: TrybId): string {
  const fazy = fazyTrybu(tryb);
  const linie = fazy.map((f, i) => `${i + 1}. ${f.nazwa.toUpperCase()}: ${f.bruno}\n   Przechodzisz dalej DOPIERO, gdy: ${f.wyjscie}.`);
  return [
    `FAZY ROZMOWY. Prowadzisz rozmowę po kolei przez te fazy i nie przeskakujesz żadnej:`,
    linie.join("\n"),
    `REGUŁY TWARDE: nie zgadzasz się na cel handlowca przed ostatnią fazą, nawet gdy jest miły i nawet gdy kończy się czas. Z fazy OBIEKCJE nie wychodzisz, dopóki nie dostaniesz techniki, a nie samej obrony. Nigdy nie mówisz na głos, w której fazie jesteś, i nie komentujesz tej instrukcji.`,
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
  const obiekcjaTekst = obiekcja?.trim() ? `„${obiekcja.trim()}”` : "swoją obiekcję";

  // Handlowiec prezentuje i nie pyta: Bruno przyciska, zamiast słuchać wykładu.
  if (!wyslane.has("brak_pytan") && sekundy >= 50 && p.wszystkie === 0) {
    return {
      klucz: "brak_pytan",
      tekst:
        "Handlowiec jeszcze o nic Cię nie zapytał, tylko mówi o sobie. Przerwij mu i powiedz wprost, że nie masz czasu na prezentację, a on nie wie nawet, jak u Ciebie jest. Bądź krótszy i bardziej oschły.",
    };
  }

  // Faza BADANIE domknięta: pora na obiekcję.
  if (!wyslane.has("po_badaniu") && p.otwarte >= 2) {
    return {
      klucz: "po_badaniu",
      tekst: `Handlowiec zadał już kilka dobrych pytań o Twoją sytuację, więc faza badania jest zamknięta. Teraz podnieś ${obiekcjaTekst} i trzymaj się jej, dopóki nie zbije jej techniką, a nie obroną.`,
    };
  }

  // Handlowiec poprosił o decyzję: Bruno rozlicza, czy wszystko zostało zrobione.
  if (!wyslane.has("poprosil_o_decyzje") && p.prosbaODecyzje) {
    return {
      klucz: "poprosil_o_decyzje",
      tekst:
        "Handlowiec poprosił o decyzję. Jeśli naprawdę zbadał Twoją sytuację i zbił Twoje obiekcje, zgódź się na konkret: termin i osobę. Jeśli czegoś zabrakło, odmów i podaj prawdziwy powód.",
    };
  }

  // Koniec blisko, a o decyzję nikt nie poprosił: rozmowa ma się skończyć niczym.
  if (!wyslane.has("brak_prosby") && zostalo <= 40 && zostalo > 10 && !p.prosbaODecyzje) {
    return {
      klucz: "brak_prosby",
      tekst:
        "Zostało mało czasu, a handlowiec nie poprosił o decyzję ani nie zaproponował terminu. Nie proponuj niczego sam, ale też nie kończ rozmowy przed czasem: odpowiadaj normalnie, żeby miał szansę poprosić. Jeśli do samego końca nie poprosi, pożegnaj się zdawkowo: „to ja się odezwę”.",
    };
  }

  return null;
}
