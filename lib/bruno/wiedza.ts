// Stała talia WIEDZY do fiszek (USER_001 2.10): typy klientów DISC (rozpoznawanie
// i jak z nimi rozmawiać) + techniki z bazy wiedzy Sprzedaż (Voss, Rackham, Sandler,
// Belfort, Mazur). Każda karta: krótki tytuł (klucz), pytanie sytuacyjne, wzór.
// Dokładane każdemu kontu przy wejściu w Trening (zapewnijKarty), oceniane jak reszta.

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
