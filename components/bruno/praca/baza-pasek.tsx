import d from "./dolacz.module.css";

// 11.11 (USER_001): pasek LP bazy handlowców: logo Bruno Sales po lewej, przycisk po prawej.
// 12.11 (USER_001): strona wraca do pomarańczu „tak jak było”, więc wraca też ikona Bruno (11.11 była tu zielona kulka, klasa .kulka zostaje w CSS).
export default function BazaPasek({ cta }: { cta?: { href: string; tekst: string } }) {
  return (
    <div className={d.pasek}>
      <a className={d.logo} href="/praca" aria-label="Bruno Sales">
        {/* 12.11 (USER_001): białe kółko na środku i większe = osobna ikona-praca.svg. */}
        <img src="/bruno/ikona-praca.svg" alt="" width={30} height={30} />
        Bruno Sales
      </a>
      {cta && (
        <a className={d.cta} href={cta.href}>
          {cta.tekst}
        </a>
      )}
    </div>
  );
}
