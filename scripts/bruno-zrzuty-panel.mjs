// 6.11: zrzuty zakładek panelu Bruno (po zalogowaniu na konto demo). Chrome headless przez CDP.
// Użycie: node scripts/bruno-zrzuty-panel.mjs <katalog> <ścieżka[,ścieżka…]> [host=http://localhost:3077] [email] [hasło]
// Przykład: node scripts/bruno-zrzuty-panel.mjs zrzuty/lejek /bruno/lejek,/bruno/lejek?jako=handlowiec
// Zmienna CDP_PORT = port debugowania (domyślnie losowy), żeby kilka równoległych uruchomień sobie nie przeszkadzało.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const [outDir, sciezki, HOST = "http://localhost:3077", EMAIL = "szef.bruno-demo@demo.salesbruno.pl", HASLO = "251025"] = process.argv.slice(2);
if (!outDir || !sciezki) {
  console.error("użycie: node bruno-zrzuty-panel.mjs <out> <ścieżka[,ścieżka…]> [host] [email] [hasło]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const PORT = Number(process.env.CDP_PORT || 9400 + Math.floor(Math.random() * 400));
const profil = mkdtempSync(join(tmpdir(), "bruno-panel-zrzuty-"));
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profil}`, "--no-first-run", "--hide-scrollbars", "--window-size=1440,900", "--lang=pl-PL", "about:blank"],
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
await send("Runtime.enable");
const bledy = [];
ws.addEventListener("message", (m) => {
  const j = JSON.parse(m.data);
  if (j.method === "Runtime.exceptionThrown") bledy.push(j.params.exceptionDetails?.exception?.description ?? j.params.exceptionDetails?.text);
  if (j.method === "Runtime.consoleAPICalled" && j.params.type === "error") bledy.push(j.params.args.map((a) => a.value ?? a.description).join(" "));
});
const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;

// logowanie: strona /login + fetch do API (ciasteczko ustawia się samo)
await send("Page.navigate", { url: `${HOST}/login` });
await sleep(1500);
const log = await evalJs(`fetch('/api/bruno/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:${JSON.stringify(EMAIL)},haslo:${JSON.stringify(HASLO)},jezyk:'pl'})}).then(r=>r.text())`);
console.log("login", log);

const bez = (s) => s.replace(/^\/bruno\/?/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "panel";
for (const sciezka of sciezki.split(",")) {
  for (const [nazwa, W, H, mobile] of [
    ["desktop", 1440, 900, false],
    ["mobile", 390, 844, true],
  ]) {
    await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await send("Page.navigate", { url: `${HOST}${sciezka}` });
    await sleep(3000);
    await evalJs("document.querySelectorAll('nextjs-portal').forEach(e => e.remove()); document.fonts.ready.then(() => 1)");
    await evalJs("(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 900)); return 1; })()");
    const wys = await evalJs("document.documentElement.scrollHeight");
    const szer = await evalJs("document.documentElement.scrollWidth");
    const okno = await evalJs("window.innerWidth");
    const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: Math.min(wys, 9000), scale: 1 } });
    const plik = join(outDir, `${bez(sciezka)}-${nazwa}.png`);
    writeFileSync(plik, Buffer.from(r.data, "base64"));
    console.log(plik, `${szer}×${wys}`, `okno ${okno}`, szer > W || okno !== W ? "POZIOMY SCROLL / ZŁE OKNO!" : "ok");
  }
}
if (bledy.length) console.log("BŁĘDY KONSOLI:", [...new Set(bledy)].slice(0, 10).join("\n"));
else console.log("konsola: 0 błędów");
ws.close();
chrome.kill();
