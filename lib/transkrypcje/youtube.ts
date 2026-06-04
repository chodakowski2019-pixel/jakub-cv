// Util bez zależności node — bezpieczny do importu po stronie klienta.

// Wyciąga 11-znakowe ID filmu z dowolnej formy linku YouTube (lub samego ID).
export function extractVideoId(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;

  // samo ID
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;

  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    }
  } catch {
    // ignoruj
  }
  return null;
}

export function buildWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function thumbUrl(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

const PL_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ż: "z", ź: "z",
};

// Tytuł -> bezpieczny fragment adresu (polskie litery -> łacińskie, reszta zdjęta).
export function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[ąćęłńóśżź]/g, (c) => PL_MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

// Z fragmentu adresu typu "tytul-filmu-dQw4w9WgXcQ" wyciąga ID (ostatnie 11 znaków).
export function extractIdFromSlug(seg: string): string | null {
  const s = (seg || "").trim();
  if (!s) return null;
  const tail = s.slice(-11);
  if (/^[A-Za-z0-9_-]{11}$/.test(tail)) return tail;
  return extractVideoId(s);
}

// Pełny ładny link do komentarza: /youtube/tytul-ID
export function buildShareLink(origin: string, id: string, title?: string): string {
  const slug = title ? slugify(title) : "";
  return slug ? `${origin}/youtube/${slug}-${id}` : `${origin}/youtube/${id}`;
}
