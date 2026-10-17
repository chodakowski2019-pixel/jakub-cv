// 17.10: wzory klauzul RODO pracodawcy (czysty plik: używa go serwer i panel w przeglądarce).
import type { KontoPraca } from "./konta";

/** Nazwa firmy w ogłoszeniach: krótka nazwa z profilu albo pełna z rejestracji. */
export const nazwaFirmy = (k: Pick<KontoPraca, "nazwa_wyswietlana" | "firma">) => k.nazwa_wyswietlana || k.firma || "Firma";

/** 17.10: wzór klauzuli informacyjnej RODO dla pracodawcy (dane firmy wstawione, jeśli są). */
export function wzorKlauzuli(k: Partial<KontoPraca>): string {
  const nazwa = k.fv_nazwa || k.firma || "[PEŁNA NAZWA FIRMY]";
  const adres = k.fv_adres && k.fv_miasto ? `${k.fv_adres}, ${k.fv_kod ?? ""} ${k.fv_miasto}`.replace(/\s+/g, " ") : "[ADRES SIEDZIBY]";
  return `Administratorem Twoich danych jest ${nazwa}, ${adres} (dalej: „Administrator”). Dane przetwarzamy w celu rekrutacji na stanowisko z ogłoszenia, na podstawie Kodeksu pracy (art. 6 ust. 1 lit. c RODO) w zakresie danych obowiązkowych, Twojej zgody (art. 6 ust. 1 lit. a RODO) w zakresie danych dodatkowych oraz naszego prawnie uzasadnionego interesu (art. 6 ust. 1 lit. f RODO) w zakresie obrony przed roszczeniami. Podanie danych wymaganych Kodeksem pracy jest obowiązkowe, pozostałych dobrowolne. Dane przechowujemy do zakończenia rekrutacji i przez okres przedawnienia roszczeń, a przy zgodzie na przyszłe rekrutacje do jej wycofania, nie dłużej niż 24 miesiące. Odbiorcami mogą być nasi dostawcy usług rekrutacyjnych, w tym Jakub Chodakowski, operator serwisu SalesBruno.pl. Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia i przenoszenia, wniesienia sprzeciwu oraz skargi do Prezesa UODO. Zgodę możesz wycofać w każdej chwili, bez wpływu na przetwarzanie sprzed wycofania. Dane nie podlegają profilowaniu.`;
}
export const WZOR_PRZYSZLE = "Zgadzam się na przetwarzanie moich danych osobowych w przyszłych procesach rekrutacyjnych prowadzonych przez Administratora, przez okres 24 miesięcy.";
