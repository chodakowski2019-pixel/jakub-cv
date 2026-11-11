import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PanelFirmy from "@/components/bruno/praca/panel-firmy";
import PanelKandydata from "@/components/bruno/praca/panel-kandydata";
import UkladGieldy from "@/components/bruno/praca/uklad-gieldy";
import { FirmyWidok, MojProfilWidok, StartGieldy } from "@/components/bruno/praca/gielda-widoki";
import g from "@/components/bruno/praca/gielda.module.css";
import { kontaktow } from "@/lib/bruno/praca/kontakty-cennik";
import s from "@/components/bruno/praca/praca.module.css";
import { supabaseAdmin } from "@/lib/supabase";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { linkPlatnosci } from "@/lib/bruno/praca/platnosci";
import { firmyZKontaktem, mojProfil, odblokowaniHandlowcy } from "@/lib/bruno/praca/handlowcy";
import { doOferty, ofertyKonta } from "@/lib/bruno/praca/oferty-firm";
import { CENA_MIESIAC, doListy, ofertaPoId, ofertyPubliczne, type OfertaLista } from "@/lib/bruno/praca/oferty";

// 17.10 (USER_001): panel portalu /praca. Pracodawca: ogłoszenia, dodawanie, kandydaci, konto.
// Kandydat: moje zgłoszenia, zapisane oferty, profil i CV. Bez sesji → logowanie.
// 11.11 (USER_001: „platforma, gdzie logują się handlowcy i osoby szukające handlowców, w stylu, jaki już mamy”):
// panel w układzie panelu Bruno AI (uklad-gieldy.tsx): lewy pasek, ekran startowy z kulą, zakładki pod ?z=.
// Bez ?z= = Start. Stare zakładki portalu (ogłoszenia, kandydaci, aplikacje…) renderują się w środku bez własnego menu.
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
    const handlowcy = await odblokowaniHandlowcy(konto.id);
    const nowych = ((data ?? []) as Zgloszenie[]).filter((x) => x.status === "nowe").length;
    const aktywne = oferty.filter((o) => o.status === "aktywna").length;
    const firma = konto.nazwa_wyswietlana || konto.firma || "Twoja firma";
    return (
      <UkladGieldy typ="pracodawca" nazwa={firma} inicjal={firma[0]?.toUpperCase() ?? "F"} podpis={konto.kontakty ? `Na koncie: ${kontaktow(konto.kontakty)}` : "Znajdź handlowca"} liczniki={{ handlowcy: handlowcy.length, kandydaci: nowych, ogloszenia: aktywne }}>
        {!zakladka ? (
          <StartGieldy
            imie={konto.imie?.split(" ")[0] || firma}
            pytanie="Kogo dziś szukasz?"
            pigulki={[
              { tekst: "Szukaj handlowców", href: "/praca/handlowcy" },
              { tekst: "Moi handlowcy", licznik: handlowcy.length, href: "/praca/panel?z=handlowcy" },
              { tekst: "Kandydaci", licznik: nowych ? `${nowych} nowych` : ((data ?? []).length), href: "/praca/panel?z=kandydaci", alarm: nowych > 0 },
            ]}
            kafle={[
              { etykieta: "Odblokowani handlowcy", wartosc: handlowcy.length, dol: "telefon, e-mail, CV", href: "/praca/panel?z=handlowcy" },
              { etykieta: "Kontakty na koncie", wartosc: konto.kontakty ?? 0, dol: "do odblokowania", href: "/praca/handlowcy" },
              { etykieta: "Aktywne ogłoszenia", wartosc: aktywne, dol: `z ${oferty.length} dodanych`, href: "/praca/panel?z=ogloszenia" },
              { etykieta: "Kandydaci", wartosc: (data ?? []).length, dol: "zgłoszenia na ogłoszenia", href: "/praca/panel?z=kandydaci" },
            ]}
          />
        ) : (
          <div className={`${s.root} ${g.wnetrze}`} lang="pl">
            <PanelFirmy bezMenu konto={konto} oferty={oferty} zgloszenia={(data ?? []) as Zgloszenie[]} handlowcy={handlowcy} cena={CENA_MIESIAC} zakladka={zakladka} linki={{ promo: linkPlatnosci(true, konto.id, konto.email), regularny: linkPlatnosci(false, konto.id, konto.email) }} />
          </div>
        )}
      </UkladGieldy>
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
  const [profil, firmy] = await Promise.all([mojProfil(konto.id), firmyZKontaktem(konto.id)]);
  const imie = (profil?.karta.imie || konto.imie || konto.email.split("@")[0]).split(" ")[0];
  const stan = !profil ? "do wypełnienia" : profil.status === "zatwierdzony" ? "sprawdzony" : profil.status === "odrzucony" ? "do poprawy" : "w weryfikacji";
  return (
    <UkladGieldy typ="kandydat" nazwa={profil?.karta.imie || konto.imie || "Mój panel"} inicjal={imie[0]?.toUpperCase() ?? "H"} podpis={`Profil ${stan}`} liczniki={{ firmy: firmy.length, aplikacje: zgloszenia.length, ulubione: zapisane.length, pulpit: polecane.length }}>
      {!zakladka ? (
        <StartGieldy
          imie={imie}
          pytanie={profil ? "Twój profil pracuje za Ciebie." : "Zacznij od profilu handlowca."}
          pigulki={[
            { tekst: "Mój profil", licznik: stan, href: profil ? "/praca/panel?z=baza" : "/praca/dolacz/profil", alarm: !profil || profil.status === "odrzucony" },
            { tekst: "Firmy z moim kontaktem", licznik: firmy.length, href: "/praca/panel?z=firmy" },
            { tekst: "Oferty dla mnie", licznik: polecane.length, href: "/praca/panel?z=pulpit" },
          ]}
          kafle={[
            { etykieta: "Profil", wartosc: profil ? (profil.status === "zatwierdzony" ? "✓" : "…") : "0", dol: stan, href: profil ? "/praca/panel?z=baza" : "/praca/dolacz/profil" },
            { etykieta: "Firmy", wartosc: firmy.length, dol: "mają Twój kontakt", href: "/praca/panel?z=firmy" },
            { etykieta: "Aplikacje", wartosc: zgloszenia.length, dol: "wysłane zgłoszenia", href: "/praca/panel?z=aplikacje" },
            { etykieta: "Ulubione", wartosc: zapisane.length, dol: "zapisane oferty", href: "/praca/panel?z=ulubione" },
          ]}
        />
      ) : zakladka === "baza" ? (
        <MojProfilWidok profil={profil} firm={firmy.length} />
      ) : zakladka === "firmy" ? (
        <FirmyWidok firmy={firmy} sprawdzony={profil?.status === "zatwierdzony"} />
      ) : (
        <div className={`${s.root} ${g.wnetrze}`} lang="pl">
          <PanelKandydata bezMenu konto={konto} zgloszenia={zgloszenia} zapisane={zapisane} polecane={polecane} alerty={al ?? []} teraz={Date.now()} zakladka={zakladka} />
        </div>
      )}
    </UkladGieldy>
  );
}
