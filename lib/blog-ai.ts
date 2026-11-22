import fs from "node:fs";
import path from "node:path";

// 21.11.2026 (USER_001): blog o AI w firmie dla marki Jakub Chodakowski (szkolenia AI dla firm).
// „To, jak ma wyglądać blog, weź z lovemyself”: układ = czytelnia lovemyself (zwiazki-lp/src/lib/blog.ts),
// tak samo jak blog Bruno (lib/bruno/blog.ts). Artykuły w .md, własny parser frontmattera i mini Markdown, bez nowych paczek.
// Wygląd = styl strony szkoleń (components/szkolenia-ai/szkolenia-ai.css): czerń, Geist, limonka.
//
// 21.11.2026 (USER_001: „bez podglądu, to ma być podstrona”): blog pod jakubchodakowski.com/blog (app/blog), indeksowany,
// w mapie witryny. Stare adresy /podglad/blog-ai przekierowane (next.config.ts). Strona szkoleń = strona główna (/).
// Uwaga: na localhost i salesbruno.pl adres /blog to blog Bruno (proxy.ts). Lokalnie ten blog widać pod 127.0.0.1:3077/blog.
// Gdyby blog miał wrócić do podglądu: PODGLAD = true (noindex) i BAZA na adres podglądu.

export const PODGLAD = false;
/** Adres bloga. W treści artykułów linki pisze się jako /blog/<slug>, renderer podmienia początek na BAZA. */
export const BAZA = "/blog";
/** Strona sprzedażowa szkoleń (od 22.11 pod /szkolenie-ai-dla-firm). W treści: /szkolenie albo /szkolenie#cena. */
// 22.11.2026: strona szkoleń przeniesiona ze strony głównej pod własny adres.
export const STRONA_SZKOLEN: string = "/szkolenie-ai-dla-firm";
export const DOMENA = "https://jakubchodakowski.com";

export const AUTOR = {
  imie: "Jakub Chodakowski",
  tytul: "prowadzę szkolenia AI dla firm",
  opis: "Od 2022 roku buduję narzędzia z AI. Na szkoleniach pokazuję to, czego sam używam w pracy każdego dnia.",
  miniatura: "/jakub-224.jpg",
  linkedin: "https://www.linkedin.com/in/jakub-chodakowski",
};

export type Grupa = {
  slug: string;
  nazwa: string;
  opis: string;
  /** Pytanie właściciela firmy, na które odpowiada grupa. Stoi pod nagłówkiem grupy. */
  pytanie: string;
};

export const GRUPY: Grupa[] = [
  {
    slug: "zasady-ai-w-firmie",
    nazwa: "Zasady i bezpieczeństwo",
    opis: "Polityka AI, regulamin dla pracowników, dane klientów i RODO. Wzory do skopiowania.",
    pytanie: "Co wolno wklejać do AI, a czego nie?",
  },
  {
    slug: "szkolenie-ai-w-firmie",
    nazwa: "Szkolenie AI w firmie",
    opis: "Ile kosztuje szkolenie AI, jak je wybrać i po czym poznać, że zadziałało.",
    pytanie: "Ile to kosztuje i czy zespół będzie z tego korzystał?",
  },
  {
    slug: "ai-w-pracy-biura",
    nazwa: "AI w pracy biura",
    opis: "Do czego biuro używa AI: maile, oferty, dokumenty, raporty. Branża po branży.",
    pytanie: "Do czego AI przyda się w mojej branży?",
  },
  {
    slug: "narzedzia-ai-dla-firm",
    nazwa: "Narzędzia AI dla firm",
    opis: "ChatGPT, Copilot, Claude i Gemini w wersjach dla firm: plany, ceny i różnice.",
    pytanie: "Które narzędzie kupić i ile kosztuje na osobę?",
  },
];

export function grupa(slug: string): Grupa | undefined {
  return GRUPY.find((g) => g.slug === slug);
}

/** Wariant rysunku okładki (1 do 4) = miejsce grupy na liście. Zdjęć nie ma, okładkę rysuje CSS. */
export function wariantGrupy(slug: string): 1 | 2 | 3 | 4 {
  return ((Math.max(0, GRUPY.findIndex((g) => g.slug === slug)) % 4) + 1) as 1 | 2 | 3 | 4;
}

/** Wpis w rejestrze źródeł: content/blog-ai/_zrodla.json. Każda liczba w artykule ma tu swoje źródło. */
export type Zrodlo = { id: string; liczba: string; teza: string; nazwa: string; url: string };

export type Artykul = {
  slug: string;
  /** Numer na okładce (pole `nr:`). */
  nr: number;
  tytul: string;
  opis: string;
  grupa: string;
  data: string;
  aktualizacja: string;
  czas: number;
  /** 2-3 zdania odpowiedzi na górze (pole `tldr:`). */
  tldr: string;
  /** Fraza główna (pole `fraza:`), tylko do kontroli i planu, nie wyświetla się. */
  fraza: string;
  tresc: string;
  spis: { id: string; tytul: string }[];
  /** Pary z sekcji „## Najczęstsze pytania” (### pytanie + akapit) dla schema FAQPage. */
  faq: { pytanie: string; odpowiedz: string }[];
  /** Pole `zrodla:` = identyfikatory z rejestru, rozdzielone przecinkami. */
  zrodla: Zrodlo[];
};

const KATALOG = path.join(process.cwd(), "content", "blog-ai");

let rejestr: Record<string, Omit<Zrodlo, "id">> | null = null;
function rejestrZrodel(): Record<string, Omit<Zrodlo, "id">> {
  // W trybie deweloperskim bez pamięci podręcznej: nowy tekst widać po odświeżeniu strony.
  if (rejestr && process.env.NODE_ENV === "production") return rejestr;
  const plik = path.join(KATALOG, "_zrodla.json");
  rejestr = fs.existsSync(plik) ? JSON.parse(fs.readFileSync(plik, "utf8")) : {};
  return rejestr!;
}

export function zrodlaPoId(pole: string | undefined): Zrodlo[] {
  const r = rejestrZrodel();
  return (pole ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((id) => id && r[id])
    .map((id) => ({ id, ...r[id] }));
}

export function parsujFrontmatter(raw: string): { meta: Record<string, string>; tresc: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, tresc: raw };
  const meta: Record<string, string> = {};
  for (const linia of m[1].split(/\r?\n/)) {
    const i = linia.indexOf(":");
    if (i === -1) continue;
    let v = linia.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    meta[linia.slice(0, i).trim()] = v;
  }
  return { meta, tresc: m[2] };
}

/** Slug nagłówka do kotwicy w spisie treści. */
export function slugify(s: string): string {
  const od = "ąćęłńóśźż";
  const na = "acelnoszz";
  return s
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => na[od.indexOf(c)] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const czysc = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`>]/g, "").trim();

export function parsujFaq(tresc: string): { pytanie: string; odpowiedz: string }[] {
  const linie = tresc.split(/\r?\n/);
  const start = linie.findIndex((l) => /^##\s+(FAQ|Najczęstsze pytania|Pytania i odpowiedzi)\s*$/.test(l));
  if (start === -1) return [];
  let koniec = linie.length;
  for (let i = start + 1; i < linie.length; i++) {
    if (/^##\s+/.test(linie[i])) {
      koniec = i;
      break;
    }
  }
  const wynik: { pytanie: string; odpowiedz: string }[] = [];
  let biezace: { pytanie: string; akapity: string[] } | null = null;
  for (const linia of linie.slice(start + 1, koniec)) {
    const naglowek = linia.match(/^###\s+(.+?)\s*$/);
    if (naglowek) {
      if (biezace) wynik.push({ pytanie: biezace.pytanie, odpowiedz: czysc(biezace.akapity.join(" ")) });
      biezace = { pytanie: czysc(naglowek[1]), akapity: [] };
    } else if (biezace && linia.trim()) {
      biezace.akapity.push(linia.trim());
    }
  }
  if (biezace) wynik.push({ pytanie: biezace.pytanie, odpowiedz: czysc(biezace.akapity.join(" ")) });
  return wynik.filter((f) => f.pytanie && f.odpowiedz);
}

function szacujCzas(tresc: string): number {
  return Math.max(2, Math.round(tresc.split(/\s+/).filter(Boolean).length / 200));
}

let cache: Artykul[] | null = null;

export function wszystkieArtykuly(): Artykul[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!fs.existsSync(KATALOG)) return [];
  const lista = fs
    .readdirSync(KATALOG)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((plik) => {
      const { meta, tresc } = parsujFrontmatter(fs.readFileSync(path.join(KATALOG, plik), "utf8"));
      const slug = meta.slug || plik.replace(/\.md$/, "");
      return {
        slug,
        nr: Number(meta.nr || 0),
        tytul: meta.tytul || slug,
        opis: meta.opis || "",
        grupa: meta.grupa || "",
        data: meta.data || "2026-11-21",
        aktualizacja: meta.aktualizacja || meta.data || "2026-11-21",
        czas: Number(meta.czas || szacujCzas(tresc)),
        tldr: meta.tldr || "",
        fraza: meta.fraza || "",
        tresc: tresc.trim(),
        spis: [...tresc.matchAll(/^##\s+(.+)$/gm)].map((m) => ({ id: slugify(m[1].trim()), tytul: m[1].trim() })),
        faq: parsujFaq(tresc),
        zrodla: zrodlaPoId(meta.zrodla),
      } satisfies Artykul;
    });
  // Kolejność na liście = numer z planu (pole `nr:`): najważniejsze teksty pierwsze.
  lista.sort((a, b) => a.nr - b.nr || (a.slug < b.slug ? -1 : 1));
  cache = lista;
  return lista;
}

export function artykul(slug: string): Artykul | undefined {
  return wszystkieArtykuly().find((a) => a.slug === slug);
}

export function artykulyGrupy(slug: string): Artykul[] {
  return wszystkieArtykuly().filter((a) => a.grupa === slug);
}

/* ------------------------------------------------------- MINI MARKDOWN */
// Gołe znaczniki HTML, wygląd daje blog-ai.css (.bai-tresc h2, .bai-tresc table...).

/** /blog/<slug> → adres bloga, /szkolenie → strona sprzedażowa. Jedno miejsce zmiany przy publikacji. */
function adres(href: string): string {
  if (href === "/blog" || href.startsWith("/blog/")) return `${BAZA}${href.slice("/blog".length)}`;
  if (href === "/szkolenie") return STRONA_SZKOLEN;
  if (href.startsWith("/szkolenie#")) return `${STRONA_SZKOLEN === "/" ? "/" : STRONA_SZKOLEN}${href.slice("/szkolenie".length)}`;
  return href;
}

function inline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, tekst: string, href: string) =>
      /^https?:/.test(href) ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${tekst}</a>` : `<a href="${adres(href)}">${tekst}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

/**
 * Obsługuje: ## ###, akapity, - listy, 1. listy, > ramka z jedną myślą, --- separator, tabele | a | b |
 * oraz blok ``` = „Polecenie do wklejenia” (gotowe polecenie dla AI, wiersz po wierszu).
 */
export function renderujMarkdown(md: string): string {
  const out: string[] = [];
  let akapit: string[] = [];
  let lista: string[] | null = null;
  let listaTyp: "ul" | "ol" = "ul";
  let cytat: string[] | null = null;
  let tabela: string[][] | null = null;
  let polecenie: string[] | null = null;

  const komorki = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const zamknijTabele = () => {
    if (tabela?.length) {
      const [naglowek, ...wiersze] = tabela;
      out.push(
        `<div class="bai-tabela"><table><thead><tr>${naglowek.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${wiersze
          .map((w) => `<tr>${w.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
    }
    tabela = null;
  };
  const zamknijAkapit = () => {
    if (akapit.length) out.push(`<p>${inline(akapit.join(" "))}</p>`);
    akapit = [];
  };
  const zamknijListe = () => {
    if (lista?.length) out.push(`<${listaTyp}>${lista.map((li) => `<li>${inline(li)}</li>`).join("")}</${listaTyp}>`);
    lista = null;
  };
  const zamknijCytat = () => {
    if (cytat?.length) out.push(`<blockquote>${cytat.map(inline).join("<br />")}</blockquote>`);
    cytat = null;
  };
  const zamknijWszystko = () => {
    zamknijAkapit();
    zamknijListe();
    zamknijCytat();
    zamknijTabele();
  };

  for (const l of md.split(/\r?\n/)) {
    const linia = l.trimEnd();
    if (/^```/.test(linia.trim())) {
      if (polecenie) {
        out.push(
          `<div class="bai-polecenie"><p class="bai-polecenie-etykieta">Polecenie do wklejenia</p><p class="bai-polecenie-tekst">${polecenie
            .map(inline)
            .join("<br />")}</p></div>`,
        );
        polecenie = null;
      } else {
        zamknijWszystko();
        polecenie = [];
      }
      continue;
    }
    if (polecenie) {
      polecenie.push(linia);
      continue;
    }
    if (!linia.trim()) {
      zamknijWszystko();
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(linia)) {
      zamknijAkapit();
      zamknijListe();
      zamknijCytat();
      if (/^\s*\|[\s:|-]+\|\s*$/.test(linia)) continue;
      tabela ??= [];
      tabela.push(komorki(linia));
      continue;
    }
    zamknijTabele();
    if (/^###\s+/.test(linia)) {
      zamknijWszystko();
      out.push(`<h3>${inline(linia.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }
    if (/^##\s+/.test(linia)) {
      zamknijWszystko();
      const t = linia.replace(/^##\s+/, "");
      out.push(`<h2 id="${slugify(t)}">${inline(t)}</h2>`);
      continue;
    }
    if (/^---+$/.test(linia)) {
      zamknijWszystko();
      out.push("<hr />");
      continue;
    }
    if (/^>\s?/.test(linia)) {
      zamknijAkapit();
      zamknijListe();
      cytat ??= [];
      cytat.push(linia.replace(/^>\s?/, ""));
      continue;
    }
    const ul = /^[-*]\s+/.test(linia);
    const ol = /^\d+\.\s+/.test(linia);
    if (ul || ol) {
      zamknijAkapit();
      zamknijCytat();
      const typ = ul ? "ul" : "ol";
      if (lista && listaTyp !== typ) zamknijListe();
      listaTyp = typ;
      lista ??= [];
      lista.push(linia.replace(ul ? /^[-*]\s+/ : /^\d+\.\s+/, ""));
      continue;
    }
    zamknijListe();
    zamknijCytat();
    akapit.push(linia.trim());
  }
  zamknijWszystko();
  return out.join("\n");
}
