// Stała talia WIEDZY do fiszek (USER_001 2.10): typy klientów DISC (rozpoznawanie
// i jak z nimi rozmawiać) + techniki z bazy wiedzy Sprzedaż (Voss, Rackham, Sandler,
// Belfort, Mazur). Każda karta: krótki tytuł (klucz), pytanie sytuacyjne, wzór.
// Dokładane każdemu kontu przy wejściu w Trening (zapewnijKarty), oceniane jak reszta.

import type { Jezyk } from "./domeny";
import type { Segment } from "./segment";

/**
 * 12.10 (W3): `kategoria: "obiekcje"` = scenki z 20 kart `SalesAI/wiedza/techniki/` (sekcja „Fiszka").
 * `segment` = B2B / B2C z karty. Tabela bruno_karty NIE ma jeszcze kolumny segment (SQL w `sql/2026-10-12-karty-segment.sql`),
 * więc pole zostaje na razie tylko w talii, zapewnijKarty go nie zapisuje.
 */
export type KartaWiedzy = { tresc: string; kategoria: "typy" | "technika" | "obiekcje"; pytanie: string; wzor: string; segment?: Segment };

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
  // ——— 12.10 (W3): objection scenes from the 20 technique cards (B2B = Negacz, B2C = Belfort / Miner / Gordon / Elliott / Cardone / Ferry / Roberts) ———
  {
    tresc: "Agree, don't argue",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "The customer says: \"That's too expensive, there's nothing to talk about.\" What do you say? (Agree + question, zero \"but\".)",
    wzor: "\"I get it. At that number that's a normal reaction. Before I say anything about price: compared to what does it feel high?\"",
  },
  {
    tresc: "Dig into \"too expensive\"",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "The customer says: \"No, that's too expensive.\" What do you say? (No argument, no discount.)",
    wzor: "\"I understand. Compared to what does that number feel high: another quote, your budget, or what you pay today?\"",
  },
  {
    tresc: "Anything besides price?",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "The customer says: \"We picked another company, they were cheaper.\" What do you say?",
    wzor: "\"Thanks for being straight. One question, not to change your mind: was there anything besides price that drove the decision?\"",
  },
  {
    tresc: "The risk of the cheaper option",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "The customer says: \"Your competitor has the same thing 20 % cheaper.\" What do you say? (Don't use the word \"quality\".)",
    wzor: "\"I hear you, that's real money. What happens if that part fails in season: what does one day of downtime cost you?\"",
  },
  {
    tresc: "\"We have a vendor\": agree, then shift",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "The customer says: \"We have a vendor, just email me something.\" What do you say?",
    wzor: "\"Sure, I'll send it. And I'm not trying to replace your vendor. I'm calling because at companies like yours I see [problem with a number]. The best next step is a 10-minute call, three questions, and I'll tell you straight if this fits. Thursday morning or afternoon?\"",
  },
  {
    tresc: "\"Just send the proposal\": questions first",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "The customer says: \"I don't need a call, just send the proposal.\" What do you say?",
    wzor: "\"I will. Before my team prices it, three questions, or it's a shot in the dark: what happened that you're looking now? Why this model? Who have you talked to already? Ten minutes today or tomorrow morning, quote by Friday.\"",
  },
  {
    tresc: "\"I'll ask the board\": who else decides",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "The customer says: \"I have to take this to the board.\" What do you say?",
    wzor: "\"Sure. Who besides you will be in on that decision? [CEO and CFO.] When the CFO hears it from us, the proposal fits better and the decision moves faster. Fifteen minutes with both of you, a few simple questions. Tuesday or Thursday?\"",
  },
  {
    tresc: "\"Not now\": put it in the plan",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "The customer says: \"Not now, let's circle back after the quarter.\" What do you say?",
    wzor: "\"I get it. What needs to happen by quarter end for this to come back? [Budget locks Nov 20.] So the numbers have to be on your desk before that. Quote in two options by Nov 5, a 20-minute call Nov 12 at 10. Can you put that in your calendar?\"",
  },
  {
    tresc: "The customer who had the same doubt",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "The customer says: \"How do I know this will work here?\" What do you say? (Story: similar company, same doubt, what was done, a number.)",
    wzor: "\"Fair question. [Company, industry, size] had the exact same doubt. We started with [small start, paid on results]. After [time], [result with a number]. Which part of that is closest to your situation?\"",
  },
  {
    tresc: "Admit the weak spot, teach them to compare",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "The customer says: \"Your competitor delivers in 5 days, you take 12.\" What do you say? (Admit it, don't deny it.)",
    wzor: "\"You're right, on delivery we're worse. Three things worth checking when you choose: delivery time, percent on time, claim time. Us: 12 days, 98 %, 1 day. Ask them the same questions. If they win, pick them. Which of the three hurts most?\"",
  },
  {
    tresc: "The loop: does the idea make sense?",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "The customer says: \"I need to think it over.\" What do you say? (Short bounce, idea question, new info, second ask.)",
    wzor: "\"I hear you. Does the idea itself, [result with a number], make sense to you? [Yes.] Exactly, so it's that you don't know me yet. Here's what I haven't told you: [new info: guarantee, timeline, named reference]. Any reason not to start on [date]?\"",
  },
  {
    tresc: "\"Think it over\": before I go",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "The customer says: \"I need to think about it, I'll let you know.\" What do you say? (Agree, book a time, then ask.)",
    wzor: "\"Sure. When did you want to get back to me, tomorrow or the day after? Let's set a time so you don't have to chase me. Thursday at 10? [Okay.] Before I let you go: what did you want to run through in your head, so I know what questions you'll have Thursday?\"",
  },
  {
    tresc: "Consequence questions, concerned tone",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "The customer says: \"Now's not a good time, I'll reach out.\" What do you say? (Permission, then 2-3 consequence questions, no arguments.)",
    wzor: "\"Sure. Can I ask one thing? How can I tell you this might be a mistake without you getting upset? [Go ahead.] What happens to [problem] if nothing changes for six months? [answer] And what happens then with [work / family]? [answer] So why look at this now instead of pushing it off like most people do?\"",
  },
  {
    tresc: "Money aside, 1-to-10, isolate",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "The customer says: \"That's a lot. Send me the proposal, I'll get back to you.\" What do you say? (Money aside, scale, gap, isolate.)",
    wzor: "\"No problem. Money aside: is what we walked through what you need to [goal]? [I think so.] On a scale of 1 to 10, where are you? [7.] What's keeping you at a 7 instead of a 9? [X.] Other than X, anything else? [No.] Then let's solve X.\"",
  },
  {
    tresc: "\"I have to ask my spouse\": respect or permission",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "The customer says: \"I have to talk it over with my wife.\" What do you say? (Isolate, respect or permission, 2 questions about her, follow-up within 48 h.)",
    wzor: "\"Sure. Besides talking to your wife, is there anything else keeping you under 100 %? [No.] Are you doing this anyway and giving her a heads-up, or does she have to sign off? [Sign off.] What will she say to [amount]? [A lot.] Does she want you to finally fix [problem]? [Yes.] When will you talk? [Tonight.] Tomorrow at 6, she's welcome on the call. If you two decide not now, that's fine, we'll still talk.\"",
  },
  {
    tresc: "\"Of course you need to think\": 5 minutes of numbers",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "After the demo the customer says: \"I need to think about it.\" No numbers yet. What do you say?",
    wzor: "\"Of course you need to think about it. I haven't given you anything to think about yet, you haven't seen a number. Five minutes: price, payment, your trade-in value, so at home you actually have something to think about. Fair?\"",
  },
  {
    tresc: "Hypothetically: what decides in the end?",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "The customer says: \"I've got two other ones to look at.\" What do you say? (Hypothetical, pick one of two, reframe, leave the exit.)",
    wzor: "\"Sure. Hypothetically: you've seen both, this was the last. What decides in the end: the [product] itself or the terms? [Terms.] So it's not 'if', it's 'where it's best'. If I save you time and money, would that offend you? [No.] Then 10 minutes. And in the end it's your call.\"",
  },
  {
    tresc: "If the money were the same, who?",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "The customer says: \"Those guys did it for $80, you want $120.\" What do you say? (No discount, no defense, one question.)",
    wzor: "\"I hear you. If the money were the same, who would you rather have do it? [You.] Why? [reviews, referral, on time] So we're deciding on a $40 difference, not $120. For that $40 you get [3 specifics]. Which option do we go with?\"",
  },
  {
    tresc: "\"You're right\" + a number + a tie-down",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "The customer says: \"Nobody looks in December, we'll list in spring.\" What do you say? (Agree, number, reframe, tie-down.)",
    wzor: "\"You're right, fewer people look in December. Last December we sold [number]. The ones looking in winter have to buy. And there are fewer listings, so you could be the only option. You want serious buyers and less competition, right?\"",
  },
  {
    tresc: "\"Not interested\": curious tone",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "The customer says: \"I'm not interested, I already have one.\" What do you say? (Light agreement, curious tone, question about their situation.)",
    wzor: "\"Okay, let me update your file. You're probably getting calls from everybody, right? [Yes.] I'm a little confused, because on the form you put down [what they wrote]. Did something change? [answer] So what had you looking in the first place?\"",
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
  // ——— 12.10 (W3): scenki obiekcji z 20 kart technik (B2B = Negacz, B2C = Belfort / Miner / Gordon / Elliott / Cardone / Ferry / Roberts) ———
  {
    tresc: "Zgoda zamiast „ale”",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "Klient mówi: „To za drogo, nie ma o czym rozmawiać.” Co odpowiesz? (Zgoda + pytanie, zero „ale”.)",
    wzor: "„Rozumiem, przy tej kwocie to naturalna reakcja. Zanim cokolwiek powiem o cenie: w porównaniu do czego wydaje się wysoka?”",
  },
  {
    tresc: "Pogłębienie „za drogo”",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "Klient mówi: „Nie, to za drogo.” Co odpowiesz? (Bez argumentu, bez rabatu.)",
    wzor: "„Rozumiem. W porównaniu do czego ta kwota wydaje się wysoka: do innej oferty, do budżetu czy do tego, co płacicie dziś?”",
  },
  {
    tresc: "Czy jest coś oprócz ceny?",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "Klient mówi: „Wybraliśmy inną firmę, mieli taniej.” Co odpowiesz?",
    wzor: "„Dziękuję za szczerość. Jedno pytanie, nie żeby zmieniać decyzję: czy było coś oprócz ceny, co wpłynęło na wybór?”",
  },
  {
    tresc: "Ryzyko tańszego rozwiązania",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "Klient mówi: „Konkurencja ma to samo 20 % taniej.” Co odpowiesz? (Bez słowa „jakość”.)",
    wzor: "„Rozumiem, to realna różnica. Co się stanie, jeśli ten element zawiedzie w sezonie: ile kosztuje u pana dzień przestoju?”",
  },
  {
    tresc: "„Mam dostawcę”: zgoda i inny obszar",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "Klient mówi: „Mamy dostawcę, proszę wysłać coś na maila.” Co odpowiesz?",
    wzor: "„Jasne, wyślę. I nie próbuję zastąpić pana dostawcy. Dzwonię, bo u firm z pana branży widzę [problem z liczbą]. Najlepszym krokiem będzie 10 minut rozmowy, zadam trzy pytania i powiem wprost, czy to ma u was sens. Czwartek rano czy po południu?”",
  },
  {
    tresc: "„Prześlij ofertę”: pytania przed ofertą",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "Klient mówi: „Nie potrzebuję rozmowy, proszę po prostu przesłać ofertę.” Co odpowiesz?",
    wzor: "„Wyślę. Zanim zespół zacznie wyceniać, trzy pytania, inaczej to strzał w ciemno: co się wydarzyło, że szukacie tego teraz? Dlaczego ten model? Z kim już rozmawialiście? 10 minut dziś albo jutro rano, oferta do piątku.”",
  },
  {
    tresc: "„Zapytam zarządu”: kto oprócz pana decyduje",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "Klient mówi: „Muszę to przedstawić zarządowi.” Co odpowiesz?",
    wzor: "„Jasne. Kto oprócz pana będzie przy tej decyzji? [Prezes i CFO.] Gdy CFO słyszy to od nas, oferta jest lepiej dopasowana i decyzja idzie szybciej. 15 minut z wami razem, kilka prostych pytań. Wtorek czy czwartek?”",
  },
  {
    tresc: "„Nie teraz”: osadzenie w planie",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "Klient mówi: „Nie teraz, wróćmy do tego po kwartale.” Co odpowiesz?",
    wzor: "„Rozumiem. Co ma się wydarzyć do końca kwartału, żeby temat wrócił? [Budżet do 20.11.] Czyli liczby muszą być u pana wcześniej. Do 5.11 wycena w dwóch wariantach, 12.11 o 10:00 20 minut rozmowy. Wpisze pan?”",
  },
  {
    tresc: "Historia klienta z tą samą wątpliwością",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "Klient mówi: „Skąd gwarancja, że to u nas zadziała?” Co odpowiesz? (Historia: podobna firma, ta sama wątpliwość, co zrobiono, liczba.)",
    wzor: "„Uczciwe pytanie. [Firma, branża, wielkość] miała tę samą wątpliwość. Zaczęliśmy od [mały start, rozliczenie po efekcie]. Po [czas] [wynik z liczbą]. Który element tej historii jest najbliżej pana sytuacji?”",
  },
  {
    tresc: "Przyznaj minus, naucz porównywać",
    kategoria: "obiekcje",
    segment: "b2b",
    pytanie: "Klient mówi: „Konkurencja dowozi w 5 dni, wy w 12.” Co odpowiesz? (Przyznaj, nie zaprzeczaj.)",
    wzor: "„Ma pan rację, w terminie jesteśmy gorsi. Przy wyborze warto sprawdzić trzy rzeczy: termin, procent dostaw na czas, czas reklamacji. My: 12 dni, 98 %, 1 dzień. Proszę zadać im te same pytania. Jeśli wygrywają, wybierzcie ich. Co z tych trzech boli was najbardziej?”",
  },
  {
    tresc: "Pętla: czy sam pomysł ma sens?",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "Klient mówi: „Muszę to przemyśleć.” Co odpowiesz? (Odbicie, pytanie o pomysł, nowa informacja, druga prośba.)",
    wzor: "„Słyszę. Sam pomysł [efekt z liczbą] ma dla pana sens? [Tak.] No właśnie, czyli chodzi o to, że mnie pan nie zna. Dlatego: [nowa informacja: gwarancja, termin, referencja]. Jest jakiś powód, żeby nie zacząć od [data]?”",
  },
  {
    tresc: "„Muszę pomyśleć”: zanim pójdę",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "Klient mówi: „Muszę to przemyśleć, dam znać.” Co odpowiesz? (Zgoda, termin, dopiero potem pytanie.)",
    wzor: "„Jasne. Kiedy chce pan wrócić, jutro czy pojutrze? Wpiszmy godzinę, żeby pan mnie nie gonił. Czwartek 10:00? [Ok.] Zanim się rozłączę: co chce pan jeszcze przemyśleć, żebym wiedział, jakie pytania będzie pan miał w czwartek?”",
  },
  {
    tresc: "Pytania o skutki, ton zatroskany",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "Klient mówi: „Teraz nie jest dobry moment, odezwę się.” Co odpowiesz? (Pozwolenie, potem 2-3 pytania o skutki, bez argumentów.)",
    wzor: "„Jasne. Mogę zadać jedno pytanie? Jak mam pani powiedzieć, że to może być błąd, żeby się pani nie obraziła? [Słucham.] Co się stanie z [problem], jeśli pół roku nic się nie zmieni? [odpowiedź] A co wtedy z [praca / rodzina]? [odpowiedź] To czemu rozważa to pani teraz, a nie odkłada jak większość?”",
  },
  {
    tresc: "Pieniądze na bok, skala 1-10, izolacja",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "Klient mówi: „Dużo. Prześle pan ofertę, odezwę się.” Co odpowiesz? (Pieniądze na bok, skala, luka, izolacja.)",
    wzor: "„Żaden problem. Odłóżmy pieniądze na bok: to, co omówiliśmy, to jest to, czego pani potrzebuje, żeby [cel]? [Chyba tak.] W skali 1-10 gdzie pani jest? [7.] Co trzyma panią na 7 zamiast 9? [X.] Poza X, jest coś jeszcze? [Nie.] To rozwiążmy X.”",
  },
  {
    tresc: "„Zapytam żony”: respekt czy pozwolenie",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "Klient mówi: „Muszę to obgadać z żoną.” Co odpowiesz? (Izolacja, respekt czy pozwolenie, 2 pytania o nią, termin ≤ 48 h.)",
    wzor: "„Jasne. Poza rozmową z żoną, jest coś jeszcze, co trzyma pana poniżej 100 %? [Nie.] To i tak pan wchodzi i chce ją uprzedzić, czy ona musi się zgodzić? [Musi.] Co powie na [kwota]? [Dużo.] A chce, żeby pan wreszcie rozwiązał [problem]? [Tak.] Kiedy pogadacie? [Dziś.] Jutro 18:00, żona mile widziana. Jeśli uznacie, że nie, w porządku, i tak się spotkamy.”",
  },
  {
    tresc: "„Oczywiście, że musi pan pomyśleć”: 5 minut liczb",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "Klient po pokazie mówi: „Muszę to przemyśleć.” Liczb jeszcze nie było. Co odpowiesz?",
    wzor: "„Oczywiście, że musi pan przemyśleć. Nie dałem panu jeszcze nic, nad czym da się myśleć, nie było liczb. 5 minut: cena, rata, wycena pana auta, żeby w domu miał pan NAD CZYM myśleć. W porządku?”",
  },
  {
    tresc: "Hipotetycznie: co zdecyduje na końcu?",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "Klient mówi: „Mam jeszcze dwa inne do obejrzenia.” Co odpowiesz? (Hipoteza, wybór z dwóch, przeramowanie, wyjście.)",
    wzor: "„Jasne. Hipotetycznie: obejrzał pan oba, to było ostatnie. Co zdecyduje na końcu: samo [produkt] czy warunki? [Warunki.] Czyli nie „czy”, tylko „gdzie najlepiej”. Jeśli oszczędzę panu czas i pieniądze, obrazi się pan? [Nie.] To 10 minut. I w końcu to pana decyzja.”",
  },
  {
    tresc: "Gdyby cena była ta sama, u kogo?",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "Klient mówi: „Tamci robili to za 800, wy chcecie 1 200.” Co odpowiesz? (Bez rabatu, bez obrony, jedno pytanie.)",
    wzor: "„Rozumiem. Gdyby cena była ta sama, u kogo wolałby pan to zrobić? [U was.] Dlaczego? [opinie, polecenie, termin] Czyli decydujemy o 400 zł różnicy, nie o 1 200. Za te 400 zł ma pan [3 konkrety]. Który wariant bierzemy?”",
  },
  {
    tresc: "„Ma pan rację” + liczba + dopięcie",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "Klient mówi: „W grudniu nikt nie szuka, wystawimy wiosną.” Co odpowiesz? (Zgoda, liczba, przeramowanie, dopięcie.)",
    wzor: "„Ma pani rację, w grudniu oglądających jest mniej. W zeszłym grudniu sprzedaliśmy [liczba]. Ci, którzy oglądają zimą, muszą kupić. I jest mniej ofert, więc może pani być jedyną opcją. Chce pani poważnych kupujących i mniej konkurencji, prawda?”",
  },
  {
    tresc: "„Nie jestem zainteresowany”: ton zaciekawiony",
    kategoria: "obiekcje",
    segment: "b2c",
    pytanie: "Klient mówi: „Nie jestem zainteresowana, już mam.” Co odpowiesz? (Lekka zgoda, ton zaciekawiony, pytanie o sytuację.)",
    wzor: "„Dobrze, zaznaczam w karcie. Pewnie dzwoni do pani cała masa firm, prawda? [Tak.] Jestem trochę skołowany, bo w formularzu napisała pani, że [to, co wpisała]. Coś się zmieniło? [odpowiedź] A po co w ogóle pani wtedy szukała?”",
  },
];

/** Talia wiedzy w danym języku. */
export function wiedzaDla(jezyk: Jezyk | string | null | undefined): KartaWiedzy[] {
  return jezyk === "pl" ? WIEDZA_PL : WIEDZA;
}
