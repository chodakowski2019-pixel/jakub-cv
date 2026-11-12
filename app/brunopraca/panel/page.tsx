import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PanelFirmy from "@/components/bruno/praca/panel-firmy";
import PanelKandydata from "@/components/bruno/praca/panel-kandydata";
import UkladGieldy from "@/components/bruno/praca/uklad-gieldy";
import { FirmyWidok, MojProfilWidok, StartGieldy } from "@/components/bruno/praca/gielda-widoki";
import ProfilEdycja from "@/components/bruno/praca/profil-edycja";
import g from "@/components/bruno/praca/gielda.module.css";
import { kontaktow } from "@/lib/bruno/praca/kontakty-cennik";
import { czyAdminGieldy, firmyIWyszukiwania, kontoHandlowca, listaHandlowcow, listaNiedokonczonych } from "@/lib/bruno/praca/admin";
import { AdminFirmy, AdminHandlowcy, AdminNiedokonczone } from "@/components/bruno/praca/admin-widoki";
import AdminWeryfikacja from "@/components/bruno/praca/admin-weryfikacja";
import SzukajHandlowca from "@/components/bruno/praca/szukaj-handlowca";
import WynikSzukania from "@/components/bruno/praca/wynik-szukania";
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

  // 11.11 (USER_001): konto właściciela giełdy widzi wszystkie profile handlowców i firmy (lib/bruno/praca/admin.ts).
  if (czyAdminGieldy(konto)) {
    const sp = await searchParams;
    const id = typeof sp.id === "string" && /^[0-9a-f-]{36}$/i.test(sp.id) ? sp.id : null;
    let tresc: React.ReactNode;
    if (zakladka === "firmy") {
      tresc = <AdminFirmy {...(await firmyIWyszukiwania())} />;
    } else if (zakladka === "niedokonczone") {
      tresc = <AdminNiedokonczone lista={await listaNiedokonczonych()} />;
    } else if (zakladka === "handlowiec" && id) {
      const [profil, dane, firmy] = await Promise.all([mojProfil(id), kontoHandlowca(id), firmyZKontaktem(id)]);
      if (!profil || !dane) redirect("/praca/panel");
      tresc = <MojProfilWidok profil={profil} email={dane.email} cvNazwa={dane.cvNazwa} cvLink={dane.cvLink} firm={firmy.length} admin={{ gora: <AdminWeryfikacja key={id} id={id} imie={String(profil.odpowiedzi?.imie ?? "") || "tego handlowca"} status={profil.status} /> }} />;
    } else {
      tresc = <AdminHandlowcy lista={await listaHandlowcow()} />;
    }
    return (
      <UkladGieldy typ="admin" nazwa="Sales Bruno">
        {tresc}
      </UkladGieldy>
    );
  }

  if (konto.typ === "pracodawca") {
    const oferty = await ofertyKonta(konto.id);
    const ids = oferty.map((o) => o.id);
    const { data } = ids.length ? await supabaseAdmin.from("praca_zgloszenia").select(POLA_Z).in("oferta_id", ids).order("created_at", { ascending: false }) : { data: [] };
    const handlowcy = await odblokowaniHandlowcy(konto.id);
    const nowych = ((data ?? []) as Zgloszenie[]).filter((x) => x.status === "nowe").length;
    const aktywne = oferty.filter((o) => o.status === "aktywna").length;
    const firma = konto.nazwa_wyswietlana || konto.firma || "Twoja firma";
    return (
      <UkladGieldy typ="pracodawca" nazwa={firma} zdjecie={konto.logo_url} liczniki={{ handlowcy: handlowcy.length, kandydaci: nowych, ogloszenia: aktywne }}>
        {/* 12.11 (USER_001): start firmy = wyszukiwarka z kulą Bruno („Opisz, jakiego handlowca szukasz”). */}
        {!zakladka ? (
          <SzukajHandlowca imie={konto.imie?.split(" ")[0] || firma} />
        ) : zakladka === "szukaj" ? (
          <WynikSzukania opis={typeof (await searchParams).q === "string" ? String((await searchParams).q) : ""} kontoId={konto.id} naKoncie={konto.kontakty ?? 0} />
        ) : zakladka === "pulpit" ? (
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
  return (
    <UkladGieldy typ="kandydat" nazwa={profil?.karta.imie || konto.imie || "Mój panel"} zdjecie={profil?.zdjecie} liczniki={{ firmy: firmy.length }}>
      {/* 11.11 (USER_001): handlowiec zaczyna od profilu, bez ekranu startowego. */}
      {!zakladka || zakladka === "baza" ? (
        <MojProfilWidok profil={profil} email={konto.email} cvNazwa={konto.cv_nazwa} firm={firmy.length} />
      ) : zakladka === "edycja" ? (
        <ProfilEdycja start={profil?.odpowiedzi ?? { ...(konto.imie ? { imie: konto.imie } : {}), ...(konto.telefon ? { telefon: konto.telefon } : {}) }} zdjecie={profil?.zdjecie ?? null} cvNazwa={konto.cv_nazwa} maProfil={Boolean(profil)} />
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

