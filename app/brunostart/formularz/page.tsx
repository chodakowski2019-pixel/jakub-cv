import type { Metadata } from "next";
import s from "../start.module.css";
import Formularz from "./formularz";
import { pakiet } from "../dane";

// 5.11 (USER_001): strona po płatności Stripe za pakiet z /start (adres powrotu w Payment Linku: /start/formularz?pakiet=<id>).
// Formularz: co chce sprzedawać → API /api/bruno/start → komunikat „Zespół Bruno tworzy dla Ciebie konto, do 24 h, dostęp na e-mail”.
export const metadata: Metadata = { title: "Jeszcze jeden krok | Bruno AI", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  const p = pakiet(typeof sp.pakiet === "string" ? sp.pakiet : null);
  const zrodlo = typeof sp.src === "string" ? sp.src : "";
  return (
    <div className={`${s.root} bruno-lp-jasne`}>
      <nav className={s.nav}>
        <div className={s.navIn}>
          <a className={s.logo} href="/start">
            Bruno AI<i />
          </a>
        </div>
      </nav>
      <main className={s.wasko}>
        <span className={s.wezwanie}>Płatność przyjęta</span>
        <h1 className={s.h1} style={{ fontSize: "clamp(30px, 5vw, 44px)" }}>
          Jeszcze jeden krok. <span className={s.g}>Powiedz Bruno, czego ma Cię nauczyć.</span>
        </h1>
        <p className={s.lead}>Na tej podstawie ustawimy Twojego klienta AI: branżę, produkt i obiekcje, które słyszysz. Zajmie Ci to 2 minuty.</p>
        <Formularz pakietId={p?.id ?? null} zrodlo={zrodlo} />
      </main>
    </div>
  );
}
