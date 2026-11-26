import { HTML } from "./strona";

// 26.11.2026 (USER_001): mapa 909 bitew na ziemiach dzisiejszej Polski (Wikidata + polska Wikipedia).
// Samodzielna strona HTML (mapa SVG, oś czasu, lista), generowana skryptem build_page.py do strona.ts.
export const dynamic = "force-static";

export function GET() {
  return new Response(HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
