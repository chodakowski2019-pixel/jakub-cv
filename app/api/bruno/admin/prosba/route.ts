import { NextResponse } from "next/server";
import { odrzucProsbe, przyznajDostep } from "@/lib/bruno/prosby";

export const dynamic = "force-dynamic";

// 17.10 (USER_001): Admin, prośby o dostęp. „Daj dostęp” = konto demo + mail z kodem, „Odrzuć” = sam status.
// Klucz STATS_KEY jak w /api/bruno/admin.
function autoryzowany(req: Request) {
  const k = process.env.STATS_KEY;
  if (!k) return false;
  return req.headers.get("x-klucz") === k || new URL(req.url).searchParams.get("k") === k;
}

export async function POST(req: Request) {
  if (!autoryzowany(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { id?: unknown; akcja?: unknown };
  const id = Number(b.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ ok: false, blad: "Złe id." }, { status: 400 });
  if (b.akcja === "odrzuc") {
    await odrzucProsbe(id);
    return NextResponse.json({ ok: true });
  }
  const z = await przyznajDostep(id);
  return NextResponse.json(z, { status: z.ok ? 200 : 400 });
}
