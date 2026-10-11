import { NextResponse } from "next/server";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { jezykLubDomyslny } from "@/lib/bruno/domeny";
import { tDla } from "@/lib/bruno/i18n";
import { zapiszProfil } from "@/lib/bruno/konto-free";
import { ROLE } from "@/lib/bruno/role";

export const dynamic = "force-dynamic";

// POST /api/bruno/profil (11.10, USER_001): po rejestracji e-mail + hasło konto uzupełnia
// imię, telefon (opcjonalnie), rolę, liczbę handlowców (opcjonalnie) i produkt. Potem panel.

export async function POST(req: Request) {
  const email = await zalogowanyEmail();
  if (!email) return NextResponse.json({ ok: false }, { status: 401 });
  const konto = await pobierzKonto(email);
  if (!konto) return NextResponse.json({ ok: false }, { status: 401 });
  const jezyk = jezykLubDomyslny(konto.jezyk);
  const t = tDla(jezyk);

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const imie = String(b.imie ?? "").trim().slice(0, 80);
  const telefon = String(b.telefon ?? "").replace(/[^\d+ ]/g, "").trim().slice(0, 24) || null;
  const rola = (ROLE as readonly string[]).includes(String(b.rola)) ? String(b.rola) : null;
  const produkt = String(b.produkt ?? "").trim().slice(0, 200);
  const h = Math.round(Number(b.handlowcy));
  const handlowcy = Number.isFinite(h) && h > 0 ? Math.min(100000, h) : null;

  if (imie.length < 2) return NextResponse.json({ ok: false, blad: t("Enter your first name.", "Podaj imię.") }, { status: 400 });
  if (!rola) return NextResponse.json({ ok: false, blad: t("Choose your role.", "Wybierz rolę.") }, { status: 400 });
  if (produkt.length < 2) return NextResponse.json({ ok: false, blad: t("Tell us what you sell.", "Napisz, co sprzedajesz.") }, { status: 400 });

  const z = await zapiszProfil({ email, imie, telefon, rola, handlowcy, produkt, jezyk });
  if (!z.ok) return NextResponse.json({ ok: false, blad: t("Could not save. Try again.", "Nie udało się zapisać. Spróbuj ponownie.") }, { status: 500 });
  return NextResponse.json({ ok: true, dalej: "/bruno/panel" });
}
