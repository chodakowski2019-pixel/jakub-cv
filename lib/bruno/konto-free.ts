import { supabaseAdmin } from "@/lib/supabase";
import { nowyKod, zaszyfrujKod } from "./auth";
import { PLAN_FREE, ROZMOWA_SEKUND_MAX, ROZMOW_ZA_DARMO } from "./db";
import { SKRZYNKA_JAKUBA, wyslij } from "./mail";

// 9.10 (USER_001): darmowe konto B2C (3 rozmowy łącznie). Wspólne dla formularza
// rejestracji i „Continue with Google”.
// 11.10 (USER_001): rejestracja = TYLKO e-mail + hasło (albo Google). Imię, telefon, rola,
// liczba handlowców i produkt uzupełnia się po założeniu konta na /bruno/start (`zapiszProfil`).

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export async function zalozKontoFree(a: {
  email: string;
  imie?: string | null;
  /** 11.10: hasło z formularza (skrót scrypt w kod_hash). Bez hasła (Google): losowy kod, nieużywany. */
  haslo?: string | null;
  /** Stare: kod mailem. Zostaje dla zgodności, nowa rejestracja go nie używa. */
  zKodem?: boolean;
  zrodlo: "formularz" | "google";
  jezyk: "en" | "pl";
}): Promise<{ ok: true; kod: string | null } | { ok: false; istnieje: boolean; blad?: string }> {
  const kod = a.zKodem ? nowyKod() : null;
  const { error } = await supabaseAdmin.from("bruno_konta").insert({
    email: a.email,
    imie: a.imie || null,
    firma: null,
    dni: 30,
    limit_sekund: ROZMOW_ZA_DARMO * ROZMOWA_SEKUND_MAX,
    rozmow_dziennie: ROZMOW_ZA_DARMO,
    fiszek_dziennie: 5,
    aktywne: true,
    plan: PLAN_FREE,
    // 11.10: język konta = domena rejestracji (salesbruno.pl = pl).
    jezyk: a.jezyk,
    kod_hash: zaszyfrujKod(a.haslo ?? kod ?? nowyKod()),
    nieudane: 0,
    blokada_do: null,
    // 11.10: po rejestracji konto jest od razu zalogowane, więc dostęp liczy się od założenia.
    start_dostepu: new Date().toISOString(),
    profil_at: null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, istnieje: true };
    console.error("[bruno konto free]", error);
    return { ok: false, istnieje: false, blad: error.message };
  }
  return { ok: true, kod };
}

/** 11.10: profil po rejestracji. Zapis na koncie + produkt do „Dostosuj Bruno” + lead + powiadomienie USER_001. */
export async function zapiszProfil(a: {
  email: string;
  imie: string;
  telefon: string | null;
  rola: string;
  handlowcy: number | null;
  produkt: string;
  jezyk: "en" | "pl";
}): Promise<{ ok: true } | { ok: false; blad: string }> {
  const { error } = await supabaseAdmin
    .from("bruno_konta")
    .update({ imie: a.imie, telefon: a.telefon, rola: a.rola, handlowcy: a.handlowcy, profil_at: new Date().toISOString() })
    .eq("email", a.email);
  if (error) return { ok: false, blad: error.message };

  // Produkt trafia do „Dostosuj Bruno”, ale nie nadpisuje tego, co konto już tam wpisało.
  const { data: konfig } = await supabaseAdmin.from("bruno_konfig").select("produkt").eq("email", a.email).maybeSingle();
  if (!String(konfig?.produkt ?? "").trim()) {
    const { error: e2 } = await supabaseAdmin
      .from("bruno_konfig")
      .upsert({ email: a.email, produkt: a.produkt, zaktualizowano: new Date().toISOString() }, { onConflict: "email" });
    if (e2) console.error("[bruno profil] konfig", e2.message);
  }

  // Kopia w leadach (best-effort) + powiadomienie USER_001.
  try {
    const { error: e3 } = await supabaseAdmin.from("salesai_leady").insert({
      imie: a.imie,
      email: a.email,
      telefon: a.telefon,
      zawod: a.rola,
      handlowcy: a.handlowcy ?? 1,
      produkt: a.produkt,
      zgoda: true,
    });
    if (e3) console.error("[bruno profil] lead", e3.message);
  } catch (e) {
    console.error("[bruno profil] lead", e);
  }
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: a.email,
      rodzaj: "inny",
      temat: `Bruno: nowe konto B2C (${a.jezyk.toUpperCase()}): ${a.imie}, ${a.rola}`,
      html: `<h2>Nowe konto B2C, profil uzupełniony</h2><p>Plan free, ${ROZMOW_ZA_DARMO} rozmowy.</p><p><b>Imię:</b> ${esc(a.imie)}<br/><b>E-mail:</b> ${esc(a.email)}<br/><b>Telefon:</b> ${esc(a.telefon ?? "nie podano")}<br/><b>Rola:</b> ${esc(a.rola)}<br/><b>Handlowców:</b> ${a.handlowcy ?? "brak"}<br/><b>Produkt:</b> ${esc(a.produkt)}<br/><b>Język:</b> ${a.jezyk.toUpperCase()}</p>`,
    });
  } catch (e) {
    console.error("[bruno profil] mail do Jakuba", e);
  }
  return { ok: true };
}
