/**
 * 4.11: test modułu lib/bruno/lejek.ts na firmie DEMO (token z bruno_firmy): odczyt lejka + analiza per handlowiec,
 * potem zapis na jednym dealu demo: notatka → zadanie → etap → wartość → przegrany → z powrotem otwarty.
 *   node --no-warnings --env-file=.env.local --import ./scripts/_ts-loader.mjs scripts/bruno-lejek-test.ts [firma=bruno-demo]
 */
import { supabaseAdmin } from "@/lib/supabase";
import { analizaZDeali, dodajNotatke, dodajZadanie, notatkiDeala, pobierzLejek, przesunEtap, zadaniaDeala, zamknijDeal, zmienWartosc } from "@/lib/bruno/lejek";

const FIRMA = process.argv[2] ?? "bruno-demo";
const { data: firma } = await supabaseAdmin.from("bruno_firmy").select("id, nazwa, demo, pipedrive_token").eq("id", FIRMA).maybeSingle();
if (!firma?.pipedrive_token) throw new Error(`Firma ${FIRMA} bez tokenu Pipedrive.`);
const token = firma.pipedrive_token as string;

const lejek = await pobierzLejek(token);
console.log(`Lejek „${lejek.pipeline.nazwa}”: ${lejek.etapy.length} etapów, ${lejek.deale.length} deali, pole handlowca: ${lejek.pole_handlowca}`);
const handlowcy = [...new Set(lejek.deale.map((d) => d.handlowiec).filter(Boolean))] as string[];
for (const h of handlowcy) {
  const a = analizaZDeali(h, lejek.etapy, lejek.deale.filter((d) => d.handlowiec === h));
  console.log(`  ${h.split("@")[0].padEnd(20)} otwarte ${a.otwarte} · wygrane ${a.wygrane} · przegrane ${a.przegrane} · skuteczność ${a.skutecznosc}% · najsłabszy: ${a.najslabszy?.nazwa ?? "-"}`);
}

const deal = lejek.deale.find((d) => d.status === "open" && d.tytul.startsWith("[Bruno demo]"));
if (!deal) throw new Error("Brak otwartego deala demo.");
console.log(`\nZapis na dealu #${deal.id} „${deal.tytul}” (etap ${deal.etap_id}, ${deal.wartosc} ${deal.waluta})`);
const n = await dodajNotatke(token, deal.id, "<p>Test z Bruno 4.11: klient chce ofertę do piątku, budżet 15 000 zł.</p>");
console.log("  notatka", n.id);
const dzis = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
const z = await dodajZadanie(token, { dealId: deal.id, temat: "Wysłać ofertę (test Bruno)", data: dzis, godzina: "10:00", typ: "email" });
console.log("  zadanie", z.id, dzis);
const etapOferta = lejek.etapy[Math.min(3, lejek.etapy.length - 1)];
const e = await przesunEtap(token, deal.id, etapOferta.id);
console.log("  etap →", etapOferta.nazwa, e.stage_id === etapOferta.id ? "✓" : "✗");
const w = await zmienWartosc(token, deal.id, 15000);
console.log("  wartość", w.value);
const l = await zamknijDeal(token, deal.id, "lost", "test Bruno: za drogo");
console.log("  status", l.status);
// z powrotem otwarty, żeby test nie zostawiał śladu w statystykach
const API = "https://api.pipedrive.com/v1";
const r = await fetch(`${API}/deals/${deal.id}?api_token=${encodeURIComponent(token)}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "open", stage_id: deal.etap_id, value: deal.wartosc }) });
console.log("  przywrócony:", (await r.json()).data?.status);
const [nn, zz] = await Promise.all([notatkiDeala(token, deal.id, 3), zadaniaDeala(token, deal.id)]);
console.log(`  notatek: ${nn.length} (ostatnia: ${nn[0]?.tresc.slice(0, 60)}), zadań: ${zz.length}`);
console.log("\nOK");
