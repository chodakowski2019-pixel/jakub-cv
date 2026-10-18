import { redirect } from "next/navigation";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { przejmijOferte } from "@/lib/bruno/praca/przejecie";

// 18.10 (USER_001): /praca/przejmij?id=<oferta>&k=<token> (link z maila do firmy → „Przejmij”).
// Bez konta pracodawcy → rejestracja i powrót tutaj. Z kontem → kopia oferty w panelu → panel (płatność / aktywne).
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : "";
  const k = typeof sp.k === "string" ? sp.k : "";
  const tu = `/praca/przejmij?id=${encodeURIComponent(id)}&k=${encodeURIComponent(k)}`;
  const konto = await zalogowanePraca();
  if (!konto || konto.typ !== "pracodawca") redirect(`/praca/konto?typ=pracodawca&tryb=rejestracja&dalej=${encodeURIComponent(tu)}`);
  const w = await przejmijOferte(konto, id, k);
  if (!w.ok) redirect(`/praca/${encodeURIComponent(id)}?k=${encodeURIComponent(k)}&blad=1`);
  redirect(`/praca/panel?przejete=${w.aktywna ? "aktywne" : "1"}`);
}
