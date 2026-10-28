import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SKRZYNKA_JAKUBA, wyslij } from "@/lib/bruno/mail";
import { KUBELEK_BRUNO } from "@/lib/bruno/nagrania";
import { FIRMY, pytaniaDla, type Rola } from "@/lib/bruno/formularz-firmy";

export const dynamic = "force-dynamic";

// POST /api/bruno/formularz (28.10, USER_001): odpowiedzi z formularza CRM po demo.
// Wiersz w `bruno_formularze` + mail z odpowiedziami do USER_001 (reply-to = osoba). Kopia w logach Vercela.
// Głosówka: klucz `<id>_nagranie` = ścieżka w kubełku bruno-nagrania (wgrana wcześniej przez /formularz/nagranie);
// w mailu link do odsłuchu ważny 7 dni.
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const firma = FIRMY[String(b.firma ?? "")];
  const rola = String(b.rola ?? "") as Rola;
  if (!firma || (rola !== "szef" && rola !== "handlowiec")) return NextResponse.json({ ok: false, blad: "Nieznany formularz." }, { status: 400 });
  const imie = String(b.imie ?? "").trim().slice(0, 80);
  // 28.10 (USER_001): e-mail usunięty z formularza; kolumna zostaje pusta.
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  if (imie.length < 2) return NextResponse.json({ ok: false, blad: "Wpisz imię." }, { status: 400 });

  const wej = (b.odpowiedzi ?? {}) as Record<string, unknown>;
  const pytania = pytaniaDla(rola);
  const odpowiedzi: Record<string, string> = {};
  for (const p of pytania) {
    const v = String(wej[p.id] ?? "").trim().slice(0, 4000);
    if (v) odpowiedzi[p.id] = v;
    if (p.glosowka) {
      const n = String(wej[`${p.id}_nagranie`] ?? "").trim();
      if (n && n.startsWith(`formularze/${firma.klucz}/`) && /^[\w./-]+$/.test(n)) odpowiedzi[`${p.id}_nagranie`] = n;
    }
  }
  if (!Object.keys(odpowiedzi).length) return NextResponse.json({ ok: false, blad: "Odpowiedz przynajmniej na jedno pytanie." }, { status: 400 });

  console.log("[bruno formularz]", JSON.stringify({ firma: firma.klucz, rola, imie, email, odpowiedzi, kiedy: new Date().toISOString() }));

  let zapis = true;
  try {
    const { error } = await supabaseAdmin.from("bruno_formularze").insert({ firma: firma.klucz, rola, imie, email: email || null, odpowiedzi });
    if (error) {
      zapis = false;
      console.error("[bruno formularz] baza", error.message);
    }
  } catch (e) {
    zapis = false;
    console.error("[bruno formularz] baza", e);
  }

  const wiersze: string[] = [];
  for (const [i, p] of pytania.entries()) {
    let odp = esc(odpowiedzi[p.id] ?? "-").replace(/\n/g, "<br>");
    const n = odpowiedzi[`${p.id}_nagranie`];
    if (n) {
      let link = n;
      try {
        const { data } = await supabaseAdmin.storage.from(KUBELEK_BRUNO).createSignedUrl(n, 7 * 24 * 3600);
        if (data?.signedUrl) link = data.signedUrl;
      } catch (e) {
        console.error("[bruno formularz] signedUrl", e);
      }
      odp += `<br><a href="${esc(link)}">🎙 Głosówka (link ważny 7 dni)</a>`;
    }
    wiersze.push(`<tr><td style="padding:8px 14px 8px 0;color:#6b6b6b;vertical-align:top;width:45%">${i + 1}. ${esc(p.tekst)}</td><td style="padding:8px 0;color:#0b0b0b;vertical-align:top"><b>${odp}</b></td></tr>`);
  }
  let mail = true;
  try {
    await wyslij({
      do: SKRZYNKA_JAKUBA,
      replyTo: email || undefined,
      temat: `Formularz CRM ${firma.nazwa} (${rola}): ${imie}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Odpowiedzi z formularza CRM <b>${esc(firma.nazwa)}</b>, rola <b>${rola}</b>.</p><p>${esc(imie)}${email ? ` &lt;${esc(email)}&gt;` : ""}${zapis ? "" : " (UWAGA: zapis do bazy nie powiódł się, odpowiedzi tylko w tym mailu)"}</p><table style="border-collapse:collapse">${wiersze.join("")}</table></div>`,
    });
  } catch (e) {
    mail = false;
    console.error("[bruno formularz] mail", e);
  }
  if (!zapis && !mail) return NextResponse.json({ ok: false, blad: "Nie udało się wysłać. Spróbuj ponownie." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
