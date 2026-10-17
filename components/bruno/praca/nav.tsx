import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import s from "./praca.module.css";
import { SALESBRUNO } from "./wspolne";
import ZalogujMenu from "./zaloguj-menu";

// 17.10: nawigacja portalu /praca (serwer: czyta sesję praca_sesja). Zalogowany = „Mój panel” zamiast „Zaloguj się”.
export async function Nav() {
  const konto = await zalogowanePraca();
  return (
    <nav className={s.nav}>
      <a className={s.logo} href="/praca">
        SalesBruno.pl<i className={s.kropka} />
        <span className={s.logoPraca}>Praca</span>
      </a>
      <div className={s.navLinki}>
        <a className={s.navLink} href="/praca">Oferty pracy</a>
        <a className={s.navLink} href={SALESBRUNO}>Trening z AI</a>
        {konto?.typ !== "kandydat" && (
          <a className={`${s.navLink} ${s.navObrys}`} href={konto ? "/praca/panel?z=dodaj" : "/praca/konto?typ=pracodawca&tryb=rejestracja&dalej=/praca/panel?z=dodaj"}>
            Dodaj ogłoszenie
          </a>
        )}
        {konto ? (
          <a className={s.navCta} href="/praca/panel">
            Mój panel
          </a>
        ) : (
          <ZalogujMenu />
        )}
      </div>
    </nav>
  );
}
