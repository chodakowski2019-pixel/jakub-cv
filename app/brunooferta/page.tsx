import type { Metadata } from "next";
import s from "@/components/podglad/bruno-lp/bruno-lp.module.css";
import o from "./oferta.module.css";
import { MINIMUM_KONT, PAKIETY, PRZYKLAD_KONT, ZAWARTOSC, koszt, zl } from "@/lib/bruno/oferta-pakiety";

// 4.11 (USER_001): salesbruno.pl/oferta = 3 pakiety Bruno AI Polska (3 tabele: warunki, zawartość, przykład na rok).
// Tylko PL (Polska = offline + ta strona jako załącznik do rozmowy). Styl = LP Bruno (bruno-lp.module.css).
// Na razie bez indeksowania (propozycja, czeka na decyzję USER_001 o cenach). Każdy przycisk → /spotkanie.
export const metadata: Metadata = {
  title: "Oferta Bruno AI dla firm | 3 pakiety",
  description: "Bruno podpięty pod Twój CRM, audyt sprzedaży albo własny system. Ceny netto, 3 pakiety.",
  robots: { index: false, follow: false },
};

const SPOTKANIE = "/spotkanie";

export default function Page() {
  return (
    <div className={`${s.root} ${o.root} bruno-lp-jasne`}>
      <nav className={s.nav}>
        <div className={s.navL}>
          <a className={s.logo} href="/">
            Bruno AI
          </a>
        </div>
        <a className={`${s.pill} ${s.pillBlack} ${s.navCta}`} href={SPOTKANIE}>
          <span className={s.dot}>+</span>
          Umów rozmowę
        </a>
      </nav>

      <header className={o.hero}>
        <span className={o.znaczek}>Oferta dla firm w Polsce</span>
        <h1 className={o.h1}>
          Trzy pakiety.
          <br />
          <span className={s.g}>Jeden Bruno.</span>
        </h1>
        <p className={o.sub}>
          Ceny netto. Abonament za jedno konto handlowca miesięcznie, konta zarządzających płatne tak samo. Minimum {MINIMUM_KONT} konta.
        </p>
      </header>

      {/* ---------- 1. WARUNKI ---------- */}
      <section className={o.sekcja} aria-labelledby="warunki">
        <h2 id="warunki" className={o.h2}>
          <span className={o.nr}>01</span> Warunki
        </h2>
        <p className={o.podpowiedz}>Przesuń tabelę w bok, żeby zobaczyć pakiety 2 i 3.</p>
        <div className={o.tabelaWrap}>
          <table className={`${o.tabela} ${o.tabelaWarunki}`}>
            <thead>
              <tr>
                <th scope="col" />
                {PAKIETY.map((p) => (
                  <th key={p.nr} scope="col" className={p.rekomendowany ? o.rek : undefined}>
                    {p.rekomendowany && <span className={o.rekZnaczek}>Rekomendowany</span>}
                    <span className={o.pakietNr}>Pakiet {p.nr}</span>
                    <span className={o.pakietNazwa}>{p.nazwa}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Opłata startowa</th>
                {PAKIETY.map((p) => (
                  <td key={p.nr} className={`${o.liczba} ${p.rekomendowany ? o.rek : ""}`}>
                    {p.start === 0 ? "0 zł" : zl(p.start)}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">1 konto na osobę miesięcznie</th>
                {PAKIETY.map((p) => (
                  <td key={p.nr} className={`${o.liczba} ${o.duza} ${p.rekomendowany ? o.rek : ""}`}>
                    {zl(p.abonament)}
                    <small>netto</small>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Wdrożenie</th>
                {PAKIETY.map((p) => (
                  <td key={p.nr} className={p.rekomendowany ? o.rek : undefined}>
                    {p.wdrozenie}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Dla kogo</th>
                {PAKIETY.map((p) => (
                  <td key={p.nr} className={p.rekomendowany ? o.rek : undefined}>
                    {p.dlaKogo}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Zawarcie</th>
                {PAKIETY.map((p) => (
                  <td key={p.nr} className={p.rekomendowany ? o.rek : undefined}>
                    {p.zawarcie}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- 2. CO JEST W ŚRODKU ---------- */}
      <section className={o.sekcja} aria-labelledby="zawartosc">
        <h2 id="zawartosc" className={o.h2}>
          <span className={o.nr}>02</span> Co jest w środku
        </h2>
        <div className={o.tabelaWrap}>
          <table className={`${o.tabela} ${o.tabelaZawartosc}`}>
            <thead>
              <tr>
                <th scope="col">Element</th>
                {PAKIETY.map((p) => (
                  <th key={p.nr} scope="col" className={`${o.kol} ${p.rekomendowany ? o.rek : ""}`}>
                    <span className={o.pakietNr}>Pakiet {p.nr}</span>
                    <span className={o.pakietNazwaMala}>{p.nazwa}</span>
                  </th>
                ))}
              </tr>
            </thead>
            {ZAWARTOSC.map((sek) => (
              <tbody key={sek.tytul}>
                <tr className={o.grupa}>
                  <th scope="rowgroup" colSpan={PAKIETY.length + 1}>
                    {sek.tytul}
                  </th>
                </tr>
                {sek.wiersze.map((w) => (
                  <tr key={w.t}>
                    <td>{w.t}</td>
                    {PAKIETY.map((p) => {
                      const jest = w.w.includes(p.nr);
                      return (
                        <td key={p.nr} className={`${o.kol} ${p.rekomendowany ? o.rek : ""}`} aria-label={jest ? "tak" : "nie"}>
                          {jest ? <span className={o.tak}>✓</span> : <span className={o.nie}>·</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      {/* ---------- 3. PRZYKŁAD ---------- */}
      <section className={o.sekcja} aria-labelledby="przyklad">
        <h2 id="przyklad" className={o.h2}>
          <span className={o.nr}>03</span> Przykład: 5 handlowców + szef
        </h2>
        <p className={o.pod}>{PRZYKLAD_KONT} kont, ceny netto.</p>
        <div className={o.tabelaWrap}>
          <table className={`${o.tabela} ${o.tabelaPrzyklad}`}>
            <thead>
              <tr>
                <th scope="col" />
                {PAKIETY.map((p) => (
                  <th key={p.nr} scope="col" className={p.rekomendowany ? o.rek : undefined}>
                    <span className={o.pakietNr}>Pakiet {p.nr}</span>
                    <span className={o.pakietNazwaMala}>{p.nazwa}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Opłata startowa</th>
                {PAKIETY.map((p) => (
                  <td key={p.nr} className={`${o.liczba} ${p.rekomendowany ? o.rek : ""}`}>
                    {zl(koszt(p).start)}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Abonament, 1 miesiąc</th>
                {PAKIETY.map((p) => (
                  <td key={p.nr} className={`${o.liczba} ${p.rekomendowany ? o.rek : ""}`}>
                    {zl(koszt(p).miesiac)}
                  </td>
                ))}
              </tr>
              <tr className={o.suma}>
                <th scope="row">Razem na start</th>
                {PAKIETY.map((p) => (
                  <td key={p.nr} className={`${o.liczba} ${p.rekomendowany ? o.rek : ""}`}>
                    {zl(koszt(p).pierwszy)}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Każdy kolejny miesiąc</th>
                {PAKIETY.map((p) => (
                  <td key={p.nr} className={`${o.liczba} ${p.rekomendowany ? o.rek : ""}`}>
                    {zl(koszt(p).kolejne)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <div className={`${s.cta} ${o.cta}`}>
        <div>
          <h2>
            Który pakiet dla Twojego zespołu?
            <br />
            <span className={s.g}>20 minut. Online.</span>
          </h2>
          <div className={s.ctaBtns}>
            <a className={`${s.btnDark} ${s.btnBig}`} href={SPOTKANIE}>
              Umów rozmowę, 20 minut
            </a>
          </div>
        </div>
        <div className={s.side}>
          <p>Wybierz termin. W 20 minut online pokażę Ci Bruno na najtrudniejszym etapie Twojego zespołu i powiem, który pakiet ma sens.</p>
          <div className={s.founder}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jakub.jpg" alt="Jakub Chodakowski" width={46} height={46} />
            <div>
              <b>Jakub Chodakowski</b>
              <span>Założyciel Bruno AI</span>
            </div>
          </div>
        </div>
      </div>

      <div className={s.lepki}>
        <a className={`${s.btnDark} ${s.btnBig}`} href={SPOTKANIE}>
          Umów rozmowę, 20 minut
        </a>
      </div>

      <footer className={s.footer}>
        <span>Bruno AI</span>
        <nav className={s.footerLinki} aria-label="Dokumenty">
          <a href="/regulamin">Regulamin</a>
          <a href="/polityka-prywatnosci">Polityka prywatności</a>
          <a href="/bezpieczenstwo">Bezpieczeństwo i dane</a>
        </nav>
        <span>Trening sprzedaży z AI podpięty pod Twój CRM</span>
      </footer>
    </div>
  );
}
