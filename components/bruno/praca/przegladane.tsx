"use client";

import { useEffect } from "react";

// 18.10 (wzór RocketJobs): „Ostatnio przeglądane”. Strona oferty zapisuje id w tej przeglądarce (ostatnie 20).
export const KLUCZ_PRZEGLADANE = "bruno_praca_przegladane";
export function czytajPrzegladane(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KLUCZ_PRZEGLADANE) ?? "[]");
  } catch {
    return [];
  }
}
export default function Przegladane({ id }: { id: string }) {
  useEffect(() => {
    try {
      const l = [id, ...czytajPrzegladane().filter((x) => x !== id)].slice(0, 20);
      localStorage.setItem(KLUCZ_PRZEGLADANE, JSON.stringify(l));
    } catch {}
  }, [id]);
  return null;
}
