// 5.11: zrzuty salesbruno.pl/start (app/brunostart), cała strona: desktop 1440 i telefon 390. Chrome headless przez CDP.
// Użycie: node scripts/bruno-zrzuty-start.mjs <katalog wyjściowy> [host=http://localhost:3001]
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const [outDir, HOST = "http://localhost:3001"] = process.argv.slice(2);
if (!outDir) {
  console.error("użycie: node bruno-zrzuty-start.mjs <out> [host]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const PORT = 9342;
const profil = mkdtempSync(join(tmpdir(), "bruno-start-zrzuty-"));
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
const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;

for (const [nazwa, W, H, mobile] of [
  ["desktop", 1440, 900, false],
  ["mobile", 390, 844, true],
]) {
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send("Page.navigate", { url: `${HOST}/start` });
  await sleep(2500);
  await evalJs("document.querySelectorAll('nextjs-portal').forEach(e => e.remove()); document.fonts.ready.then(() => 1)");
  // widok z góry
  let r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(outDir, `${nazwa}-1-gora.png`), Buffer.from(r.data, "base64"));
  // cała strona: najpierw przewiń do dołu krokami (sekcje pojawiają się przy przewijaniu), potem wróć na górę
  await evalJs("(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } document.querySelectorAll('[data-pokaz]').forEach(e => e.classList.add('widac')); window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 800)); return 1; })()");
  // cała strona
  const wys = await evalJs("document.documentElement.scrollHeight");
  const szer = await evalJs("document.documentElement.scrollWidth");
  console.log(nazwa, "wysokość", wys, "szerokość", szer, szer > W ? "POZIOMY SCROLL!" : "ok");
  r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: Math.min(wys, 12000), scale: 1 } });
  writeFileSync(join(outDir, `${nazwa}-2-cala.png`), Buffer.from(r.data, "base64"));
  console.log("shot", nazwa);
}
ws.close();
chrome.kill();
