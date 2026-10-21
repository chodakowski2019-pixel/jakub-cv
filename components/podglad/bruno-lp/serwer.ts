import type { Metadata } from "next";
import { headers } from "next/headers";
import { DOMENA, SCIEZKI, jezykZHosta, type Jezyk } from "@/lib/bruno/domeny";

// 11.10 (USER_001): publiczne strony Bruno na dwóch domenach. Język i metadane liczone na serwerze,
// żeby strona na salesbruno.pl od razu (bez mignięcia EN) była po polsku, a canonical wskazywał właściwą domenę.

export type CelStrony = "firmy" | "handlowcy" | "rejestracja" | "logowanie" | "demo";
type Szukaj = Promise<Record<string, string | string[] | undefined>> | undefined;

/** Język strony: domena (x-jezyk z proxy / host), a poza domenami Bruno ?pl albo ?lang=pl. */
export async function stronaBruno(searchParams?: Szukaj): Promise<{ jezyk: Jezyk; naDomenie: boolean }> {
  const h = await headers();
  const zHosta = jezykZHosta(h.get("host"));
  if (zHosta) return { jezyk: zHosta, naDomenie: true };
  const q = (await searchParams) ?? {};
  const pl = h.get("x-jezyk") === "pl" || q.pl !== undefined || q.lang === "pl";
  return { jezyk: pl ? "pl" : "en", naDomenie: false };
}

// 21.10 (USER_001): opisy PL i EN krótkie, po 2-6 słów (pod SMS i WhatsApp).
const OPISY: Record<CelStrony, Record<Jezyk, { title: string; description: string }>> = {
  firmy: {
    en: {
      title: "Bruno AI for sales teams | AI sales practice",
      description: "AI sales training",
    },
    pl: {
      // 18.10 (USER_001): tytuł karty.
      title: "Trenuj codziennie, bądź najlepszy",
      description: "Trening sprzedaży z AI",
    },
  },
  handlowcy: {
    en: {
      title: "Bruno AI for sales reps | Practice your next call",
      description: "Practice a sales call with an AI customer",
    },
    pl: {
      title: "Wykorzystaj swój potencjał | sprzedaży można się nauczyć",
      description: "Przećwicz rozmowę sprzedażową z klientem AI",
    },
  },
  rejestracja: {
    en: { title: "Bruno AI: request access", description: "Sign up" },
    pl: { title: "Bruno AI: dostęp", description: "Rejestracja" },
  },
  logowanie: {
    en: { title: "Bruno AI: log in", description: "Log in" },
    pl: { title: "Bruno AI: logowanie", description: "Zaloguj się" },
  },
  // 21.10 (USER_001): /spotkanie | /meeting = kalendarz spotkania online (klucz „demo” zostaje w kodzie).
  demo: {
    en: { title: "Bruno AI: book a meeting", description: "Book an online meeting" },
    pl: { title: "Bruno AI: umów spotkanie", description: "Umów spotkanie online" },
  },
};

/**
 * 18.10 (USER_001: „dlaczego wciąż zielony?”): przeglądarki trzymały w pamięci zieloną ikonę z /icon.svg
 * (ten sam adres co jakubchodakowski.com). Strony Bruno wskazują pomarańczową pod własnym adresem, więc
 * przeglądarka pobiera ją od nowa. `v` podbić przy zmianie ikony.
 */
export const IKONY_BRUNO: Metadata["icons"] = {
  icon: [
    { url: "/bruno/ikona.svg?v=3", type: "image/svg+xml" },
    { url: "/bruno/ikona.ico?v=3", sizes: "64x64" },
  ],
  apple: [{ url: "/bruno/ikona-apple.png?v=3", sizes: "180x180" }],
};

/** Metadane: tytuł i opis w języku, canonical na domenę języka, wersje językowe, OG. */
export async function metadaneBruno(cel: CelStrony, searchParams?: Szukaj, robots?: Metadata["robots"]): Promise<Metadata> {
  const { jezyk } = await stronaBruno(searchParams);
  const { title, description } = OPISY[cel][jezyk];
  const sciezka = SCIEZKI[jezyk][cel];
  return {
    metadataBase: new URL(DOMENA[jezyk]),
    title,
    description,
    icons: IKONY_BRUNO,
    alternates: {
      canonical: sciezka,
      languages: { en: `${DOMENA.en}${SCIEZKI.en[cel]}`, pl: `${DOMENA.pl}${SCIEZKI.pl[cel]}`, "x-default": `${DOMENA.en}${SCIEZKI.en[cel]}` },
    },
    openGraph: {
      title,
      description,
      url: sciezka,
      siteName: "Bruno AI",
      locale: jezyk === "pl" ? "pl_PL" : "en_US",
      type: "website",
      // 21.10 (USER_001): jedna miniaturka na WSZYSTKIE strony Bruno (SMS, WhatsApp, FB, LinkedIn): zorza + „Bruno AI”,
      // przycięta bliżej logo (og-bruno-2.png). Wcześniej rejestracja i firmy miały kwadratowe jakub.jpg, które się ucinało.
      images: [{ url: "/bruno/og-bruno-2.png", width: 1200, height: 630, alt: "Bruno AI" }],
    },
    ...(robots ? { robots } : {}),
  };
}
