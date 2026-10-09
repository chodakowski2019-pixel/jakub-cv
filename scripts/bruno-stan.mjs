#!/usr/bin/env node
// Stan Bruno AI z bazy: konta testerów, rozmowy, oceny, ostatnia aktywność.
//   node --env-file=.env.local scripts/bruno-stan.mjs
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: konta, error: e1 } = await sb
  .from("bruno_konta")
  .select("*")
  .order("utworzono", { ascending: true });
if (e1) throw e1;

const { data: rozmowy, error: e2 } = await sb
  .from("bruno_rozmowy")
  .select("*")
  .order("start", { ascending: true });
if (e2) throw e2;

const kol = (r, ...n) => n.map((k) => r[k]).find((v) => v !== undefined);
const dzis = new Date().toISOString().slice(0, 10);

console.log(`Konta: ${konta.length}, rozmowy: ${rozmowy.length}\n`);
console.log("| Konto | Firma | 1. logowanie | Limit s | Rozmowy | Dziś | Ocena ost. | Ostatnia rozmowa |");
console.log("|---|---|---|---|---|---|---|---|");
for (const k of konta) {
  const r = rozmowy.filter((x) => x.email === k.email);
  const dzisR = r.filter((x) => (x.start || "").startsWith(dzis)).length;
  const ost = r[r.length - 1];
  const ocena = ost ? kol(ost, "ocena", "ocena_ogolna", "wynik") ?? "-" : "-";
  console.log(
    `| ${kol(k, "imie", "nazwa") ?? k.email} | ${k.firma ?? "-"} | ${(k.start_dostepu ?? "brak").slice(0, 16)} | ${k.limit_sekund ?? "-"} | ${r.length} | ${dzisR} | ${ocena} | ${ost ? ost.start.slice(0, 16) : "-"} |`
  );
}
const sek = rozmowy.reduce((s, x) => s + (kol(x, "czas_s", "dlugosc_s", "sekundy") ?? 0), 0);
console.log(`\nŁączny czas rozmów: ${Math.round(sek / 60)} min. Kolumny rozmowy: ${Object.keys(rozmowy[0] ?? {}).join(", ")}`);
