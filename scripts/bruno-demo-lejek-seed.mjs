// 4.11.2026 (USER_001: „na razie tylko na naszym koncie demo wprowadzaj zmiany”).
// Zasiewa LEJEK DEMO w Pipedrive USER_001 (token PIPEDRIVE_API_TOKEN z .env.local) i podpina go do firmy
// demo w bazie (bruno_firmy.pipedrive_token), żeby /bruno/lejek i /bruno/kokpit miały na czym pracować.
//
//   node --env-file=.env.local scripts/bruno-demo-lejek-seed.mjs [--firma bruno-demo] [--reset]
//
// Co robi: (1) pole własne deala „Handlowiec Bruno” (e-mail konta Bruno), (2) ok. 45 deali dla 5 handlowców
// demo w 6 etapach lejka „Lejek sprzedaży”: otwarte, wygrane i PRZEGRANE na konkretnych etapach (każda osoba
// ma swój słaby etap, zgodny z profilem z demo-zespol.ts), (3) 8 przykładowych deali Pipedrive dostaje handlowca,
// (4) token do bruno_firmy. --reset = usuwa deale z tytułem zaczynającym się od „[Bruno demo]” i zakłada od nowa.

import { createClient } from "@supabase/supabase-js";

const TOKEN = process.env.PIPEDRIVE_API_TOKEN;
if (!TOKEN) throw new Error("Brak PIPEDRIVE_API_TOKEN w .env.local");
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const arg = (n, d = null) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const FIRMA = arg("firma", "bruno-demo");
const RESET = process.argv.includes("--reset");
const PREFIKS = "[Bruno demo]";
const A = "https://api.pipedrive.com/v1";

async function pd(p, init) {
  const sep = p.includes("?") ? "&" : "?";
  const r = await fetch(`${A}${p}${sep}api_token=${TOKEN}`, { ...init, headers: { "content-type": "application/json" } });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.success) throw new Error(`Pipedrive ${p}: ${r.status} ${j?.error ?? ""}`);
  return j.data;
}
const spij = (ms) => new Promise((r) => setTimeout(r, ms));

// Handlowcy firmy demo (aktywni, rola rep).
const { data: konta, error } = await sb.from("bruno_konta").select("email, imie").eq("firma_id", FIRMA).eq("rola", "rep").eq("aktywne", true).order("imie");
if (error) throw error;
if (!konta?.length) throw new Error(`Brak handlowców w firmie ${FIRMA}.`);
console.log("Handlowcy:", konta.map((k) => `${k.imie} <${k.email}>`).join(", "));

// 1. Pole „Handlowiec Bruno”.
const pola = await pd("/dealFields?limit=500");
let pole = pola.find((f) => f.name === "Handlowiec Bruno")?.key;
if (!pole) {
  pole = (await pd("/dealFields", { method: "POST", body: JSON.stringify({ name: "Handlowiec Bruno", field_type: "varchar" }) })).key;
  console.log("Pole „Handlowiec Bruno” założone:", pole);
} else console.log("Pole „Handlowiec Bruno”:", pole);

// 2. Etapy pierwszego lejka.
const pipelines = (await pd("/pipelines")).sort((a, b) => a.id - b.id);
const pipeline = pipelines[0];
const etapy = (await pd("/stages")).filter((s) => s.pipeline_id === pipeline.id).sort((a, b) => a.order_nr - b.order_nr);
console.log(`Lejek „${pipeline.name}”: ${etapy.map((e) => e.name).join(" → ")}`);
if (etapy.length < 4) throw new Error("Za mało etapów w lejku (min. 4).");

// 3. Reset.
const istniejace = await pd("/deals?status=all_not_deleted&limit=500");
const nasze = (istniejace ?? []).filter((d) => d.title.startsWith(PREFIKS));
if (RESET && nasze.length) {
  for (const d of nasze) {
    await pd(`/deals/${d.id}`, { method: "DELETE" });
    await spij(120);
  }
  console.log(`Usunięto ${nasze.length} deali demo.`);
} else if (nasze.length) {
  console.log(`Jest już ${nasze.length} deali demo (użyj --reset, żeby założyć od nowa). Tylko podpinam token.`);
}

// Przykładowe deale Pipedrive bez handlowca → rozdaj po kolei.
const przyklady = (istniejace ?? []).filter((d) => !d.title.startsWith(PREFIKS) && !d[pole]);
for (let i = 0; i < przyklady.length; i++) {
  await pd(`/deals/${przyklady[i].id}`, { method: "PUT", body: JSON.stringify({ [pole]: konta[i % konta.length].email }) });
  await spij(100);
}
if (przyklady.length) console.log(`Przypisano ${przyklady.length} przykładowych deali Pipedrive do handlowców.`);

if (!RESET && nasze.length) {
  await podepnijToken();
  process.exit(0);
}

// 4. Deale demo. Profil słabości (demo-zespol.ts): Marta najlepsza (traci rzadko, na końcu), Kasia obiekcje (traci na
// ofercie/negocjacjach), Natalia pytania (traci po prezentacji), Ola otwarcie (traci na początku), Julia pewność (negocjacje).
const E = (i) => etapy[Math.min(i, etapy.length - 1)].id;
const ostatni = etapy.length - 1;
const profil = {
  Marta: { otwarte: [0, 1, 2, 3, 4, ostatni], wygrane: 6, przegrane: [ostatni - 1, ostatni - 1] },
  Kasia: { otwarte: [0, 1, 2, 3], wygrane: 2, przegrane: [3, 3, 3, 4, 2, 3] },
  Natalia: { otwarte: [1, 2, 2], wygrane: 2, przegrane: [2, 2, 2, 1, 2] },
  Ola: { otwarte: [0, 0, 1, 2, 3], wygrane: 3, przegrane: [0, 0, 1, 0] },
  Julia: { otwarte: [1, 2, 3, 4], wygrane: 3, przegrane: [4, 4, 3, ostatni - 1] },
};
const domyslny = { otwarte: [0, 1, 2], wygrane: 2, przegrane: [2, 3] };
const FIRMY = ["Nowak Logistics", "Budmax", "Zieleniak", "PolTech", "Kowalski Meble", "Dach-Bud", "Agro-Lis", "EkoDom", "MedSystem", "Transpol", "Piekarnia Róża", "Stal-Mont", "AutoSerwis Max", "Optima Druk", "Hydro-Instal", "Lux Okna", "Fit Studio", "Biuro Rachunkowe Plus", "Kebab King", "SolarPol", "Przedszkole Słoneczko", "GreenEnergy", "Mirex", "Dentica", "Apteka Centrum", "Mebel-Art", "TechSerwis", "Fabryka Smaku", "Drukarnia Nova", "Elektro-Max", "Klimatex", "Hotel Pod Lipą", "Fotowoltaika 24", "Pralnia Expres", "Studio Reklamy", "AutoMyjnia", "Bistro Lato"];
const OSOBY = ["Anna Nowak", "Piotr Kowalski", "Marek Zieliński", "Ewa Wiśniewska", "Tomasz Lis", "Katarzyna Dąbrowska", "Jan Wójcik", "Monika Kamińska", "Adam Lewandowski", "Agnieszka Mazur", "Paweł Krawczyk", "Joanna Piotrowska", "Michał Grabowski", "Magdalena Pawlak", "Krzysztof Michalski", "Dorota Zając", "Łukasz Król", "Beata Wieczorek", "Rafał Jabłoński", "Natalia Majewska", "Grzegorz Olszewski", "Karolina Stępień", "Dawid Malinowski", "Izabela Jaworska", "Sebastian Dudek", "Alicja Adamczyk", "Mateusz Sikora", "Patrycja Walczak", "Kamil Baran", "Aleksandra Rutkowska", "Marcin Szewczyk", "Weronika Czarnecka", "Bartosz Sawicki", "Justyna Borkowska", "Daniel Kubiak", "Sylwia Wróbel", "Artur Sokołowski"];
const POWODY = ["za drogo", "wybrali konkurencję", "brak budżetu w tym roku", "nie dodzwoniłem się", "decydent nie odpisał", "nie widzieli wartości", "przesunęli decyzję na później", "wewnętrzny opór w firmie"];
let nr = 0;
const kwota = () => [4500, 6900, 8000, 9500, 12000, 15000, 18500, 22000, 27000, 35000, 48000][nr % 11];
const dzien = (ileDniTemu) => new Date(Date.now() - ileDniTemu * 86_400_000).toISOString().slice(0, 10);

async function zalozDeal({ handlowiec, etapIdx, status, powod }) {
  const firma = FIRMY[nr % FIRMY.length];
  const osoba = OSOBY[nr % OSOBY.length];
  nr++;
  const org = await pd("/organizations", { method: "POST", body: JSON.stringify({ name: firma }) });
  const person = await pd("/persons", { method: "POST", body: JSON.stringify({ name: osoba, org_id: org.id }) });
  const body = { title: `${PREFIKS} ${firma}`, value: kwota(), currency: "PLN", stage_id: E(etapIdx), person_id: person.id, org_id: org.id, [pole]: handlowiec, add_time: `${dzien(20 + (nr % 40))} 09:00:00` };
  const deal = await pd("/deals", { method: "POST", body: JSON.stringify(body) });
  if (status === "won" || status === "lost") {
    await pd(`/deals/${deal.id}`, { method: "PUT", body: JSON.stringify({ status, ...(status === "lost" ? { lost_reason: powod } : {}) }) });
  } else if (nr % 3 === 0) {
    await pd("/activities", { method: "POST", body: JSON.stringify({ deal_id: deal.id, subject: nr % 2 ? "Telefon: domknąć termin" : "Wysłać ofertę", type: nr % 2 ? "call" : "email", due_date: dzien(-(1 + (nr % 5))), done: 0 }) });
  }
  await spij(120);
  return deal.id;
}

let razem = 0;
for (const k of konta) {
  const p = profil[k.imie] ?? domyslny;
  for (const i of p.otwarte) {
    await zalozDeal({ handlowiec: k.email, etapIdx: i, status: "open" });
    razem++;
  }
  for (let w = 0; w < p.wygrane; w++) {
    await zalozDeal({ handlowiec: k.email, etapIdx: ostatni, status: "won" });
    razem++;
  }
  for (const i of p.przegrane) {
    await zalozDeal({ handlowiec: k.email, etapIdx: i, status: "lost", powod: POWODY[razem % POWODY.length] });
    razem++;
  }
  console.log(`${k.imie}: ${p.otwarte.length} otwartych, ${p.wygrane} wygranych, ${p.przegrane.length} przegranych`);
}
console.log(`Założono ${razem} deali demo.`);
await podepnijToken();

async function podepnijToken() {
  const { error: e2 } = await sb.from("bruno_firmy").update({ pipedrive_token: TOKEN }).eq("id", FIRMA);
  if (e2) throw e2;
  console.log(`Token Pipedrive podpięty do firmy „${FIRMA}”. Lejek: /bruno/lejek, kokpit: /bruno/kokpit (konto szefa demo).`);
}
