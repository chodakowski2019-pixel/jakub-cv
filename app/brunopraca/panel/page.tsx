import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/bruno/praca/nav";
import PanelFirmy from "@/components/bruno/praca/panel-firmy";
import PanelKandydata from "@/components/bruno/praca/panel-kandydata";
import { Stopka } from "@/components/bruno/praca/wspolne";
import s from "@/components/bruno/praca/praca.module.css";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { doOferty, ofertyKonta } from "@/lib/bruno/praca/oferty-firm";
import { CENA_MIESIAC, doListy, ofertaPoId, ofertyPubliczne, type OfertaLista } from "@/lib/bruno/praca/oferty";

// 17.10 (USER_001): panel portalu /praca. Pracodawca: ogłoszenia, dodawanie, kandydaci, konto.
// Kandydat: moje zgłoszenia, zapisane oferty, profil i CV. Bez sesji → logowanie.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mój panel | SalesBruno.pl Praca", robots: { index: false } };

export type Zgloszenie = {
  id: string;
  oferta_id: string;
  imie: string;
  email: string;
  telefon: string | null;
  linkedin: string | null;
  wiadomosc: string | null;
  cv_nazwa: string | null;
  status: string;
  created_at: string;
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const konto = await zalogowanePraca();
  if (!konto) redirect("/praca/konto?tryb=logowanie");
  const z = (await searchParams).z;
  const zakladka = typeof z === "string" ? z : undefined;
  const POLA_Z = "id,oferta_id,imie,email,telefon,linkedin,wiadomosc,cv_nazwa,status,created_at";

  if (konto.typ === "pracodawca") {
    const oferty = await ofertyKonta(konto.id);
    const ids = oferty.map((o) => o.id);
    const { data } = ids.length ? await supabaseAdmin.from("praca_zgloszenia").select(POLA_Z).in("oferta_id", ids).order("created_at", { ascending: false }) : { data: [] };
    return (
      <div className={s.root} lang="pl">
        <Nav />
        <PanelFirmy konto={konto} oferty={oferty} zgloszenia={(data ?? []) as Zgloszenie[]} cena={CENA_MIESIAC} zakladka={zakladka} />
        <Stopka />
      </div>
    );
  }

  // Kandydat: zgłoszenia z konta + wcześniejsze z tego samego e-maila (zanim założył konto).
  const { data: zg } = await supabaseAdmin
    .from("praca_zgloszenia")
    .select(POLA_Z)
    .or(`kandydat_id.eq.${konto.id},email.eq.${konto.email}`)
    .order("created_at", { ascending: false });
  const { data: zap } = await supabaseAdmin.from("praca_zapisane").select("oferta_id").eq("konto_id", konto.id).order("created_at", { ascending: false });
  const poId = async (id: string): Promise<OfertaLista | null> => {
    const o = ofertaPoId(id);
    if (o) return doListy(o);
    const { data } = await supabaseAdmin.from("praca_oferty_firm").select("*").eq("id", id).maybeSingle();
    return data ? doListy(doOferty(data)) : null;
  };
  const zgloszenia = await Promise.all(((zg ?? []) as Zgloszenie[]).map(async (x) => ({ ...x, oferta: await poId(x.oferta_id) })));
  const zapisane = (await Promise.all((zap ?? []).map((x) => poId(x.oferta_id)))).filter(Boolean) as OfertaLista[];
  // 18.10: „Oferty dla Ciebie” = proste dopasowanie do preferencji (stanowisko, miasto, branża, tryb, min. wynagrodzenie).
  const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");
  const slowa = norm(konto.pref_stanowisko ?? "").split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const maPref = !!(slowa.length || konto.pref_miasto || konto.pref_branza || konto.pref_tryb);
  const polecane = maPref
    ? (await ofertyPubliczne())
        .filter(
          (o) =>
            (!slowa.length || slowa.some((w) => norm(o.stanowisko).includes(w))) &&
            (!konto.pref_miasto || norm(`${o.miasto} ${o.wojewodztwo}`).includes(norm(konto.pref_miasto))) &&
            (!konto.pref_branza || o.branza === konto.pref_branza) &&
            (!konto.pref_tryb || o.tryb === konto.pref_tryb) &&
            (!konto.pref_pensja || !(o.pensjaMax ?? o.pensjaMin) || (o.pensjaMax ?? o.pensjaMin ?? 0) >= konto.pref_pensja),
        )
        .slice(0, 8)
        .map(doListy)
    : [];
  const { data: al } = await supabaseAdmin.from("praca_alerty").select("id,opis,created_at").eq("konto_id", konto.id).order("created_at", { ascending: false });
  return (
    <div className={s.root} lang="pl">
      <Nav />
      <PanelKandydata konto={konto} zgloszenia={zgloszenia} zapisane={zapisane} polecane={polecane} alerty={al ?? []} teraz={Date.now()} zakladka={zakladka} />
      <Stopka />
    </div>
  );
}
