import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";
import type { Feedback, Konfig, Kryterium, Wypowiedz } from "./db";
import { WAGI } from "./kryteria";
import type { Firma } from "./firmy";
import { listaObiekcji } from "./obiekcje";
import type { PostacId } from "./postacie";

// 25.10 (USER_001): przykładowy zespół do DEMO. 5 handlowców, 30 rozmów z ocenami na produkcie firmy,
// żeby panel szefa nie był pusty na spotkaniu: 1 najlepszy, 1 najsłabszy (cena), 1 nie ćwiczy od 5 dni,
// 2 z trendem w górę. Treść rozmów (3 wersje: dobra, średnia, słaba) pisze model RAZ i ląduje w
// bruno_firmy.demo_dane; reset seeda tylko przestawia daty i oceny. Liczby deterministyczne (seed = id firmy),
// więc dwa resety dają ten sam zespół.

export type Jakosc = "dobra" | "srednia" | "slaba";
export type WersjaDemo = { jakosc: Jakosc; wypowiedzi: { rola: "handlowiec" | "klient"; tekst: string }[]; plusy: string[]; minusy: string[]; poprawka: string; wygrana: string };
export type DemoDane = { wersje: WersjaDemo[]; wygenerowano: string };

type Profil = {
  imie: { pl: string; en: string };
  /** 25.10: twarz wygenerowana przez AI (public/bruno/demo, z postaci Bliskiej). Nigdy zdjęcia prawdziwych osób. */
  zdjecie: string;
  typ: "najlepszy" | "najslabszy" | "nie_cwiczy" | "rosnie";
  rozmow: number;
  /** Średnia docelowa. */
  baza: number;
  /** Zmiana od pierwszej do ostatniej rozmowy (trend). */
  trend: number;
  slabe: Kryterium["nazwa"];
  /** Dni od ostatniej rozmowy do dziś. */
  przerwa: number;
};

export const PROFILE_DEMO: Profil[] = [
  // 25.10 (USER_001): każdy handlowiec ze zdjęciem. Twarze AI są tylko kobiece, więc Marek/Tomek/Piotr → Marta/Natalia/Julia.
  { imie: { pl: "Marta", en: "Martha" }, zdjecie: "/bruno/demo/marta.jpg", typ: "najlepszy", rozmow: 8, baza: 8.2, trend: 0.6, slabe: "zamkniecie", przerwa: 0 },
  { imie: { pl: "Kasia", en: "Kate" }, zdjecie: "/bruno/demo/kasia.jpg", typ: "najslabszy", rozmow: 7, baza: 4.8, trend: 0.2, slabe: "obiekcje", przerwa: 1 },
  { imie: { pl: "Natalia", en: "Natalie" }, zdjecie: "/bruno/demo/natalia.jpg", typ: "nie_cwiczy", rozmow: 4, baza: 6.1, trend: -0.4, slabe: "pytania", przerwa: 5 },
  { imie: { pl: "Ola", en: "Olivia" }, zdjecie: "/bruno/demo/ola.jpg", typ: "rosnie", rozmow: 6, baza: 6.5, trend: 2.2, slabe: "otwarcie", przerwa: 0 },
  { imie: { pl: "Julia", en: "Julia" }, zdjecie: "/bruno/demo/julia.jpg", typ: "rosnie", rozmow: 5, baza: 6.4, trend: 1.4, slabe: "pewnosc", przerwa: 1 },
];

export const DOMENA_DEMO = "demo.salesbruno.pl";
export const emailHandlowcaDemo = (imie: string, firmaId: string) => `${imie.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}.${firmaId}@${DOMENA_DEMO}`;

/** Prosty generator liczb z ziarnem (mulberry32): ten sam seed = te same oceny. */
function los(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ziarno = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const ogr = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const zaokr = (v: number) => Math.round(v * 10) / 10;

const KOLEJNOSC: Kryterium["nazwa"][] = ["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"];
const POSTACIE: PostacId[] = ["czerwony", "niebieski", "zielony", "zolty"];
const TRYBY = ["cold", "zywo", "online"] as const;
const CELE = ["spotkanie", "sprzedaz", "decyzja", "prezentacja"] as const;

/** Trzy wersje rozmowy na produkcie firmy: jedna prośba do modelu, wynik zapisany w bruno_firmy.demo_dane. */
export async function wygenerujWersje(firma: Firma, konfig: Pick<Konfig, "produkt" | "klient" | "obiekcje">): Promise<DemoDane> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Brak ANTHROPIC_API_KEY.");
  const pl = firma.jezyk === "pl";
  const obiekcje = listaObiekcji(konfig.obiekcje).slice(0, 5);
  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const odp = await klient.messages.create({
    model: process.env.BRUNO_TRENER_MODEL ?? "claude-sonnet-5",
    max_tokens: 6000,
    system: pl
      ? "Piszesz PRZYKŁADOWE rozmowy sprzedażowe do panelu demo narzędzia treningowego. Handlowiec sprzedaje produkt firmy, klient to osoba z opisu. Trzy wersje tej samej sytuacji: DOBRA (handlowiec pyta, zgadza się przed odpowiedzią na obiekcję, pogłębia pytaniem, zamyka terminem), ŚREDNIA (poprawna, ale bez pytania po obiekcji, zamknięcie miękkie) i SŁABA (monolog, „ale” po obiekcji, rabat od razu, brak prośby o decyzję). Każda 8-10 krótkich wypowiedzi, naturalny mówiony polski, bez nazwisk. Plusy i minusy = krótkie zdania z cytatem z rozmowy. Poprawka = jedno konkretne zdanie, co zrobić inaczej następnym razem."
      : "You write SAMPLE sales calls for the demo dashboard of a training tool. The rep sells the company's product, the customer is the person described. Three versions of the same situation: GOOD (the rep asks questions, agrees before answering an objection, digs deeper with a question, closes with a date), MEDIUM (fine, but no question after the objection, soft close) and WEAK (monologue, “but” after the objection, instant discount, no ask for a decision). Each 8-10 short lines, natural spoken American English, no last names. Pluses and minuses = short sentences with a quote from the call. Fix = one concrete sentence on what to do differently next time.",
    messages: [
      {
        role: "user",
        content: pl
          ? `FIRMA: ${firma.nazwa}\nPRODUKT: ${konfig.produkt}\nKLIENT: ${konfig.klient}\nOBIEKCJE (użyj ich w rozmowach): ${obiekcje.join("; ")}`
          : `COMPANY: ${firma.nazwa}\nPRODUCT: ${konfig.produkt}\nCUSTOMER: ${konfig.klient}\nOBJECTIONS (use them in the calls): ${obiekcje.join("; ")}`,
      },
    ],
    tools: [
      {
        name: "wersje_demo",
        description: "Three sample calls: good, medium, weak.",
        input_schema: {
          type: "object",
          properties: {
            wersje: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  jakosc: { type: "string", enum: ["dobra", "srednia", "slaba"] },
                  wypowiedzi: { type: "array", items: { type: "object", properties: { rola: { type: "string", enum: ["handlowiec", "klient"] }, tekst: { type: "string" } }, required: ["rola", "tekst"] } },
                  plusy: { type: "array", items: { type: "string" }, description: "3 items" },
                  minusy: { type: "array", items: { type: "string" }, description: "2 items" },
                  poprawka: { type: "string" },
                  wygrana: { type: "string", description: "One sentence: the best moment of the call." },
                },
                required: ["jakosc", "wypowiedzi", "plusy", "minusy", "poprawka", "wygrana"],
              },
            },
          },
          required: ["wersje"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "wersje_demo" },
  });
  const blok = odp.content.find((c) => c.type === "tool_use");
  if (!blok || blok.type !== "tool_use") throw new Error("Model nie zwrócił wersji.");
  const wersje = ((blok.input as { wersje?: WersjaDemo[] }).wersje ?? []).filter((w) => w && Array.isArray(w.wypowiedzi) && w.wypowiedzi.length >= 4);
  if (!["dobra", "srednia", "slaba"].every((j) => wersje.some((w) => w.jakosc === j))) throw new Error("Brak któregoś z 3 poziomów jakości.");
  return { wersje, wygenerowano: new Date().toISOString() };
}

/**
 * Wersje domyślne (bez modelu: brak klucza albo błąd). Ogólne B2B, ta sama struktura: dobra / średnia / słaba.
 * `zrodlo: "domyslne"` = przy następnym uruchomieniu z kluczem model pisze je od nowa pod produkt firmy.
 */
export const WERSJE_DOMYSLNE: Record<"pl" | "en", DemoDane & { zrodlo: "domyslne" }> = {
  pl: {
    zrodlo: "domyslne",
    wygenerowano: "2026-10-25",
    wersje: [
      {
        jakosc: "dobra",
        wypowiedzi: [
          { rola: "handlowiec", tekst: "Dzień dobry, Marek z naszej firmy. Dzwonię, bo pracujemy z firmami takimi jak państwa. Mam 3 minuty, żeby sprawdzić, czy to ma sens. Pasuje?" },
          { rola: "klient", tekst: "Trzy minuty może. O co chodzi?" },
          { rola: "handlowiec", tekst: "Jak dziś wygląda u państwa ten temat? Kto się tym zajmuje i ile to zabiera czasu w miesiącu?" },
          { rola: "klient", tekst: "Robi to jedna osoba, pewnie z 20 godzin miesięcznie. Ale szczerze, to za drogo dla nas." },
          { rola: "handlowiec", tekst: "Rozumiem. Za drogo w porównaniu do czego: do tego, co płacicie dziś, czy do budżetu, który macie w głowie?" },
          { rola: "klient", tekst: "Do budżetu. Nie planowaliśmy tego w tym kwartale." },
          { rola: "handlowiec", tekst: "Czyli jeśli te 20 godzin miesięcznie kosztuje was około 2 000 zł, a my schodzimy do 5, to różnica pokrywa koszt w pierwszym miesiącu. Czy oprócz ceny jest coś, co by was zatrzymało?" },
          { rola: "klient", tekst: "Nie, w sumie tylko cena." },
          { rola: "handlowiec", tekst: "To proponuję wtorek o 10:00, 20 minut, pokażę to na waszych danych i policzymy razem. Pasuje wtorek?" },
          { rola: "klient", tekst: "Wtorek 10:00 może być." },
        ],
        plusy: ["Kontrakt czasu na starcie: „mam 3 minuty, pasuje?”.", "Zgoda przed odpowiedzią na obiekcję: „Rozumiem. Za drogo w porównaniu do czego?”.", "Zamknięcie terminem z godziną: „wtorek o 10:00”."],
        minusy: ["Jedno pytanie o sytuację, zero o skutki problemu.", "Liczba 2 000 zł założona, nie potwierdzona przez klienta."],
        poprawka: "Po „20 godzin miesięcznie” zapytaj: „co to dla was oznacza w pieniądzach?”, zanim sam podasz liczbę.",
        wygrana: "Pytanie „za drogo w porównaniu do czego?” odkryło prawdziwy powód: budżet kwartału, nie cena.",
      },
      {
        jakosc: "srednia",
        wypowiedzi: [
          { rola: "handlowiec", tekst: "Dzień dobry, dzwonię z naszej firmy. Chciałem opowiedzieć o naszym rozwiązaniu dla firm z państwa branży." },
          { rola: "klient", tekst: "Słucham, ale mam mało czasu." },
          { rola: "handlowiec", tekst: "Jasne. Jak u państwa wygląda ten temat dzisiaj?" },
          { rola: "klient", tekst: "Mamy już dostawcę, działa, nie szukamy." },
          { rola: "handlowiec", tekst: "Rozumiem, większość naszych klientów też miała dostawcę. My robimy to szybciej i z gwarancją wyniku." },
          { rola: "klient", tekst: "Każdy tak mówi. Ile to kosztuje?" },
          { rola: "handlowiec", tekst: "Od 1 500 zł miesięcznie, zależy od zakresu. Mogę przesłać ofertę na maila?" },
          { rola: "klient", tekst: "Dobrze, proszę przesłać, zobaczę." },
          { rola: "handlowiec", tekst: "Wyślę dziś. Odezwę się za tydzień, dobrze?" },
          { rola: "klient", tekst: "Dobrze." },
        ],
        plusy: ["Zgoda na start odpowiedzi: „Rozumiem, większość naszych klientów też miała dostawcę”.", "Jedno pytanie otwarte o sytuację.", "Spokojny ton, bez przepraszania."],
        minusy: ["Po „mamy dostawcę” brak pytania: co działa, a co nie.", "„Prześlę ofertę” bez daty i godziny następnej rozmowy."],
        poprawka: "Zamiast „odezwę się za tydzień” powiedz: „czwartek 11:00, 15 minut na ofertę, pasuje?”.",
        wygrana: "Nie wszedł w spór z „każdy tak mówi”, utrzymał rozmowę do ceny.",
      },
      {
        jakosc: "slaba",
        wypowiedzi: [
          { rola: "handlowiec", tekst: "Dzień dobry, przepraszam, że przeszkadzam, nie zajmę dużo czasu. Dzwonię z naszej firmy, mamy super rozwiązanie, które na pewno się państwu spodoba." },
          { rola: "klient", tekst: "O co konkretnie chodzi?" },
          { rola: "handlowiec", tekst: "To kompleksowe, innowacyjne narzędzie, jesteśmy liderem na rynku, obsługujemy setki firm, mamy najwyższą jakość i najlepsze ceny, poza tym…" },
          { rola: "klient", tekst: "Dobrze, dobrze. Ile to kosztuje?" },
          { rola: "handlowiec", tekst: "Standardowo 1 500 zł, ale dla państwa mogę zrobić 1 200." },
          { rola: "klient", tekst: "To i tak za drogo." },
          { rola: "handlowiec", tekst: "Ale proszę zobaczyć, ile państwo zyskają, to naprawdę się opłaca, inni klienci są bardzo zadowoleni." },
          { rola: "klient", tekst: "Muszę to przemyśleć." },
          { rola: "handlowiec", tekst: "Oczywiście, rozumiem. To proszę dać znać, jak państwo coś zdecydują." },
          { rola: "klient", tekst: "Dobrze, do widzenia." },
        ],
        plusy: ["Podał cenę, gdy klient zapytał.", "Grzeczny ton do końca.", "Nie przerwał klientowi."],
        minusy: ["Start od „przepraszam, że przeszkadzam” i monolog o firmie zamiast pytania.", "Rabat 300 zł zanim padła obiekcja; po „za drogo” kontra z „ale”; „muszę przemyśleć” bez pytania."],
        poprawka: "Po „za drogo” zacznij od zgody i pytania: „Rozumiem. Za drogo w porównaniu do czego?”, bez „ale” i bez rabatu.",
        wygrana: "Cena podana wprost, bez „tylko” i „jedynie”.",
      },
    ],
  },
  en: {
    zrodlo: "domyslne",
    wygenerowano: "2026-10-25",
    wersje: [
      {
        jakosc: "dobra",
        wypowiedzi: [
          { rola: "handlowiec", tekst: "Hi, this is Mike. We work with companies like yours. I've got 3 minutes to see if this makes sense for you. Fair?" },
          { rola: "klient", tekst: "Three minutes, sure. What is it?" },
          { rola: "handlowiec", tekst: "How does this look at your company today? Who handles it, and how many hours a month does it take?" },
          { rola: "klient", tekst: "One person, maybe 20 hours a month. Honestly though, it's too expensive for us." },
          { rola: "handlowiec", tekst: "Makes sense. Too expensive compared to what: what you pay today, or the budget you had in mind?" },
          { rola: "klient", tekst: "The budget. We didn't plan it this quarter." },
          { rola: "handlowiec", tekst: "So if those 20 hours cost you about $1,000 a month and we bring it to 5, the difference covers the fee in month one. Besides price, is there anything else that would stop you?" },
          { rola: "klient", tekst: "No, just the price really." },
          { rola: "handlowiec", tekst: "Then let's do Tuesday at 10, 20 minutes, I'll show it on your data and we'll run the numbers together. Does Tuesday work?" },
          { rola: "klient", tekst: "Tuesday at 10 works." },
        ],
        plusy: ["Time contract up front: “3 minutes, fair?”.", "Agreement before answering the objection: “Makes sense. Compared to what?”.", "Closed with a date and time: “Tuesday at 10”."],
        minusy: ["One situation question, none about the cost of the problem.", "The $1,000 figure was assumed, not confirmed by the customer."],
        poprawka: "After “20 hours a month”, ask “what does that cost you in dollars?” before you name a number yourself.",
        wygrana: "“Compared to what?” uncovered the real reason: this quarter's budget, not the price.",
      },
      {
        jakosc: "srednia",
        wypowiedzi: [
          { rola: "handlowiec", tekst: "Hi, I'm calling from our company. I wanted to tell you about our solution for companies in your industry." },
          { rola: "klient", tekst: "Go ahead, but I'm short on time." },
          { rola: "handlowiec", tekst: "Sure. How does this look at your company today?" },
          { rola: "klient", tekst: "We already have a vendor. It works, we're not looking." },
          { rola: "handlowiec", tekst: "Makes sense, most of our clients had a vendor too. We do it faster and with a guaranteed result." },
          { rola: "klient", tekst: "Everybody says that. How much is it?" },
          { rola: "handlowiec", tekst: "From $800 a month depending on scope. Can I send you a proposal by email?" },
          { rola: "klient", tekst: "Fine, send it over, I'll take a look." },
          { rola: "handlowiec", tekst: "I'll send it today and follow up next week, okay?" },
          { rola: "klient", tekst: "Okay." },
        ],
        plusy: ["Agreement first: “Makes sense, most of our clients had a vendor too”.", "One open question about the situation.", "Calm tone, no apologizing."],
        minusy: ["After “we have a vendor”, no question about what works and what doesn't.", "“I'll send a proposal” with no date and time for the next call."],
        poprawka: "Instead of “follow up next week”, say “Thursday at 11, 15 minutes on the proposal, does that work?”.",
        wygrana: "Didn't argue with “everybody says that”, kept the call going to price.",
      },
      {
        jakosc: "slaba",
        wypowiedzi: [
          { rola: "handlowiec", tekst: "Hi, sorry to bother you, I won't take much of your time. I'm calling from our company, we have a great solution you're definitely going to love." },
          { rola: "klient", tekst: "What is it exactly?" },
          { rola: "handlowiec", tekst: "It's a comprehensive, innovative tool, we're the market leader, we serve hundreds of companies, top quality and the best prices, and also…" },
          { rola: "klient", tekst: "Okay, okay. How much?" },
          { rola: "handlowiec", tekst: "Normally $800, but for you I can do $650." },
          { rola: "klient", tekst: "That's still too expensive." },
          { rola: "handlowiec", tekst: "But look at how much you'd gain, it really pays off, our other clients are very happy." },
          { rola: "klient", tekst: "I need to think about it." },
          { rola: "handlowiec", tekst: "Of course, I understand. Just let me know once you decide." },
          { rola: "klient", tekst: "Okay, bye." },
        ],
        plusy: ["Gave the price when asked.", "Polite to the end.", "Didn't interrupt the customer."],
        minusy: ["Opened with “sorry to bother you” and a monologue about the company instead of a question.", "A $150 discount before any objection; “but” after “too expensive”; “I need to think about it” left without a question."],
        poprawka: "After “too expensive”, start with agreement and a question: “Makes sense. Compared to what?”, no “but” and no discount.",
        wygrana: "Price stated plainly, without “only” or “just”.",
      },
    ],
  },
};

function wersjaDla(dane: DemoDane, ocena: number): WersjaDemo {
  const j: Jakosc = ocena >= 7.5 ? "dobra" : ocena >= 5.5 ? "srednia" : "slaba";
  return dane.wersje.find((w) => w.jakosc === j) ?? dane.wersje[0];
}

type WierszRozmowy = {
  email: string;
  postac: PostacId;
  start: string;
  koniec: string;
  sekundy: number;
  transkrypcja: Wypowiedz[];
  feedback: Feedback;
  ocena: number;
  status: "zakonczona";
  tryb: string;
  cel: string;
  obiekcja: string;
  poziom: string;
  dostawca: string;
};

/**
 * Rozmowy jednego handlowca z profilu. Ostatnie 14 dni: `profil.rozmow` rozmów wokół bazy z trendem.
 * 25.10 (USER_001: „średnia zespołu na 3 miesiące”): do tego HISTORIA dni 15-90, ok. 2 rozmowy tygodniowo,
 * ocena rośnie od bazy - 1,8 do początku okna ostatnich 14 dni (zespół robi postęp z Bruno).
 */
export function rozmowyZProfilu(profil: Profil, email: string, dane: DemoDane, obiekcje: string[], seed: string): WierszRozmowy[] {
  const r = los(ziarno(`${seed}:${email}`));
  const n = profil.rozmow;
  const okno = Math.max(1, 14 - profil.przerwa);
  const plan: { dniTemu: number; cel: number }[] = [];
  const startOkna = profil.baza - profil.trend / 2;
  for (let d = 90; d > 15; d -= 3 + r() * 1.5) {
    const postep = (90 - d) / 75;
    plan.push({ dniTemu: d, cel: profil.baza - 1.8 + (startOkna - (profil.baza - 1.8)) * postep + (r() - 0.5) * 1.0 });
  }
  for (let i = 0; i < n; i++) {
    // i = 0 najstarsza, i = n-1 najnowsza (przerwa dni temu).
    plan.push({
      dniTemu: profil.przerwa + (okno * (n - 1 - i)) / Math.max(1, n - 1) + (i === n - 1 ? 0 : r() * 0.6),
      cel: profil.baza + profil.trend * ((n === 1 ? 0.5 : i / (n - 1)) - 0.5) + (r() - 0.5) * 0.8,
    });
  }
  const wynik: WierszRozmowy[] = [];
  for (let i = 0; i < plan.length; i++) {
    const { dniTemu, cel } = plan[i];
    const start = new Date(Date.now() - dniTemu * 86_400_000);
    start.setHours(9 + Math.floor(r() * 7), Math.floor(r() * 60), 0, 0);
    // Dzisiejsza rozmowa nie może być „z przyszłości” (godzina 9-15 vs pora uruchomienia seeda).
    if (start.getTime() > Date.now() - 3_600_000) start.setTime(Date.now() - (1 + r() * 2) * 3_600_000);
    // Kryteria całkowite wokół celu; najsłabsze niżej. Ocena = średnia ważona z kryteriów (jak u trenera).
    const kryteria = KOLEJNOSC.map((nazwa) => {
      const przes = nazwa === profil.slabe ? -1.8 : (r() - 0.5) * 1.6;
      return { nazwa, ocena: Math.round(ogr(cel + przes, 1, 10)), cytat: "", czas: "", komentarz: "" };
    });
    const ocena = zaokr(ogr(kryteria.reduce((s, k) => s + k.ocena * WAGI[k.nazwa], 0), 1, 10));
    const w = wersjaDla(dane, ocena);
    const sekundy = 140 + Math.floor(r() * 70);
    const krok = sekundy / (w.wypowiedzi.length + 1);
    const obiekcja = obiekcje.length ? obiekcje[(i + ziarno(email)) % obiekcje.length] : "";
    const najslabsze = [...kryteria].sort((a, b) => a.ocena - b.ocena)[0].nazwa;
    const feedback: Feedback = {
      ocena,
      kryteria,
      liczba_z_audio: "",
      wygrana: w.wygrana,
      poprawka: w.poprawka,
      najslabsze,
      plusy: w.plusy,
      minusy: w.minusy,
      obiekcje_ocena: obiekcja ? [{ obiekcja, ocena: kryteria.find((k) => k.nazwa === "obiekcje")?.ocena ?? 5 }] : [],
    };
    wynik.push({
      email,
      postac: POSTACIE[(i + ziarno(seed)) % POSTACIE.length],
      start: start.toISOString(),
      koniec: new Date(start.getTime() + sekundy * 1000).toISOString(),
      sekundy,
      transkrypcja: w.wypowiedzi.map((x, k) => ({ rola: x.rola, tekst: x.tekst, t: Math.round(krok * (k + 1)) })),
      feedback,
      ocena: Math.round(ocena),
      status: "zakonczona",
      tryb: TRYBY[i % TRYBY.length],
      cel: CELE[i % CELE.length],
      obiekcja,
      poziom: "sredni",
      dostawca: "demo",
    });
  }
  return wynik;
}

export type WynikSeeda = { handlowcy: { email: string; imie: string; typ: Profil["typ"]; rozmow: number }[]; rozmow: number };

/**
 * Zakłada (albo odświeża) 5 handlowców demo firmy i ich rozmowy. Konta bez kodu (nie logują się),
 * plan „pelny”, ta sama konfiguracja Bruno co szef. Stare rozmowy demo tych kont kasuje i wstawia na nowo.
 */
export async function zasiejZespol(firma: Firma, konfig: Konfig, dane: DemoDane): Promise<WynikSeeda> {
  const jezyk = firma.jezyk === "pl" ? "pl" : "en";
  const obiekcje = listaObiekcji(konfig.obiekcje).slice(0, 6);
  const wynik: WynikSeeda = { handlowcy: [], rozmow: 0 };
  // Handlowcy demo spoza aktualnej listy (np. stare imiona) = wyłączeni, nie kasowani.
  const aktualni = PROFILE_DEMO.map((p) => emailHandlowcaDemo(p.imie[jezyk], firma.id));
  await supabaseAdmin.from("bruno_konta").update({ aktywne: false }).eq("firma_id", firma.id).eq("rola", "rep").eq("demo", true).not("email", "in", `(${aktualni.map((e) => `"${e}"`).join(",")})`);
  for (const p of PROFILE_DEMO) {
    const imie = p.imie[jezyk];
    const email = emailHandlowcaDemo(imie, firma.id);
    const { error } = await supabaseAdmin.from("bruno_konta").upsert(
      {
        email,
        imie,
        zdjecie_url: p.zdjecie,
        firma: firma.nazwa,
        firma_id: firma.id,
        rola: "rep",
        demo: true,
        plan: "pelny",
        jezyk,
        dni: 365,
        limit_sekund: 36_000,
        rozmow_dziennie: 3,
        fiszek_dziennie: 5,
        aktywne: true,
        kod_hash: null,
        nieudane: 0,
        blokada_do: null,
        profil_at: new Date().toISOString(),
        start_dostepu: new Date(Date.now() - 14 * 86_400_000).toISOString(),
      },
      { onConflict: "email" },
    );
    if (error) throw new Error(`konto ${email}: ${error.message}`);
    const { error: e2 } = await supabaseAdmin.from("bruno_konfig").upsert({ ...konfig, email, zaktualizowano: new Date().toISOString() }, { onConflict: "email" });
    if (e2) throw new Error(`konfig ${email}: ${e2.message}`);
    await supabaseAdmin.from("bruno_rozmowy").delete().eq("email", email);
    const rozmowy = rozmowyZProfilu(p, email, dane, obiekcje, firma.id);
    const { error: e3 } = await supabaseAdmin.from("bruno_rozmowy").insert(rozmowy);
    if (e3) throw new Error(`rozmowy ${email}: ${e3.message}`);
    wynik.handlowcy.push({ email, imie, typ: p.typ, rozmow: rozmowy.length });
    wynik.rozmow += rozmowy.length;
  }
  return wynik;
}
