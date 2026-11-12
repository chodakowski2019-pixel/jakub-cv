import { NextResponse } from "next/server";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { czyAdminGieldy, przypomnijHandlowcowi, usunHandlowca, ustawStatusProfilu } from "@/lib/bruno/praca/admin";

export const dynamic = "force-dynamic";

// POST /api/bruno/praca/admin (11.11, USER_001): administrator giełdy zmienia status profilu handlowca.
// { id: <id konta handlowca>, status: "zatwierdzony" | "weryfikacja" | "odrzucony" }. Pierwsze „zatwierdzony” wysyła handlowcowi mail o weryfikacji (raz na profil); `mail` w odpowiedzi mówi, co się stało.
const STATUSY = ["zatwierdzony", "weryfikacja", "odrzucony"] as const;

export async function POST(req: Request) {
  if (!czyAdminGieldy(await zalogowanePraca())) return NextResponse.json({ ok: false, blad: "Brak dostępu." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  // 12.11 (USER_001): { id, akcja: "przypomnij" } = mail z prośbą o dokończenie profilu (zakładka „Niedokończone”).
  if (b.akcja === "przypomnij") {
    const id = String(b.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, blad: "Złe dane." }, { status: 400 });
    const w = await przypomnijHandlowcowi(id);
    return NextResponse.json(w, { status: w.ok ? 200 : 400 });
  }
  const status = STATUSY.find((s) => s === b.status);
  const id = String(b.id ?? "");
  if (!status || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, blad: "Złe dane." }, { status: 400 });
  const w = await ustawStatusProfilu(id, status);
  if (!w.ok) return NextResponse.json({ ok: false, blad: "Nie ma takiego profilu." }, { status: 404 });
  return NextResponse.json({ ok: true, status, mail: w.mail });
}

// DELETE /api/bruno/praca/admin?id=<id konta handlowca> (12.11, USER_001): „X” = usunięcie handlowca z bazy razem z CV i zdjęciem.
export async function DELETE(req: Request) {
  if (!czyAdminGieldy(await zalogowanePraca())) return NextResponse.json({ ok: false, blad: "Brak dostępu." }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, blad: "Złe dane." }, { status: 400 });
  if (!(await usunHandlowca(id))) return NextResponse.json({ ok: false, blad: "Nie udało się usunąć." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
