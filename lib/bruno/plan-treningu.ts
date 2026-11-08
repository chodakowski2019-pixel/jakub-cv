import { supabaseAdmin } from "@/lib/supabase";
import type { Feedback, Konto } from "./db";
import type { Firma } from "./firmy";
import { analizaZDeali, dealeBezRuchu, lejekFirmy, type Deal, type Lejek } from "./lejek";
import { notatkiKlienta, zadaniaFirmyCrm } from "./crm";
import type { TrybId } from "./postacie";

// 8.11 (USER_001): ALGORYTM TRENINGU. Bruno sam decyduje (szef nie narzuca), 5 treningów dziennie, Bruno gra KONKRETNEGO
// klienta z CRM. Priorytet (odpowiedzi USER_001 8.11):
//   1. NAJBLIŻSZE SPOTKANIE z prawdziwym klientem (telefon / spotkanie dziś albo jutro w CRM) = zawsze pierwsze.
//   2. ETAP, na którym handlowiec przegrywa najwięcej deali (klient otwarty na tym etapie, największa wartość).
//   3. OBIEKCJE KLIENTÓW (z notatek w CRM i z ocenionych nagrań prawdziwych rozmów).
//   4. NISKA OCENA ostatniej rozmowy (< 6): powtórka z tym samym klientem, nacisk na najsłabsze kryterium.
//   5. DEAL STOI ponad 7 dni bez kontaktu: rozmowa wznawiająca.
// Uzupełnienie do 5: najsłabsze nieopanowane kryterium (ogólny klient z doboru dobor.ts).
// OPANOWANE kryterium = 3 ostatnie oceny tego kryterium (trening + prawdziwe nagrania) ≥ 7 → nie jest już naciskiem.
// Najsłabsze kryterium: średnia z 20 ostatnich treningów + nagrania prawdziwych rozmów liczone podwójnie.
// Plan powstaje raz dziennie (tabela bruno_plan_treningu) i rano idzie mailem; zrobione = rozmowa z plan_pozycja.

export const TRENINGOW_DZIENNIE = 5;
const MAX_NA_KLIENTA = 2;

export type Kryt = Feedback["kryteria"][number]["nazwa"];
export type PowodTreningu = "spotkanie" | "etap" | "obiekcja" | "ocena" | "stoi" | "kryterium";
export type PozycjaPlanu = {
  nr: number;
  powod: PowodTreningu;
  /** Krótko do listy: „Jutro 10:00 · Piotr Zieliński (Lorean)” (bez dwukropka: lista w czacie tnie po „:”). */
  tytul: string;
  /** Dlaczego Bruno to wybrał, 1 zdanie. */
  dlaczego: string;
  klient_id: number | null;
  klient: string | null;
  tryb: TrybId;
  obiekcja: string | null;
  fokus: Kryt | null;
  /** Opis dla Bruno: kogo gra i w jakim momencie (idzie do promptu rozmowy). */
  sytuacja: string;
};
export type Plan = { dzien: string; pozycje: (PozycjaPlanu & { zrobione: boolean; ocena: number | null })[]; zrobione: number; opanowane: Kryt[] };

const NAZWY_PL: Record<Kryt, string> = { otwarcie: "otwarcie", pytania: "pytania", obiekcje: "obiekcje", zamkniecie: "zamknięcie", pewnosc: "pewność siebie" };
const NAZWY_EN: Record<Kryt, string> = { otwarcie: "opening", pytania: "questions", obiekcje: "objections", zamkniecie: "closing", pewnosc: "confidence" };
const KRYTERIA: Kryt[] = ["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"];

/** Obiekcje rozpoznawane w notatkach (jak dobor-treningu.ts). */
const WZORCE: [RegExp, string, string][] = [
  [/za drog|drogo|cena|budżet|budzet|taniej|rabat/i, "za drogo, nie mamy budżetu", "too expensive, no budget"],
  [/konkurenc|inna ofert|porówn|porown/i, "mamy tańszą ofertę od konkurencji", "we have a cheaper offer from a competitor"],
  [/później|pozniej|przesun|za miesiąc|na razie nie|odłóż|odloz/i, "wróćmy do tego później", "let's come back to this later"],
  [/zastanow|przemyśl|przemysl|skonsultow|szef|zarząd|zarzad|wspólnik|wspolnik/i, "muszę to skonsultować", "I need to check with my team"],
  [/nie widz|po co|nie potrzeb|mamy już|mamy juz/i, "nie widzę, po co nam to", "I don't see why we need this"],
];

export const dzisWarszawa = (przesun = 0) => new Date(Date.now() + przesun * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

type Ocena = { kryteria: Partial<Record<Kryt, number>>; waga: number };

async function ocenyHandlowca(email: string): Promise<{ treningi: { id: string; ocena: number | null; klient_id: number | null; feedback: Feedback | null }[]; oceny: Ocena[]; obiekcjeNagran: { obiekcja: string; klient_id: number | null }[] }> {
  const [r, n] = await Promise.all([
    supabaseAdmin.from("bruno_rozmowy").select("id, ocena, klient_id, feedback, start").eq("email", email).eq("status", "zakonczona").order("start", { ascending: false }).limit(20),
    supabaseAdmin.from("bruno_oceny_nagran").select("kryteria, obiekcje, klient_id, utworzono").eq("email", email).order("utworzono", { ascending: false }).limit(10),
  ]);
  const treningi = ((r.data ?? []) as { id: string; ocena: number | null; klient_id: number | null; feedback: Feedback | null }[]);
  const oceny: Ocena[] = [];
  // Kolejność od najnowszej: nagrania i treningi przemieszane po dacie.
  const wszystko = [
    ...((r.data ?? []) as { feedback: Feedback | null; start: string }[]).map((x) => ({ kiedy: x.start, k: Object.fromEntries((x.feedback?.kryteria ?? []).map((k) => [k.nazwa, k.ocena])) as Partial<Record<Kryt, number>>, waga: 1 })),
    ...((n.data ?? []) as { kryteria: Partial<Record<Kryt, number>>; utworzono: string }[]).map((x) => ({ kiedy: x.utworzono, k: x.kryteria ?? {}, waga: 2 })),
  ].sort((a, b) => b.kiedy.localeCompare(a.kiedy));
  for (const w of wszystko) if (Object.keys(w.k).length) oceny.push({ kryteria: w.k, waga: w.waga });
  const obiekcjeNagran = ((n.data ?? []) as { obiekcje: string[] | null; klient_id: number | null }[]).flatMap((x) => (x.obiekcje ?? []).map((o) => ({ obiekcja: o, klient_id: x.klient_id })));
  return { treningi, oceny, obiekcjeNagran };
}

/** Opanowane = 3 ostatnie oceny kryterium ≥ 7. Najsłabsze = najniższa średnia ważona spośród nieopanowanych. */
export function kryteriaHandlowca(oceny: Ocena[]): { opanowane: Kryt[]; najslabsze: Kryt | null; srednie: Partial<Record<Kryt, number>>; kolejnosc: Kryt[] } {
  const opanowane: Kryt[] = [];
  const srednie: Partial<Record<Kryt, number>> = {};
  for (const k of KRYTERIA) {
    const lista = oceny.filter((o) => typeof o.kryteria[k] === "number");
    if (lista.length >= 3 && lista.slice(0, 3).every((o) => (o.kryteria[k] as number) >= 7)) opanowane.push(k);
    const suma = lista.reduce((s, o) => s + (o.kryteria[k] as number) * o.waga, 0);
    const wagi = lista.reduce((s, o) => s + o.waga, 0);
    if (wagi) srednie[k] = suma / wagi;
  }
  const kandydaci = KRYTERIA.filter((k) => !opanowane.includes(k));
  // Od najsłabszego (brak ocen = najsłabsze); opanowane na końcu.
  const kolejnosc = [...kandydaci.sort((a, b) => (srednie[a] ?? -1) - (srednie[b] ?? -1)), ...opanowane];
  const najslabsze = kandydaci.length ? kolejnosc[0] : null;
  return { opanowane, najslabsze, srednie, kolejnosc };
}

function opisKlienta(d: Deal, lejek: Lejek, notatki: string[], pl: boolean): string {
  const etap = lejek.etapy.find((e) => e.id === d.etap_id)?.nazwa ?? "?";
  return [
    pl
      ? `Zagraj klienta: ${d.osoba ?? "osoba decyzyjna"}${d.organizacja ? ` z firmy ${d.organizacja}` : ""}. Wartość rozmowy ${Math.round(d.wartosc)} ${d.waluta}, etap: ${etap}.`
      : `Play the customer: ${d.osoba ?? "decision maker"}${d.organizacja ? ` from ${d.organizacja}` : ""}. Deal value ${Math.round(d.wartosc)} ${d.waluta}, stage: ${etap}.`,
    notatki.length ? (pl ? `Co wiemy z CRM: ${notatki.join(" | ").slice(0, 900)}.` : `What the CRM says: ${notatki.join(" | ").slice(0, 900)}.`) : "",
  ].filter(Boolean).join(" ");
}

/** Układa plan (bez zapisu). Kolejność i limity jak w nagłówku pliku. */
export async function ulozPlan(konto: Pick<Konto, "email" | "jezyk" | "rola" | "firma_id">, firma: Pick<Firma, "id" | "pipedrive_token"> | null, szef: boolean): Promise<{ pozycje: PozycjaPlanu[]; opanowane: Kryt[] }> {
  const pl = konto.jezyk !== "en";
  const ja = konto.email.toLowerCase();
  const nazwa = (k: Kryt | null) => (k ? (pl ? NAZWY_PL : NAZWY_EN)[k] : "");
  const [{ treningi, oceny, obiekcjeNagran }, lejek, zadania] = await Promise.all([
    ocenyHandlowca(konto.email),
    firma ? lejekFirmy(firma) : Promise.resolve(null),
    firma ? zadaniaFirmyCrm(firma.id, { do: dzisWarszawa(1) }) : Promise.resolve([]),
  ]);
  const { opanowane, najslabsze, kolejnosc } = kryteriaHandlowca(oceny);
  const fokus = najslabsze;
  const nacisk = fokus ? (pl ? ` Naciskaj tam, gdzie handlowiec jest najsłabszy: ${nazwa(fokus)}.` : ` Push where the rep is weakest: ${nazwa(fokus)}.`) : "";
  const koniec = pl ? " Zachowuj się jak ta konkretna osoba w tym momencie procesu." : " Behave like this exact person at this point of the process.";

  let moje: Deal[] = [];
  if (lejek) {
    moje = lejek.deale.filter((d) => d.handlowiec === ja);
    if (!moje.length && szef) moje = lejek.deale;
  }
  const otwarte = moje.filter((d) => d.status === "open");
  const pozycje: PozycjaPlanu[] = [];
  const ileKlienta = new Map<number, number>();
  const notatkiCache = new Map<number, string[]>();
  const notatki = async (id: number) => {
    if (!notatkiCache.has(id)) notatkiCache.set(id, firma ? (await notatkiKlienta(firma.id, id, 5).catch(() => [])).map((n) => n.tresc) : []);
    return notatkiCache.get(id)!;
  };
  const wolny = (id: number | null) => !id || (ileKlienta.get(id) ?? 0) < MAX_NA_KLIENTA;
  const dodaj = (p: Omit<PozycjaPlanu, "nr">) => {
    if (pozycje.length >= TRENINGOW_DZIENNIE || !wolny(p.klient_id)) return false;
    pozycje.push({ ...p, nr: pozycje.length + 1 });
    if (p.klient_id) ileKlienta.set(p.klient_id, (ileKlienta.get(p.klient_id) ?? 0) + 1);
    return true;
  };
  const etykieta = (d: Deal) => `${d.osoba ?? d.tytul}${d.organizacja && d.organizacja !== d.osoba ? ` (${d.organizacja})` : ""}`;

  // 1. Najbliższe spotkania / telefony (dziś i jutro), max 3.
  const dzis = dzisWarszawa();
  const spotkania = zadania
    .filter((z) => z.deal_id && (z.typ === "meeting" || z.typ === "call") && z.data >= dzis && otwarte.some((d) => d.id === z.deal_id))
    .sort((a, b) => (a.data + (a.godzina ?? "")).localeCompare(b.data + (b.godzina ?? "")))
    .slice(0, 3);
  for (const z of spotkania) {
    const d = otwarte.find((x) => x.id === z.deal_id)!;
    const kiedy = `${z.data === dzis ? (pl ? "Dziś" : "Today") : pl ? "Jutro" : "Tomorrow"}${z.godzina ? ` ${z.godzina.slice(0, 5)}` : ""}`;
    const n = await notatki(d.id);
    const obiekcja = WZORCE.find(([r]) => n.some((t) => r.test(t)));
    dodaj({
      powod: "spotkanie",
      tytul: `${kiedy} · ${etykieta(d)}`,
      dlaczego: pl ? `${kiedy} masz ${z.typ === "meeting" ? "spotkanie" : "telefon"} z tym klientem („${z.temat}”). Przećwicz tę rozmowę wcześniej.` : `${kiedy} you have a ${z.typ === "meeting" ? "meeting" : "call"} with this client (“${z.temat}”). Practice it first.`,
      klient_id: d.id,
      klient: etykieta(d),
      tryb: z.typ === "meeting" ? "zywo" : "cold",
      obiekcja: obiekcja ? (pl ? obiekcja[1] : obiekcja[2]) : null,
      fokus,
      sytuacja: `${opisKlienta(d, lejek!, n, pl)} ${pl ? `To jest rozmowa, którą handlowiec ma ${kiedy.toLowerCase()}: „${z.temat}”.` : `This is the real call the rep has ${kiedy.toLowerCase()}: “${z.temat}”.`}${obiekcja ? (pl ? ` Podnieś obiekcję: „${obiekcja[1]}”.` : ` Raise the objection: “${obiekcja[2]}”.`) : ""}${nacisk}${koniec}`,
    });
  }

  // Kandydaci 2-5 (po jednym z każdego rodzaju na rundę, aż plan ma 5 pozycji).
  const etapKand: Omit<PozycjaPlanu, "nr">[] = [];
  const obiekcjaKand: Omit<PozycjaPlanu, "nr">[] = [];
  const ocenaKand: Omit<PozycjaPlanu, "nr">[] = [];
  const stoiKand: Omit<PozycjaPlanu, "nr">[] = [];

  if (lejek) {
    const a = analizaZDeali(ja, lejek.etapy, szef && !lejek.deale.some((d) => d.handlowiec === ja) ? lejek.deale.map((d) => ({ ...d, handlowiec: ja })) : moje);
    if (a.najslabszy) {
      const naEtapie = otwarte.filter((d) => d.etap_id === a.najslabszy!.id).sort((x, y) => y.wartosc - x.wartosc);
      for (const d of naEtapie.slice(0, 2)) {
        const n = await notatki(d.id);
        etapKand.push({
          powod: "etap",
          tytul: `${a.najslabszy.nazwa} · ${etykieta(d)}`,
          dlaczego: pl ? `Na etapie „${a.najslabszy.nazwa}” tracisz najwięcej klientów. Ten klient właśnie tam jest.` : `You lose the most deals at “${a.najslabszy.nazwa}”. This client is there now.`,
          klient_id: d.id,
          klient: etykieta(d),
          tryb: "online",
          obiekcja: null,
          fokus,
          sytuacja: `${opisKlienta(d, lejek, n, pl)} ${pl ? `Na tym etapie handlowiec najczęściej traci klientów: bądź wymagający.` : `This is where the rep loses most deals: be demanding.`}${nacisk}${koniec}`,
        });
      }
    }
    // 3. Obiekcje z notatek CRM.
    for (const d of otwarte.sort((x, y) => y.wartosc - x.wartosc).slice(0, 15)) {
      const n = await notatki(d.id);
      const w = WZORCE.find(([r]) => n.some((t) => r.test(t)));
      if (!w) continue;
      const ob = pl ? w[1] : w[2];
      obiekcjaKand.push({
        powod: "obiekcja",
        tytul: `„${ob}” · ${etykieta(d)}`,
        dlaczego: pl ? `Ten klient zgłosił w CRM obiekcję „${ob}”.` : `This client raised “${ob}” in the CRM.`,
        klient_id: d.id,
        klient: etykieta(d),
        tryb: "zywo",
        obiekcja: ob,
        fokus: "obiekcje",
        sytuacja: `${opisKlienta(d, lejek, n, pl)} ${pl ? `Podnieś obiekcję: „${ob}” i nie odpuszczaj po pierwszej odpowiedzi.` : `Raise the objection “${ob}” and don't drop it after the first answer.`}${koniec}`,
      });
    }
    // 5. Deale bez kontaktu > 7 dni.
    for (const d of dealeBezRuchu(otwarte, 7).slice(0, 3)) {
      const dni = Math.floor((Date.now() - new Date(d.ostatni_kontakt ?? d.aktualizacja ?? Date.now()).getTime()) / 86_400_000);
      const n = await notatki(d.id);
      stoiKand.push({
        powod: "stoi",
        tytul: `${pl ? `${dni} dni ciszy` : `${dni} days silent`} · ${etykieta(d)}`,
        dlaczego: pl ? `Nie było kontaktu od ${dni} dni. Przećwicz telefon, który odświeży rozmowę.` : `No contact for ${dni} days. Practice the call that restarts it.`,
        klient_id: d.id,
        klient: etykieta(d),
        tryb: "cold",
        obiekcja: null,
        fokus,
        sytuacja: `${opisKlienta(d, lejek, n, pl)} ${pl ? `Handlowiec nie odzywał się ${dni} dni i dzwoni ponownie. Jesteś chłodniejszy niż ostatnio, zajęty.` : `The rep hasn't called for ${dni} days and calls again. You're cooler than last time and busy.`}${nacisk}${koniec}`,
      });
    }
  }
  // 3b. Obiekcje z ocenionych nagrań prawdziwych rozmów.
  for (const o of obiekcjeNagran.slice(0, 3)) {
    const d = o.klient_id ? otwarte.find((x) => x.id === o.klient_id) : null;
    obiekcjaKand.unshift({
      powod: "obiekcja",
      tytul: `„${o.obiekcja}”${d ? ` · ${etykieta(d)}` : ""}`,
      dlaczego: pl ? `Ta obiekcja padła w Twojej prawdziwej rozmowie (nagranie).` : `This objection came up in your real call (recording).`,
      klient_id: d?.id ?? null,
      klient: d ? etykieta(d) : null,
      tryb: "zywo",
      obiekcja: o.obiekcja,
      fokus: "obiekcje",
      sytuacja: `${d && lejek ? opisKlienta(d, lejek, await notatki(d.id), pl) : ""} ${pl ? `Podnieś obiekcję: „${o.obiekcja}” i nie odpuszczaj po pierwszej odpowiedzi.` : `Raise the objection “${o.obiekcja}” and don't drop it after the first answer.`}${koniec}`.trim(),
    });
  }
  // 4. Niska ocena ostatniej rozmowy.
  const ost = treningi.find((t) => typeof t.ocena === "number");
  if (ost && (ost.ocena as number) < 6) {
    const d = ost.klient_id ? otwarte.find((x) => x.id === ost.klient_id) : null;
    const slabe = ost.feedback?.najslabsze ?? fokus;
    ocenaKand.push({
      powod: "ocena",
      tytul: `${pl ? "Powtórka" : "Replay"} ${ost.ocena}/10${d ? ` · ${etykieta(d)}` : ""}`,
      dlaczego: pl ? `Ostatnia rozmowa: ${ost.ocena}/10. Najsłabiej: ${nazwa(slabe)}. Powtórz, zanim wejdzie w nawyk.` : `Last call: ${ost.ocena}/10. Weakest: ${nazwa(slabe)}. Replay it before it becomes a habit.`,
      klient_id: d?.id ?? null,
      klient: d ? etykieta(d) : null,
      tryb: "cold",
      obiekcja: null,
      fokus: slabe,
      sytuacja: `${d && lejek ? opisKlienta(d, lejek, await notatki(d.id), pl) : ""} ${pl ? `Handlowiec powtarza rozmowę, w której dostał ${ost.ocena}/10. Naciskaj na: ${nazwa(slabe)}.` : `The rep replays a call scored ${ost.ocena}/10. Push on: ${nazwa(slabe)}.`}${koniec}`.trim(),
    });
  }

  const kolejki = [etapKand, obiekcjaKand, ocenaKand, stoiKand];
  let ruch = true;
  while (pozycje.length < TRENINGOW_DZIENNIE && ruch) {
    ruch = false;
    for (const q of kolejki) {
      while (q.length) {
        const p = q.shift()!;
        if (dodaj(p)) {
          ruch = true;
          break;
        }
      }
      if (pozycje.length >= TRENINGOW_DZIENNIE) break;
    }
  }
  // Uzupełnienie: 2 najsłabsze nieopanowane kryteria na zmianę, ogólny klient (dobór z dobor.ts).
  // Brak ocen = pierwsze treningi (po kolei wszystkie kryteria); wszystko opanowane = utrzymanie formy.
  const doUzup = !oceny.length ? KRYTERIA : najslabsze ? kolejnosc.filter((k) => !opanowane.includes(k)).slice(0, 2) : KRYTERIA;
  let u = 0;
  while (pozycje.length < TRENINGOW_DZIENNIE) {
    const k = doUzup[u++ % doUzup.length];
    const dl = !oceny.length
      ? pl ? "Pierwsze treningi: Bruno poznaje Twój poziom." : "First sessions: Bruno is learning your level."
      : !najslabsze
        ? pl ? "Wszystkie kryteria opanowane: trening utrzymuje formę." : "All criteria mastered: this keeps you sharp."
        : pl ? `${nazwa(k)[0].toUpperCase()}${nazwa(k).slice(1)}: jedno z 2 najsłabszych kryteriów.` : `${nazwa(k)}: one of your 2 weakest criteria.`;
    dodaj({
      powod: "kryterium",
      tytul: pl ? `Trening · ${nazwa(k)}` : `Practice · ${nazwa(k)}`,
      dlaczego: dl,
      klient_id: null,
      klient: null,
      tryb: (["cold", "zywo", "online"] as TrybId[])[pozycje.length % 3],
      obiekcja: null,
      fokus: k,
      sytuacja: pl ? `Naciskaj tam, gdzie handlowiec jest najsłabszy: ${nazwa(k)}.` : `Push where the rep is weakest: ${nazwa(k)}.`,
    });
  }
  return { pozycje, opanowane };
}

/** Plan na dziś: zapisany albo nowy (raz dziennie), z oznaczeniem zrobionych pozycji. */
export async function planNaDzis(konto: Pick<Konto, "email" | "jezyk" | "rola" | "firma_id">, firma: Pick<Firma, "id" | "pipedrive_token"> | null, szef: boolean): Promise<Plan> {
  const dzien = dzisWarszawa();
  const email = konto.email.toLowerCase();
  const { data } = await supabaseAdmin.from("bruno_plan_treningu").select("pozycje").eq("email", email).eq("dzien", dzien).maybeSingle();
  let pozycje = (data?.pozycje as PozycjaPlanu[] | undefined) ?? null;
  let opanowane: Kryt[] = [];
  if (!pozycje) {
    const u = await ulozPlan(konto, firma, szef);
    pozycje = u.pozycje;
    opanowane = u.opanowane;
    await supabaseAdmin.from("bruno_plan_treningu").upsert({ email, dzien, pozycje }, { onConflict: "email,dzien" });
  } else {
    opanowane = kryteriaHandlowca((await ocenyHandlowca(email)).oceny).opanowane;
  }
  const { data: r } = await supabaseAdmin.from("bruno_rozmowy").select("plan_pozycja, ocena").eq("email", email).like("plan_pozycja", `${dzien}:%`);
  const zrobione = new Map(((r ?? []) as { plan_pozycja: string; ocena: number | null }[]).map((x) => [Number(x.plan_pozycja.split(":")[1]), x.ocena]));
  const lista = pozycje.map((p) => ({ ...p, zrobione: zrobione.has(p.nr), ocena: zrobione.get(p.nr) ?? null }));
  return { dzien, pozycje: lista, zrobione: lista.filter((p) => p.zrobione).length, opanowane };
}

/** Pozycja planu po kluczu „RRRR-MM-DD:nr” (start rozmowy). Tylko z planu tego konta. */
export async function pozycjaPlanu(email: string, klucz: string): Promise<PozycjaPlanu | null> {
  const [dzien, nr] = klucz.split(":");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dzien ?? "") || !Number(nr)) return null;
  const { data } = await supabaseAdmin.from("bruno_plan_treningu").select("pozycje").eq("email", email.toLowerCase()).eq("dzien", dzien).maybeSingle();
  return ((data?.pozycje as PozycjaPlanu[] | undefined) ?? []).find((p) => p.nr === Number(nr)) ?? null;
}

/** Link do treningu z planu. */
export const linkTreningu = (dzien: string, nr: number) => `/bruno/rozmowa?trening=${dzien}:${nr}`;
