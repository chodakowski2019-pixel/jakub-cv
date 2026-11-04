// 4.11.2026 (USER_001: „w kliencie nie ma być napisane «przykład» i po polsku imiona i nazwiska klientów”).
// Przerabia 8 przykładowych deali Pipedrive (założonych przez Pipedrive po angielsku: „[Przykład] Tony Turner” itd.)
// na polskie osoby i firmy, zdejmuje „[Przykład] ” z tytułów, notatek i aktywności, podmienia imiona w treści.
//   node --env-file=.env.local scripts/bruno-demo-pipedrive-pl.mjs
// Prefiks „[Bruno demo] ” w naszych dealach ZOSTAJE w Pipedrive (reset seeda po nim usuwa), panel go nie pokazuje (lib/bruno/lejek.ts).

const TOKEN = process.env.PIPEDRIVE_API_TOKEN;
if (!TOKEN) throw new Error("Brak PIPEDRIVE_API_TOKEN w .env.local");
const A = "https://api.pipedrive.com/v1";
async function pd(p, init) {
  const sep = p.includes("?") ? "&" : "?";
  const r = await fetch(`${A}${p}${sep}api_token=${TOKEN}`, { ...init, headers: { "content-type": "application/json" } });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.success) throw new Error(`Pipedrive ${p}: ${r.status} ${j?.error ?? ""}`);
  return j.data;
}
const spij = (ms) => new Promise((r) => setTimeout(r, ms));

// Osoba EN → PL (mianownik, narzędnik „z …”, dopełniacz „do …”), firma EN → PL.
const OSOBY = {
  "Tony Turner": { pl: "Tomasz Tarnowski", formy: [["Tonym", "Tomaszem"], ["Tony'ego", "Tomasza"], ["Tony", "Tomasz"]] },
  "Benjamin Leon": { pl: "Bartosz Lewicki", formy: [["Benjaminem", "Bartoszem"], ["Benjamina", "Bartosza"], ["Benjamin", "Bartosz"]] },
  "Gloria Quinn": { pl: "Grażyna Kwiatkowska", formy: [["Glorią", "Grażyną"], ["Glorii", "Grażyny"], ["Gloria", "Grażyna"]] },
  "Phyllis Yang": { pl: "Paulina Janik", formy: [["Phyllis", "Pauliną"]] },
  "Otto Miller": { pl: "Olgierd Malinowski", formy: [["Ottem", "Olgierdem"], ["Otta", "Olgierda"], ["Otto", "Olgierd"]] },
  "Kanushi Barnes": { pl: "Kamil Bartczak", formy: [["Kanushim", "Kamilem"], ["Kanushi", "Kamilem"]] },
  "Peru Zitan": { pl: "Piotr Zieliński", formy: [["Peru", "Piotrem"]] },
  "Githa Watson": { pl: "Gabriela Wasilewska", formy: [["Githą", "Gabrielą"], ["Githy", "Gabrieli"], ["Githa", "Gabriela"]] },
};
const FIRMY = { EmpowerMove: "Energomont", MoveEr: "Movex Logistyka", "Phyllis & Cie": "Janik i Wspólnicy", iTable: "iStół Meble", Lorean: "Lorean Polska", SoRock: "SoRock Studio", Damone: "Damone Kosmetyki" };

const czysc = (s) => String(s ?? "").replace(/\[Przykład\]\s*/g, "").replace(/\[Sample\]\s*/g, "");
function tlumacz(s) {
  let t = czysc(s);
  for (const o of Object.values(OSOBY)) for (const [en, pl] of o.formy) t = t.replace(new RegExp(en, "g"), pl);
  for (const [en, pl] of Object.entries(FIRMY)) t = t.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), pl);
  return t;
}

const deale = (await pd("/deals?status=all_not_deleted&limit=500")).filter((d) => /\[Przykład\]|\[Sample\]/i.test(d.title));
console.log(`${deale.length} przykładowych deali`);
const osobyZrobione = new Set();
const firmyZrobione = new Set();
for (const d of deale) {
  const osobaEn = czysc(d.person_name);
  const firmaEn = czysc(d.org_name);
  const osobaPl = OSOBY[osobaEn]?.pl ?? osobaEn;
  const firmaPl = FIRMY[firmaEn] ?? firmaEn;
  const tytul = tlumacz(d.title) === osobaEn ? osobaPl : tlumacz(d.title) === firmaEn ? firmaPl : tlumacz(d.title);
  await pd(`/deals/${d.id}`, { method: "PUT", body: JSON.stringify({ title: tytul }) });
  if (d.person_id?.value && !osobyZrobione.has(d.person_id.value)) {
    await pd(`/persons/${d.person_id.value}`, { method: "PUT", body: JSON.stringify({ name: osobaPl }) });
    osobyZrobione.add(d.person_id.value);
  }
  if (d.org_id?.value && !firmyZrobione.has(d.org_id.value)) {
    await pd(`/organizations/${d.org_id.value}`, { method: "PUT", body: JSON.stringify({ name: firmaPl }) });
    firmyZrobione.add(d.org_id.value);
  }
  const notatki = (await pd(`/notes?deal_id=${d.id}&limit=50`)) ?? [];
  for (const n of notatki) {
    const nowa = tlumacz(n.content);
    if (nowa !== n.content) await pd(`/notes/${n.id}`, { method: "PUT", body: JSON.stringify({ content: nowa }) });
    await spij(80);
  }
  const akt = (await pd(`/deals/${d.id}/activities?limit=50`)) ?? [];
  for (const a of akt) {
    const subject = tlumacz(a.subject);
    const note = tlumacz(a.note);
    if (subject !== a.subject || note !== (a.note ?? "")) await pd(`/activities/${a.id}`, { method: "PUT", body: JSON.stringify({ subject, ...(a.note ? { note } : {}) }) });
    await spij(80);
  }
  console.log(`#${d.id} „${tytul}” · ${osobaPl} · ${firmaPl || "-"} · notatek ${notatki.length}, aktywności ${akt.length}`);
  await spij(150);
}
// Osoby i firmy „[Przykład]” bez deala (np. dodatkowe wpisy Pipedrive).
for (const p of (await pd("/persons?limit=500")) ?? []) if (/\[Przykład\]|\[Sample\]/i.test(p.name)) await pd(`/persons/${p.id}`, { method: "PUT", body: JSON.stringify({ name: OSOBY[czysc(p.name)]?.pl ?? czysc(p.name) }) });
for (const o of (await pd("/organizations?limit=500")) ?? []) if (/\[Przykład\]|\[Sample\]/i.test(o.name)) await pd(`/organizations/${o.id}`, { method: "PUT", body: JSON.stringify({ name: FIRMY[czysc(o.name)] ?? czysc(o.name) }) });
console.log("OK");
