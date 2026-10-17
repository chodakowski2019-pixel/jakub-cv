// 17.10: prywatne linki dla firm do ich ogłoszenia (salesbruno.com/praca/<id>?k=<token>).
// Token = HMAC z sekretu serwera (ten sam wzór co tokenOferty w lib/bruno/praca/oferty.ts), w repo go nie ma.
// Użycie: node --env-file=.env.local scripts/bruno-praca-linki.mjs <id> [<id> ...]
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!s) throw new Error("Brak SUPABASE_SERVICE_ROLE_KEY (uruchom z --env-file=.env.local)");
const oferty = JSON.parse(readFileSync(path.join(import.meta.dirname, "..", "lib/bruno/praca/oferty.json"), "utf8"));
for (const id of process.argv.slice(2)) {
  const o = oferty.find((x) => x.id === id);
  if (!o) { console.log(`${id}\tBRAK`); continue; }
  const k = createHmac("sha256", `praca:${s}`).update(o.klucz).digest("hex").slice(0, 24);
  console.log(`${id}\thttps://salesbruno.com/praca/${o.id}?k=${k}`);
}
