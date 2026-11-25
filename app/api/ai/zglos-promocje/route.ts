import { NextResponse } from "next/server";
import { SKRZYNKA_JAKUBA, esc, wyslijMail } from "@/lib/newsletter-marka";

export const dynamic = "force-dynamic";

// POST /api/ai/zglos-promocje (25.11.2026): zgłoszenie promocji z /ai/black-week. Tylko adres strony, bez danych osobowych.
// Nic nie jest publikowane: mail do Jakuba, sprawdzenie u producenta, ręczny wpis do content/narzedzia-ai/_promocje.json.
const OSTATNIE = new Map<string, number>();

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.www) return NextResponse.json({ ok: true });
  let url: URL;
  try {
    url = new URL(String(b.url ?? "").trim().slice(0, 500));
    if (!/^https?:$/.test(url.protocol)) throw new Error("protokol");
  } catch {
    return NextResponse.json({ ok: false, blad: "Adres wygląda na niepełny. Wklej cały, z https://." }, { status: 400 });
  }
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "brak";
  const teraz = Date.now();
  if (teraz - (OSTATNIE.get(ip) ?? 0) < 30_000) return NextResponse.json({ ok: false, blad: "Za szybko. Spróbuj za pół minuty." }, { status: 429 });
  OSTATNIE.set(ip, teraz);
  console.log("[zglos-promocje]", url.toString());
  try {
    await wyslijMail({
      do: SKRZYNKA_JAKUBA,
      temat: `Zgłoszona promocja: ${url.host}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;font-size:15px"><p>Ktoś zgłosił promocję z /ai/black-week. Sprawdź u producenta, zanim trafi na listę.</p><p><a href="${esc(url.toString())}">${esc(url.toString())}</a></p></div>`,
    });
  } catch (e) {
    console.error("[zglos-promocje] mail", e);
  }
  return NextResponse.json({ ok: true });
}
