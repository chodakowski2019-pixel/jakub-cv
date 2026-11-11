import d from "./dolacz.module.css";

// 11.11 (USER_001): pasek LP bazy handlowców: logo Bruno Sales po lewej, przycisk po prawej.
export default function BazaPasek({ cta }: { cta?: { href: string; tekst: string } }) {
  return (
    <div className={d.pasek}>
      <a className={d.logo} href="/praca" aria-label="Bruno Sales">
        <img src="/bruno/ikona.svg" alt="" width={30} height={30} />
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
