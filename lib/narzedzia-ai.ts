import fs from "node:fs";
import path from "node:path";
import { parsujFaq, parsujFrontmatter, slugify, zrodlaPoId, type Zrodlo } from "@/lib/blog-ai";

// 21.11.2026 (USER_001): katalog narzędzi AI, „tak jak jest na listedai.co, tylko po polsku”:
// lista z filtrami, kategorie i podstrona na każde narzędzie. Budowa wzorowana na katalogu (kafel: nazwa, krótki opis,
// cennik, kategoria; podstrona: fakty, opis, pytania, podobne narzędzia), treść i wygląd nasze.
//
// ZASADA (baza SEO, plik 23): żadnych stron z szablonu. Wpis powstaje dopiero po sprawdzeniu ceny, języka i zasad
// dotyczących danych na stronie producenta. Każdy fakt ma źródło w content/blog-ai/_zrodla.json, a wpis ma datę sprawdzenia.
// Każda podstrona odpowiada na pytanie polskiej firmy: ile kosztuje wersja firmowa, czy działa po polsku, co z danymi.
//
// 21.11.2026 (USER_001: „a to jako podstrona ai”): katalog pod jakubchodakowski.com/ai (app/ai), indeksowany razem z blogiem
// (lib/blog-ai.ts, PODGLAD). Stare adresy /podglad/narzedzia-ai przekierowane (next.config.ts).

export const BAZA_NARZEDZI = "/ai";

export type Kategoria = { slug: string; nazwa: string; opis: string };

export const KATEGORIE: Kategoria[] = [
  { slug: "asystenci-ai", nazwa: "Asystenci AI", opis: "Narzędzia do rozmowy, pisania i pracy z dokumentami: ChatGPT, Copilot, Claude, Gemini." },
  { slug: "wyszukiwanie-i-dokumenty", nazwa: "Wyszukiwanie i dokumenty", opis: "Odpowiedzi ze źródłami, praca na własnych plikach i notatkach." },
  { slug: "tlumaczenia-i-pisanie", nazwa: "Tłumaczenia i pisanie", opis: "Tłumaczenie pism i maili, korekta i poprawa stylu." },
  { slug: "notatki-ze-spotkan", nazwa: "Notatki ze spotkań", opis: "Zapis rozmowy, lista ustaleń i zadań po spotkaniu." },
  { slug: "grafika-i-prezentacje", nazwa: "Grafika i prezentacje", opis: "Slajdy, grafiki i materiały firmowe z opisu słownego." },
  { slug: "glos-i-wideo", nazwa: "Głos i wideo", opis: "Lektor, nagrania i materiały wideo tworzone z tekstu." },
  // 22.11.2026 (USER_001: „dorób jeszcze do 50 narzędzi”): 2 nowe kategorie.
  { slug: "automatyzacja", nazwa: "Automatyzacja", opis: "Połączenia między aplikacjami i powtarzalne zadania, które wykonują się same." },
  { slug: "obsluga-klienta", nazwa: "Obsługa klienta", opis: "Czat na stronie i odpowiedzi na pytania klientów z pomocą AI." },
  // 25.11.2026 (USER_001: „narzędzi do 100”): 3 nowe kategorie.
  { slug: "marketing-i-seo", nazwa: "Marketing i SEO", opis: "Teksty pod wyszukiwarkę, plan treści i widoczność strony firmy w Google." },
  { slug: "organizacja-pracy", nazwa: "Organizacja pracy", opis: "Zadania, kalendarz i projekty zespołu z pomocą AI." },
  { slug: "strony-i-kod", nazwa: "Strony i programowanie", opis: "Strony internetowe, aplikacje i kod tworzone z opisu słownego." },
];

export function kategoria(slug: string): Kategoria | undefined {
  return KATEGORIE.find((k) => k.slug === slug);
}

/** Model cenowy, jak filtr „Pricing Model” w katalogach narzędzi. */
export const CENNIKI = {
  "darmowy-plan": "Darmowy plan",
  "okres-probny": "Okres próbny",
  platne: "Tylko płatne",
  "w-pakiecie": "W cenie pakietu biurowego",
} as const;
export type Cennik = keyof typeof CENNIKI;

/** Cechy do filtrowania. Wpis dostaje cechę tylko wtedy, gdy potwierdza ją źródło. */
export const CECHY = {
  "plan-firmowy": "Plan dla firm",
  "umowa-dpa": "Umowa o przetwarzaniu danych",
  "bez-trenowania": "Bez trenowania na danych firmy",
  "po-polsku": "Działa po polsku",
} as const;
export type Cecha = keyof typeof CECHY;

export type Narzedzie = {
  slug: string;
  nazwa: string;
  producent: string;
  /** Adres strony producenta. */
  strona: string;
  kategoria: string;
  cennik: Cennik;
  /** „Cena od”: najtańszy płatny plan, dokładnie tak, jak podaje producent. */
  cenaOd: string;
  planFirmowy: string;
  poPolsku: string;
  dane: string;
  cechy: Cecha[];
  /** Data sprawdzenia danych u producenta. Widoczna na podstronie. */
  sprawdzono: string;
  tytul: string;
  opis: string;
  /** Jedno zdanie na kafel. */
  krotko: string;
  podobne: string[];
  /** 22.11.2026 (USER_001: „każde narzędzie powinno mieć zdjęcie logo”): /narzedzia-ai/<slug>.png, gdy plik istnieje.
   *  Ikony pobiera scripts/narzedzia-ai-loga.mjs ze stron producentów. Pusty = kwadrat z 2 literami. */
  logo: string;
  /** Slug tekstu z bloga, który rozwija temat (np. cennik). */
  artykul: string;
  tresc: string;
  spis: { id: string; tytul: string }[];
  faq: { pytanie: string; odpowiedz: string }[];
  zrodla: Zrodlo[];
};

const KATALOG = path.join(process.cwd(), "content", "narzedzia-ai");
const lista = (pole: string | undefined) =>
  (pole ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

let cache: Narzedzie[] | null = null;

export function wszystkieNarzedzia(): Narzedzie[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!fs.existsSync(KATALOG)) return [];
  const wynik = fs
    .readdirSync(KATALOG)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((plik) => {
      const { meta, tresc } = parsujFrontmatter(fs.readFileSync(path.join(KATALOG, plik), "utf8"));
      const slug = meta.slug || plik.replace(/\.md$/, "");
      return {
        slug,
        nazwa: meta.nazwa || slug,
        producent: meta.producent || "",
        strona: meta.strona || "",
        kategoria: meta.kategoria || "",
        cennik: (meta.cennik in CENNIKI ? meta.cennik : "platne") as Cennik,
        cenaOd: meta.cena_od || "",
        planFirmowy: meta.plan_firmowy || "",
        poPolsku: meta.po_polsku || "",
        dane: meta.dane || "",
        cechy: lista(meta.cechy).filter((c): c is Cecha => c in CECHY),
        sprawdzono: meta.sprawdzono || "2026-11-21",
        tytul: meta.tytul || meta.nazwa || slug,
        opis: meta.opis || "",
        krotko: meta.krotko || "",
        podobne: lista(meta.podobne),
        logo: fs.existsSync(path.join(process.cwd(), "public", "narzedzia-ai", `${slug}.png`)) ? `/narzedzia-ai/${slug}.png` : "",
        artykul: meta.artykul || "",
        tresc: tresc.trim(),
        spis: [...tresc.matchAll(/^##\s+(.+)$/gm)].map((m) => ({ id: slugify(m[1].trim()), tytul: m[1].trim() })),
        faq: parsujFaq(tresc),
        zrodla: zrodlaPoId(meta.zrodla),
      } satisfies Narzedzie;
    });
  // Kolejność: pole `kolejnosc:` nie jest potrzebne, wystarcza alfabet w obrębie kategorii z listy KATEGORIE.
  const miejsce = (n: Narzedzie) => Math.max(0, KATEGORIE.findIndex((k) => k.slug === n.kategoria));
  wynik.sort((a, b) => miejsce(a) - miejsce(b) || a.nazwa.localeCompare(b.nazwa, "pl"));
  cache = wynik;
  return wynik;
}

export function narzedzie(slug: string): Narzedzie | undefined {
  return wszystkieNarzedzia().find((n) => n.slug === slug);
}

export function narzedziaKategorii(slug: string): Narzedzie[] {
  return wszystkieNarzedzia().filter((n) => n.kategoria === slug);
}

/** Kategorie, w których jest co najmniej jedno sprawdzone narzędzie. Pustych nie pokazujemy. */
export function kategorieZNarzedziami(): (Kategoria & { ile: number })[] {
  return KATEGORIE.map((k) => ({ ...k, ile: narzedziaKategorii(k.slug).length })).filter((k) => k.ile > 0);
}
