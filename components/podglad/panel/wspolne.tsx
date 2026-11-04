"use client";

import { useRouter } from "next/navigation";
import type { Jezyk } from "@/lib/bruno/i18n";

// Zakładki prawdziwego panelu (components/bruno/nav.tsx), te same adresy i nazwy.
export const LINKI = [
  // 25.10 (USER_001): panel szefa, tylko dla konta z rolą szefa i firmą (dostep.szef).
  { href: "/bruno/szef", nazwa: "Team", nazwaPl: "Zespół", ikona: "zespol", szef: true },
  // 4.11 (USER_001): BRUNO POD CRM. Lejek z Pipedrive (gdzie kto traci deale) i kokpit (handlowiec mówi / pisze, AI zapisuje w CRM). Tylko firma demo z tokenem (dostep.crm).
  // 4.11 wieczór (USER_001, pkt 1): NAWIGACJA HANDLOWCA = 4 ZAKŁADKI: Czat (= kokpit) · Klienci · Lejek · Statystyki. Czat = pierwszy ekran.
  // Szef: te same 4 na poziomie zespołu + Raport miesięczny + Zespół. Reszta (Test, Trening, Feedback…) = menu drugorzędne.
  { href: "/bruno/kokpit", nazwa: "Chat", nazwaPl: "Czat", ikona: "kokpit", crm: true },
  { href: "/bruno/klienci", nazwa: "Clients", nazwaPl: "Klienci", ikona: "klienci", crm: true },
  { href: "/bruno/lejek", nazwa: "Pipeline", nazwaPl: "Lejek", ikona: "lejek", crm: true },
  { href: "/bruno/raport", nazwa: "Monthly report", nazwaPl: "Raport miesięczny", ikona: "raport", crm: true, szef: true },
  { href: "/bruno/panel", nazwa: "Home", nazwaPl: "Panel", ikona: "panel" },
  { href: "/bruno/rozmowa", nazwa: "Live Call", nazwaPl: "Test", ikona: "test" },
  // 26.10 (USER_001): zakładka „Rozmowa, którą masz jutro” usunięta (/bruno/jutro przekierowuje na /bruno/rozmowa).
  // „Ogień” tylko przy pełnym dostępie (jak components/bruno/nav.tsx, 9.10).
  // 26.10 (USER_001): „Ogień przed rozmową” → „Strefa mentalna”.
  { href: "/bruno/ogien", nazwa: "Mental Zone", nazwaPl: "Strefa mentalna", ikona: "ogien", pelny: true },
  { href: "/bruno/trening", nazwa: "Drills", nazwaPl: "Trening", ikona: "trening" },
  { href: "/bruno/feedback", nazwa: "Feedback", nazwaPl: "Feedback", ikona: "feedback" },
  { href: "/bruno/statystyki", nazwa: "Stats", nazwaPl: "Statystyki", ikona: "statystyki" },
  // 11.10 (USER_001, E32): kalendarz rozmów i treningu, do kiedy trwa dostęp.
  { href: "/bruno/kalendarz", nazwa: "Calendar", nazwaPl: "Kalendarz", ikona: "kalendarz" },
  // 28.10 (USER_001): „Podsumowanie tygodnia”: rozmowy z tygodnia + nad czym pracować w następnym.
  { href: "/bruno/tydzien", nazwa: "Week review", nazwaPl: "Podsumowanie tygodnia", ikona: "tydzien" },
  // 25.10 (USER_001): „Dostosuj Bruno” znika z menu. Strona /bruno/dostosuj zostaje jako formularz dla firmy po podpisaniu umowy.
  { href: "/bruno/ustawienia", nazwa: "Settings", nazwaPl: "Ustawienia", ikona: "ustawienia" },
] as const;

/**
 * Linki widoczne dla konta: „Ogień” tylko przy pełnym dostępie; „Statystyki” nie dla konta free (10.10).
 * Przyjmuje stare `pelny: boolean` albo obiekt dostępu z `dostepKonta`.
 */
export type DostepLinkow = { ogien: boolean; statystyki: boolean; szef?: boolean; /** 4.11: lejek + kokpit z CRM (firma demo z tokenem Pipedrive). */ crm?: boolean };
export const linkiDla = (d: boolean | DostepLinkow, jezyk: Jezyk = "en") => {
  const ogien = typeof d === "boolean" ? d : d.ogien;
  const statystyki = typeof d === "boolean" ? true : d.statystyki;
  const szef = typeof d === "boolean" ? false : Boolean(d.szef);
  const crm = typeof d === "boolean" ? false : Boolean(d.crm);
  const lista = LINKI.filter((l) => ("pelny" in l ? ogien : true) && ("szef" in l ? szef : true) && ("crm" in l ? crm : true) && (l.href === "/bruno/statystyki" ? statystyki : true)).map((l) => ({ ...l, nazwa: nazwaLinku(l, jezyk) }));
  if (!crm) return lista;
  // 4.11 (pkt 1): z CRM kolejność = Czat · Klienci · Lejek · Statystyki · (Raport · Zespół) · reszta.
  const kolejnosc = GLOWNE_CRM;
  const poz = (href: string) => (kolejnosc.includes(href) ? kolejnosc.indexOf(href) : 100 + LINKI.findIndex((x) => x.href === href));
  return [...lista].sort((a, b) => poz(a.href) - poz(b.href));
};

/** 4.11 (pkt 1): 4 główne zakładki z CRM (+ raport i zespół dla szefa). Reszta = menu drugorzędne. */
export const GLOWNE_CRM = ["/bruno/kokpit", "/bruno/klienci", "/bruno/lejek", "/bruno/statystyki", "/bruno/raport", "/bruno/szef"];

/** 11.10: nazwa zakładki w języku konta (PL = nazwy sprzed tłumaczenia, fd7de52). */
export const nazwaLinku = (l: { nazwa: string; nazwaPl: string }, jezyk: Jezyk = "en") => (jezyk === "pl" ? l.nazwaPl : l.nazwa);

export type NazwaIkony = (typeof LINKI)[number]["ikona"] | "dostosuj" | "jutro" | "klodka" | "wyjscie" | "mikrofon" | "strzalka";

export function Ikona({ nazwa, rozmiar = 20, grubosc = 1.7 }: { nazwa: NazwaIkony; rozmiar?: number; grubosc?: number }) {
  const w = { viewBox: "0 0 24 24", width: rozmiar, height: rozmiar, fill: "none", stroke: "currentColor", strokeWidth: grubosc, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (nazwa) {
    case "jutro":
      return <svg {...w}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M12 13v4M10 15h4" /></svg>;
    case "zespol":
      return <svg {...w}><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M15.5 20a5 5 0 0 1 6-4.6" /></svg>;
    case "lejek":
      return <svg {...w}><path d="M3 4h18l-7 8.5V19l-4 2v-8.5z" /></svg>;
    case "kokpit":
      return <svg {...w}><path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /><path d="M8 9h8M8 12.5h5" /></svg>;
    case "klienci":
      return <svg {...w}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2.2" /><path d="M5.5 16.5a3.5 3.5 0 0 1 7 0" /><path d="M14.5 9.5h4M14.5 13h4" /></svg>;
    case "raport":
      return <svg {...w}><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5" /><path d="M9 17v-3M12 17v-6M15 17v-4" /></svg>;
    case "panel":
      return <svg {...w}><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="11" width="8" height="10" rx="2" /><rect x="3" y="14" width="8" height="7" rx="2" /></svg>;
    case "test":
      return <svg {...w}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>;
    case "ogien":
      return <svg {...w}><path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5.2 1.2.8 2 1.5 2.5C11.5 8 11 5.5 12 3z" /><path d="M8.5 13.5C7 15 6 16.5 6 18a6 6 0 0 0 12 0c0-1.5-.6-3-1.5-4" /></svg>;
    case "trening":
      return <svg {...w}><rect x="3" y="5" width="13" height="15" rx="2" /><path d="M8 3h11a2 2 0 0 1 2 2v11" /><path d="M7 12h5M7 15.5h3" /></svg>;
    case "feedback":
      return <svg {...w}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5" /><path d="M9 11l2 2 4-4" /><path d="M9 16h6" /></svg>;
    case "kalendarz":
      return <svg {...w}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /><circle cx="8.5" cy="14.5" r="1" fill="currentColor" /><circle cx="12" cy="14.5" r="1" fill="currentColor" /></svg>;
    case "tydzien":
      return <svg {...w}><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18M7 2.5v3M17 2.5v3" /><path d="M7 14h4M7 17.5h7" /><path d="M15 13.5l1.5 1.5 3-3" /></svg>;
    case "statystyki":
      return <svg {...w}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M7 14l3-4 3 3 4-5" /></svg>;
    case "dostosuj":
      return <svg {...w}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2.2" /><circle cx="10" cy="17" r="2.2" /></svg>;
    case "ustawienia":
      return <svg {...w}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
    case "klodka":
      return <svg {...w}><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></svg>;
    case "wyjscie":
      return <svg {...w}><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M4 12h11M8 8l-4 4 4 4" /></svg>;
    case "mikrofon":
      return <svg {...w}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>;
    case "strzalka":
      return <svg {...w}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  }
}

/** Wyloguj tak samo jak prawdziwy panel. */
export function useWyloguj() {
  const router = useRouter();
  return async () => {
    await fetch("/api/bruno/wyloguj", { method: "POST" });
    router.push("/bruno");
    router.refresh();
  };
}

export const odmiana = (n: number, jeden: string, kilka: string, wiele: string) =>
  n === 1 ? jeden : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? kilka : wiele;

export const rozmowy = (n: number, jezyk: Jezyk = "en") => (jezyk === "pl" ? odmiana(n, "rozmowa", "rozmowy", "rozmów") : odmiana(n, "call", "calls", "calls"));

/** Czy użytkownik prosi o mniej ruchu. */
export function malaAnimacja(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
