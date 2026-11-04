import type { Metadata } from "next";
import s from "@/components/podglad/bruno-lp/bruno-lp.module.css";
import o from "../oferta.module.css";
import ZamowienieForm from "./zamowienie-form";

// 4.11 (USER_001, pkt 6): salesbruno.pl/oferta/zamowienie = FORMULARZ ZAMÓWIENIA PAKIETU + AKCEPTACJA REGULAMINU
// (zamiast umowy; pakiet 3 = umowa, „napisz”). Zapis do bruno_zamowienia (akceptacja z datą i IP, wersja oferty).
// Dalej (po decyzji): mail potwierdzający, faktura Stripe (start + 1. miesiąc), konta zakłada Admin po płatności.
export const metadata: Metadata = {
  title: "Zamówienie pakietu Bruno AI",
  description: "Wybierz pakiet, liczbę kont i zaakceptuj regulamin. Fakturę wyślemy na e-mail.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className={`${s.root} ${o.root} bruno-lp-jasne`}>
      <nav className={s.nav}>
        <div className={s.navL}>
          <a className={s.logo} href="/">
            Bruno AI
          </a>
        </div>
        <a className={`${s.pill} ${s.pillBlack} ${s.navCta}`} href="/oferta">
          <span className={s.dot}>←</span>
          Oferta
        </a>
      </nav>

      <header className={o.hero}>
        <span className={o.znaczek}>Zamówienie</span>
        <h1 className={o.h1}>
          Zamów pakiet.
          <br />
          <span className={s.g}>Start w 1 dzień.</span>
        </h1>
        <p className={o.sub}>Wypełnij, zaakceptuj regulamin, odbierz fakturę. Po opłaceniu zakładamy konta i umawiamy spotkanie startowe.</p>
      </header>

      <ZamowienieForm />

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
