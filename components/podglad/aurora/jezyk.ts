"use client";

import { useEffect, useState } from "react";
import { SCIEZKI, jezykZHosta, type Jezyk } from "@/lib/bruno/domeny";

// 9.10 (USER_001): angielski = główny język. Polski z dopiskiem ?pl w adresie (jak LP Bruno).
// 11.10: polski też na domenie salesbruno.pl.
export function jezykStrony(): "en" | "pl" {
  if (typeof window === "undefined") return "en";
  // 11.10 (USER_001): na domenach Bruno decyduje TYLKO domena (.pl = PL, .com = EN). ?pl tylko lokalnie / na podglądach.
  const zDomeny = jezykZHosta(window.location.hostname);
  if (zDomeny) return zDomeny;
  return new URLSearchParams(window.location.search).has("pl") ? "pl" : "en";
}

/** `start` = język policzony na serwerze (strona go podaje), wtedy bez mignięcia EN. */
export function useJezyk(start?: Jezyk): "en" | "pl" {
  const [j, setJ] = useState<"en" | "pl">(start ?? "en");
  useEffect(() => {
    setJ(jezykStrony());
  }, []);
  return j;
}

// 11.10: linki między stronami publicznymi Bruno. Na salesbruno.* ładne adresy (SCIEZKI),
// na innym hoście (localhost, podglądy Vercela) stare adresy, bo tam proxy nie robi rewrite.
export type CelBruno = "firmy" | "handlowcy" | "rejestracja" | "logowanie";
const STARE: Record<CelBruno, string> = { firmy: "/brunobusiness", handlowcy: "/brunoai", rejestracja: "/brunorejestracja", logowanie: "/bruno" };

export function adresStrony(jezyk: Jezyk, cel: CelBruno, naDomenie: boolean, hash = ""): string {
  if (naDomenie) return `${SCIEZKI[jezyk][cel]}${hash}`;
  return `${STARE[cel]}${jezyk === "pl" ? "?pl" : ""}${hash}`;
}

export function naDomenieBruno(): boolean {
  return typeof window !== "undefined" && jezykZHosta(window.location.hostname) !== null;
}

/** Hook: czy jesteśmy na salesbruno.* (start z serwera, potem sprawdzenie w przeglądarce). */
export function useNaDomenie(start?: boolean): boolean {
  const [d, setD] = useState(start ?? false);
  useEffect(() => {
    setD(naDomenieBruno());
  }, []);
  return d;
}
