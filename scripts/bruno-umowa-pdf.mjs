// 5.11: umowa klienta (app/oferta/<slug>/umowa) → public/pdf/umowa-<slug>.pdf. Chrome headless przez CDP, A4, tło włączone.
// Użycie: node scripts/bruno-umowa-pdf.mjs <slug: ewatex | limalogic> [host=http://localhost:3001]
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const [SLUG, HOST = "http://localhost:3001", DOK = "umowa"] = process.argv.slice(2);
if (!SLUG) {
  console.error("użycie: node scripts/bruno-umowa-pdf.mjs <slug> [host]");
  process.exit(1);
}
// 7.11: 3. argument = dokument: umowa (domyślnie) albo powierzenie (RODO art. 28) → public/pdf/<dok>-<slug>.pdf
const TYTUL = DOK === "powierzenie" ? `Umowa powierzenia danych ${SLUG === "ewatex" ? "Ewatex" : SLUG} × Bruno AI` : ({ ewatex: "Umowa współpracy Ewatex × Bruno AI", limalogic: "Umowa: analiza sprzedaży Limalogic × Bruno AI" }[SLUG] ?? `Umowa ${SLUG}`);
const OUT = join(process.cwd(), `public/pdf/${DOK}-${SLUG}.pdf`);
mkdirSync(join(process.cwd(), "public/pdf"), { recursive: true });
const PORT = 9342;
const profil = mkdtempSync(join(tmpdir(), "bruno-umowa-pdf-"));
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profil}`, "--no-first-run", "--lang=pl-PL", "about:blank"],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const j = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const p = j.find((t) => t.type === "page");
      if (p) return p.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("chrome nie wstał");
}
const ws = new WebSocket(await wsUrl());
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const j = JSON.parse(m.data);
  if (j.id && pending.has(j.id)) {
    pending.get(j.id)(j);
    pending.delete(j.id);
  }
};
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, (j) => (j.error ? rej(new Error(JSON.stringify(j.error))) : res(j.result)));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
await send("Page.enable");
await send("Page.navigate", { url: `${HOST}/oferta/${SLUG}/${DOK}` });
await sleep(2500);
await send("Runtime.evaluate", { expression:
    "document.querySelectorAll('nextjs-portal').forEach(e => e.remove());" +
    // tło i ramki z globalnych stylów strony (ciemne body) poza dokumentem
    "const st = document.createElement('style'); st.textContent = 'html,body{background:#fff!important;border:0!important;box-shadow:none!important} body::before,body::after{display:none!important;content:none!important}'; document.head.appendChild(st);" +
    "document.fonts.ready.then(() => 1)", awaitPromise: true });
const r = await send("Page.printToPDF", {
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: `<div style="width:100%;font-size:8px;color:#888;text-align:center;font-family:sans-serif">${TYTUL} · strona <span class="pageNumber"></span> z <span class="totalPages"></span></div>`,
});
writeFileSync(OUT, Buffer.from(r.data, "base64"));
console.log("PDF", OUT);
ws.close();
chrome.kill();
