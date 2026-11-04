import type { Konto } from "./db";
import { czySzef, handlowcyFirmy, type Firma } from "./firmy";

// 4.11 (USER_001): lewy pasek dzieli się na „Bruno właściciela” i „Bruno handlowca”. Szef (demo) może wejść
// w zakładki handlowca: `?jako=handlowiec` (pierwszy handlowiec firmy) albo `?jako=<e-mail handlowca>`.
// Strony Czat / Klienci / Lejek / Statystyki liczą wtedy dane TEGO handlowca, nie całego zespołu.
// Handlowiec (rola rep) zawsze widzi swoje; parametr jest ignorowany. Tylko serwer.

export type Widok = {
  /** true = dane całego zespołu (szef bez `jako`). */
  szef: boolean;
  /** Konto, którego dane pokazujemy (szef albo wybrany handlowiec). */
  konto: Pick<Konto, "email" | "imie" | "zdjecie_url">;
  /** Wszyscy handlowcy firmy (do tabel szefa i pigułek przełącznika). */
  handlowcy: Konto[];
  /** Szef ogląda widok handlowca (pigułki „Widok handlowca: Julia · Kasia…”). */
  jakoHandlowiec: boolean;
  /** Wartość do dopisania do linków, żeby zostać w tym widoku. */
  jako: string | null;
};

export async function widokKonta(konto: Konto, firma: Firma | null, jako: string | string[] | undefined | null): Promise<Widok> {
  const szefKonta = czySzef(konto);
  const handlowcy = firma ? await handlowcyFirmy(firma.id) : [];
  const j = Array.isArray(jako) ? jako[0] : jako;
  if (!szefKonta || !j || !handlowcy.length) {
    return { szef: szefKonta, konto, handlowcy: szefKonta ? handlowcy : [konto], jakoHandlowiec: false, jako: null };
  }
  const wybrany = handlowcy.find((h) => h.email.toLowerCase() === String(j).toLowerCase()) ?? handlowcy[0];
  return { szef: false, konto: wybrany, handlowcy, jakoHandlowiec: true, jako: wybrany.email };
}

export { zJako } from "./linki";
