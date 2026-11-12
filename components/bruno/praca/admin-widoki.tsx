import Link from "next/link";
import type { FirmaAdmin, HandlowiecAdmin, NiedokonczonyAdmin, Wyszukiwanie } from "@/lib/bruno/praca/admin";
import { KROKI } from "@/lib/bruno/praca/profil-handlowca";
import g from "./gielda.module.css";
import AdminUsun from "./admin-usun";
import AdminPrzypomnij from "./admin-przypomnij";

// 11.11 (USER_001): panel administratora giełdy (konto chodak.job72@gmail.com), dwie zakładki w układzie panelu Bruno:
// „Handlowcy” = wszystkie profile, klik otwiera profil z odhaczeniem „Zweryfikowany”; „Firmy” = konta firm i ich wyszukiwania.

const data = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Warsaw" });
const dataGodz = (iso: string) => new Date(iso).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });

const STATUS: Record<HandlowiecAdmin["status"], [string, string]> = {
  weryfikacja: ["Do weryfikacji", "p-chip-uwaga"],
  zatwierdzony: ["Zweryfikowany", "p-chip-ok"],
  odrzucony: ["Odrzucony", "p-chip-zle"],
};

export function AdminHandlowcy({ lista }: { lista: HandlowiecAdmin[] }) {
  const ile = (s: HandlowiecAdmin["status"]) => lista.filter((x) => x.status === s).length;
  return (
    <div className="p-strona">
      <div className="p-naglowek">
        <h1>Handlowcy</h1>
      </div>
      <div className="p-kafle">
        {(
          [
            ["Wszystkie profile", lista.length],
            ["Do weryfikacji", ile("weryfikacja")],
            ["Zweryfikowani", ile("zatwierdzony")],
            ["Odrzuceni", ile("odrzucony")],
          ] as [string, number][]
        ).map(([et, n]) => (
          <div className="p-kafel" key={et}>
            <span className="p-kafel-et">{et}</span>
            <span className="p-kafel-wart">{n}</span>
          </div>
        ))}
      </div>
      <div className="p-karta">
        {lista.length === 0 ? (
          <p className="p-pusto">Nikt jeszcze nie wypełnił profilu.</p>
        ) : (
          <div className="p-tabela-wrap">
            <table className={`p-tabela ${g.adminTabela}`}>
              <thead>
                <tr>
                  <th>Handlowiec</th>
                  <th>Stanowisko</th>
                  <th>Miasto</th>
                  <th>W sprzedaży</th>
                  <th>Kontakt</th>
                  <th>Firmy</th>
                  <th>Wysłano</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((x) => {
                  const [nazwa, chip] = STATUS[x.status];
                  return (
                    <tr key={x.id}>
                      <td>
                        <Link className="p-osoba" href={`/praca/panel?z=handlowiec&id=${x.id}`}>
                          {x.zdjecie ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="p-twarz-s" src={x.zdjecie} alt="" />
                          ) : (
                            <span className="p-inicjal" style={{ width: 36, height: 36 }}>{x.imie[0]?.toUpperCase()}</span>
                          )}
                          <b>{x.imie}</b>
                        </Link>
                      </td>
                      <td>{x.stanowisko}</td>
                      <td>{x.miasto}</td>
                      <td>{x.lata}</td>
                      <td>
                        {x.telefon}
                        <small>{x.email}</small>
                      </td>
                      <td>{x.firm}</td>
                      <td>{data(x.wyslano)}</td>
                      <td><span className={`p-chip ${chip}`}>{nazwa}</span></td>
                      <td><AdminUsun id={x.id} imie={x.imie} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// 12.11 (USER_001): „Niedokończone” = konta handlowców bez wysłanego profilu i krok, na którym przerwali formularz.
// Formularz ma KROKI.length kroków; kropki = kroki, wypełnione = te, do których handlowiec doszedł.
function Etap({ x }: { x: NiedokonczonyAdmin }) {
  if (x.krok === null) return <span className="p-chip">{x.bezDanych ? "Brak danych (konto sprzed 12.11)" : "Nie otworzył formularza"}</span>;
  return (
    <span>
      <span style={{ display: "flex", gap: 4, marginBottom: 6 }} aria-hidden="true">
        {KROKI.map((k, i) => (
          <i key={k.tytul} style={{ width: 18, height: 6, borderRadius: 3, background: i <= x.krok! ? "#141416" : "#dcdce0" }} />
        ))}
      </span>
      <b>
        Krok {x.krok + 1} z {KROKI.length}: {KROKI[x.krok].tytul}
      </b>
      <small>
        Wpisane pola: {x.wpisane} z {x.pol}
      </small>
    </span>
  );
}

export function AdminNiedokonczone({ lista }: { lista: NiedokonczonyAdmin[] }) {
  const wFormularzu = lista.filter((x) => x.krok !== null);
  return (
    <div className="p-strona">
      <div className="p-naglowek">
        <h1>Niedokończone</h1>
      </div>
      <div className="p-kafle">
        {(
          [
            ["Konto bez profilu", lista.length],
            ["Nie zaczęli albo brak danych", lista.length - wFormularzu.length],
            ["Przerwali w formularzu", wFormularzu.length],
            ["Doszli do ostatniego kroku", wFormularzu.filter((x) => x.krok === KROKI.length - 1).length],
          ] as [string, number][]
        ).map(([et, n]) => (
          <div className="p-kafel" key={et}>
            <span className="p-kafel-et">{et}</span>
            <span className="p-kafel-wart">{n}</span>
          </div>
        ))}
      </div>
      <div className="p-karta">
        {lista.length === 0 ? (
          <p className="p-pusto">Każdy, kto założył konto, wysłał profil.</p>
        ) : (
          <div className="p-tabela-wrap">
            <table className={`p-tabela ${g.adminTabela}`}>
              <thead>
                <tr>
                  <th>Handlowiec</th>
                  <th>Kontakt</th>
                  <th>Etap formularza</th>
                  <th>Konto od</th>
                  <th>Ostatnio w formularzu</th>
                  <th>Przypomnienie</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <span className="p-osoba">
                        <span className="p-inicjal" style={{ width: 36, height: 36 }}>{(x.imie || x.email)[0]?.toUpperCase()}</span>
                        <b>{x.imie || "Bez imienia"}</b>
                      </span>
                    </td>
                    <td>
                      {x.telefon || "brak telefonu"}
                      <small>{x.email}</small>
                    </td>
                    <td><Etap x={x} /></td>
                    <td>{dataGodz(x.od)}</td>
                    <td>{x.ostatnio ? dataGodz(x.ostatnio) : "-"}</td>
                    <td><AdminPrzypomnij id={x.id} email={x.email} ostatnie={x.przypomnienieAt} ile={x.przypomnien} /></td>
                    <td><AdminUsun id={x.id} imie={x.imie || x.email} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminFirmy({ firmy, wyszukiwania }: { firmy: FirmaAdmin[]; wyszukiwania: Wyszukiwanie[] }) {
  return (
    <div className="p-strona">
      <div className="p-naglowek">
        <h1>Firmy</h1>
      </div>
      <div className="p-kafle">
        {(
          [
            ["Firmy z kontem", firmy.length],
            ["Odblokowane kontakty", firmy.reduce((s, f) => s + f.odblokowane, 0)],
            ["Kontakty opłacone, do odblokowania", firmy.reduce((s, f) => s + f.kontakty, 0)],
            ["Wyszukiwania (ostatnie 500)", firmy.reduce((s, f) => s + f.wyszukiwania, 0) + wyszukiwania.filter((w) => !w.firma).length],
          ] as [string, number][]
        ).map(([et, n]) => (
          <div className="p-kafel" key={et}>
            <span className="p-kafel-et">{et}</span>
            <span className="p-kafel-wart">{n}</span>
          </div>
        ))}
      </div>

      <div className="p-karta">
        <div className="p-karta-hd"><h3 className={g.mocny}>Konta firm</h3></div>
        {firmy.length === 0 ? (
          <p className="p-pusto">Żadna firma nie ma jeszcze konta.</p>
        ) : (
          <div className="p-tabela-wrap">
            <table className={`p-tabela ${g.adminTabela}`}>
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Osoba</th>
                  <th>Kontakt</th>
                  <th>NIP</th>
                  <th>Odblokowani</th>
                  <th>Do odblokowania</th>
                  <th>Ogłoszenia</th>
                  <th>Szukała</th>
                  <th>Konto od</th>
                </tr>
              </thead>
              <tbody>
                {firmy.map((f) => (
                  <tr key={f.id}>
                    <td><b>{f.firma}</b></td>
                    <td>{f.osoba}</td>
                    <td>
                      {f.telefon}
                      <small>{f.email}</small>
                    </td>
                    <td>{f.nip ?? ""}</td>
                    <td>{f.odblokowane}</td>
                    <td>{f.kontakty}</td>
                    <td>{f.ogloszenia}</td>
                    <td>
                      {f.wyszukiwania}
                      {f.ostatnie && <small>ostatnio {dataGodz(f.ostatnie)}</small>}
                    </td>
                    <td>{data(f.od)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-karta">
        <div className="p-karta-hd">
          <h3 className={g.mocny}>Kogo szukają</h3>
          <span className="p-karta-hd-meta">50 ostatnich wyszukiwań handlowców</span>
        </div>
        {wyszukiwania.length === 0 ? (
          <p className="p-pusto">Nikt jeszcze nie szukał handlowca.</p>
        ) : (
          <div className="p-tabela-wrap">
            <table className={`p-tabela ${g.adminTabela}`}>
              <thead>
                <tr>
                  <th>Kiedy</th>
                  <th>Kto</th>
                  <th>Czego szukał</th>
                  <th>Wynik</th>
                </tr>
              </thead>
              <tbody>
                {wyszukiwania.map((w, i) => (
                  <tr key={i}>
                    <td>{dataGodz(w.kiedy)}</td>
                    <td>{w.firma ?? <span className="p-cichy">bez konta</span>}</td>
                    <td>{w.opis}</td>
                    <td>{w.wynik}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
