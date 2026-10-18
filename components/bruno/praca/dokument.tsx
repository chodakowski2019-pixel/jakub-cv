import { Nav } from "./nav";
import s from "./praca.module.css";
import { Stopka } from "./wspolne";

// 18.10: szablon dokumentów portalu /praca (regulamin, polityka prywatności).
export type SekcjaDok = { tytul: string; akapity?: React.ReactNode[]; punkty?: React.ReactNode[]; po?: React.ReactNode[] };

export default function Dokument({ tytul, data, wstep, sekcje }: { tytul: string; data: string; wstep: React.ReactNode; sekcje: SekcjaDok[] }) {
  return (
    <div className={s.root} lang="pl">
      <Nav />
      <main className={s.dokument}>
        <p className={s.aplikujEtykieta}>SalesBruno.pl Praca</p>
        <h1 className={s.ofertaH}>{tytul}</h1>
        <p className={s.drobny}>Obowiązuje od {data}</p>
        <div className={s.tekst}>
          <p>{wstep}</p>
          {sekcje.map((x) => (
            <section key={x.tytul}>
              <h3>{x.tytul}</h3>
              {x.akapity?.map((a, i) => <p key={i}>{a}</p>)}
              {x.punkty && (
                <ul>
                  {x.punkty.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
              {x.po?.map((a, i) => <p key={`po${i}`}>{a}</p>)}
            </section>
          ))}
        </div>
      </main>
      <Stopka />
    </div>
  );
}
