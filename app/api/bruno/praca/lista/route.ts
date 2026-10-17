import { NextResponse } from "next/server";
import { doListy, ofertaPoId } from "@/lib/bruno/praca/oferty";
import { doOferty, wierszOferty } from "@/lib/bruno/praca/oferty-firm";

export const dynamic = "force-dynamic";

// GET /api/bruno/praca/lista?ids=a,b,c (18.10): lekkie karty ofert po id (panel kandydata: „Ostatnio przeglądane”).
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 30);
  const oferty = [];
  for (const id of ids) {
    const o = ofertaPoId(id);
    if (o) oferty.push(doListy(o));
    else {
      const w = await wierszOferty(id);
      if (w?.status === "aktywna") oferty.push(doListy(doOferty(w)));
    }
  }
  return NextResponse.json({ ok: true, oferty });
}
