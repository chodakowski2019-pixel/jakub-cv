import fs from "node:fs";
import path from "node:path";

// 31.10 (USER_001): blog Bruno na salesbruno.pl/blog (proxy: rewrite na /brunoblog), tylko Polska.
// Wzór = czytelnia lovemyself (zwiazki-lp/src/lib/blog.ts): artykuły w .md, własny parser frontmattera
// i mini Markdown bez nowych paczek. 3 grupy tematów (Negacz NSM 121): strona główna grupy = /blog/temat/<grupa>,
// artykuły linkują tylko w obrębie swojej grupy. Treść grupy: content/bruno-blog/temat/<grupa>.md.

export const DOMENA_BLOGA = "https://salesbruno.pl";

export type Grupa = {
  slug: string;
  nazwa: string;
  opis: string;
  /** Słowa ludzi z badania B2C (31.10), pod nagłówkiem grupy jak „poLudzku” na lovemyself. */
  cytat: string;
  /** Jedno wezwanie na grupę, dopasowane do gotowości zakupu frazy. */
  wezwanie: { tytul: string; tekst: string; przycisk: string; href: string };
};

export const GRUPY: Grupa[] = [
  {
    slug: "jak-zostac-handlowcem",
    nazwa: "Jak zostać handlowcem",
    opis: "Praca w sprzedaży bez doświadczenia: od czego zacząć, ile się zarabia, jak przejść rekrutację.",
    cytat: "Czy mnie wezmą bez doświadczenia? Czy ja się w ogóle nadaję?",
    wezwanie: {
      tytul: "Sprawdź, czy nadajesz się do sprzedaży",
      tekst: "Test predyspozycji zajmuje 2 minuty. Dostaniesz swój styl sprzedaży i kurs dobrany do Twojego poziomu.",
      przycisk: "Zrób darmowy test",
      href: "/kursy/test",
    },
  },
  {
    slug: "kurs-sprzedazy",
    nazwa: "Kurs i szkolenie sprzedaży",
    opis: "Jak wybrać kurs sprzedaży, ile kosztuje, czego się uczyć i jakie szkolenie daje pracę.",
    cytat: "Płatne szkolenia nie dają żadnej gwarancji.",
    wezwanie: {
      tytul: "Kurs sprzedaży z gwarancją pracy",
      tekst: "3 miesiące treningu z AI, certyfikat i oferta pracy w 30 dni po kursie. Albo oddajemy pieniądze.",
      przycisk: "Zobacz kursy",
      href: "/kursy",
    },
  },
  {
    slug: "obiekcje-i-rozmowa",
    nazwa: "Obiekcje i rozmowa sprzedażowa",
    opis: "Co odpowiedzieć na „muszę się zastanowić” i „za drogo”, zimne telefony, umawianie spotkań, zamykanie.",
    cytat: "Klient odpowie, że musi się zastanowić. 90 % tak reaguje.",
    wezwanie: {
      tytul: "Przećwicz to na AI, zanim powiesz to klientowi",
      tekst: "Bruno gra klienta głosem, a trener ocenia rozmowę. Pierwsze rozmowy za darmo, bez karty.",
      przycisk: "Porozmawiaj z Bruno",
      href: "/rejestracja",
    },
  },
];

export function grupa(slug: string): Grupa | undefined {
  return GRUPY.find((g) => g.slug === slug);
}

/** Numer koloru okładki (1-3) = miejsce grupy na liście. Zdjęć okładek nie mamy, okładka to gradient grupy. */
export function kolorGrupy(slug: string): 1 | 2 | 3 {
  return (Math.max(0, GRUPY.findIndex((g) => g.slug === slug)) % 3 + 1) as 1 | 2 | 3;
}

export type Zrodlo = { liczba: string; teza: string; nazwa: string; url: string };

export type Artykul = {
  slug: string;
  tytul: string;
  opis: string;
  grupa: string;
  data: string;
  aktualizacja: string;
  czas: number;
  /** 2-4 zdania odpowiedzi na górze (pole `tldr:`). Największy wpływ na cytowanie przez AI. */
  tldr: string;
  tresc: string;
  spis: { id: string; tytul: string }[];
  /** Pary z sekcji „## Najczęstsze pytania” (### pytanie + akapit) dla schema FAQPage. */
  faq: { pytanie: string; odpowiedz: string }[];
  /** Pole `zrodla:` = wpisy rozdzielone „;”, w każdym „liczba | teza | nazwa | url”. Sekcja „Źródła” na dole jak na lovemyself. */
  zrodla: Zrodlo[];
};

function parsujZrodla(pole: string | undefined): Zrodlo[] {
  return (pole ?? "")
    .split(";")
    .map((w) => w.split("|").map((x) => x.trim()))
    .filter((w) => w.length === 4 && w[3].startsWith("http"))
    .map(([liczba, teza, nazwa, url]) => ({ liczba, teza, nazwa, url }));
}

const KATALOG = path.join(process.cwd(), "content", "bruno-blog");
const KATALOG_TEMAT = path.join(KATALOG, "temat");

function parsujFrontmatter(raw: string): { meta: Record<string, string>; tresc: string } {
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

function parsujFaq(tresc: string): { pytanie: string; odpowiedz: string }[] {
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

function zbuduj(slug: string, meta: Record<string, string>, tresc: string): Artykul {
  return {
    slug,
    tytul: meta.tytul || slug,
    opis: meta.opis || "",
    grupa: meta.grupa || "",
    data: meta.data || "2026-10-31",
    aktualizacja: meta.aktualizacja || meta.data || "2026-10-31",
    czas: Number(meta.czas || szacujCzas(tresc)),
    tldr: meta.tldr || "",
    tresc: tresc.trim(),
    spis: [...tresc.matchAll(/^##\s+(.+)$/gm)].map((m) => ({ id: slugify(m[1].trim()), tytul: m[1].trim() })),
    faq: parsujFaq(tresc),
    zrodla: parsujZrodla(meta.zrodla),
  };
}

let cache: Artykul[] | null = null;

export function wszystkieArtykuly(): Artykul[] {
  if (cache) return cache;
  if (!fs.existsSync(KATALOG)) return [];
  const lista = fs
    .readdirSync(KATALOG)
    .filter((f) => f.endsWith(".md"))
    .map((plik) => {
      const { meta, tresc } = parsujFrontmatter(fs.readFileSync(path.join(KATALOG, plik), "utf8"));
      return zbuduj(meta.slug || plik.replace(/\.md$/, ""), meta, tresc);
    });
  lista.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  cache = lista;
  return lista;
}

export function artykul(slug: string): Artykul | undefined {
  return wszystkieArtykuly().find((a) => a.slug === slug);
}

export function artykulyGrupy(slug: string): Artykul[] {
  return wszystkieArtykuly().filter((a) => a.grupa === slug);
}

/** Strona główna grupy (pillar page). Brak pliku = sama lista artykułów. */
export function stronaGrupy(slug: string): Artykul | undefined {
  const plik = path.join(KATALOG_TEMAT, `${slug}.md`);
  if (!fs.existsSync(plik)) return undefined;
  const { meta, tresc } = parsujFrontmatter(fs.readFileSync(plik, "utf8"));
  return zbuduj(slug, { ...meta, grupa: slug }, tresc);
}

/* ------------------------------------------------------- MINI MARKDOWN */
// Gołe znaczniki HTML, wygląd daje blog.module.css (.tresc h2, .tresc table...).

function inline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

/** Obsługuje: ## ###, akapity, - listy, 1. listy, > cytat, --- separator, tabele | a | b |. */
export function renderujMarkdown(md: string): string {
  const out: string[] = [];
  let akapit: string[] = [];
  let lista: string[] | null = null;
  let listaTyp: "ul" | "ol" = "ul";
  let cytat: string[] | null = null;
  let tabela: string[][] | null = null;

  const komorki = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const zamknijTabele = () => {
    if (tabela?.length) {
      const [naglowek, ...wiersze] = tabela;
      out.push(
        `<div class="tabela"><table><thead><tr>${naglowek.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${wiersze
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
    if (cytat?.length) out.push(`<blockquote>${inline(cytat.join(" "))}</blockquote>`);
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
