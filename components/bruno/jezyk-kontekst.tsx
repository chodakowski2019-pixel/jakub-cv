"use client";

import { createContext, useContext, useMemo } from "react";
import { locale, mnoga, tDla, type Jezyk, type T } from "@/lib/bruno/i18n";

// 11.10: język panelu Bruno dla komponentów w przeglądarce. Ustawia go app/bruno/layout.tsx
// z konta (bruno_konta.jezyk), a dla niezalogowanych z domeny (salesbruno.pl = pl).

const Kontekst = createContext<Jezyk>("en");

export function JezykProvider({ jezyk, children }: { jezyk: Jezyk; children: React.ReactNode }) {
  return <Kontekst.Provider value={jezyk}>{children}</Kontekst.Provider>;
}

/** Język panelu. */
export function useJezykPanelu(): Jezyk {
  return useContext(Kontekst);
}

/** t("Save", "Zapisz"), mnoga(n, ["call","calls"], ["rozmowa","rozmowy","rozmów"]), locale do dat. */
export function useT(): { t: T; jezyk: Jezyk; mnoga: (n: number, en: [string, string], pl: [string, string, string]) => string; locale: string } {
  const jezyk = useContext(Kontekst);
  return useMemo(() => ({ t: tDla(jezyk), jezyk, mnoga: (n, en, pl) => mnoga(jezyk, n, en, pl), locale: locale(jezyk) }), [jezyk]);
}
