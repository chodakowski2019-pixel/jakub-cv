// 22.11.2026 (USER_001: „każde narzędzie powinno mieć zdjęcie logo”): pobiera oficjalne ikony narzędzi z katalogu /ai.
// Źródło 1: strona producenta (link rel="apple-touch-icon" / "icon", największy rozmiar). Źródło 2 (gdy strona blokuje):
// usługa ikon Google (s2/favicons, 256 px). Wynik: scripts/out/narzedzia-ai-loga-surowe/<slug>.<ext> (surowy plik), potem ręczna obróbka
// do public/narzedzia-ai/<slug>.png 256×256 (22.11: SVG przez Chrome, ChatGPT z wymuszonym czarnym, ElevenLabs powiększony). Znaki należą do producentów; w katalogu tylko wskazują narzędzie, które opisujemy.
// Użycie: node scripts/narzedzia-ai-loga.mjs
import fs from "node:fs";
const DOMENY = {
  chatgpt: "https://chatgpt.com", claude: "https://claude.ai", deepl: "https://www.deepl.com", elevenlabs: "https://elevenlabs.io",
  fireflies: "https://fireflies.ai", gamma: "https://gamma.app", gemini: "https://gemini.google.com", "microsoft-copilot": "https://copilot.microsoft.com",
  notebooklm: "https://notebooklm.google.com", "notion-ai": "https://www.notion.com", perplexity: "https://www.perplexity.ai",
};
const UA = { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36", "accept-language": "pl,en;q=0.8" };
const OUT = "scripts/out/narzedzia-ai-loga-surowe"; // surowe pliki poza public (nie idą na serwer)
fs.mkdirSync(OUT, { recursive: true });
async function pobierz(url) {
  const r = await fetch(url, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${r.status}`);
  return { buf: Buffer.from(await r.arrayBuffer()), typ: r.headers.get("content-type") || "" };
}
for (const [slug, strona] of Object.entries(DOMENY)) {
  let wynik = "";
  try {
    const { buf } = await pobierz(strona);
    const html = buf.toString("utf8");
    const linki = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((l) => /rel=["'][^"']*(apple-touch-icon|icon)[^"']*["']/i.test(l));
    const kandydaci = linki.map((l) => {
      const href = (l.match(/href=["']([^"']+)["']/i) || [])[1];
      const rozm = Number(((l.match(/sizes=["'](\d+)x\d+["']/i) || [])[1]) || (/apple-touch-icon/i.test(l) ? 180 : /\.svg/i.test(href || "") ? 512 : 32));
      return { href, rozm };
    }).filter((k) => k.href && !k.href.startsWith("data:")).sort((a, b) => b.rozm - a.rozm);
    for (const k of kandydaci) {
      try {
        const u = new URL(k.href.replace(/&amp;/g, "&"), strona).href;
        const { buf: ik, typ } = await pobierz(u);
        const ext = /svg/.test(typ) || u.endsWith(".svg") ? "svg" : /icon|ico/.test(typ) || u.endsWith(".ico") ? "ico" : /webp/.test(typ) ? "webp" : /jpe?g/.test(typ) ? "jpg" : "png";
        if (ik.length < 200) continue;
        fs.writeFileSync(`${OUT}/${slug}.${ext}`, ik);
        wynik = `strona ${k.rozm}px ${ext} ${u}`;
        break;
      } catch {}
    }
  } catch (e) {
    wynik = "";
  }
  if (!wynik) {
    try {
      const host = new URL(strona).hostname;
      const { buf } = await pobierz(`https://www.google.com/s2/favicons?domain=${host}&sz=256`);
      fs.writeFileSync(`${OUT}/${slug}.png`, buf);
      wynik = `google-s2 ${host}`;
    } catch (e) {
      wynik = `BRAK (${e.message})`;
    }
  }
  console.log(slug.padEnd(18), wynik);
}
