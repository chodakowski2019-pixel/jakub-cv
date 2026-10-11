// Stała talia WIEDZY do fiszek (USER_001 2.10): typy klientów DISC (rozpoznawanie
// i jak z nimi rozmawiać) + techniki z bazy wiedzy Sprzedaż (Voss, Rackham, Sandler,
// Belfort, Mazur). Każda karta: krótki tytuł (klucz), pytanie sytuacyjne, wzór.
// Dokładane każdemu kontu przy wejściu w Trening (zapewnijKarty), oceniane jak reszta.

import type { Jezyk } from "./domeny";

export type KartaWiedzy = { tresc: string; kategoria: "typy" | "technika"; pytanie: string; wzor: string };

export const WIEDZA: KartaWiedzy[] = [
  // Rozpoznawanie typów
  {
    tresc: "Spot it: Red",
    kategoria: "typy",
    pytanie: "The customer cuts you off after two sentences, asks \"how much?\" and \"what's in it for me?\", and has no time for small talk. What type is this and how do you talk to them?",
    wzor: "Red, the driver. Keep it short: numbers, results, a clear next step. No warm-up, no fluff. Give them a decision to make, not a story.",
  },
  {
    tresc: "Spot it: Yellow",
    kategoria: "typy",
    pytanie: "The customer is warm, tells stories, drifts off topic, and says \"sounds great, I'll talk to my team.\" What type is this and what's your main job?",
    wzor: "Yellow, the social one. They buy on emotion and relationship and avoid a hard \"no.\" Your job: bring them back on topic and lock in specifics: a date, a person, a decision. Otherwise the call is nice and ends with nothing.",
  },
  {
    tresc: "Spot it: Green",
    kategoria: "typy",
    pytanie: "The customer gives short answers, asks no questions, and says \"I need to think about it\" or \"we already have something that works.\" What type is this and how do you open them up?",
    wzor: "Green, the steady one. They fear change and risk. Open them up with open questions about their situation, with safety (a guarantee, time, no pressure), and with an example of someone just like them.",
  },
  {
    tresc: "Spot it: Blue",
    kategoria: "typy",
    pytanie: "The customer asks for details, where your numbers come from, and the fine print, and calls out gaps: \"a minute ago you said something else.\" What type is this and what convinces them?",
    wzor: "Blue, the analyst. They're convinced by hard numbers, company names, comparisons, and time to think it over. Admit your limits up front. With them, one vague claim = trust is gone.",
  },
  // Techniki
  {
    tresc: "Label (Voss)",
    kategoria: "technika",
    pytanie: "The customer says: \"That's too expensive for me.\" What label do you answer with, and what do you NOT do after it?",
    wzor: "\"It sounds like price is a big deal for you here.\" Then silence. You don't defend the price, you don't offer a discount, you don't argue. You wait until the customer tells you what's really going on.",
  },
  {
    tresc: "Mirror (Voss)",
    kategoria: "technika",
    pytanie: "Customer: \"I already have a vendor and I'm happy with them.\" Use a mirror.",
    wzor: "\"Happy with them?\" (repeat the last 1-3 words, as a question, then stay quiet). The customer keeps talking and shows you what's missing with their current vendor.",
  },
  {
    tresc: "Implication question (SPIN)",
    kategoria: "technika",
    pytanie: "The customer admits: \"Sometimes we lose leads because nobody calls them back in time.\" Ask an implication question.",
    wzor: "\"How many leads like that a month, and what's one worth on average? So how much money is left on the table every month?\" Ask about the cost and impact of the problem, not the problem itself.",
  },
  {
    tresc: "Upfront contract (Sandler)",
    kategoria: "technika",
    pytanie: "You're starting a 20-minute video call. What does your upfront contract sound like in the first 30 seconds?",
    wzor: "\"We have 20 minutes. Here's what I suggest: I'll ask a few questions about your situation, you ask me yours, and at the end we'll decide straight up if this makes sense and what the next step is. Sound good?\" Goal, time, outcome, agreement.",
  },
  {
    tresc: "Looping (Belfort)",
    kategoria: "technika",
    pytanie: "After you answer an objection, the customer says: \"OK, but I need to think about it.\" What do you do in the loop?",
    wzor: "Add ONE new piece of info or proof (company name + number) and ask for the decision again: \"...so let's do this: we start with a pilot in November. Sound good?\" Don't repeat the same argument.",
  },
  {
    tresc: "Silence after the price",
    kategoria: "technika",
    pytanie: "You just gave the price: \"It's $1,000 a month.\" What do you do in the next 5 seconds?",
    wzor: "Nothing. Stay quiet. The customer talks first. Anything you add (\"but we can negotiate,\" \"only,\" \"unfortunately\") sounds like you're apologizing for the price and invites a discount.",
  },
  {
    tresc: "Ask for the decision",
    kategoria: "technika",
    pytanie: "There are 2 minutes left in the call. The customer is basically sold but doesn't suggest anything. What do you say?",
    wzor: "Ask straight out for a specific step with a date and a person: \"Let's set up the rollout for Tuesday at 10 a.m., with you and your sales manager. Sound good?\" Not: \"I'll be in touch,\" \"I'll send you a proposal,\" \"take some time to think.\"",
  },
  {
    tresc: "Proof with a number",
    kategoria: "technika",
    pytanie: "Customer: \"How do I know this will work for us?\" What does good proof sound like, and what does bad proof sound like?",
    wzor: "Good: company name + number + time: \"Styrobud, 12 reps, after 6 weeks booked meetings were up 18%.\" Bad: \"lots of our customers are happy,\" \"it really works.\"",
  },
];

// 11.10 (USER_001): Bruno w dwóch językach. Talia PL (z fd7de52, 1:1) dla kont PL.
// Tytuły (tresc) są kluczem karty w bazie, więc talie EN i PL się nie mieszają.
export const WIEDZA_PL: KartaWiedzy[] = [
  // Rozpoznawanie typów
  {
    tresc: "Rozpoznaj: czerwony",
    kategoria: "typy",
    pytanie: "Klient przerywa po dwóch zdaniach, pyta „ile?” i „co z tego mam?”, nie chce gadać o pogodzie. Jaki to typ i jak z nim rozmawiasz?",
    wzor: "Czerwony, dominujący. Krótko, liczby, wynik, jasny następny krok. Zero wstępów i ogólników. Dajesz mu decyzję do podjęcia, nie opowieść.",
  },
  {
    tresc: "Rozpoznaj: żółty",
    kategoria: "typy",
    pytanie: "Klient jest ciepły, opowiada anegdoty, odbiega od tematu, mówi „super, pogadam z zespołem”. Jaki to typ i co jest Twoim głównym zadaniem?",
    wzor: "Żółty, towarzyski. Kupuje emocją i relacją, unika twardego „nie”. Twoje zadanie: sprowadzać do tematu i dopinać konkret: data, osoba, decyzja. Inaczej rozmowa jest miła i kończy się niczym.",
  },
  {
    tresc: "Rozpoznaj: zielony",
    kategoria: "typy",
    pytanie: "Klient odpowiada półsłówkami, nie zadaje pytań, mówi „muszę to przemyśleć”, „mamy już sprawdzone rozwiązanie”. Jaki to typ i czym go otwierasz?",
    wzor: "Zielony, stabilny. Boi się zmiany i ryzyka. Otwierasz go pytaniami otwartymi o jego sytuację, bezpieczeństwem (gwarancja, czas, brak presji) i przykładem kogoś podobnego do niego.",
  },
  {
    tresc: "Rozpoznaj: niebieski",
    kategoria: "typy",
    pytanie: "Klient dopytuje o szczegóły, źródła liczb, wyjątki w umowie, wytyka niespójność: „przed chwilą powiedział pan co innego”. Jaki to typ i co go przekonuje?",
    wzor: "Niebieski, analityczny. Przekonują go konkretne liczby, nazwy firm, porównanie i czas na analizę. Przyznaj ograniczenia wprost. Ogólnik u niego = koniec zaufania.",
  },
  // Techniki
  {
    tresc: "Etykieta (Voss)",
    kategoria: "technika",
    pytanie: "Klient mówi: „to dla mnie za drogo”. Jak brzmi etykieta, którą odpowiadasz, i czego po niej NIE robisz?",
    wzor: "„Wygląda na to, że cena jest tu dla pana kluczowa.” Potem cisza. Nie bronisz ceny, nie dajesz rabatu, nie argumentujesz. Czekasz, aż klient sam dopowie, o co naprawdę chodzi.",
  },
  {
    tresc: "Lustro (Voss)",
    kategoria: "technika",
    pytanie: "Klient: „Mam już swojego dostawcę i jestem zadowolony.” Zastosuj lustro.",
    wzor: "„Zadowolony?” (powtarzasz 1-3 ostatnie słowa, ton pytający, cisza). Klient rozwija temat i sam pokazuje, czego mu brakuje u obecnego dostawcy.",
  },
  {
    tresc: "Pytanie implikacyjne (SPIN)",
    kategoria: "technika",
    pytanie: "Klient przyznał: „czasem gubimy leady, bo nikt nie oddzwania na czas”. Zadaj pytanie implikacyjne.",
    wzor: "„Ile takich leadów miesięcznie i ile średnio wart jest jeden? Czyli ile pieniędzy zostaje co miesiąc na stole?” Pytanie o skutek i koszt problemu, nie o sam problem.",
  },
  {
    tresc: "Kontrakt wstępny (Sandler)",
    kategoria: "technika",
    pytanie: "Zaczynasz 20-minutową rozmowę online. Jak brzmi kontrakt wstępny w pierwszych 30 sekundach?",
    wzor: "„Mamy 20 minut. Proponuję: ja zadam kilka pytań o waszą sytuację, pan zada mi swoje, a na końcu ustalimy wprost, czy to ma sens i jaki jest następny krok. Pasuje?” Cel, czas, wynik, zgoda.",
  },
  {
    tresc: "Pętla po obiekcji (Belfort)",
    kategoria: "technika",
    pytanie: "Klient po Twojej odpowiedzi na obiekcję mówi „no dobrze, ale muszę pomyśleć”. Co robisz w pętli?",
    wzor: "Dokładasz JEDNĄ nową informację albo dowód (nazwa firmy + liczba) i ponownie prosisz o decyzję: „…dlatego zróbmy tak: zaczynamy od pilotażu w listopadzie. Pasuje?” Nie powtarzasz tego samego argumentu.",
  },
  {
    tresc: "Cisza po kwocie",
    kategoria: "technika",
    pytanie: "Podałeś cenę: „to kosztuje 4 000 zł miesięcznie”. Co robisz w następnych 5 sekundach?",
    wzor: "Nic. Milczysz. Klient odzywa się pierwszy. Każde dopowiedzenie („ale można negocjować”, „tylko”, „niestety”) to usprawiedliwianie ceny i zaproszenie do rabatu.",
  },
  {
    tresc: "Prośba o decyzję",
    kategoria: "technika",
    pytanie: "Zostały 2 minuty rozmowy, klient jest w zasadzie przekonany, ale sam nic nie proponuje. Co mówisz?",
    wzor: "Prosisz wprost o konkretny krok z datą i osobą: „Umówmy wdrożenie na wtorek 10:00, z panem i szefem sprzedaży. Pasuje?” Nie: „to odezwę się”, „prześlę ofertę”, „proszę pomyśleć”.",
  },
  {
    tresc: "Dowód z liczbą",
    kategoria: "technika",
    pytanie: "Klient: „a skąd mam wiedzieć, że to u nas zadziała?”. Jak brzmi dobry dowód, a jak zły?",
    wzor: "Dobry: nazwa firmy + liczba + czas: „Styrobud, 12 handlowców, po 6 tygodniach +18 % umówionych spotkań.” Zły: „wielu klientów jest zadowolonych”, „to się sprawdza”.",
  },
];

/** Talia wiedzy w danym języku. */
export function wiedzaDla(jezyk: Jezyk | string | null | undefined): KartaWiedzy[] {
  return jezyk === "pl" ? WIEDZA_PL : WIEDZA;
}
