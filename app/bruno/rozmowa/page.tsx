import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { DOGRYWKA_SEKUND, ROZMOWA_SEKUND, dostepKonta, limitDzienny, listaObiekcji, pelnyDostep, pobierzKonfig, pobierzKonto, rozmowyDzis, stanDostepu, stanFree, zuzyteSekundy, type Karta } from "@/lib/bruno/db";
import { NAZWY } from "@/lib/bruno/kryteria";
import { postacLubDomyslna } from "@/lib/bruno/postacie";
import Rozmowa from "@/components/bruno/rozmowa";

export const dynamic = "force-dynamic";

export default async function BrunoRozmowaPage({ searchParams }: { searchParams: Promise<{ karta?: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  const stan = stanDostepu(konto);
  if (!konto || !stan.aktywny) redirect("/bruno/panel");

  const { karta: kartaId } = await searchParams;
  let karta: Karta | null = null;
  if (kartaId) {
    const { data } = await supabaseAdmin.from("bruno_karty").select("*").eq("email", email).eq("id", kartaId).maybeSingle();
    karta = (data as Karta | null) ?? null;
  }
  const [konfig, dzis, zuzyte] = await Promise.all([pobierzKonfig(email), rozmowyDzis(email), zuzyteSekundy(email)]);
  const minutZostalo = Math.max(0, Math.floor((konto.limit_sekund - zuzyte) / 60));

  return (
    <Rozmowa
      postacDomyslna={postacLubDomyslna(konfig.postac)}
      karta={karta ? { id: karta.id, typ: karta.typ, tresc: karta.typ === "kryterium" ? NAZWY[karta.tresc as keyof typeof NAZWY] ?? karta.tresc : karta.tresc } : null}
      obiekcje={listaObiekcji(konfig.obiekcje)}
      rozmowyDzis={dzis}
      rozmowDziennie={limitDzienny(konto)}
      minutZostalo={minutZostalo}
      sekundRozmowy={ROZMOWA_SEKUND}
      sekundDogrywki={DOGRYWKA_SEKUND}
      pelny={pelnyDostep(konto)}
      free={dostepKonta(konto).free ? await stanFree(konto) : null}
    />
  );
}
