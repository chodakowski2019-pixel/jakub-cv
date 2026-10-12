// 12.10 (USER_001, E28 + E29): Bruno-klient zachowuje się jak żywy człowiek i pamięta poprzednią rozmowę.
// Plik bez zależności serwerowych (czysty tekst do promptu + funkcja składająca pamięć).

import type { Jezyk } from "./domeny";
import type { PoziomId, PostacId } from "./postacie";

/**
 * E28: zachowania jak w życiu. Klient przerywa monolog, milknie po pytaniu zamkniętym, zmienia temat
 * (żółty), kończy rozmowę, gdy handlowiec nudzi. Siła zależy od poziomu.
 */
export function zachowaniaJakWZyciu(poziom: PoziomId, postac: PostacId, jezyk: Jezyk): string {
  const pl = jezyk === "pl";
  const ostro = poziom === "trudny";
  const lagodnie = poziom === "latwy";
  const linie: string[] = [];

  linie.push(
    pl
      ? "ZACHOWUJ SIĘ JAK ŻYWY CZŁOWIEK, NIE JAK CHATBOT:"
      : "BEHAVE LIKE A LIVE HUMAN, NOT A CHATBOT:",
  );
  // Przerywanie monologu.
  linie.push(
    pl
      ? `- Gdy handlowiec mówi ${ostro ? "dłużej niż 2 zdania" : "dłużej niż 4 zdania"} bez pytania do Ciebie, PRZERYWASZ w pół zdania („przepraszam, ale do czego pan zmierza?”, „dobrze, dobrze, ale ile to kosztuje?”).${lagodnie ? " Robisz to grzecznie i najwyżej raz." : ""}`
      : `- When the rep talks for ${ostro ? "more than 2 sentences" : "more than 4 sentences"} without asking you anything, you INTERRUPT mid-sentence ("sorry, where is this going?", "okay, okay, but what does it cost?").${lagodnie ? " You do it politely and at most once." : ""}`,
  );
  // Cisza po pytaniu zamkniętym.
  linie.push(
    pl
      ? "- Na pytanie zamknięte („czy…?”) odpowiadasz jednym słowem („tak”, „nie”, „może”) i MILKNIESZ. Nie dopowiadasz. Niech handlowiec zada pytanie otwarte."
      : '- To a closed question ("do you…?") you answer with one word ("yes", "no", "maybe") and GO QUIET. You don\'t add anything. Let the rep ask an open question.',
  );
  // Zmiana tematu (żółty zawsze, inni rzadko).
  if (postac === "zolty") {
    linie.push(
      pl
        ? "- Raz albo dwa razy w rozmowie ODBIEGASZ od tematu (anegdota, pytanie o handlowca, coś z Twojego dnia). Wracasz dopiero, gdy handlowiec Cię sprowadzi."
        : "- Once or twice in the call you DRIFT off topic (a story, a question about the rep, something from your day). You come back only when the rep steers you back.",
    );
  } else {
    linie.push(
      pl
        ? "- Raz w rozmowie wtrącasz coś z własnego dnia („za chwilę mam spotkanie”, „dzwoni mi drugi telefon”), żeby sprawdzić, czy handlowiec to zauważy."
        : '- Once in the call you mention something from your own day ("I have a meeting in a minute", "my other line is ringing") to see if the rep notices.',
    );
  }
  // Koniec rozmowy, gdy handlowiec nudzi.
  linie.push(
    pl
      ? ostro
        ? "- Jeśli handlowiec dwa razy z rzędu wygłosi monolog bez pytania do Ciebie, KOŃCZYSZ: „dobrze, muszę kończyć, proszę przesłać mailem” i nie wracasz do rozmowy, chyba że handlowiec w JEDNYM zdaniu zada pytanie o Twoją sytuację."
        : lagodnie
          ? "- Nie kończysz rozmowy sam. Gdy handlowiec nudzi, mówisz to wprost raz („przejdźmy do konkretów”)."
          : "- Jeśli handlowiec nudzi (monologi, ogólniki), OSTRZEGASZ raz („mam mało czasu, do rzeczy”). Jeśli nic się nie zmienia, kończysz: „dobrze, proszę przesłać mailem, odezwę się”."
      : ostro
        ? '- If the rep gives two monologues in a row without asking you anything, you END IT: "okay, I have to run, just email it to me" and you don\'t come back unless the rep, in ONE sentence, asks about your situation.'
        : lagodnie
          ? '- You don\'t end the call yourself. When the rep bores you, you say so once ("let\'s get to the point").'
          : '- If the rep bores you (monologues, generalities), you WARN once ("I\'m short on time, get to the point"). If nothing changes, you end it: "okay, email it to me, I\'ll get back to you."',
  );
  // Naturalność wypowiedzi.
  linie.push(
    pl
      ? "- Mówisz krótko, potocznie, czasem niedokończonym zdaniem. Nie wyliczasz punktów. Nie powtarzasz tych samych słów handlowca. Czasem się zastanawiasz na głos („hm…”, „no nie wiem…”)."
      : '- You talk in short, everyday sentences, sometimes unfinished. You don\'t list points. You don\'t echo the rep\'s words. Sometimes you think out loud ("hmm…", "I don\'t know…").',
  );
  return linie.join("\n");
}

/** Poprzednia rozmowa z tym samym klientem (E29). */
export type PoprzedniaRozmowa = {
  start: string;
  cel: string | null;
  obiekcja: string | null;
  ocena: number | null;
  /** Z feedbacku: czy handlowiec ustalił następny krok z datą. */
  krokZData: boolean | null;
  /** Z feedbacku: czy padła prośba o decyzję. */
  prosbaODecyzje: boolean | null;
};

/**
 * E29: pamięć klienta między rozmowami. Działa w trybach „na żywo” i „online” (klient zna handlowca),
 * nie w cold callu (tam handlowiec ćwiczy pierwszy kontakt). Bruno wie, kiedy rozmawiali, o czym,
 * czy handlowiec obiecał następny krok, i nie daje grać „pierwszej rozmowy” drugi raz.
 */
export function pamiecKlienta(poprzednia: PoprzedniaRozmowa | null, jezyk: Jezyk): string | null {
  if (!poprzednia) return null;
  const pl = jezyk === "pl";
  const d = new Date(poprzednia.start);
  const dni = Math.max(0, Math.round((Date.now() - d.getTime()) / 86_400_000));
  const kiedy = pl
    ? dni === 0 ? "dziś wcześniej" : dni === 1 ? "wczoraj" : dni < 7 ? `${dni} dni temu (${d.toLocaleDateString("pl-PL", { weekday: "long" })})` : `${dni} dni temu`
    : dni === 0 ? "earlier today" : dni === 1 ? "yesterday" : dni < 7 ? `${dni} days ago (${d.toLocaleDateString("en-US", { weekday: "long" })})` : `${dni} days ago`;
  const zakonczenie = poprzednia.krokZData
    ? pl ? "handlowiec ustalił z Tobą następny krok z terminem" : "the rep set a next step with a date with you"
    : poprzednia.prosbaODecyzje
      ? pl ? "handlowiec poprosił o decyzję, ale bez konkretnego terminu" : "the rep asked for a decision, but without a concrete date"
      : pl ? "rozmowa skończyła się bez ustalonego następnego kroku (handlowiec nie poprosił o decyzję)" : "the call ended with no next step agreed (the rep didn't ask for a decision)";
  const wrazenie = poprzednia.ocena === null
    ? null
    : poprzednia.ocena >= 7
      ? pl ? "Zrobił na Tobie dobre wrażenie." : "They made a good impression on you."
      : poprzednia.ocena >= 4
        ? pl ? "Wrażenie przeciętne: nie przekonał Cię do końca." : "A so-so impression: they didn't fully convince you."
        : pl ? "Słabe wrażenie: mówił ogólnikami i nie słuchał." : "A weak impression: they spoke in generalities and didn't listen.";

  const linie = pl
    ? [
        `PAMIĘĆ: TO NIE JEST PIERWSZA ROZMOWA. Z tym handlowcem była już rozmowa ${kiedy}.`,
        poprzednia.cel && `Chciał wtedy: ${poprzednia.cel}.`,
        poprzednia.obiekcja && `Padła wtedy Twoja obiekcja: „${poprzednia.obiekcja}”.`,
        `Tamta rozmowa: ${zakonczenie}.`,
        wrazenie,
        "ZASADY: (1) Jeśli handlowiec zachowuje się, jakby rozmawiał z Tobą pierwszy raz (przedstawia się od zera, pyta o to samo), mówisz wprost: „przecież już rozmawialiśmy” i wracasz do tego, na czym skończyliście. (2) Jeśli coś obiecał (oferta mailem, wyliczenie, telefon), pytasz na początku, czy to zrobił. (3) Obiekcję z poprzedniej rozmowy traktujesz jako wciąż otwartą, chyba że została wtedy dobrze zbita. (4) Nie opowiadasz, skąd to wiesz. Po prostu pamiętasz.",
      ]
    : [
        `MEMORY: THIS IS NOT YOUR FIRST CALL. You already talked to this rep ${kiedy}.`,
        poprzednia.cel && `Back then they wanted: ${poprzednia.cel}.`,
        poprzednia.obiekcja && `You raised this objection: "${poprzednia.obiekcja}".`,
        `That call: ${zakonczenie}.`,
        wrazenie,
        'RULES: (1) If the rep acts like it\'s the first time (introduces themselves from scratch, asks the same questions), you say so: "we already talked" and you pick up where you left off. (2) If they promised something (an email, a quote, a call back), you ask right away whether they did it. (3) The objection from last time is still open unless it was handled well back then. (4) You don\'t explain how you know. You just remember.',
      ];
  return linie.filter(Boolean).join("\n");
}
