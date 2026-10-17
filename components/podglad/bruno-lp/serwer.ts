import type { Metadata } from "next";
import { headers } from "next/headers";
import { DOMENA, SCIEZKI, jezykZHosta, type Jezyk } from "@/lib/bruno/domeny";

// 11.10 (USER_001): publiczne strony Bruno na dwóch domenach. Język i metadane liczone na serwerze,
// żeby strona na salesbruno.pl od razu (bez mignięcia EN) była po polsku, a canonical wskazywał właściwą domenę.

export type CelStrony = "firmy" | "handlowcy" | "rejestracja" | "logowanie";
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

const OPISY: Record<CelStrony, Record<Jezyk, { title: string; description: string }>> = {
  firmy: {
    en: {
      title: "Bruno AI for sales teams | AI sales practice",
      description: "Your sales reps practice calls with an AI customer before they talk to a real one. Every call gets a score. Request a demo call.",
    },
    pl: {
      title: "Bruno AI dla zespołów sprzedaży | Trening sprzedaży z AI",
      description: "Wasi handlowcy ćwiczą rozmowy z klientem AI, zanim zadzwonią do prawdziwego. Każda rozmowa dostaje ocenę. Poproś o rozmowę demo.",
    },
  },
  handlowcy: {
    en: {
      title: "Bruno AI for sales reps | Practice your next call",
      description: "Practice your next sales call with an AI customer before it counts. Every call gets a score and a practice plan. Your first 3 calls are free.",
    },
    pl: {
      title: "Wykorzystaj swój potencjał | sprzedaży można się nauczyć",
      description: "Przećwicz rozmowę sprzedażową z klientem AI, zanim zadzwonisz do prawdziwego. Każda rozmowa dostaje ocenę i plan ćwiczeń. Pierwsze 3 rozmowy za darmo.",
    },
  },
  rejestracja: {
    en: { title: "Bruno AI: request access", description: "Request access to Bruno AI for your sales team. You get a demo call within 24 hours." },
    pl: { title: "Bruno AI: dostęp", description: "Poproś o dostęp do Bruno AI dla Twojego zespołu handlowego. Rozmowę demo dostaniesz w ciągu 24 godzin." },
  },
  logowanie: {
    en: { title: "Bruno AI: log in", description: "Log in to your Bruno AI practice panel." },
    pl: { title: "Bruno AI: logowanie", description: "Zaloguj się do panelu treningowego Bruno AI." },
  },
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
      // 13.10 (USER_001): handlowcy = zorza z rejestracji + „Bruno AI” (1200x630, pełna szerokość na FB). Reszta = zdjęcie Jakuba.
      images: cel === "handlowcy" ? [{ url: "/bruno/og-bruno.png", width: 1200, height: 630, alt: "Bruno AI" }] : [{ url: "/jakub.jpg" }],
    },
    ...(robots ? { robots } : {}),
  };
}
