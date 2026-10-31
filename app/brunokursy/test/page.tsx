import type { Metadata } from "next";
import s from "../kursy.module.css";
import Rama from "../rama";
import Test from "./test";

// 30.10 (USER_001): salesbruno.pl/kursy/test = test predyspozycji (4 pytania → e-mail → profil + kurs). Bez rozmowy z Bruno.
export const metadata: Metadata = {
  title: "Test: jaki handlowiec z Ciebie? | Bruno AI",
  description: "4 pytania. Sprawdź, w jakiej sprzedaży odnajdziesz się najlepiej, i dostań dopasowany kurs.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Rama>
      <div className={s.wasko}>
        <section className={s.hero} style={{ paddingBottom: 12 }}>
          <span className={s.znaczek}>4 pytania · bezpłatnie</span>
          <h1 className={s.tytul}>Jaki handlowiec z Ciebie?</h1>
          <p className={s.podtytul}>Odpowiedz na 4 pytania. Pokażemy Twój styl sprzedaży i kurs, który do Ciebie pasuje.</p>
        </section>
        <Test />
      </div>
    </Rama>
  );
}
