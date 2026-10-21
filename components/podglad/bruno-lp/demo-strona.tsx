"use client";

import Rezerwacja from "./rezerwacja";
import s from "./bruno-lp.module.css";
import { adresStrony, useJezyk, useNaDomenie } from "../aurora/jezyk";
import type { Jezyk } from "@/lib/bruno/domeny";

// 21.10 (USER_001): podstrona /demo = TYLKO kalendarz spotkania online z USER_001 (ten sam formularz,
// co dawniej w LP po kliknięciu). Każdy przycisk na stronie firm prowadzi tu. Powód: 3 osoby z eventu
// 20.10 nie założyły konta samodzielnie; sprzedaż = spotkanie 20 min z Bruno pokazanym na żywo z ekranu USER_001.
export default function DemoStrona({ jezykStart, naDomenieStart = false }: { jezykStart?: Jezyk; naDomenieStart?: boolean }) {
  const jezyk = useJezyk(jezykStart);
  const naDomenie = useNaDomenie(naDomenieStart);
  const doStrony = () => {
    window.location.href = adresStrony(jezyk, "firmy", naDomenie);
  };
  return (
    <div className={`${s.root} bruno-lp-jasne`}>
      <nav className={`${s.nav} ${s.navFormularz}`}>
        <div className={s.navL}>
          <a className={s.logo} href={adresStrony(jezyk, "firmy", naDomenie)}>
            Bruno AI
          </a>
        </div>
      </nav>
      <Rezerwacja jezyk={jezyk} zrodlo="demo" onWstecz={doStrony} />
    </div>
  );
}
