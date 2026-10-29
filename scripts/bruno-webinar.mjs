// Webinar śr 4.11 19:00: lista zapisanych i maile po webinarze (3 grupy). 27.10 (USER_001).
// Uruchom z katalogu jakub-cv:
//   node --env-file=.env.local scripts/bruno-webinar.mjs lista
//   node --env-file=.env.local scripts/bruno-webinar.mjs obecnosc byli a@x.pl b@y.pl      (grupy: byli | wyszli | nieprzyszli)
//   node --env-file=.env.local scripts/bruno-webinar.mjs obecnosc nieprzyszli --reszta     (wszyscy bez grupy → nieprzyszli)
//   node --env-file=.env.local scripts/bruno-webinar.mjs po --test=chodakowski2019@gmail.com   (3 maile na próbę do Jakuba)
//   node --env-file=.env.local scripts/bruno-webinar.mjs po --wyslij                       (M5 do każdego z grupą i bez mail_po)
// Bez --wyslij `po` tylko pokazuje, komu i co by poszło. Lista obecności = z Zooma (Reports → Usage → Participants), ręcznie.
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Moduły TS projektu (webinar.ts, mail-webinar.ts) przez wbudowany strip-types Node 22+.
const [cmd, ...args] = process.argv.slice(2);
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const WEBINAR_KLUCZ = "2026-11-04";

async function moduly() {
  // Node 22.6+ czyta TS po fladze --experimental-strip-types; Node 23+ domyślnie. Importy względne w lib używają aliasu "@/",
  // mail-webinar.ts importuje tylko ./szablon-mail.mjs i ./webinar, więc można je wczytać bezpośrednio.
  const w = await import(new URL("../lib/bruno/webinar.ts", import.meta.url).href);
  const m = await import(new URL("../lib/bruno/mail-webinar.ts", import.meta.url).href);
  return { WEBINAR: w.WEBINAR, mailWebinarPo: m.mailWebinarPo, NADAWCA: m.NADAWCA_WEBINARU };
}

async function lista() {
  const { data, error } = await sb.from("bruno_webinar_zapisy").select("*").eq("webinar", WEBINAR_KLUCZ).order("zapisano");
  if (error) throw error;
  const zr = {};
  for (const z of data) zr[z.zrodlo ?? "-"] = (zr[z.zrodlo ?? "-"] ?? 0) + 1;
  console.table(data.map((z) => ({ imie: z.imie, email: z.email, zrodlo: z.zrodlo ?? "-", zapisano: z.zapisano.slice(0, 16), potw: z.potwierdzono ? z.potwierdzono.slice(0, 16) : "-", M0: !!z.mail_potwierdz, link: !!z.mail_potwierdzenie, M1: !!z.mail_jutro, M2: !!z.mail_dzis, M3: !!z.resend_za_godzine, M4: !!z.resend_start, obecnosc: z.obecnosc ?? "-", M5: !!z.mail_po, wypisany: !!z.wypisano })));
  console.log(`Razem: ${data.length}. Źródła:`, zr);
}

async function obecnosc() {
  const [grupa, ...maile] = args;
  if (!["byli", "wyszli", "nieprzyszli"].includes(grupa)) throw new Error("grupa: byli | wyszli | nieprzyszli");
  if (maile.includes("--reszta")) {
    const { error } = await sb.from("bruno_webinar_zapisy").update({ obecnosc: grupa }).eq("webinar", WEBINAR_KLUCZ).is("obecnosc", null).not("potwierdzono", "is", null);
    if (error) throw error;
    console.log(`Wszyscy bez grupy → ${grupa}`);
    return lista();
  }
  const { error } = await sb.from("bruno_webinar_zapisy").update({ obecnosc: grupa }).eq("webinar", WEBINAR_KLUCZ).in("email", maile.map((m) => m.toLowerCase()));
  if (error) throw error;
  console.log(`${maile.length} → ${grupa}`);
  return lista();
}

async function po() {
  const { mailWebinarPo, NADAWCA } = await moduly();
  const test = args.find((a) => a.startsWith("--test="))?.slice(7);
  if (test && !process.env.RESEND_API_KEY) {
    // Lokalnie bez klucza Resend: podgląd HTML wszystkich maili sekwencji do katalogu --do=<katalog> (domyślnie /tmp).
    const { mailWebinarPotwierdzenie, mailWebinarJutro, mailWebinarDzis, mailWebinarZaGodzine, mailWebinarStart } = await import(new URL("../lib/bruno/mail-webinar.ts", import.meta.url).href);
    const fs = await import("node:fs");
    const kat = args.find((a) => a.startsWith("--do="))?.slice(5) ?? "/tmp";
    const baza = "https://salesbruno.pl";
    const maile = { m0: mailWebinarPotwierdzenie({ imie: "Jakub", baza }), m1: mailWebinarJutro({ imie: "Jakub", baza }), m2: mailWebinarDzis({ imie: "Jakub", baza }), m3: mailWebinarZaGodzine({ imie: "Jakub" }), m4: mailWebinarStart({ imie: "Jakub" }), m5a: mailWebinarPo({ imie: "Jakub", grupa: "byli" }), m5b: mailWebinarPo({ imie: "Jakub", grupa: "wyszli" }), m5c: mailWebinarPo({ imie: "Jakub", grupa: "nieprzyszli" }) };
    for (const [k, m] of Object.entries(maile)) {
      fs.writeFileSync(`${kat}/webinar-${k}.html`, m.html);
      console.log(`${k}: ${m.temat} → ${kat}/webinar-${k}.html`);
    }
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  if (test) {
    for (const grupa of ["byli", "wyszli", "nieprzyszli"]) {
      const m = mailWebinarPo({ imie: "Jakub", grupa });
      const { error } = await resend.emails.send({ from: NADAWCA, to: test, subject: `[TEST ${grupa}] ${m.temat}`, html: m.html });
      if (error) throw new Error(error.message);
      console.log("test →", test, grupa);
    }
    return;
  }
  const { data, error } = await sb.from("bruno_webinar_zapisy").select("*").eq("webinar", WEBINAR_KLUCZ).not("obecnosc", "is", null).not("potwierdzono", "is", null).is("wypisano", null).is("mail_po", null);
  if (error) throw error;
  const wyslij = args.includes("--wyslij");
  for (const z of data) {
    const m = mailWebinarPo({ imie: z.imie, grupa: z.obecnosc, wypisz: z.token ? `https://salesbruno.pl/api/bruno/webinar/wypisz?t=${z.token}` : undefined });
    if (!wyslij) {
      console.log(`[podgląd] ${z.email} (${z.obecnosc}): ${m.temat}`);
      continue;
    }
    const { error: e } = await resend.emails.send({ from: NADAWCA, to: z.email, replyTo: "jakub@salesbruno.com", subject: m.temat, html: m.html });
    if (e) {
      console.error("błąd", z.email, e.message);
      continue;
    }
    await sb.from("bruno_webinar_zapisy").update({ mail_po: new Date().toISOString() }).eq("id", z.id);
    console.log("wysłane →", z.email, z.obecnosc);
  }
  if (!wyslij) console.log(`${data.length} do wysłania. Dodaj --wyslij, żeby wysłać.`);
}

const akcje = { lista, obecnosc, po };
if (!akcje[cmd]) {
  console.log("Użycie: lista | obecnosc <grupa> <maile…|--reszta> | po [--test=mail] [--wyslij]");
  process.exit(1);
}
akcje[cmd]().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
