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
  // 22.11.2026: katalog do 50 narzędzi.
  "le-chat": "https://chat.mistral.ai", deepseek: "https://www.deepseek.com", grok: "https://grok.com", chatpdf: "https://www.chatpdf.com",
  consensus: "https://consensus.app", "acrobat-ai-assistant": "https://acrobat.adobe.com", elicit: "https://elicit.com", "you-com": "https://you.com",
  languagetool: "https://languagetool.org", grammarly: "https://www.grammarly.com", quillbot: "https://quillbot.com", jasper: "https://www.jasper.ai",
  "copy-ai": "https://www.copy.ai", wordtune: "https://www.wordtune.com", otter: "https://otter.ai", tldv: "https://tldv.io", fathom: "https://fathom.video",
  "read-ai": "https://www.read.ai", "zoom-ai-companion": "https://www.zoom.com", krisp: "https://krisp.ai", canva: "https://www.canva.com",
  midjourney: "https://www.midjourney.com", "adobe-firefly": "https://firefly.adobe.com", ideogram: "https://ideogram.ai", "beautiful-ai": "https://www.beautiful.ai",
  "microsoft-designer": "https://designer.microsoft.com", "napkin-ai": "https://www.napkin.ai", synthesia: "https://www.synthesia.io", heygen: "https://www.heygen.com",
  descript: "https://www.descript.com", runway: "https://runwayml.com", opusclip: "https://www.opus.pro", zapier: "https://zapier.com", make: "https://www.make.com",
  n8n: "https://n8n.io", "power-automate": "https://www.microsoft.com/en-us/power-platform/products/power-automate", tidio: "https://www.tidio.com",
  livechat: "https://www.livechat.com", "intercom-fin": "https://fin.ai",
  // 25.11.2026: +10 narzędzi (60).
  manus: "https://manus.im", "meta-ai": "https://www.meta.ai", clickup: "https://clickup.com", writesonic: "https://writesonic.com",
  "leonardo-ai": "https://leonardo.ai", suno: "https://suno.com", "kling-ai": "https://klingai.com", veed: "https://www.veed.io",
  capcut: "https://www.capcut.com", freepik: "https://www.freepik.com",
  // 25.11.2026: katalog do 100 narzędzi.
  "murf-ai": "https://murf.ai",
  "speechify": "https://speechify.com",
  "pictory": "https://pictory.ai",
  "invideo-ai": "https://invideo.io",
  "fliki": "https://fliki.ai",
  "colossyan": "https://www.colossyan.com",
  "submagic": "https://www.submagic.co",
  "photoroom": "https://photoroom.com",
  "picsart": "https://picsart.com",
  "pitch": "https://pitch.com",
  "visme": "https://visme.co",
  "rytr": "https://rytr.me",
  "anyword": "https://anyword.com",
  "hypotenuse-ai": "https://www.hypotenuse.ai",
  "surfer-seo": "https://surferseo.com",
  "neuronwriter": "https://neuronwriter.com",
  "frase": "https://www.frase.io",
  "scalenut": "https://www.scalenut.com",
  "tactiq": "https://tactiq.io",
  "notta": "https://www.notta.ai",
  "sembly": "https://www.sembly.ai",
  "avoma": "https://www.avoma.com",
  "chatbase": "https://www.chatbase.co",
  "botpress": "https://botpress.com",
  "voiceflow": "https://www.voiceflow.com",
  "crisp": "https://crisp.chat",
  "pabbly-connect": "https://www.pabbly.com/connect/",
  "activepieces": "https://www.activepieces.com",
  "taskade": "https://www.taskade.com",
  "motion": "https://www.usemotion.com",
  "reclaim-ai": "https://reclaim.ai",
  "monday": "https://monday.com",
  "cursor": "https://cursor.com",
  "github-copilot": "https://github.com",
  "relevance-ai": "https://relevanceai.com",
  "lovable": "https://lovable.dev",
  "replit": "https://replit.com",
  "framer": "https://www.framer.com",
  "hostinger-horizons": "https://www.hostinger.com",
  "decktopus": "https://www.decktopus.com",
  "predis-ai": "https://predis.ai",
};
// Pobiera tylko brakujące (public/narzedzia-ai/<slug>.png nie istnieje), chyba że podano --wszystkie.
const WSZYSTKIE = process.argv.includes("--wszystkie");
const UA = { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36", "accept-language": "pl,en;q=0.8" };
const OUT = "scripts/out/narzedzia-ai-loga-surowe"; // surowe pliki poza public (nie idą na serwer)
fs.mkdirSync(OUT, { recursive: true });
async function pobierz(url) {
  const r = await fetch(url, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${r.status}`);
  return { buf: Buffer.from(await r.arrayBuffer()), typ: r.headers.get("content-type") || "" };
}
for (const [slug, strona] of Object.entries(DOMENY)) {
  if (!WSZYSTKIE && fs.existsSync(`public/narzedzia-ai/${slug}.png`)) continue;
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
