import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonfig, pobierzKonto, poczatekDniaPL, stanDostepu, wszystkieKarty } from "@/lib/bruno/db";
import { zapewnijKarty } from "@/lib/bruno/fsrs";
import Fiszki, { type FiszkaKarta } from "@/components/bruno/fiszki";

export const dynamic = "force-dynamic";

// „Trening" (USER_001 2.10): fiszki z obiekcjami na FSRS. Handlowiec odpowiada
// na obiekcję (głosem albo tekstem), trener daje werdykt i wzór, FSRS planuje,
// kiedy obiekcja wróci. To jest nauka. „Test" (rozmowa z Bruno) to egzamin.

const FISZEK_DZIENNIE = 5;

/** Seria dni: ile kolejnych dni (licząc od dziś albo wczoraj) miało ≥1 fiszkę. */
function seriaDni(daty: string[]): number {
  const klucz = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const dni = new Set(daty.map((d) => klucz(new Date(d))));
  let seria = 0;
  const kursor = new Date();
  if (!dni.has(klucz(kursor))) kursor.setDate(kursor.getDate() - 1);
  while (dni.has(klucz(kursor))) {
    seria++;
    kursor.setDate(kursor.getDate() - 1);
  }
  return seria;
}

export default async function BrunoTreningPage({ searchParams }: { searchParams: Promise<{ karta?: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto || !stanDostepu(konto).aktywny) redirect("/bruno/panel");

  const konfig = await pobierzKonfig(email);
  await zapewnijKarty(email, konfig);
  const { karta: kartaId } = await searchParams;

  const [karty, fiszkiDzis, wszystkieFiszki] = await Promise.all([
    wszystkieKarty(email),
    supabaseAdmin.from("bruno_fiszki").select("id", { count: "exact", head: true }).eq("email", email).gte("utworzono", poczatekDniaPL()),
    supabaseAdmin.from("bruno_fiszki").select("utworzono, werdykt").eq("email", email).order("utworzono", { ascending: false }).limit(500),
  ]);

  const teraz = Date.now();
  const obiekcje = karty
    .filter((k) => k.typ === "obiekcja")
    .map<FiszkaKarta>((k) => ({ id: k.id, tresc: k.tresc, due: k.due, naCzas: new Date(k.due).getTime() <= teraz, reps: k.reps, lapses: k.lapses }))
    .sort((a, b) => Number(b.naCzas) - Number(a.naCzas) || new Date(a.due).getTime() - new Date(b.due).getTime());
  // Karta z linku (np. z „Do powtórki") idzie na początek.
  if (kartaId) {
    const i = obiekcje.findIndex((k) => k.id === kartaId);
    if (i > 0) obiekcje.unshift(...obiekcje.splice(i, 1));
  }

  const dzis = fiszkiDzis.count ?? 0;
  const historia = (wszystkieFiszki.data ?? []) as { utworzono: string; werdykt: number }[];
  const seria = seriaDni(historia.map((h) => h.utworzono));
  const razem = historia.length;
  const sredniWerdykt = razem ? Math.round((historia.reduce((s, h) => s + h.werdykt, 0) / razem) * 10) / 10 : null;

  if (obiekcje.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem] text-center">Trening</h1>
        <div className="bruno-szklo rounded-3xl p-8 text-center text-slate-600">
          Fiszki powstają z Twoich obiekcji. <Link href="/bruno/dostosuj" className="underline">Dodaj je w „Dostosuj Bruno”</Link> (jedna na linię), a tu pojawią się karty do ćwiczenia.
        </div>
      </div>
    );
  }

  return (
    <Fiszki
      karty={obiekcje}
      dzis={dzis}
      dziennie={FISZEK_DZIENNIE}
      seria={seria}
      razem={razem}
      sredniWerdykt={sredniWerdykt}
      naCzas={obiekcje.filter((k) => k.naCzas).length}
    />
  );
}
