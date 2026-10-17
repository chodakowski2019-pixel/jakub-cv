import type { Metadata } from "next";
import { KartaFirmy, Nav, Stopka } from "@/components/bruno/praca/wspolne";
import s from "@/components/bruno/praca/praca.module.css";
import { CENA_MIESIAC } from "@/lib/bruno/praca/oferty";

// 17.10: strona pracodawcy. Panelu firm jeszcze nie ma: logowanie i rejestracja pracodawcy prowadzą tutaj,
// ogłoszenie dodaje się mailem. Firma z naszego maila ma swój link do aktywacji (/praca/<id>?k=...).
export const metadata: Metadata = { title: "Dla pracodawców | SalesBruno.pl Praca", robots: { index: false } };

export default function Page() {
  return (
    <div className={s.root} lang="pl">
      <Nav />
      <main className={s.stronaWyboru}>
        <h1 className={s.ofertaH}>Dla pracodawców</h1>
        <div id="dodaj">
          <KartaFirmy cena={CENA_MIESIAC} />
        </div>
      </main>
      <Stopka />
    </div>
  );
}
