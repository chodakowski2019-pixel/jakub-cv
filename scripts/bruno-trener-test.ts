/**
 * Zestaw testowy trenera (10.10): puszcza trenera na zapisanych rozmowach z bazy
 * i porównuje z oceną, która tam leży. Po każdej zmianie rubryki / metryk widać,
 * co się przesunęło, zanim pójdzie „push".
 *
 *   node --no-warnings --env-file=.env.local --import ./scripts/_ts-loader.mjs scripts/bruno-trener-test.ts
 *     --metryki        tylko metryki z transkrypcji, bez modelu (0 $)
 *     --id <uuid>      jedna rozmowa
 *     --limit <n>      pierwsze n rozmów
 *     --wzorzec        zapisz WZORZEC.md z kolumną na ocenę USER_001
 *
 * Wyniki: ~/Moje-Życie/Biznes/Projekty/SalesAI/trener-testy/wynik-<data>.json i .md
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { supabaseAdmin } from "@/lib/supabase";
import { ROZMOWA_SEKUND, listaObiekcji, pobierzKonfig, pobierzKonto, type Feedback, type Rozmowa, type Wypowiedz } from "@/lib/bruno/db";
import { policzMetryki } from "@/lib/bruno/metryki";
import { celLubDomyslny, opisCelu, postacLubDomyslna, trybLubDomyslny } from "@/lib/bruno/postacie";
import { ocenRozmowe } from "@/lib/bruno/rubryka";

const KATALOG = `${process.env.HOME}/Moje-Życie/Biznes/Projekty/SalesAI/trener-testy`;
const KRYTERIA = ["otwarcie", "pytania", "obiekcje", "zamkniecie", "pewnosc"] as const;

const arg = (n: string) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const tylkoMetryki = process.argv.includes("--metryki");
const zapiszWzorzec = process.argv.includes("--wzorzec");

let q = supabaseAdmin.from("bruno_rozmowy").select("*").eq("status", "zakonczona").order("start", { ascending: true });
if (arg("--id")) q = q.eq("id", arg("--id")!);
if (arg("--limit")) q = q.limit(Number(arg("--limit")));
const { data, error } = await q;
if (error) throw error;
const rozmowy = (data ?? []) as Rozmowa[];
console.log(`Rozmów: ${rozmowy.length}${tylkoMetryki ? " (tylko metryki)" : ""}\n`);

const ocenaKryt = (f: Feedback | null | undefined, n: string) => f?.kryteria?.find((k) => k.nazwa === n)?.ocena ?? null;

type Wynik = {
  id: string;
  kto: string;
  data: string;
  postac: string | null;
  poziom: string | null;
  sekundy: number | null;
  metryki_stare: Record<string, unknown>;
  metryki_nowe: Record<string, unknown>;
  ocena_stara: number | null;
  ocena_nowa: number | null;
  kryteria_stare: Record<string, number | null>;
  kryteria_nowe: Record<string, number | null>;
  minusy_nowe?: string[];
  reguly_nowe?: string[];
  techniki?: Feedback["zamkniecie_techniki"];
  blad?: string;
};

const wyniki: Wynik[] = [];
const POLA_METRYK = ["pytania_otwarte", "pytania_handlowca", "prosby_o_decyzje", "nastepny_krok_z_data", "obiekcje_klienta", "zmiana_tempa_proc", "wypelniacze", "kwota_padla", "cena_przed_pytaniem"];

for (const r of rozmowy) {
  const tr = (r.transkrypcja ?? []) as Wypowiedz[];
  const [konfig, konto] = await Promise.all([pobierzKonfig(r.email), pobierzKonto(r.email)]);
  const sekundy = r.sekundy ?? 0;
  const m = policzMetryki(tr, sekundy, listaObiekcji(konfig.obiekcje));
  const wybierz = (o: Record<string, unknown> | null) => Object.fromEntries(POLA_METRYK.map((p) => [p, o?.[p] ?? null]));
  const w: Wynik = {
    id: r.id,
    kto: konto?.imie ?? r.email,
    data: r.start.slice(0, 16),
    postac: r.postac,
    poziom: r.poziom ?? null,
    sekundy,
    metryki_stare: wybierz(r.metryki),
    metryki_nowe: wybierz(m as unknown as Record<string, unknown>),
    ocena_stara: r.ocena,
    ocena_nowa: null,
    kryteria_stare: Object.fromEntries(KRYTERIA.map((k) => [k, ocenaKryt(r.feedback, k)])),
    kryteria_nowe: {},
  };
  if (!tylkoMetryki) {
    try {
      const f = await ocenRozmowe({
        transkrypcja: tr,
        metryki: m,
        konfig,
        postac: postacLubDomyslna(r.postac),
        tryb: trybLubDomyslny(r.tryb),
        cel: opisCelu(celLubDomyslny(r.cel), r.cel_wlasny),
        obiekcja: r.obiekcja ?? null,
        poziom: r.poziom ?? null,
        imie: konto?.imie ?? null,
        ucieta_limitem: sekundy >= ROZMOWA_SEKUND,
        sytuacja: r.sytuacja ?? null,
      });
      w.ocena_nowa = f.ocena;
      w.kryteria_nowe = Object.fromEntries(KRYTERIA.map((k) => [k, ocenaKryt(f, k)]));
      w.minusy_nowe = f.minusy;
      w.reguly_nowe = f.reguly;
      w.techniki = f.zamkniecie_techniki;
    } catch (e) {
      w.blad = String(e).slice(0, 200);
    }
  }
  wyniki.push(w);
  const k = (o: Record<string, number | null>) => KRYTERIA.map((n) => o[n] ?? "-").join("/");
  console.log(
    `${w.kto.padEnd(10)} ${w.data} ${String(w.postac).padEnd(9)} ${sekundy}s | ocena ${w.ocena_stara ?? "-"} → ${w.ocena_nowa ?? "-"} | kryteria ${k(w.kryteria_stare)} → ${k(w.kryteria_nowe)} | otwarte ${w.metryki_stare.pytania_otwarte}→${w.metryki_nowe.pytania_otwarte} prośby ${w.metryki_stare.prosby_o_decyzje}→${w.metryki_nowe.prosby_o_decyzje} krok ${w.metryki_nowe.nastepny_krok_z_data} tempo ${w.metryki_stare.zmiana_tempa_proc}→${w.metryki_nowe.zmiana_tempa_proc}${w.techniki ? ` | techniki ${Object.values(w.techniki).map((v) => (v === true ? "✓" : v === false ? "✗" : v)).join(",")}` : ""}${w.blad ? ` | BŁĄD ${w.blad}` : ""}`,
  );
}

mkdirSync(KATALOG, { recursive: true });
const stempel = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
writeFileSync(`${KATALOG}/wynik-${stempel}.json`, JSON.stringify(wyniki, null, 2));

// Tabela do czytania.
const md = [
  `# Trener: wynik ${stempel}${tylkoMetryki ? " (tylko metryki)" : ""}`,
  "",
  "| Kto | Data | Postać | Poziom | s | Ocena stara → nowa | Otw/Pyt/Obi/Zam/Pew stare | nowe | Otwarte | Prośby | Krok z datą | Reguły |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|",
  ...wyniki.map((w) => {
    const k = (o: Record<string, number | null>) => KRYTERIA.map((n) => o[n] ?? "-").join("/");
    return `| ${w.kto} | ${w.data} | ${w.postac} | ${w.poziom ?? "-"} | ${w.sekundy} | ${w.ocena_stara ?? "-"} → ${w.ocena_nowa ?? "-"} | ${k(w.kryteria_stare)} | ${k(w.kryteria_nowe)} | ${w.metryki_stare.pytania_otwarte}→${w.metryki_nowe.pytania_otwarte} | ${w.metryki_stare.prosby_o_decyzje}→${w.metryki_nowe.prosby_o_decyzje} | ${w.metryki_nowe.nastepny_krok_z_data} | ${(w.reguly_nowe ?? []).join("; ")} |`;
  }),
];
writeFileSync(`${KATALOG}/wynik-${stempel}.md`, md.join("\n"));

// Wzorzec: ocena USER_001 obok oceny trenera. Istniejące oceny USER_001 nie giną.
if (zapiszWzorzec) {
  const plik = `${KATALOG}/WZORZEC.md`;
  const stare = new Map<string, string>();
  if (existsSync(plik)) {
    for (const linia of readFileSync(plik, "utf8").split("\n")) {
      const m = linia.match(/^\| `([0-9a-f-]{36})` \|(?:[^|]*\|){5}\s*([^|]*)\|\s*([^|]*)\|$/);
      if (m) stare.set(m[1], `${m[2].trim()}|${m[3].trim()}`);
    }
  }
  const tab = [
    "# Zestaw testowy trenera: WZORZEC",
    "",
    "Kolumny „Ocena USER_001” i „Uwaga USER_001” wypełnia USER_001 (1-10 + jedno zdanie, co trener przeoczył albo przesadził).",
    "Po każdej zmianie rubryki: `scripts/bruno-trener-test.ts` i porównanie z tą tabelą.",
    "",
    "| Id | Kto | Data | Postać | Poziom | Trener | Ocena USER_001 | Uwaga USER_001 |",
    "|---|---|---|---|---|---|---|---|",
    ...wyniki.map((w) => {
      const [o = "", u = ""] = (stare.get(w.id) ?? "|").split("|");
      return `| \`${w.id}\` | ${w.kto} | ${w.data} | ${w.postac} | ${w.poziom ?? "-"} | ${w.ocena_nowa ?? w.ocena_stara ?? "-"} | ${o} | ${u} |`;
    }),
  ];
  writeFileSync(plik, tab.join("\n"));
  console.log(`\nWzorzec: ${plik}`);
}
console.log(`\nZapisane: ${KATALOG}/wynik-${stempel}.{json,md}`);
