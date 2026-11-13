import { redirect } from "next/navigation";
import OfertaWyszukiwarki from "./oferta-wyszukiwarki";
import { PoleSzukania } from "./szukaj-handlowca";
import { odczytajOpis } from "@/lib/bruno/praca/opis-szukania";
import { odblokowaneId, szukajHandlowcow, zamazaneZdjecia, zapiszWyszukiwanie, type Filtry } from "@/lib/bruno/praca/handlowcy";
import { PACZKA, znaczkiRynku } from "@/lib/bruno/praca/kontakty-cennik";
import { maKryteria } from "@/lib/bruno/praca/zlecenia";
import { kluczStripePraca } from "@/lib/bruno/stripe";
import g from "./gielda.module.css";

// 12.11 (USER_001): wynik publicznej wyszukiwarki /wyszukiwarka. Liczba dopasowanych + 3 najlepiej dopasowanych handlowców
// (zdjęcie, jeśli jest, tylko jako zamazana plama), pod spodem zakup: paczka, subskrypcja, gwarancja.
// Panel firmy (/praca/panel?z=szukaj) zostaje przy starym widoku z wyborem osób (wynik-szukania.tsx).
const ADRES = "/wyszukiwarka?q=";

export default async function WynikWyszukiwarki({ opis: surowy, kontoId }: { opis: string; kontoId: string | null }) {
  const opis = surowy.slice(0, 600);
  if (opis.trim().length < 2) redirect("/wyszukiwarka");
  const { filtry, etykiety } = odczytajOpis(opis);
  const [karty, mam] = await Promise.all([szukajHandlowcow(filtry), kontoId ? odblokowaneId(kontoId) : Promise.resolve([])]);
  await zapiszWyszukiwanie({ ...filtry, opis } as Filtry & { opis: string }, karty.length, kontoId);
  const top = karty.slice(0, PACZKA.ile);
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
            Codziennie dodajemy do bazy nowych handlowców.
          </p>
          <div className={g.chipy} style={{ marginTop: 12 }}>
            {etykiety.length ? etykiety.map((e) => <span key={e} className="p-chip">{e}</span>) : <span className="p-chip">Bez zawężania: wszyscy handlowcy</span>}
          </div>
        </div>
      </div>
      {/* 13.11 (USER_001: „w lepszej tabeli poukładane i cienka obwódka wokół”): karta = nagłówek + wiersze etykieta / wartość. */}
      {top.length > 0 && (
        <ul className={g.kartyH}>
          {top.map((k) => (
            <li key={k.id} className={g.kartaH}>
              <div className={g.kartaHGora}>
                {zdjecia[k.id] ? (
                  <span className={g.fotoZamazane} title="Zdjęcie widoczne po odblokowaniu">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={zdjecia[k.id]} alt="" />
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                ) : (
                  <span className={g.kartaHInicjal} aria-hidden="true">{k.imie[0]}</span>
                )}
                <div>
                  <h3>{k.imie}</h3>
                  <p>{[k.stanowisko, k.miasto].filter(Boolean).join(" · ")}</p>
                </div>
                {juzMam.has(k.id) && <span className="p-chip">Kontakt w panelu</span>}
              </div>
              <dl className={g.kartaHWiersze}>
                {k.dopasowanie != null && (
                  <div>
                    <dt>Dopasowanie</dt>
                    <dd>
                      <b>{k.dopasowanie} %</b>
                      <span className={g.kartaHPasek} aria-hidden="true">
                        <i style={{ width: `${k.dopasowanie}%` }} />
                      </span>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>W sprzedaży</dt>
                  <dd>{k.lata}</dd>
                </div>
                {znaczkiRynku(k.rynek).length > 0 && (
                  <div>
                    <dt>Sprzedaje</dt>
                    <dd>{znaczkiRynku(k.rynek).join(" i ")}</dd>
                  </div>
                )}
                <div>
                  <dt>Branże</dt>
                  <dd>{k.branze.filter((x) => x !== "Inna").join(", ") || "Inna"}</dd>
                </div>
                <div>
                  <dt>Mocne strony</dt>
                  <dd>{k.mocne.join(", ")}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
      {karty.length === 0 && <p className="p-karta p-pusto">Subskrypcja albo gwarancja: szukamy dalej z tym samym opisem, bez dodawania oferty drugi raz.</p>}
      <OfertaWyszukiwarki
        opis={opis}
        doOdblokowania={top.filter((k) => !juzMam.has(k.id)).map((k) => k.id)}
        maKryteria={maKryteria(filtry)}
        test={!kluczStripePraca() && process.env.NODE_ENV !== "production"}
      />
    </div>
  );
}
