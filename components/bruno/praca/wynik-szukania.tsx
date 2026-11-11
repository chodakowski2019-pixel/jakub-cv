import { redirect } from "next/navigation";
import HandlowcyWyniki from "./handlowcy-wyniki";
import { PoleSzukania, ADRES_PANELU } from "./szukaj-handlowca";
import { odczytajOpis } from "@/lib/bruno/praca/opis-szukania";
import { odblokowaneId, szukajHandlowcow, zapiszWyszukiwanie, type Filtry } from "@/lib/bruno/praca/handlowcy";
import { handlowcow } from "@/lib/bruno/praca/kontakty-cennik";
import g from "./gielda.module.css";

// 12.11 (USER_001): wynik wyszukiwania z opisu firmy, wspólny dla panelu firmy i publicznej strony /wyszukiwarka.
// Opis → filtry (bez AI), te same karty i zakup kontaktów co na /praca/handlowcy. Bez konta: płatność, potem konto firmy.
export default async function WynikSzukania({ opis: surowy, kontoId, naKoncie, adres = ADRES_PANELU }: { opis: string; kontoId: string | null; naKoncie: number; adres?: string }) {
  const opis = surowy.slice(0, 600);
  const pusty = adres === ADRES_PANELU ? "/praca/panel" : adres.split("?")[0];
  if (opis.trim().length < 2) redirect(pusty);
  const { filtry, etykiety } = odczytajOpis(opis);
  const [karty, mam] = await Promise.all([szukajHandlowcow(filtry), kontoId ? odblokowaneId(kontoId) : Promise.resolve([])]);
  await zapiszWyszukiwanie({ ...filtry, opis } as Filtry & { opis: string }, karty.length, kontoId);
  return (
    <div className={`p-strona ${g.wynikSzukania}`}>
      {/* Opis firmy w polu na górze: poprawka i ponowne szukanie bez wracania (na dole jest pasek zakupu kontaktów). */}
      <PoleSzukania key={opis} start={opis} male adres={adres} />
      <div className="p-naglowek">
        <div>
          <h1>{karty.length ? <>Mamy dla Ciebie <b className={g.liczbaWyniku}>{handlowcow(karty.length)}</b>.</> : "Nie mamy jeszcze takiego handlowca."}</h1>
          <div className={g.chipy} style={{ marginTop: 12 }}>
            {etykiety.length ? etykiety.map((e) => <span key={e} className="p-chip">{e}</span>) : <span className="p-chip">Bez zawężania: wszyscy handlowcy</span>}
          </div>
        </div>
      </div>
      {karty.length > 0 ? (
        <div className={g.zmienneLp}>
          <HandlowcyWyniki key={opis} karty={karty} odblokowane={mam} naKoncie={naKoncie} powrot={`${adres}${encodeURIComponent(opis)}`} test={!process.env.BRUNO_STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production"} />
        </div>
      ) : (
        <p className="p-karta p-pusto">Zmień opis: inna branża albo miasto. Baza rośnie codziennie.</p>
      )}
    </div>
  );
}
