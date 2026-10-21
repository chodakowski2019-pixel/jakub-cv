import { supabaseAdmin } from "@/lib/supabase";
import { nowyKod, tokenProsby, zaszyfrujKod } from "./auth";
import { PLAN_FREE, ROZMOWA_SEKUND_MAX, ROZMOW_DEMO, pobierzKonto } from "./db";
import { zapewnijKarty } from "./fsrs";
import { SKRZYNKA_JAKUBA, htmlDostepDemo, mailDziala, wyslij } from "./mail";

// 17.10 (USER_001): Bruno tylko B2B. Nikt nie zakłada konta sam: formularz na stronie = prośba o dostęp
// (bruno_prosby), USER_001 akceptuje w Adminie do 24 h, wtedy powstaje konto demo (1 rozmowa, 3 min)
// z profilem z formularza i idzie mail z kodem logowania.

export const HANDLOWCY = ["1-4", "5-9", "10-50", "50+"] as const;
export type Handlowcy = (typeof HANDLOWCY)[number];
/** Liczba do `bruno_konta.handlowcy` (kolumna liczbowa): górna granica przedziału. */
const HANDLOWCY_LICZBA: Record<Handlowcy, number> = { "1-4": 4, "5-9": 9, "10-50": 50, "50+": 51 };

export type Prosba = {
  id: number;
  utworzono: string;
  email: string;
  imie: string;
  telefon: string | null;
  firma: string;
  handlowcy: string;
  produkt: string;
  jezyk: string;
  /** 21.10: 'krok1' = tylko e-mail + hasło, dane firmy jeszcze nie wpisane. */
  status: "krok1" | "nowa" | "przyznany" | "odrzucona" | string;
  decyzja_at: string | null;
  /** 21.10: skrót scrypt hasła z kroku 1 rejestracji. Przy „Daj dostęp” trafia do bruno_konta.kod_hash. */
  haslo_hash?: string | null;
};

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/**
 * 21.10 (USER_001): krok 1 rejestracji = e-mail + hasło. Każdy e-mail przechodzi (gmail też).
 * Wiersz w bruno_prosby ze statusem 'krok1'; powtórny krok 1 tym samym e-mailem nadpisuje hasło.
 * Zwraca id + podpis, którym krok 2 uzupełnia dane firmy.
 */
export async function zapiszKrok1(a: { email: string; haslo: string; jezyk: string }): Promise<{ ok: true; id: number; token: string } | { ok: false; blad: string }> {
  const haslo_hash = zaszyfrujKod(a.haslo);
  const { data: jest } = await supabaseAdmin.from("bruno_prosby").select("id, status").eq("email", a.email).in("status", ["krok1", "nowa"]).order("utworzono", { ascending: false }).limit(1).maybeSingle();
  if (jest?.id) {
    const { error } = await supabaseAdmin.from("bruno_prosby").update({ haslo_hash, jezyk: a.jezyk }).eq("id", jest.id);
    if (error) return { ok: false, blad: error.message };
    return { ok: true, id: jest.id, token: tokenProsby(jest.id, a.email) };
  }
  const { data, error } = await supabaseAdmin.from("bruno_prosby").insert({ email: a.email, haslo_hash, jezyk: a.jezyk, status: "krok1" }).select("id").single();
  if (error || !data) {
    console.error("[bruno prosba krok1]", error);
    return { ok: false, blad: error?.message ?? "insert" };
  }
  return { ok: true, id: data.id, token: tokenProsby(data.id, a.email) };
}

/** Krok 2: dane firmy do wiersza z kroku 1, status 'nowa', mail do USER_001 jak dotąd. */
export async function zapiszKrok2(id: number, a: Omit<Prosba, "id" | "utworzono" | "status" | "decyzja_at">): Promise<{ ok: true } | { ok: false; blad: string }> {
  const { error } = await supabaseAdmin.from("bruno_prosby").update({ ...a, status: "nowa" }).eq("id", id).eq("email", a.email).in("status", ["krok1", "nowa"]);
  if (error) {
    console.error("[bruno prosba krok2]", error);
    return { ok: false, blad: error.message };
  }
  await powiadomJakuba(a);
  return { ok: true };
}

async function powiadomJakuba(a: Omit<Prosba, "id" | "utworzono" | "status" | "decyzja_at">) {
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: a.email,
      rodzaj: "inny",
      temat: `Bruno: prośba o dostęp (${a.jezyk.toUpperCase()}): ${a.firma}, ${a.handlowcy} handlowców`,
      html: `<h2>Prośba o dostęp do Bruno</h2><p><b>Imię:</b> ${esc(a.imie)}<br/><b>E-mail:</b> ${esc(a.email)}<br/><b>Telefon:</b> ${esc(a.telefon ?? "-")}<br/><b>Firma:</b> ${esc(a.firma)}<br/><b>Handlowców:</b> ${esc(a.handlowcy)}<br/><b>Co sprzedają:</b> ${esc(a.produkt)}<br/><b>Język:</b> ${a.jezyk.toUpperCase()}</p><p>Akceptacja w Adminie: /bruno/admin (przycisk „Daj dostęp”). Obiecane: do 24 h.</p>`,
    });
  } catch (e) {
    console.error("[bruno prosba] mail do Jakuba", e);
  }
}

export async function zapiszProsbe(a: Omit<Prosba, "id" | "utworzono" | "status" | "decyzja_at">): Promise<{ ok: true } | { ok: false; blad: string }> {
  const { error } = await supabaseAdmin.from("bruno_prosby").insert(a);
  if (error) {
    console.error("[bruno prosba]", error);
    return { ok: false, blad: error.message };
  }
  await powiadomJakuba(a);
  return { ok: true };
}

/**
 * „Daj dostęp” w Adminie: konto demo (plan free, 1 rozmowa), profil z formularza (bez /bruno/start),
 * „Co sprzedajesz” wpisane w Dostosuj, segment B2B, mail z kodem. Istniejące konto: nic nie nadpisujemy.
 */
export async function przyznajDostep(id: number): Promise<{ ok: true; email: string; kod: string; mail: "wyslany" | "pominiety" | "blad" } | { ok: false; blad: string }> {
  const { data } = await supabaseAdmin.from("bruno_prosby").select("*").eq("id", id).maybeSingle();
  const p = data as Prosba | null;
  if (!p) return { ok: false, blad: "Nie ma takiej prośby." };
  if (await pobierzKonto(p.email)) return { ok: false, blad: `Konto ${p.email} już istnieje. Włącz je w liście kont.` };
  if (p.status === "krok1") return { ok: false, blad: "Ta osoba nie wpisała jeszcze danych firmy (krok 2)." };

  // 21.10: hasło z rejestracji (krok 1) idzie do konta; bez niego (stare prośby) losowy kod jak dotąd.
  const wlasneHaslo = Boolean(p.haslo_hash);
  const kod = wlasneHaslo ? "" : nowyKod();
  const jezyk = p.jezyk === "en" ? "en" : "pl";
  const teraz = new Date().toISOString();
  const { error } = await supabaseAdmin.from("bruno_konta").insert({
    email: p.email,
    imie: p.imie,
    firma: p.firma,
    telefon: p.telefon,
    handlowcy: HANDLOWCY_LICZBA[p.handlowcy as Handlowcy] ?? null,
    dni: 30,
    limit_sekund: ROZMOW_DEMO * ROZMOWA_SEKUND_MAX,
    rozmow_dziennie: ROZMOW_DEMO,
    fiszek_dziennie: 5,
    aktywne: true,
    plan: PLAN_FREE,
    jezyk,
    kod_hash: wlasneHaslo ? p.haslo_hash : zaszyfrujKod(kod),
    nieudane: 0,
    blokada_do: null,
    start_dostepu: null,
    profil_at: teraz,
    // Film zastąpiony chmurkami (prowadzenie-demo.tsx), popup filmu się nie pokazuje.
    tour_obejrzany_at: teraz,
  });
  if (error) return { ok: false, blad: error.message };

  const konfig = {
    email: p.email,
    produkt: p.produkt.slice(0, 1500),
    klient: "",
    obiekcje: "",
    udana_rozmowa: "",
    skrypt: "",
    postac: "czerwony",
    godzina_przypomnienia: 8,
    segment: "b2b",
    zaktualizowano: teraz,
  };
  const { error: e2 } = await supabaseAdmin.from("bruno_konfig").upsert(konfig, { onConflict: "email" });
  if (e2) console.error("[bruno dostep] konfig", e2.message);
  else await zapewnijKarty(p.email, konfig, jezyk);

  await supabaseAdmin.from("bruno_prosby").update({ status: "przyznany", decyzja_at: teraz }).eq("id", id);

  let mail: "wyslany" | "pominiety" | "blad" = "pominiety";
  if (mailDziala()) {
    try {
      await wyslij({
        do: p.email,
        rodzaj: "dostep",
        temat: jezyk === "pl" ? "Twój dostęp do Bruno AI" : "Your Bruno AI access",
        html: htmlDostepDemo({ imie: p.imie, email: p.email, kod: wlasneHaslo ? null : kod, jezyk }),
      });
      mail = "wyslany";
    } catch (e) {
      console.error("[bruno dostep] mail", e);
      mail = "blad";
    }
  }
  return { ok: true, email: p.email, kod, mail };
}

export async function odrzucProsbe(id: number): Promise<void> {
  await supabaseAdmin.from("bruno_prosby").update({ status: "odrzucona", decyzja_at: new Date().toISOString() }).eq("id", id);
}
