import type { Metadata } from "next";
import { Nav, Stopka } from "@/components/bruno/praca/wspolne";
import { IKONA_KANDYDAT, IKONA_PRACODAWCA, LINKI } from "@/components/bruno/praca/zaloguj-menu";
import s from "@/components/bruno/praca/praca.module.css";

// 17.10 (USER_001, wzór RocketJobs): strona wyboru logowania, kandydat albo pracodawca (na telefonie zamiast menu).
export const metadata: Metadata = { title: "Zaloguj się | SalesBruno.pl Praca", robots: { index: false } };

const Ikona = ({ d }: { d: string }) => (
  <span className={s.menuIkona}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  </span>
);

export default function Page() {
  const karty = [
    { d: IKONA_KANDYDAT, tekst: "Zaloguj się jako kandydat", href: LINKI.kandydatLogin, rej: LINKI.kandydatRejestracja },
    { d: IKONA_PRACODAWCA, tekst: "Zaloguj się jako pracodawca", href: LINKI.pracodawcaLogin, rej: LINKI.pracodawcaRejestracja },
  ];
  return (
    <div className={s.root} lang="pl">
      <Nav />
      <main className={s.stronaWyboru}>
        <h1 className={s.ofertaH}>Zaloguj się</h1>
        {karty.map((k) => (
          <div key={k.tekst}>
            <a className={s.wyborKarta} href={k.href}>
              <Ikona d={k.d} />
              {k.tekst}
            </a>
            <p className={s.wyborRej}>
              Nie masz konta? <a href={k.rej}>Zarejestruj się</a>
            </p>
          </div>
        ))}
      </main>
      <Stopka />
    </div>
  );
}
