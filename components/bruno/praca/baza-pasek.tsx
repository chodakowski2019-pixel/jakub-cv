import d from "./dolacz.module.css";

// 11.11 (USER_001): pasek LP bazy handlowców: logo Bruno Sales po lewej, przycisk po prawej.
// 11.11 wieczór (USER_001): zamiast ikony Bruno zielona kulka z panelu (ta sama co awatar Bruno w czacie, rysowana w CSS).
export default function BazaPasek({ cta }: { cta?: { href: string; tekst: string } }) {
  return (
    <div className={d.pasek}>
      <a className={d.logo} href="/praca" aria-label="Bruno Sales">
        <i className={d.kulka} aria-hidden="true" />
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
