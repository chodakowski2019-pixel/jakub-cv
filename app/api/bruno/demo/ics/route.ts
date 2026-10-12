import { ORGANIZATOR_DEMO, terminIcsPoprawny, zaproszenieIcs } from "@/lib/bruno/demo-terminy";
import { wpisKalendarzaDemo } from "@/lib/bruno/mail-demo";

export const dynamic = "force-dynamic";

// 12.10 (E19): GET /api/bruno/demo/ics?termin=<ISO UTC>&jezyk=pl|en
// Plik .ics (30 min) do linku „Apple / Outlook (.ics)” w mailu potwierdzenia demo (lib/bruno/mail-demo.ts).
// Bez bazy i bez logowania: tytuł i opis są stałe, zmienia się tylko termin, a ten przyjmujemy wyłącznie
// w formacie ISO UTC i w oknie od wczoraj do 60 dni w przód (terminIcsPoprawny). Lokalizacja = link
// do rozmowy wideo z BRUNO_DEMO_LINK (pusty = bez LOCATION).
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const start = terminIcsPoprawny(p.get("termin"));
  if (!start) return new Response("Bad termin", { status: 400 });
  const jezyk = p.get("jezyk") === "pl" ? "pl" : "en";
  const link = process.env.BRUNO_DEMO_LINK?.trim() || null;
  const w = wpisKalendarzaDemo(jezyk, link);
  const ics = zaproszenieIcs({
    start: start.toISOString(),
    tytul: w.tytul,
    opis: w.opis,
    organizator: ORGANIZATOR_DEMO,
    uid: `demo-${start.getTime()}`,
    lokalizacja: link,
  });
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="bruno-demo.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
