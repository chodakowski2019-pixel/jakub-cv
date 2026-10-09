import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pelnyDostep, pobierzKonfig, pobierzKonto, pobierzRozmowy, stanDostepu, type Karta } from "@/lib/bruno/db";
import { NAZWY } from "@/lib/bruno/kryteria";
import { obiekcjeZWyjasnieniem } from "@/lib/bruno/obiekcje";
import { cytatDnia } from "@/lib/bruno/cytaty";
import Ogien from "@/components/bruno/ogien";

export const dynamic = "force-dynamic";

// „Ogień przed rozmową" (USER_001 9.10): 5-minutowy rytuał przed PRAWDZIWYM
// telefonem. Nie trening i nie czat: oddech → głos → kartka w Bruno → głowa →
// „Dzwonię" → 3 pytania po rozmowie. Z energią zespołu (muzyka + Bruno nakręca)
// i cytatem dnia. Wsad: konfiguracja, ostatnia ocena, nieprzerobione poprawki.
export default async function BrunoOgienPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  const stan = stanDostepu(konto);
  if (!konto || !stan.aktywny) redirect("/bruno/panel");
  // Tylko pełny dostęp (USER_001 9.10): trial nie widzi zakładki ani strony.
  if (!pelnyDostep(konto)) redirect("/bruno/panel");

  const [konfig, rozmowy] = await Promise.all([pobierzKonfig(email), pobierzRozmowy(email, 5)]);
  const ostatnia = rozmowy.find((r) => r.status === "zakonczona" && r.feedback) ?? null;
  const { data: kartyRaw } = await supabaseAdmin
    .from("bruno_karty")
    .select("id, typ, tresc, pytanie, wzor, reps")
    .eq("email", email)
    .in("typ", ["poprawka", "obiekcja"])
    .order("due", { ascending: true })
    .limit(40);
  const karty = (kartyRaw ?? []) as Pick<Karta, "id" | "typ" | "tresc" | "pytanie" | "wzor" | "reps">[];
  const poprawki = karty.filter((k) => k.typ === "poprawka").slice(0, 3);
  const kartyObiekcji = new Map(karty.filter((k) => k.typ === "obiekcja").map((k) => [k.tresc, k.id]));
  const obiekcje = obiekcjeZWyjasnieniem(konfig.obiekcje).map((o) => ({ ...o, karta_id: kartyObiekcji.get(o.nazwa) ?? null }));
  const pierwszeZdanie = (konfig.skrypt || "").split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 10) ?? "";

  return (
    <Ogien
      imie={konto.imie}
      cytat={cytatDnia(email)}
      produkt={konfig.produkt}
      obiekcje={obiekcje}
      pierwszeZdanie={pierwszeZdanie}
      poprawki={poprawki.map((p) => ({ tresc: p.tresc, pytanie: p.pytanie ?? null, wzor: p.wzor ?? null }))}
      ostatnia={
        ostatnia?.feedback
          ? { ocena: ostatnia.feedback.ocena, najslabsze: NAZWY[ostatnia.feedback.najslabsze] ?? ostatnia.feedback.najslabsze, poprawka: ostatnia.feedback.poprawka, wygrana: ostatnia.feedback.wygrana }
          : null
      }
    />
  );
}
