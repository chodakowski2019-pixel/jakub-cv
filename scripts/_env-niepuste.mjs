// 25.10: łączy pliki env tak, że PUSTA wartość nie nadpisuje pełnej (Node `--env-file` nadpisuje zawsze).
// Potrzebne, bo `vercel env pull` zapisuje zmienne „sensitive” jako puste, a .env.local ma puste
// miejsca na klucze, których lokalnie nie ma. Kolejność: .env.local, potem .env.vercel; wygrywa pierwsza niepusta.
//   node --import ./scripts/_env-niepuste.mjs --import ./scripts/_ts-loader.mjs scripts/plik.ts
import { existsSync, readFileSync } from "node:fs";

for (const plik of [".env.local", ".env.vercel"]) {
  if (!existsSync(plik)) continue;
  for (const linia of readFileSync(plik, "utf8").split("\n")) {
    const m = linia.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (v && !process.env[m[1]]) process.env[m[1]] = v;
  }
}
