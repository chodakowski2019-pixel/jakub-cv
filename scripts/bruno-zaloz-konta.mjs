#!/usr/bin/env node
// Zakłada konta testowe Bruno AI prosto w bazie (to samo, co /bruno/admin,
// tylko bez STATS_KEY). Kod logowania losuje i WYPISUJE na ekran, bo w bazie
// zostaje sam skrót scrypt. Maila NIE wysyła: drafty robi osobny skrypt
// scripts/bruno-drafty-dostep.mjs.
//
// Karty FSRS zakładają się same przy pierwszym logowaniu (zapewnijKarty
// w /api/bruno/login), więc tu nie trzeba ich dotykać.
//
//   node --env-file=.env.local scripts/bruno-zaloz-konta.mjs --sucho
//   node --env-file=.env.local scripts/bruno-zaloz-konta.mjs --email karina.chowaniak@gmail.com
//   node --env-file=.env.local scripts/bruno-zaloz-konta.mjs                # wszyscy nowi
//   ... --nadpisz                                                           # nadaje NOWY kod istniejącemu

import { randomBytes, randomInt, scryptSync } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// ── testerzy ────────────────────────────────────────────────────────────
// konfig = wsad do promptu Bruna. Puste pola tester uzupełnia sam
// w zakładce „Dostosuj Bruno".
const TESTERZY = [
  {
    email: "a.kempinska@quadrivium.pro",
    imie: "Aleksandra",
    firma: "Quadrivium",
    // Formularz /aisaleskontakt z 30.09: dyrektor sprzedaży, 10 handlowców.
    konfig: {
      produkt: "Roszczenia za służebność przesyłu.",
      klient: "",
      obiekcje: "",
      udana_rozmowa: "",
      skrypt: "",
    },
  },
  {
    email: "karina.chowaniak@gmail.com",
    imie: "Karina",
    firma: "",
    // Zgłoszenie telefoniczne 29.09, bez ankiety.
    konfig: { produkt: "", klient: "", obiekcje: "", udana_rozmowa: "", skrypt: "" },
  },
  {
    email: "dj_qb@wp.pl",
    imie: "Jakub",
    firma: "JDG",
    // Ankieta /aisalesbrief z 29.09 20:17 (firma „JDG"), potwierdzona przez USER_001 2.10.
    konfig: {
      produkt: "Kontrakty na energię, gaz, kompensatory energii biernej.",
      klient:
        "Firmy. Decyduje właściciel, prezes albo osoba oddelegowana, liczba osób przy decyzji zależy od firmy. Każdy klient jest inny. Kanały: telefon i spotkanie u klienta. Etapy, na których przegrywam: badanie potrzeb, follow-up po ofercie, domykanie.",
      obiekcje: "Mamy już umowę\nPana firma to jakiś random, ja mam państwową",
      udana_rozmowa: "Jestem umówiony na spotkanie w celu domknięcia.",
      skrypt:
        "1. telefon, przedstawienie, wybadanie z kim rozmawiam\n2. poruszenie problemu z którym dzwonię i jak rozwiązuję go z innymi\n3. umówienie spotkania\n4. domykanie F2F\n\nCzego nie dociskam: klienta między ofertą a decyzją, oraz między rozmową a umówieniem spotkania.",
    },
  },
];

// Parametry testu, te same dla wszystkich (decyzje 30.09 i 1.10).
const DNI = 7;
const LIMIT_SEKUND = 3780; // 63 min = 3 rozmowy × 3 min × 7 dni
const ROZMOW_DZIENNIE = 3;
const FISZEK_DZIENNIE = 5;

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i === -1 ? d : process.argv[i + 1];
};
const TYLKO = (arg("email", "") || "").toLowerCase();
const SUCHO = process.argv.includes("--sucho");
const NADPISZ = process.argv.includes("--nadpisz");

// ── kod i skrót (dokładnie jak lib/bruno/auth.ts) ───────────────────────
const nowyKod = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
function zaszyfrujKod(kod) {
  const sol = randomBytes(16).toString("hex");
  return `${sol}:${scryptSync(kod, sol, 32).toString("hex")}`;
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const kand = TESTERZY.filter((t) => (TYLKO ? t.email.toLowerCase() === TYLKO : true));
const bezMaila = kand.filter((t) => !t.email);
for (const t of bezMaila) console.error(`POMINIĘTY ${t.imie}: brak adresu e-mail`);

for (const t of kand.filter((x) => x.email)) {
  const email = t.email.trim().toLowerCase();
  const { data: istnieje } = await sb.from("bruno_konta").select("email, kod_hash").eq("email", email).maybeSingle();
  if (istnieje && !NADPISZ) {
    console.log(`JEST JUŻ  ${email} (kod zostaje; --nadpisz nada nowy)`);
    continue;
  }
  const kod = nowyKod();
  if (SUCHO) {
    console.log(`[sucho] ${email} | ${t.imie} | ${t.firma || "bez firmy"} | kod byłby losowy`);
    continue;
  }
  const { error } = await sb.from("bruno_konta").upsert(
    {
      email,
      imie: t.imie || null,
      firma: t.firma || null,
      dni: DNI,
      limit_sekund: LIMIT_SEKUND,
      rozmow_dziennie: ROZMOW_DZIENNIE,
      fiszek_dziennie: FISZEK_DZIENNIE,
      aktywne: true,
      kod_hash: zaszyfrujKod(kod),
      nieudane: 0,
      blokada_do: null,
    },
    { onConflict: "email" },
  );
  if (error) {
    console.error(`BŁĄD konto ${email}: ${error.message}`);
    continue;
  }
  const { error: e2 } = await sb.from("bruno_konfig").upsert(
    {
      email,
      produkt: t.konfig.produkt ?? "",
      klient: t.konfig.klient ?? "",
      obiekcje: t.konfig.obiekcje ?? "",
      udana_rozmowa: t.konfig.udana_rozmowa ?? "",
      skrypt: t.konfig.skrypt ?? "",
      postac: "czerwony",
      godzina_przypomnienia: 8,
      zaktualizowano: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (e2) console.error(`BŁĄD konfig ${email}: ${e2.message}`);
  console.log(`ZAŁOŻONE ${email} | login: ${email} | kod: ${kod}`);
}
