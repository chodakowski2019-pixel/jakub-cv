import type { Metadata } from "next";
import s from "../brunokursy/kursy.module.css";
import Ankieta from "./ankieta";

// 11.11 (USER_001): najpierw ankieta, potem 3 dopasowane szkolenia z bazy (lib/bruno/polecenia.ts). Tylko localhost, bez indeksowania.
export const metadata: Metadata = {
  title: "Polecane szkolenia sprzedażowe | Bruno AI",
  description: "Odpowiedz na 5 pytań. Pokażemy 3 szkolenia sprzedażowe dopasowane do Ciebie.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className={s.strona} style={{ fontFamily: 'var(--font-elm), "Poppins", system-ui, sans-serif' }}>
      <header className={s.nav}>
        <div className={s.navWnetrze}>
          <span className={s.logo}>
            <img src="/bruno/ikona-96.png" alt="" width={34} height={34} />
            <span>Bruno AI · Polecenia</span>
          </span>
        </div>
      </header>
      <div className={s.wasko}>
        <section className={s.hero}>
          <span className={s.znaczek}>5 pytań · 3 szkolenia</span>
          <h1 className={s.tytul}>Znajdź szkolenie sprzedażowe dla siebie</h1>
          <p className={s.podtytul}>Odpowiedz na 5 pytań. Pokażemy 3 szkolenia, które najlepiej pasują.</p>
        </section>
        <Ankieta />
      </div>
      <footer className={s.stopka}>Bruno AI · salesbruno.pl</footer>
    </main>
  );
}
