import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AkcjeOferty from "@/components/bruno/praca/akcje-oferty";
import Aplikuj from "@/components/bruno/praca/aplikuj";
import Karta from "@/components/bruno/praca/karta";
import PasekDolny from "@/components/bruno/praca/pasek-dolny";
import Przegladane from "@/components/bruno/praca/przegladane";
import PasekFirmy from "@/components/bruno/praca/pasek-firmy";
import { Inicjaly, KartaFirmy, Stopka, Tekst, krotkaFirma, opisDni, pensja } from "@/components/bruno/praca/wspolne";
import { Nav } from "@/components/bruno/praca/nav";
import s from "@/components/bruno/praca/praca.module.css";
import { CENA_MIESIAC, KLAUZULA_SALESBRUNO, dniTemu, ofertaPublicznaLubFirmy, ofertyWidoczne, podgladWszystkich, podobne } from "@/lib/bruno/praca/oferty";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { strukturaOpisu } from "@/lib/bruno/praca/opis";

// 17.10 (USER_001): oferta pod salesbruno.com/praca/<id>, układ jak Pracuj.pl. Aktywna = dla każdego.
// Nieaktywna = tylko z linku w mailu do firmy (?k=<token>): pasek „Aktywuj za 50 zł / Usuń”.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const MIES = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
// 17.10 (USER_001): „przećwicz rozmowę o tę pracę z Bruno” przy każdej ofercie = PÓŹNIEJ, na razie bez.

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;
  const w = await ofertaPublicznaLubFirmy(id, sp.k, (await zalogowanePraca())?.id);
  if (!w) return { title: "Oferta niedostępna | SalesBruno.pl", robots: { index: false } };
  const { oferta: o } = w;
  const tytul = `${o.stanowisko}, ${o.firma}${o.miasto ? `, ${o.miasto}` : ""}`;
  return {
    metadataBase: new URL("https://salesbruno.com"),
    title: `${tytul} | Praca dla handlowców | Bruno AI`,
    description: o.opis.slice(0, 155),
    alternates: { canonical: `/praca/${o.id}` },
    openGraph: { title: tytul, description: o.opis.slice(0, 155), url: `/praca/${o.id}`, siteName: "Bruno AI", locale: "pl_PL", images: [{ url: "/bruno/og-bruno.png", width: 1200, height: 630 }] },
    robots: { index: false, follow: false },
  };
}

const Ikona = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);
const IK = {
  miejsce: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  umowa: "M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5M10 16h5",
  wymiar: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2",
  poziom: "M5 20v-5M10 20V10M15 20V7M20 20V4",
  tryb: "M4 21V8l8-5 8 5v13M9 21v-6h6v6",
  zaraz: "M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-2 1-3 1-3s.5 2 2 2c0-3-1-5 1-7.5Z",
  b2b: "M3 12h4l3-3 4 4 3-3h4M7 12l3 3",
};

function Sekcja({ tytul, punkty }: { tytul: string; punkty: string[] }) {
  if (!punkty.length) return null;
  return (
    <>
      <h3>{tytul}</h3>
      <ul>
        {punkty.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </>
  );
}

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const podglad = podgladWszystkich(sp.podglad);
  const konto = await zalogowanePraca();
  const w = await ofertaPublicznaLubFirmy(id, sp.k, konto?.id);
  if (!w) notFound();
  const { oferta: o, wlasciciel, wlascicielPanelu } = w;
  const klauzule = o.zFirmy && o.klauzula ? { tekst: o.klauzula, przyszle: o.klauzulaPrzyszle, przyszleDomyslnie: o.klauzulaPrzyszleDomyslnie } : { tekst: KLAUZULA_SALESBRUNO };
  const kandydat = konto?.typ === "kandydat" ? { imie: konto.imie, email: konto.email, telefon: konto.telefon, cvNazwa: konto.cv_nazwa, linkedin: konto.linkedin } : null;
  const zl = pensja(o.pensjaMin, o.pensjaMax);
  // 17.10 (USER_001): żadnych wyjść na strony zewnętrzne. Aplikuj = nasz formularz (components/bruno/praca/aplikuj.tsx).
  const doKonca = Math.max(0, Math.ceil((Date.parse(o.wazneDo) - Date.now()) / 86_400_000));
  const wazne = new Date(o.wazneDo);
  const procent = Math.min(100, Math.max(4, ((30 - doKonca) / 30) * 100));
  const zPodgladem = (h: string) => `${h}${podglad ? "?podglad=wszystkie" : ""}`;
  const podobneOferty = podobne(o, podglad, 7);
  const [rekomendowana, ...reszta] = podobneOferty;
  const teraz = Date.now();
  const data = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  const miasto = o.miasto || o.wojewodztwo;
  const ofertFirmy = ofertyWidoczne(podglad || wlasciciel).filter((x) => x.firma === o.firma).length;
  const struktura = o.zFirmy ? null : strukturaOpisu(o.opis, o.stanowisko);
  const maSekcje = o.obowiazki.length + o.wymagania.length + o.oferujemy.length > 0;

  const pigulki: [string, string][] = [
    [IK.miejsce, o.miasto ? `${o.miasto}${o.wojewodztwo ? ` (${o.wojewodztwo})` : ""}` : o.wojewodztwo || "Cała Polska"],
    ...(o.umowa ? [[IK.umowa, o.umowa.toLowerCase()] as [string, string]] : []),
    [IK.wymiar, o.wymiar.toLowerCase()],
    [IK.poziom, o.poziom.toLowerCase()],
    [IK.tryb, o.tryb.toLowerCase()],
    ...(o.odZaraz ? [[IK.zaraz, "praca od zaraz"] as [string, string]] : []),
    ...(o.b2b ? [[IK.b2b, "sprzedaż B2B"] as [string, string]] : []),
  ];
  const informacje: [string, string][] = [
    ["Branża", o.branza],
    ["Poziom stanowiska", o.poziom],
    ["Rodzaj umowy", o.umowa ?? "nie podano"],
    ["Wymiar pracy", o.wymiar],
    ["Tryb pracy", o.tryb],
    ["Wynagrodzenie", zl ? `${zl} brutto / mies.` : "nie podano"],
    ["Dodano", `${opisDni(dniTemu(o.dodano))}`],
  ];

  return (
    <div className={s.root} lang="pl">
      <Nav />
      {wlascicielPanelu && o.status !== "aktywna" && <p className={`${s.podglad} ${s.podgladFirmy}`}>Podgląd Twojego ogłoszenia. Publicznie widać je tylko po opłaceniu 30 dni publikacji.</p>}
      {wlasciciel && o.status === "nieaktywna" && <PasekFirmy id={o.id} k={String(sp.k)} firma={o.firma} cena={CENA_MIESIAC} />}
      <div className={s.uklad}>
        <div className={s.kolumna}>
          <nav className={s.okruszki} aria-label="Ścieżka">
            <a href={zPodgladem("/praca")}>Oferty pracy</a>
            {miasto && <a href={zPodgladem("/praca")}>Praca {miasto}</a>}
            <a href={zPodgladem("/praca")}>{o.branza}</a>
            <span>{o.stanowisko}</span>
          </nav>

          <article className={s.oferta}>
            <div className={s.ofertaGlowa}>
              <Inicjaly firma={o.firma} logo={o.logo} duze />
              <div>
                <span className={s.branzaZnaczek}>{o.branza}</span>
                <h1 className={s.ofertaH}>{o.stanowisko}</h1>
                <p className={s.ofertaFirma}>
                  {krotkaFirma(o.firma)}
                  <a href="#o-firmie">Pokaż profil firmy</a>
                </p>
                <div className={s.waznosc}>
                  <span className={s.waznoscPasek}>
                    <i style={{ width: `${procent}%` }} />
                  </span>
                  <span>
                    {doKonca > 0 ? (
                      <>
                        <b>ważna jeszcze {doKonca} {doKonca === 1 ? "dzień" : "dni"}</b> (do {wazne.getDate()} {MIES[wazne.getMonth()]})
                      </>
                    ) : (
                      <b>oferta wygasła</b>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className={s.pigulkiDuze}>
              {pigulki.map(([d, t]) => (
                <span className={s.pigDuza} key={t}>
                  <Ikona d={d} />
                  {t}
                </span>
              ))}
            </div>
          </article>

          <section className={s.oferta}>
            <h2 className={s.sekcjaH}>Dodatkowe informacje</h2>
            <dl className={s.tabelka}>
              {informacje.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd className={v === "nie podano" ? s.nieznane : ""}>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={s.oferta}>
            <p className={s.etykietaSekcji}>Opis stanowiska</p>
            {o.opis && o.zFirmy && <Tekst tekst={o.opis} lead />}
            {o.opis && !o.zFirmy && struktura && (
              // 18.10 (USER_001): opis z Adzuna rozbity szablonem na sekcje i punkty (lib/bruno/praca/opis.ts).
              <div className={s.tekst}>
                {struktura.lead && <p className={s.tekstLead}>{struktura.lead}{struktura.sekcje.length ? "" : struktura.uciety ? "…" : ""}</p>}
                {struktura.sekcje.map((x) => (
                  <Sekcja key={x.tytul} tytul={x.tytul} punkty={x.punkty} />
                ))}
              </div>
            )}
            {maSekcje && (
              <div className={s.tekst}>
                <Sekcja tytul="Twój zakres obowiązków" punkty={o.obowiazki} />
                <Sekcja tytul="Nasze wymagania" punkty={o.wymagania} />
                <Sekcja tytul="Mile widziane" punkty={o.mileWidziane} />
                <Sekcja tytul="To oferujemy" punkty={o.oferujemy} />
              </div>
            )}
            {!maSekcje && (
              <>
                {o.umiejetnosci.length > 0 && (
                  <>
                    <h2 className={s.sekcjaH}>Umiejętności</h2>
                    <div className={s.tagi}>
                      {o.umiejetnosci.map((u) => (
                        <span className={`${s.tag} ${s.tagCieply}`} key={u}>
                          {u}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                <p className={s.dodana}>Oferta dodana: {data(new Date(o.dodano))}</p>
                {wlasciciel ? (
                  <p className={s.podpowiedz}>Po aktywacji dodasz zakres obowiązków, wymagania, to, co oferujecie, i logo firmy.</p>
                ) : null}
              </>
            )}
          </section>

          <section className={s.oferta} id="o-firmie">
            <div className={s.firmaKarta}>
              <Inicjaly firma={o.firma} logo={o.logo} />
              <div>
                <h2 className={s.sekcjaH}>{krotkaFirma(o.firma)}</h2>
                <p className={s.firma}>
                  {o.zFirmy ? o.branza : `${o.branza} · ${ofertFirmy} ${ofertFirmy === 1 ? "oferta" : "ofert"} na salesbruno.com`}
                </p>
              </div>
            </div>
            {o.oFirmie && <Tekst tekst={o.oFirmie} />}
            {o.www && (
              <a className={s.linkStrzalka} href={o.www.startsWith("http") ? o.www : `https://${o.www}`} target="_blank" rel="noopener">
                Strona firmy →
              </a>
            )}
          </section>

          <div className={`${s.oferta} ${s.aplikujDol}`}>
            <Aplikuj className={`${s.btn} ${s.btnDuzy}`} id={o.id} firma={krotkaFirma(o.firma)} stanowisko={o.stanowisko} logo={o.logo} kandydat={kandydat} klauzule={klauzule} />
          </div>
          {!o.zFirmy && <p className={s.zrodlo}>Źródło oferty: {o.zrodlo}</p>}
          {reszta.length > 0 && (
            <section>
              <p className={s.etykietaSekcji}>Podobne oferty</p>
              <div className={s.siatka}>
                {reszta.map((x) => (
                  <Karta o={x} href={zPodgladem(`/praca/${x.id}`)} teraz={teraz} key={x.id} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className={s.bok}>
          <div className={s.aplikujKarta}>
            <Aplikuj className={`${s.btn} ${s.btnDuzy}`} id={o.id} firma={krotkaFirma(o.firma)} stanowisko={o.stanowisko} logo={o.logo} kandydat={kandydat} klauzule={klauzule} />
            <div className={s.odliczanie}>
              <span className={s.waznoscPasek}>
                <i style={{ width: `${procent}%` }} />
              </span>
              <span>{doKonca > 0 ? `Pozostało ${doKonca} ${doKonca === 1 ? "dzień" : "dni"} (do ${data(wazne)})` : "Oferta wygasła"}</span>
            </div>
            <AkcjeOferty id={o.id} tytul={`${o.stanowisko}, ${o.firma}`} />
          </div>
          {rekomendowana && (
            <div>
              <p className={s.etykietaSekcji}>Rekomendowana oferta</p>
              <Karta o={rekomendowana} href={zPodgladem(`/praca/${rekomendowana.id}`)} teraz={teraz} wyrozniona />
            </div>
          )}
          {!wlasciciel && konto?.typ !== "kandydat" && <KartaFirmy cena={CENA_MIESIAC} zalogowanyPracodawca={konto?.typ === "pracodawca"} />}
        </aside>
      </div>
      <Stopka />
      <Przegladane id={o.id} />
      <PasekDolny tytul={o.stanowisko} id={o.id} firma={krotkaFirma(o.firma)} logo={o.logo} kandydat={kandydat} klauzule={klauzule} />
    </div>
  );
}
