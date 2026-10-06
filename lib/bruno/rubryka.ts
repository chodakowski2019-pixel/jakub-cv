import Anthropic from "@anthropic-ai/sdk";
import type { Feedback, Konfig, Kryterium, Wypowiedz } from "./db";
import { listaObiekcji } from "./db";
import { plecZTranskrypcji, type Metryki } from "./metryki";
import { POSTACIE, POZIOMY, TRYBY, poziomLubDomyslny, type PostacId, type PoziomId, type TrybId } from "./postacie";
import { NAZWY, WAGI } from "./kryteria";

// Bruno-TRENER. Ocenia rozmowę po jej zakończeniu wg SalesAI/BRUNO-RUBRYKA.md
// (złożonej 30.09 z 7 plików bazy wiedzy: Belfort, Rackham, Voss, Sandler,
// Challenger, Cialdini, Mazur). Model: Claude. Bruno-klient (OpenAI Realtime)
// tej rubryki nie zna.

export { WAGI, NAZWY };

const RUBRYKA = `
Oceniasz treningową rozmowę sprzedażową po polsku. Handlowiec ćwiczy, AI grało klienta. Oceniasz WYŁĄCZNIE handlowca.

KRYTERIA (każde 1-10):
1. OTWARCIE (pierwsze 90 s): cel rozmowy w ≤30 s; ≤6 zdań przed pierwszym pytaniem; kontrakt wstępny (cel, czas, wynik); zero „przepraszam, że przeszkadzam”, „tylko”, „nie zajmę dużo”; zero „nasza firma”, „oferujemy”, nazwy produktu przed pierwszym pytaniem klienta; plus za tezę lub liczbę z rynku.
2. PYTANIA: udział słów handlowca <50 % (dobrze), >60 % (źle); ≥5 pytań otwartych („jak”, „co”, „ile”, „kiedy”) przed prezentacją; SPIN: pytania o problem (P), jego skutki (I) i o to, czego klient chce (N) ważniejsze niż pytania o sytuację (S); brak pytania implikacyjnego = max 5; pytanie o koszt problemu; pytanie o budżet i decydenta; lustro (powtórzenie 1-3 słów klienta); handlowiec NIE odpowiada sam na swoje pytania; podsumowanie „powiedział Pan, że…”.
3. OBIEKCJE (po „za drogo”, „muszę pomyśleć”, „nie teraz”, „mamy już”): następna wypowiedź = etykieta („wygląda na to”), lustro albo pytanie („w porównaniu do czego?”, „co nie gra?”) = dobrze; argument, obrona, rabat od razu = źle; rabat bez niczego w zamian = źle; nowa informacja + ponowna prośba o decyzję (pętla) = dobrze; dowód z nazwą firmy i liczbą = dobrze, „wielu klientów jest zadowolonych” = źle; poddanie się po pierwszym „przemyślę” = źle; cena przed pytaniem o ból = czerwona flaga.
4. ZAMKNIĘCIE (ostatnie 20 %): 1-2 prośby o decyzję (0 albo ≥3 = źle); postęp = data + osoba + działanie klienta; kontynuacja („odezwę się”, „prześlę ofertę”, „proszę pomyśleć”) = źle; kwota wprost = dobrze; cena z „tylko”, „jedynie”, „niestety” = źle; klient sam wypowiada datę/krok = dobrze; pytanie „co może stanąć na drodze” = plus; limit tylko z prawdziwym powodem; po kwocie cisza, klient odzywa się pierwszy (handlowiec dopowiada >15 słów = usprawiedliwianie).
5. PEWNOŚĆ SIEBIE (głos, z liczb): wypełniacze/min 0-2 dobrze, 3-5 średnio, >5 źle; osłabiacze na 100 słów ≤1 dobrze, >3 źle; „przepraszam”/„niestety” >2 = źle; zmiana_tempa_proc to zmiana tempa ostatniej minuty względem pierwszej (plus = przyspieszył, minus = zwolnił): ≤ -15 = siadanie po odmowie, ≥ +15 przy cenie = nerwy; w komentarzu pisz po ludzku „przyspieszyłeś o X %” albo „zwolniłeś o X %”; przerywanie klienta; zdania >25 słów; energia rosnąca przy „nie” klienta = źle. To jest kryterium główne wg Mazura: handlowiec ma twierdzić, nie sugerować.

REGUŁY TWARDE (zastosuj i wypisz, które zadziałały):
- brak prośby o decyzję → ocena ogólna max 5
- prezentacja lub cena przed pytaniem o ból → ocena ogólna minus 3
- ocena ogólna nie wyższa niż pewność siebie + 2
- rozmowa „miła”, bez tezy, liczby i następnego kroku → max 5
- klient powiedział „nie myślałem o tym w ten sposób” → +1
- fałszywa technika (limit bez powodu, „klient” bez nazwy) → minus 2 za każdą

ZASADY FEEDBACKU:
- Oceniasz czyny i liczby, nigdy osobę: „zrobiłeś X”, nie „jesteś Y”. Zero moralizowania. Zero ogólników.
- Do każdego kryterium 1 cytat DOSŁOWNY z transkrypcji (może być fragment) + znacznik czasu z transkrypcji.
- Jedna liczba z audio (z metryk), jedna wygrana (co poszło dobrze, konkretnie), jedna poprawka (co zrobić inaczej w NASTĘPNEJ rozmowie, jedno zdanie, wykonalne).
- Komentarz do kryterium: max 2 zdania, po polsku, prosto, per „ty”.
- Jeśli rozmowa była za krótka (poniżej 60 s) albo handlowiec prawie nic nie powiedział, oceń nisko i powiedz to wprost.
`;

const SCHEMAT = `Odpowiedz WYŁĄCZNIE JSON-em (bez markdownu) o kształcie:
{
  "kryteria": [
    {"nazwa":"otwarcie","ocena":1-10,"cytat":"...","czas":"m:ss","komentarz":"..."},
    {"nazwa":"pytania", ...},
    {"nazwa":"obiekcje", ...},
    {"nazwa":"zamkniecie", ...},
    {"nazwa":"pewnosc", ...}
  ],
  "liczba_z_audio": "np. 7 wypełniaczy na minutę",
  "wygrana": "...",
  "poprawka": "...",
  "plusy": ["2-4 krótkie punkty (max 12 słów każdy): co konkretnie zagrało, z cytatem albo liczbą"],
  "minusy": ["2-4 krótkie punkty (max 12 słów każdy): co konkretnie nie zagrało"],
  "reguly": ["nazwy reguł twardych, które zadziałały, albo pusta lista"],
  "bonus": 0 lub 1,
  "kary": liczba całkowita ≥ 0 (suma punktów do odjęcia z reguł: 3 za cenę przed bólem, 2 za każdą fałszywą technikę),
  "brak_prosby_o_decyzje": true/false,
  "mila_bez_tresci": true/false,
  "obiekcje_ocena": [{"obiekcja":"tekst obiekcji z listy firmy, która padła","ocena":1-4}]
}
Skala obiekcje_ocena: 1 = handlowiec poległ, 2 = słabo, 3 = dobrze, 4 = wzorowo. Uwzględnij tylko obiekcje z listy firmy, które realnie padły.
FORMAT: to musi być poprawny JSON. Wewnątrz tekstów NIE używaj prostego cudzysłowu " ani znaków nowej linii; cytaty zapisuj w „ ” albo w apostrofach. Żadnego tekstu przed ani po JSON-ie.`;

function formatCzas(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function transkrypcjaDoTekstu(tr: Wypowiedz[]): string {
  return tr.map((w) => `[${formatCzas(w.t)}] ${w.rola === "handlowiec" ? "HANDLOWIEC" : "KLIENT"}: ${w.tekst}`).join("\n");
}

/** Poniżej tej oceny kara z reguł już nie spycha: słaba rozmowa ma niskie kryteria i bez kary. */
const PODLOGA_KARY = 3;

/**
 * Średnia ważona + reguły twarde. Liczone tu, nie przez model, żeby wynik był powtarzalny.
 * 6.10: działa JEDNA, najcięższa reguła, a nie wszystkie po kolei. Wcześniej kary się
 * sumowały i każda słabsza rozmowa lądowała na 1/10 (Aleksandra: kryteria 5/1/2/2/4,
 * po karze -3 wynik 1). Kara z reguł nie spycha też poniżej 3.
 */
export function policzOcene(
  kryteria: Kryterium[],
  reguly: { bonus?: number; kary?: number; brak_prosby_o_decyzje?: boolean; mila_bez_tresci?: boolean },
): { ocena: number; reguly: string[] } {
  const z = (n: Kryterium["nazwa"]) => Math.min(10, Math.max(1, Number(kryteria.find((k) => k.nazwa === n)?.ocena ?? 1)));
  let baza = 0;
  for (const n of Object.keys(WAGI) as Kryterium["nazwa"][]) baza += z(n) * WAGI[n];
  const uzyte: string[] = [];
  if (reguly.bonus) {
    baza += 1;
    uzyte.push("przeramowanie: +1");
  }

  // Kandydaci: każda reguła osobno liczy, ile zostaje z bazy. Wygrywa najniższy wynik.
  const kandydaci: { wynik: number; opis: string }[] = [];
  const kary = Math.max(0, Math.min(6, Number(reguly.kary ?? 0)));
  if (kary && baza > PODLOGA_KARY) kandydaci.push({ wynik: Math.max(PODLOGA_KARY, baza - kary), opis: `kara z reguł: -${kary} (nie poniżej ${PODLOGA_KARY})` });
  if (reguly.brak_prosby_o_decyzje && baza > 5) kandydaci.push({ wynik: 5, opis: "brak prośby o decyzję: max 5" });
  if (reguly.mila_bez_tresci && baza > 5) kandydaci.push({ wynik: 5, opis: "miło bez treści: max 5" });
  const sufit = z("pewnosc") + 2;
  if (baza > sufit) kandydaci.push({ wynik: sufit, opis: "nie wyżej niż pewność siebie + 2" });

  let ocena = baza;
  if (kandydaci.length) {
    const najciezsza = kandydaci.reduce((a, b) => (b.wynik < a.wynik ? b : a));
    ocena = najciezsza.wynik;
    uzyte.push(najciezsza.opis);
  }
  return { ocena: Math.min(10, Math.max(1, Math.round(ocena))), reguly: uzyte };
}

/** Rodzaj gramatyczny z imienia konta. Polskie imiona żeńskie kończą się na „a" (wyjątki męskie poniżej). */
export function czyKobieta(imie: string | null | undefined): boolean | null {
  const i = (imie ?? "").trim().split(/\s+/)[0]?.toLowerCase();
  if (!i) return null;
  if (["kuba", "barnaba", "bonawentura", "kosma", "jarema", "dyzma", "boryna", "zawisza"].includes(i)) return false;
  return i.endsWith("a");
}

function wyciagnijJson(t: string): unknown {
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("Trener nie zwrócił JSON");
  const surowy = t.slice(s, e + 1);
  try {
    return JSON.parse(surowy);
  } catch {
    // Najczęstszy błąd (1-2.10): prosty cudzysłów " wewnątrz cytatu albo surowa nowa linia.
    // Naprawa: w obrębie wartości tekstowych zamieniamy niezabezpieczone " na „ i \n na spację.
    return JSON.parse(naprawJson(surowy));
  }
}

/** Prosty automat: przechodzi po znakach, śledzi czy jesteśmy w stringu, i neutralizuje cudzysłowy, po których nie następuje separator JSON. */
export function naprawJson(t: string): string {
  let out = "";
  let wStringu = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (!wStringu) {
      if (c === '"') wStringu = true;
      out += c;
      continue;
    }
    if (c === "\\") {
      out += c + (t[i + 1] ?? "");
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      out += " ";
      continue;
    }
    if (c === '"') {
      // koniec stringa tylko, jeśli dalej (po spacjach) jest : , } ]
      const dalej = t.slice(i + 1).match(/^\s*([:,}\]])/);
      if (dalej) {
        wStringu = false;
        out += c;
      } else {
        out += "„";
      }
      continue;
    }
    out += c;
  }
  return out;
}

export async function ocenRozmowe(args: {
  transkrypcja: Wypowiedz[];
  metryki: Metryki;
  konfig: Konfig;
  postac: PostacId;
  tryb?: TrybId;
  cel?: string;
  obiekcja?: string | null;
  poziom?: PoziomId | string | null;
  imie?: string | null;
  ucieta_limitem?: boolean;
}): Promise<Feedback> {
  const { transkrypcja, metryki, konfig, postac, tryb, cel, obiekcja } = args;
  // Płeć: najpierw z własnych słów handlowca w transkrypcji, potem z imienia.
  const kobieta = plecZTranskrypcji(transkrypcja) ?? czyKobieta(args.imie);
  const poziom = poziomLubDomyslny(typeof args.poziom === "string" ? args.poziom : null);
  const klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.BRUNO_TRENER_MODEL ?? "claude-sonnet-5";

  const kontekst = [
    // 6.10: ta sama osoba dostawała raz „podałaś", raz „podałeś".
    kobieta === true && `HANDLOWIEC TO KOBIETA${args.imie ? ` (${args.imie})` : ""}. Wszystkie teksty pisz w rodzaju żeńskim: „zrobiłaś”, „podałaś”, „zapytałaś”.`,
    kobieta === false && `HANDLOWIEC TO MĘŻCZYZNA${args.imie ? ` (${args.imie})` : ""}. Wszystkie teksty pisz w rodzaju męskim: „zrobiłeś”, „podałeś”, „zapytałeś”.`,
    kobieta === null && "PŁEĆ HANDLOWCA NIEZNANA. Unikaj form z końcówką rodzajową: zamiast „zrobiłeś” pisz „tu zabrakło…”, „następnym razem zapytaj…”, „dobrze, że padła liczba”.",
    // 6.10: limit 3 min ucinał rozmowę tuż po sygnale kupna klienta, a trener karał za „urwanie" rozmowy.
    args.ucieta_limitem &&
      "ROZMOWĘ ZAKOŃCZYŁ LIMIT CZASU APLIKACJI (3 min + 45 s dogrywki na domknięcie). Nie karz za to, że handlowiec nie odpowiedział na OSTATNIĄ wypowiedź klienta, ani za to, że rozmowa „urywa się”: to zrobiła aplikacja. Brak prośby o decyzję w całej rozmowie nadal jest błędem handlowca, bo w dogrywce widział na ekranie „Dogrywka: domknij”. Jeśli klient dał sygnał kupna, a handlowiec go nie wykorzystał, napisz to w MINUSACH i w POPRAWCE podpowiedz, jak domknąć wcześniej.",
    `TYP KLIENTA (DISC): ${POSTACIE[postac].nazwa}, ${POSTACIE[postac].krotko}: ${POSTACIE[postac].opis}`,
    tryb && `TRYB ROZMOWY: ${TRYBY[tryb].nazwa}. ${tryb === "cold" ? "Klient nie znał oferty, otwarcie oceniaj w pełni." : "Klient znał ofertę i sam zaczął od obiekcji, więc OTWARCIE oceniaj łagodniej (liczy się reakcja na pierwszą obiekcję), a OBIEKCJE i ZAMKNIĘCIE surowiej."}`,
    cel && `CEL HANDLOWCA: ${cel}. W ZAMKNIĘCIU oceń wprost, czy ten cel został osiągnięty albo czy handlowiec o niego poprosił.`,
    // Poziom to kontekst, nie taryfa: rubryka jest ta sama, inaczej oceny z dwóch poziomów nie dałyby się porównać.
    `POZIOM TRUDNOŚCI KLIENTA: ${POZIOMY[poziom].nazwa} (${POZIOMY[poziom].krotko}). ${
      poziom === "trudny"
        ? "Klient miał wracać do obiekcji dwa razy i dociskać cenę. Jeśli handlowiec to wytrzymał, napisz to w PLUSACH."
        : poziom === "latwy"
          ? "Klient był życzliwy i odpuszczał szybko, więc wynik nie dowodzi jeszcze, że handlowiec zbije obiekcję u trudnego klienta. Jeśli rozmowa poszła gładko, w NASTĘPNYM RAZEM zaproponuj powtórkę tego samego scenariusza na wyższym poziomie."
          : "Zachowanie klienta było typowe."
    } OCENY NIE ZMIENIAJ ZE WZGLĘDU NA POZIOM: rubryka i skala 1-10 są te same na każdym poziomie.`,
    obiekcja &&
      (obiekcja.includes(" · ")
        ? `OBIEKCJE DO PRZETRENOWANIA (klient miał podnieść każdą): ${obiekcja
            .split(" · ")
            .map((o) => `„${o.trim()}”`)
            .join(", ")}. Oceń zbicie każdej z nich w pierwszej kolejności i wpisz je do obiekcje_ocena.`
        : `OBIEKCJA DO PRZETRENOWANIA: „${obiekcja}”. Oceń jej zbicie w pierwszej kolejności i wpisz ją do obiekcje_ocena.`),
    konfig.produkt && `PRODUKT HANDLOWCA: ${konfig.produkt}`,
    konfig.klient && `KLIENT WG FIRMY: ${konfig.klient}`,
    konfig.udana_rozmowa && `UDANA ROZMOWA WG FIRMY: ${konfig.udana_rozmowa}`,
    listaObiekcji(konfig.obiekcje).length && `LISTA OBIEKCJI FIRMY:\n- ${listaObiekcji(konfig.obiekcje).join("\n- ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const tresc = `${kontekst}\n\nMETRYKI (policzone z transkrypcji, ufaj im):\n${JSON.stringify(metryki, null, 0)}\n\nTRANSKRYPCJA:\n${transkrypcjaDoTekstu(transkrypcja)}\n\n${SCHEMAT}`;

  // Wymuszony format (2.10): odpowiedź jako wywołanie narzędzia ze schematem.
  // API oddaje gotowy obiekt, więc znika cała klasa błędów „niepoprawny JSON"
  // (cudzysłowy w cytatach, ucięty tekst), która wywalała trenera 1-2.10.
  const odp = await klient.messages.create({
    model,
    max_tokens: 3000,
    system: RUBRYKA,
    messages: [{ role: "user", content: tresc }],
    tools: [
      {
        name: "ocena_rozmowy",
        description: "Zapisuje ocenę rozmowy sprzedażowej wg rubryki.",
        input_schema: {
          type: "object",
          properties: {
            kryteria: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nazwa: { type: "string", enum: ["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"] },
                  ocena: { type: "integer", minimum: 1, maximum: 10 },
                  cytat: { type: "string" },
                  czas: { type: "string" },
                  komentarz: { type: "string" },
                },
                required: ["nazwa", "ocena", "cytat", "czas", "komentarz"],
              },
            },
            liczba_z_audio: { type: "string" },
            wygrana: { type: "string" },
            poprawka: { type: "string" },
            plusy: { type: "array", items: { type: "string" } },
            minusy: { type: "array", items: { type: "string" } },
            reguly: { type: "array", items: { type: "string" } },
            bonus: { type: "integer", minimum: 0, maximum: 1 },
            kary: { type: "integer", minimum: 0 },
            brak_prosby_o_decyzje: { type: "boolean" },
            mila_bez_tresci: { type: "boolean" },
            obiekcje_ocena: {
              type: "array",
              items: {
                type: "object",
                properties: { obiekcja: { type: "string" }, ocena: { type: "integer", minimum: 1, maximum: 4 } },
                required: ["obiekcja", "ocena"],
              },
            },
          },
          required: ["kryteria", "liczba_z_audio", "wygrana", "poprawka", "plusy", "minusy", "brak_prosby_o_decyzje", "mila_bez_tresci"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "ocena_rozmowy" },
  });
  const blok = odp.content.find((c) => c.type === "tool_use");
  const tekst = odp.content
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim();
  // Zapasowo (gdyby model mimo wymuszenia odpowiedział tekstem): stara ścieżka z naprawą JSON.
  const raw = (blok && blok.type === "tool_use" ? (blok.input as unknown) : wyciagnijJson(tekst)) as {
    kryteria?: Kryterium[];
    liczba_z_audio?: string;
    wygrana?: string;
    poprawka?: string;
    plusy?: string[];
    minusy?: string[];
    reguly?: string[];
    bonus?: number;
    kary?: number;
    brak_prosby_o_decyzje?: boolean;
    mila_bez_tresci?: boolean;
    obiekcje_ocena?: { obiekcja: string; ocena: number }[];
  };

  const kolejnosc: Kryterium["nazwa"][] = ["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"];
  const kryteria: Kryterium[] = kolejnosc.map((n) => {
    const k = raw.kryteria?.find((x) => x.nazwa === n);
    return {
      nazwa: n,
      ocena: Math.min(10, Math.max(1, Math.round(Number(k?.ocena ?? 1)))),
      cytat: String(k?.cytat ?? "").slice(0, 300),
      czas: String(k?.czas ?? ""),
      komentarz: String(k?.komentarz ?? "").slice(0, 400),
    };
  });
  const { ocena, reguly } = policzOcene(kryteria, {
    bonus: raw.bonus,
    kary: raw.kary,
    brak_prosby_o_decyzje: raw.brak_prosby_o_decyzje ?? metryki.prosby_o_decyzje === 0,
    mila_bez_tresci: raw.mila_bez_tresci,
  });
  // Lista reguł = to, co naprawdę zadziałało w policzOcene. Z listy modelu zostają tylko powody kary
  // (cena przed bólem, fałszywa technika), i tylko wtedy, gdy kara faktycznie obniżyła ocenę.
  const karaZadzialala = reguly.some((r) => r.startsWith("kara z reguł"));
  const powodyKary = karaZadzialala
    ? (raw.reguly ?? []).map(String).filter((r) => /minus|cen[aęy]|prezentac|fałszyw|technik|limit bez/i.test(r) && !/max 5|pewno/i.test(r))
    : [];
  const najslabsze = [...kryteria].sort((a, b) => a.ocena - b.ocena)[0].nazwa;

  return {
    ocena,
    kryteria,
    liczba_z_audio: String(raw.liczba_z_audio ?? `${metryki.wypelniacze_na_min} wypełniaczy na minutę`).slice(0, 200),
    wygrana: String(raw.wygrana ?? "").slice(0, 400),
    poprawka: String(raw.poprawka ?? "").slice(0, 400),
    najslabsze,
    obiekcje_ocena: (raw.obiekcje_ocena ?? [])
      .filter((o) => o && typeof o.obiekcja === "string")
      .map((o) => ({ obiekcja: o.obiekcja.slice(0, 200), ocena: Math.min(4, Math.max(1, Math.round(Number(o.ocena) || 2))) })),
    reguly: [...reguly, ...powodyKary].slice(0, 6),
    plusy: (raw.plusy ?? []).filter((p) => typeof p === "string" && p.trim()).map((p) => p.trim().slice(0, 160)).slice(0, 5),
    minusy: (raw.minusy ?? []).filter((m) => typeof m === "string" && m.trim()).map((m) => m.trim().slice(0, 160)).slice(0, 5),
  };
}
