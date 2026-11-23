import { redirect } from "next/navigation";
import OfertaWyszukiwarki from "./oferta-wyszukiwarki";
import { PoleSzukania } from "./szukaj-handlowca";
import { odczytajOpis } from "@/lib/bruno/praca/opis-szukania";
import { odblokowaneId, szukajHandlowcow, zamazaneZdjecia, zapiszWyszukiwanie, type Filtry } from "@/lib/bruno/praca/handlowcy";
import WynikOsoby from "./wynik-osoby";
import { CENA_KONTAKTU } from "@/lib/bruno/praca/kontakty-cennik";
import { maKryteria } from "@/lib/bruno/praca/zlecenia";
import { kluczStripePraca } from "@/lib/bruno/stripe";
import g from "./gielda.module.css";

// 12.11 (USER_001): wynik publicznej wyszukiwarki /wyszukiwarka. Liczba dopasowanych + 3 najlepiej dopasowanych handlowców
// (zdjęcie, jeśli jest, tylko jako zamazana plama), pod spodem zakup: paczka, subskrypcja, gwarancja.
// Panel firmy (/praca/panel?z=szukaj) zostaje przy starym widoku z wyborem osób (wynik-szukania.tsx).
const ADRES = "/wyszukiwarka?q=";
/** Najwięcej kart w wyniku (zamazane zdjęcia liczy serwer, więc limit chroni czas strony). */
const POKAZ = 30;

export default async function WynikWyszukiwarki({ opis: surowy, kontoId }: { opis: string; kontoId: string | null }) {
  const opis = surowy.slice(0, 600);
  if (opis.trim().length < 2) redirect("/wyszukiwarka");
  const { filtry, etykiety } = odczytajOpis(opis);
  const [karty, mam] = await Promise.all([szukajHandlowcow(filtry), kontoId ? odblokowaneId(kontoId) : Promise.resolve([])]);
  await zapiszWyszukiwanie({ ...filtry, opis } as Filtry & { opis: string }, karty.length, kontoId);
  // 23.11 (USER_001): pokazujemy wszystkich dopasowanych (nie 3), każdego z checkboxem do odblokowania za 50 zł.
  const top = karty.slice(0, POKAZ);
  const zdjecia = await zamazaneZdjecia(top.map((k) => k.id));
  const juzMam = new Set(mam);
  return (
    <div className={`p-strona ${g.wynikPubliczny}`}>
      {/* Opis w polu na górze: poprawka i ponowne szukanie bez wracania do trzech okienek. */}
      <PoleSzukania key={opis} start={opis} male adres={ADRES} />
      <div className="p-naglowek">
        <div>
          <h1>{karty.length ? <>Mamy <b className={g.liczbaWyniku}>{karty.length}</b> {karty.length === 1 ? "dopasowanego handlowca" : "dopasowanych handlowców"}.</> : "Nie mamy jeszcze takiego handlowca."}</h1>
          <p>
            {karty.length > top.length ? `Poniżej ${top.length} najlepiej dopasowanych. ` : ""}
            Zaznacz osoby i odblokuj kontakt: {CENA_KONTAKTU} zł za osobę. Codziennie dodajemy do bazy nowych handlowców. Jeżeli nie mamy tych, których potrzebujesz, znajdziemy ich.
          </p>
          <div className={g.chipy} style={{ marginTop: 12 }}>
            {etykiety.length ? etykiety.map((e) => <span key={e} className="p-chip">{e}</span>) : <span className="p-chip">Bez zawężania: wszyscy handlowcy</span>}
          </div>
        </div>
      </div>
      {/* 23.11 (USER_001): szczegóły bez imienia, nazwiska, telefonu, e-maila; zdjęcie zamazane; checkbox + „Odblokuj {n} osób”. */}
      {/* Imię wycinamy na serwerze: props komponentu przeglądarkowego trafiają do HTML strony. */}
      {top.length > 0 && <WynikOsoby karty={top.map((k) => ({ ...k, imie: "" }))}zdjecia={zdjecia} odblokowane={[...juzMam]} powrot={`${ADRES}${encodeURIComponent(opis)}`} test={!kluczStripePraca() && process.env.NODE_ENV !== "production"} />}
      {karty.length === 0 && <p className="p-karta p-pusto">Wybierz pakiet, a znajdziemy handlowców dla Ciebie.</p>}
      <OfertaWyszukiwarki
        opis={opis}
        doOdblokowania={top.filter((k) => !juzMam.has(k.id)).map((k) => k.id)}
        maKryteria={maKryteria(filtry)}
        test={!kluczStripePraca() && process.env.NODE_ENV !== "production"}
      />
    </div>
  );
}
