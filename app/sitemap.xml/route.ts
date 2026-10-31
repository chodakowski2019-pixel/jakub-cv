import { DOMENA, SCIEZKI, jezykZHosta } from "@/lib/bruno/domeny";
import { GRUPY, stronaGrupy, wszystkieArtykuly } from "@/lib/bruno/blog";

export const dynamic = "force-dynamic";

// 21.10 (USER_001, Search Console): mapa witryny per domena. Proxy omija pliki z rozszerzeniem, więc host czytamy sami.
// salesbruno.pl / .com = strony publiczne Bruno (bez panelu, rejestracji, webinaru i /praca, które mają noindex).
// jakubchodakowski.com = strona główna + wersja EN.
function wpisy(host: string | null): string[] {
  const j = jezykZHosta(host);
  if (j) {
    const P = SCIEZKI[j];
    const d = DOMENA[j];
    // 31.10: na .pl także blog (lista, strony grup, artykuły).
    const blog = j === "pl" ? ["/blog", ...GRUPY.filter((g) => stronaGrupy(g.slug)).map((g) => `/blog/temat/${g.slug}`), ...wszystkieArtykuly().map((a) => `/blog/${a.slug}`)] : [];
    return [P.firmy, P.demo, P.bezpieczenstwo, "/regulamin", "/polityka-prywatnosci", ...blog].map((s) => `${d}${s === "/" ? "" : s}`);
  }
  return ["https://jakubchodakowski.com", "https://jakubchodakowski.com/en"];
}

export async function GET(req: Request) {
  const host = req.headers.get("host");
  const dzis = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${wpisy(host)
  .map((u) => `  <url><loc>${u}</loc><lastmod>${dzis}</lastmod></url>`)
  .join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
