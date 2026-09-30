import type { Kryterium } from "./db";

// Nazwy i wagi kryteriów rubryki (SalesAI/BRUNO-RUBRYKA.md). Osobny plik bez
// SDK Anthropica, bo importują go komponenty kliencka i strony panelu.

export const WAGI: Record<Kryterium["nazwa"], number> = {
  otwarcie: 0.15,
  pytania: 0.25,
  obiekcje: 0.25,
  zamkniecie: 0.2,
  pewnosc: 0.15,
};

export const NAZWY: Record<Kryterium["nazwa"], string> = {
  otwarcie: "Otwarcie",
  pytania: "Pytania",
  obiekcje: "Obiekcje",
  zamkniecie: "Zamknięcie",
  pewnosc: "Pewność siebie",
};
