// Zrzuty panelu Bruno do sekcji „Zobacz Bruno w środku” na LP (/handlowcy, /reps).
// 3 ekrany: panel, trwająca rozmowa, feedback (szczegóły). Chrome headless przez CDP, 1280x800 @1.5.
// Rozmowa: klik Start, zapytanie /api/bruno/rozmowa/start ZATRZYMANE (0 kosztu, 0 zużytych rozmów),
// ekran odliczania przerobiony w DOM na wygląd trwającej rozmowy (te same klasy co w rozmowa.tsx).
// Użycie: node --env-file=.env.local scripts/bruno-zrzuty-lp.mjs <email konta> <pl|en> <katalog wyjściowy> [host]
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash, createHmac } from "node:crypto";

const [email, jezyk = "pl", outDir, HOST = "http://localhost:3001"] = process.argv.slice(2);
if (!email || !outDir) {
  console.error("użycie: node --env-file=.env.local scripts/bruno-zrzuty-lp.mjs <email> <pl|en> <out> [host]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

// Token sesji jak lib/bruno/auth.ts (nowyToken).
const s = process.env.BRUNO_AUTH_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!s) throw new Error("Brak BRUNO_AUTH_SECRET / SUPABASE_SERVICE_ROLE_KEY w env");
const sekret = createHash("sha256").update(`bruno:${s}`).digest("hex");
const wygasa = Date.now() + 60 * 60 * 1000;
const tresc = `${Buffer.from(email).toString("base64url")}.${wygasa}`;
const cookie = `${tresc}.${createHmac("sha256", sekret).update(tresc).digest("hex")}`;

const URLH = new URL(HOST);
const PORT = 9338;
const W = 1280;
const SCALE = 1.5;
const profil = mkdtempSync(join(tmpdir(), "bruno-zrzuty-lp-"));
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profil}`,
    "--no-first-run",
    "--hide-scrollbars",
    `--window-size=${W},800`,
    `--lang=${jezyk === "pl" ? "pl-PL" : "en-US"}`,
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "about:blank",
  ],
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
await send("Network.enable");
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Emulation.setDeviceMetricsOverride", { width: W, height: 800, deviceScaleFactor: SCALE, mobile: false });
await send("Browser.grantPermissions", { permissions: ["audioCapture"], origin: URLH.origin }).catch(() => {});
await send("Network.setCookie", { name: "bruno_sesja", value: cookie, domain: URLH.hostname, path: "/", secure: URLH.protocol === "https:" });
// Start rozmowy NIGDY nie dochodzi do serwera: zapytanie wisi (Fetch.requestPaused bez continue).
await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/bruno/rozmowa/start*", requestStage: "Request" }] });

const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;
const SPRZATAJ = `(() => {
  document.querySelector('[aria-label="Film oprowadzający"]')?.remove();
  document.querySelector('[aria-label="Welcome video"]')?.remove();
  document.querySelectorAll('nextjs-portal, .bruno-dymek').forEach((e) => e.remove());
  document.body.style.overflow = '';
  return 1;
})()`;
async function goto(path) {
  const sep = path.includes("?") ? "&" : "?";
  await send("Page.navigate", { url: HOST + path + sep + jezyk });
  await sleep(5000);
  await evalJs("document.fonts && document.fonts.ready");
  await evalJs(SPRZATAJ);
  await sleep(1500);
  await evalJs(SPRZATAJ);
}
async function shot(name) {
  await evalJs(SPRZATAJ);
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(outDir, name + ".png"), Buffer.from(r.data, "base64"));
  console.log("shot", name);
}

const t = (en, pl) => (jezyk === "pl" ? pl : en);

// 1. PANEL
await goto("/bruno/panel?tour=0");
await shot("panel");

// 2. ROZMOWA (kreator → Start → odliczanie zatrzymane → wygląd „trwa”)
await goto("/bruno/rozmowa");
const start = await evalJs("(() => { const b = [...document.querySelectorAll('main button')].find(b => b.textContent.trim() === 'Start'); if (!b) return false; b.click(); return true; })()");
console.log("start:", start);
await sleep(4200); // odliczanie 3-2-1-Start, zapytanie start wisi
const ok = await evalJs(`(() => {
  const kula = document.querySelector('main .bruno-kula');
  if (!kula) return 'brak kuli';
  const box = kula.closest('.bruno-szklo');
  box.querySelector('.bruno-odliczanie')?.remove();
  kula.classList.remove('bruno-kula-czeka');
  kula.classList.add('bruno-kula-mowi');
  const status = [...box.querySelectorAll('div')].find(d => d.className.includes('text-sm') && d.className.includes('mt-1'));
  if (status) status.textContent = ${JSON.stringify(t("Bruno is talking", "Bruno mówi"))};
  const zegar = document.createElement('div');
  zegar.className = 'absolute top-4 right-4 sm:top-5 sm:right-5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums bg-white/70 text-slate-700 border border-slate-200/80';
  zegar.textContent = '2:41';
  box.prepend(zegar);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bruno-przycisk-2';
  btn.textContent = ${JSON.stringify(t("End call", "Zakończ rozmowę"))};
  box.append(btn);
  return 'ok';
})()`);
console.log("rozmowa DOM:", ok);
await sleep(600);
await shot("rozmowa");

// 3. FEEDBACK (szczegóły ostatniej ocenionej rozmowy)
await goto("/bruno/feedback");
const link = await evalJs("document.querySelector('main a[href^=\"/bruno/feedback/\"]')?.getAttribute('href') ?? ''");
if (link) {
  await goto(link);
  await shot("feedback");
} else {
  console.log("brak ocenionych rozmów, zrzut listy");
  await shot("feedback");
}

ws.close();
chrome.kill();
process.exit(0);
