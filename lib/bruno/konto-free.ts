import { supabaseAdmin } from "@/lib/supabase";
import { nowyKod, zaszyfrujKod } from "./auth";
import { PLAN_FREE, ROZMOWA_SEKUND_MAX, ROZMOW_ZA_DARMO } from "./db";
import { SKRZYNKA_JAKUBA, wyslij } from "./mail";

// 9.10 (USER_001): darmowe konto B2C (3 rozmowy łącznie). Wspólne dla formularza
// /brunorejestracja (z kodem mailem) i „Continue with Google” (bez kodu, logowanie Google).

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export async function zalozKontoFree(a: {
  email: string;
  imie: string;
  zKodem: boolean;
  zrodlo: "formularz" | "google";
  jezyk: "en" | "pl";
  produkt?: string | null;
  zawod?: string | null;
  telefon?: string | null;
  handlowcy?: number | null;
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
    kod_hash: kod ? zaszyfrujKod(kod) : null,
    nieudane: 0,
    blokada_do: null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, istnieje: true };
    console.error("[bruno konto free]", error);
    return { ok: false, istnieje: false, blad: error.message };
  }

  if (a.produkt) {
    const { error: e2 } = await supabaseAdmin
      .from("bruno_konfig")
      .upsert({ email: a.email, produkt: a.produkt, zaktualizowano: new Date().toISOString() }, { onConflict: "email" });
    if (e2) console.error("[bruno konto free] konfig", e2.message);
  }

  // Kopia w leadach (best-effort) + powiadomienie USER_001.
  try {
    const { error: e3 } = await supabaseAdmin.from("salesai_leady").insert({
      imie: a.imie || null,
      email: a.email,
      telefon: a.telefon ?? null,
      zawod: a.zawod ?? (a.zrodlo === "google" ? "Google" : null),
      handlowcy: a.handlowcy ?? 1,
      produkt: a.produkt ?? null,
      zgoda: true,
    });
    if (e3) console.error("[bruno konto free] lead", e3.message);
  } catch (e) {
    console.error("[bruno konto free] lead", e);
  }
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: a.email,
      rodzaj: "inny",
      temat: `Bruno: nowa rejestracja B2C (${a.zrodlo}): ${a.imie || a.email}${a.zawod ? `, ${a.zawod}` : ""}`,
      html: `<h2>Nowa rejestracja B2C (${a.zrodlo === "google" ? "przez Google" : "formularz /brunorejestracja"})</h2><p>Konto założone: plan free, ${ROZMOW_ZA_DARMO} rozmowy.</p><p><b>Imię:</b> ${esc(a.imie || "brak")}<br/><b>E-mail:</b> ${esc(a.email)}<br/><b>Telefon:</b> ${esc(a.telefon ?? "nie podano")}<br/><b>Rola:</b> ${esc(a.zawod ?? "brak")}<br/><b>Handlowców:</b> ${a.handlowcy ?? "brak"}<br/><b>Produkt:</b> ${esc(a.produkt ?? "brak")}<br/><b>Język:</b> ${a.jezyk.toUpperCase()}</p>`,
    });
  } catch (e) {
    console.error("[bruno konto free] mail do Jakuba", e);
  }
  return { ok: true, kod };
}
