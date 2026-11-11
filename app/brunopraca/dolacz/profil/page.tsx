import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BazaPasek from "@/components/bruno/praca/baza-pasek";
import ProfilHandlowcaForm, { Weryfikacja } from "@/components/bruno/praca/profil-handlowca-form";
import d from "@/components/bruno/praca/dolacz.module.css";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";

// 11.11 (USER_001): /praca/dolacz/profil = formularz profilu handlowca po założeniu konta.
// Profil już wysłany → komunikat o weryfikacji. Bez konta kandydata → LP /praca.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profil handlowca | SalesBruno.pl Praca", robots: { index: false } };

export default async function Page() {
  const konto = await zalogowanePraca();
  if (!konto) redirect("/praca");
  if (konto.typ !== "kandydat") redirect("/praca/panel");
  const { data } = await supabaseAdmin.from("praca_profile_handlowcow").select("status").eq("konto_id", konto.id).maybeSingle();
  return (
    <div className={d.v} lang="pl">
      <BazaPasek />
      <main className={d.formStrona}>{data ? <Weryfikacja email={konto.email} /> : <ProfilHandlowcaForm email={konto.email} imie={konto.imie} telefon={konto.telefon} />}</main>
    </div>
  );
}
