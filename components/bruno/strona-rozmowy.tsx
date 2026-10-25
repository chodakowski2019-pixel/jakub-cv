import { redirect } from "next/navigation";
import Link from "next/link";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { DOGRYWKA_SEKUND, ROZMOWA_SEKUND, dostepKonta, limitDzienny, listaObiekcji, pelnyDostep, pobierzKonfig, pobierzKonto, rozmowyDzis, stanDostepu, stanFree, zuzyteSekundy, type Karta } from "@/lib/bruno/db";
import { etykiety } from "@/lib/bruno/etykiety";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { postacLubDomyslna } from "@/lib/bruno/postacie";
import { obiekcjeZWyjasnieniem } from "@/lib/bruno/obiekcje";
import Rozmowa from "@/components/bruno/rozmowa";


/** 25.10: wspólne dla /bruno/rozmowa i /bruno/jutro („Rozmowa, którą masz jutro”, osobna zakładka). */
export default async function StronaRozmowy({ searchParams, jutro }: { searchParams: Promise<{ karta?: string }>; jutro: boolean }) {
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
  const { jezyk, t } = await tSerwer();
  const { NAZWY } = etykiety(jezyk);

  // 12.10 (USER_001): bez „co sprzedajesz” i „kim jest klient” Bruno nie ma kogo grać.
  // Zamiast kreatora: komunikat „Uzupełnij Bruno” z przejściem do „Dostosuj Bruno”.
  if (!konfig.produkt.trim() || !konfig.klient.trim()) {
    return (
      <div className="bruno-szklo rounded-3xl p-8 sm:p-10 max-w-xl mx-auto mt-6 text-center flex flex-col items-center gap-4">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          {t("Set up", "Uzupełnij")} <span className="bruno-gradient-tekst">Bruno</span>
        </h1>
        <p className="bruno-opis text-slate-600 max-w-md">
          {t(
            "Before your first call, tell Bruno what you sell and who your customer is. It takes 2 minutes. You can paste your website and Bruno fills it in for you.",
            "Przed pierwszą rozmową powiedz Bruno, co sprzedajesz i kim jest Twój klient. To 2 minuty. Możesz wkleić adres strony, a Bruno wypełni pola sam.",
          )}
        </p>
        <Link href="/bruno/dostosuj" className="bruno-przycisk text-base px-6 py-3">
          {t("Customize Bruno →", "Dostosuj Bruno →")}
        </Link>
      </div>
    );
  }
  const minutZostalo = Math.max(0, Math.floor((konto.limit_sekund - zuzyte) / 60));

  return (
    <Rozmowa
      postacDomyslna={postacLubDomyslna(konfig.postac)}
      glosDomyslny={konfig.glos === "k" ? "k" : "m"}
      karta={karta ? { id: karta.id, typ: karta.typ, tresc: karta.typ === "kryterium" ? NAZWY[karta.tresc as keyof typeof NAZWY] ?? karta.tresc : karta.tresc } : null}
      obiekcje={listaObiekcji(konfig.obiekcje)}
      rozmowyDzis={dzis}
      rozmowDziennie={limitDzienny(konto)}
      minutZostalo={minutZostalo}
      sekundRozmowy={ROZMOWA_SEKUND}
      sekundDogrywki={DOGRYWKA_SEKUND}
      pelny={pelnyDostep(konto)}
      free={dostepKonta(konto).free ? await stanFree(konto) : null}
      obiekcjeOpis={Object.fromEntries(obiekcjeZWyjasnieniem(konfig.obiekcje).map((o) => [o.nazwa, o.wyjasnienie]))}
      jutro={jutro}
    />
  );
}
