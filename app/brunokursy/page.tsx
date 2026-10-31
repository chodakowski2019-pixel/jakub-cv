import type { Metadata } from "next";
import Link from "next/link";
import s from "./kursy.module.css";
import Wyszukiwarka from "./wyszukiwarka";
import Rama from "./rama";
import { CENA, GWARANCJA, KURSY } from "@/lib/bruno/kursy";

// 30.10 (USER_001): salesbruno.pl/kursy = wyszukiwarka. Ktoś pisze, czego szuka, AI dobiera kurs i prowadzi na jego stronę.
// Na razie bez indeksowania (do decyzji USER_001 o starcie).
export const metadata: Metadata = {
  title: "Kursy sprzedaży z gwarancją pracy | Bruno AI",
  description: "Napisz, czego szukasz. Dobierzemy kurs sprzedaży dla Ciebie. 3 miesiące treningu z AI, certyfikat i pomoc w znalezieniu pracy.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Rama>
    <div className={s.wasko}>
      <section className={s.hero}>
        <span className={s.znaczek}>3 miesiące · certyfikat · gwarancja pracy</span>
        <h1 className={s.tytul}>Znajdź kurs sprzedaży dla siebie</h1>
        <p className={s.podtytul}>
          Napisz, czego szukasz. AI dobierze kurs do Twojej branży i doświadczenia. Po kursie łączymy Cię z pracodawcami.
        </p>
      </section>
      <Wyszukiwarka />
      <section className={s.sekcja}>
        <h2 className={s.h2}>Wszystkie kursy</h2>
        <div className={s.siatka}>
          {KURSY.map((k) => (
            <Link key={k.slug} href={`/kursy/${k.slug}`} className={s.karta} style={{ color: "inherit", textDecoration: "none" }}>
              <div className={s.miesiac}>
                {k.branza} · {k.poziom === "start" ? "Start" : "Pro"}
              </div>
              <h3>{k.tytul}</h3>
              <p style={{ margin: 0, color: "#b5bcc6", fontSize: "0.95rem" }}>{k.obietnica}</p>
            </Link>
          ))}
        </div>
        <p className={s.pod} style={{ textAlign: "center" }}>
          Każdy kurs: {CENA.miesiac} zł / mies. albo {CENA.zGory} zł z góry za {CENA.miesiecy} miesiące. Brak oferty pracy w {GWARANCJA.dniNaOferte} dni od
          certyfikatu = zwrot pieniędzy.
        </p>
      </section>
    </div>
    </Rama>
  );
}
