import { redirect } from "next/navigation";
import OfertaWyszukiwarki from "./oferta-wyszukiwarki";
import { PoleSzukania } from "./szukaj-handlowca";
import { odczytajOpis } from "@/lib/bruno/praca/opis-szukania";
import { odblokowaneId, szukajHandlowcow, zamazaneZdjecia, zapiszWyszukiwanie, type Filtry } from "@/lib/bruno/praca/handlowcy";
import { PACZKA, znaczkiRynku } from "@/lib/bruno/praca/kontakty-cennik";
import { maKryteria } from "@/lib/bruno/praca/zlecenia";
import g from "./gielda.module.css";
import h from "./handlowcy.module.css";

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
      {top.length > 0 && (
        <div className={g.zmienneLp}>
          <ul className={`${h.siatka} ${g.siatkaTop}`}>
            {top.map((k) => (
              <li key={k.id} className={h.karta}>
                <div className={h.kartaGora}>
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
                    <span className={h.inicjal} aria-hidden="true">{k.imie[0]}</span>
                  )}
                  <div>
                    <h3 className={h.imie}>{k.imie}</h3>
                    <p className={h.rola}>{[k.stanowisko, k.miasto].filter(Boolean).join(" · ")}</p>
                    {juzMam.has(k.id) && <p className={h.ok}>Kontakt już w panelu</p>}
                  </div>
                </div>
                <div className={h.kartaTresc}>
                  <div className={h.fakty}>
                    <div>
                      <span className={h.etykieta}>W sprzedaży</span>
                      <p>{k.lata}</p>
                    </div>
                    {k.dopasowanie != null && (
                      <div>
                        <span className={h.etykieta}>Dopasowanie</span>
                        <p className={h.dopasowanie}>{k.dopasowanie} %</p>
                        <div className={h.pasekDop} aria-hidden="true">
                          <i style={{ width: `${k.dopasowanie}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={h.etykieta}>Branże</span>
                  <ul className={h.tagi}>
                    {k.branze.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                    {znaczkiRynku(k.rynek).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <span className={h.etykieta}>Mocne strony</span>
                  <ul className={h.tagi}>
                    {k.mocne.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {karty.length === 0 && <p className="p-karta p-pusto">Subskrypcja albo gwarancja: szukamy dalej z tym samym opisem, bez dodawania oferty drugi raz.</p>}
      <OfertaWyszukiwarki
        opis={opis}
        doOdblokowania={top.filter((k) => !juzMam.has(k.id)).map((k) => k.id)}
        maKryteria={maKryteria(filtry)}
        test={!process.env.BRUNO_STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production"}
      />
    </div>
  );
}
