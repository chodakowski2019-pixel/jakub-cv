// Pozwala uruchamiać kod z lib/ w Node 24 bez budowania Next:
//   node --env-file=.env.local --import ./scripts/_ts-loader.mjs scripts/plik.ts
// Rozwiązuje alias "@/..." na katalog projektu i dopisuje rozszerzenie .ts/.tsx,
// bo Node rozbiera typy sam, ale wymaga pełnych ścieżek w importach.
import { register } from "node:module";

// Bez pathToFileURL: ścieżka z „Moje-Życie" byłaby zakodowana dwa razy.
const root = new URL("..", import.meta.url).href;

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = ${JSON.stringify(root)};
export async function resolve(specifier, context, next) {
  let s = specifier;
  if (s.startsWith("@/")) s = root + s.slice(2);
  // next/headers, next/server: pakiet next nie ma pola exports, Node chce pełnej nazwy pliku.
  if (/^next\\/[a-z-]+$/.test(s)) return next(s + ".js", context);
  const wzgledny = s.startsWith("./") || s.startsWith("../") || s.startsWith("file:");
  if (wzgledny && !/\\.[a-z]+$/i.test(s)) {
    const baza = s.startsWith("file:") ? s : new URL(s, context.parentURL).href;
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      if (existsSync(fileURLToPath(baza + ext))) return next(baza + ext, context);
    }
  }
  return next(s, context);
}
`),
);
