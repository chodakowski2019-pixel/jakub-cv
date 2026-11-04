#!/usr/bin/env node
// 2.11.2026: test podpięcia Bruno → Pipedrive bez deployu.
// Bierze ostatnią ocenioną rozmowę konta i tworzy zrobioną aktywność „Trening Bruno” w Pipedrive z PIPEDRIVE_API_TOKEN.
//   node --env-file=.env.local scripts/bruno-pipedrive-test.mjs <email konta Bruno>
// Ta sama logika co lib/bruno/pipedrive.ts (skrypt w .mjs, bo repo nie ma tsx).
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) { console.error("Podaj e-mail konta Bruno."); process.exit(1); }
const token = process.env.PIPEDRIVE_API_TOKEN;
if (!token) { console.error("Brak PIPEDRIVE_API_TOKEN w .env.local"); process.exit(1); }

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: konto } = await sb.from("bruno_konta").select("email, imie, jezyk").eq("email", email).maybeSingle();
const { data: r } = await sb.from("bruno_rozmowy").select("id, start, sekundy, obiekcja, poziom, feedback, ocena").eq("email", email).eq("status", "zakonczona").not("feedback", "is", null).order("start", { ascending: false }).limit(1).maybeSingle();
if (!r) { console.error("Brak ocenionej rozmowy dla", email); process.exit(1); }
console.log("Rozmowa:", r.id, r.start, "ocena", r.ocena);

const API = "https://api.pipedrive.com/v1";
async function pd(p, init) {
  const sep = p.includes("?") ? "&" : "?";
  const res = await fetch(`${API}${p}${sep}api_token=${token}`, { ...init, headers: { "content-type": "application/json" } });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j?.success) throw new Error(`Pipedrive ${p.split("?")[0]}: ${res.status} ${j?.error ?? ""}`);
  return j.data;
}

const typy = await pd("/activityTypes");
let typ = typy.find((t) => t.name === "Trening Bruno" && t.active_flag)?.key_string;
if (!typ) typ = (await pd("/activityTypes", { method: "POST", body: JSON.stringify({ name: "Trening Bruno", icon_key: "call", color: "6C5CE7" }) })).key_string;
console.log("Typ aktywności:", typ);

const uz = (await pd(`/users/find?term=${encodeURIComponent(email)}&search_by_email=1`)) ?? [];
const user_id = uz.find((u) => String(u.email).toLowerCase() === email.toLowerCase())?.id ?? null;
console.log("Użytkownik Pipedrive:", user_id ?? "brak (właściciel tokenu)");

const f = r.feedback;
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const lista = (t) => (t?.length ? `<ul>${t.slice(0, 4).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "<p>-</p>");
const plusy = f.plusy ?? f.kryteria.filter((k) => k.ocena >= 7).map((k) => k.komentarz);
const minusy = f.minusy ?? f.kryteria.filter((k) => k.ocena < 5).map((k) => k.komentarz);
const note = `<p><b>Ocena: ${f.ocena}/10</b></p><p><b>Plusy</b></p>${lista(plusy)}<p><b>Minusy</b></p>${lista(minusy)}${f.poprawka ? `<p><b>Jedna poprawka:</b> ${esc(f.poprawka)}</p>` : ""}<p>Kryteria: ${f.kryteria.map((k) => `${k.nazwa} ${k.ocena}`).join(", ")}</p>`;
const start = new Date(r.start);
const minuty = Math.max(1, Math.round((r.sekundy ?? 0) / 60));
const a = await pd("/activities", {
  method: "POST",
  body: JSON.stringify({
    subject: `${konto?.imie ? konto.imie + ": " : ""}Bruno ${f.ocena}/10${r.obiekcja ? " · " + r.obiekcja : ""}${r.poziom ? " · " + r.poziom : ""}`,
    type: typ, done: 1,
    due_date: start.toISOString().slice(0, 10), due_time: start.toISOString().slice(11, 16),
    duration: `${String(Math.floor(minuty / 60)).padStart(2, "0")}:${String(minuty % 60).padStart(2, "0")}`,
    ...(user_id ? { user_id } : {}),
    note, public_description: `Trening z Bruno AI, rozmowa ${r.id}`,
  }),
});
console.log("Aktywność w Pipedrive: id", a.id, "|", a.subject);
