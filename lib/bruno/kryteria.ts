import type { Kryterium } from "./db";

// Wagi i nazwy 5 kryteriów rubryki (SalesAI/BRUNO-RUBRYKA.md). Osobny plik bez
// Supabase, bo czyta go też przeglądarka (feedback, statystyki). 10.10: nazwy EN.

export const WAGI: Record<Kryterium["nazwa"], number> = {
  otwarcie: 0.15,
  pytania: 0.25,
  obiekcje: 0.25,
  zamkniecie: 0.2,
  pewnosc: 0.15,
};

export const NAZWY: Record<Kryterium["nazwa"], string> = {
  otwarcie: "Opening",
  pytania: "Questions",
  obiekcje: "Objections",
  zamkniecie: "Closing",
  pewnosc: "Confidence",
};
