import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isValidYouTubeUrl } from "@/lib/transkrypcje/transcribe";

export const runtime = "nodejs";

// Tworzy "job" z linkiem. NIE robi żadnej pracy AI (zero kosztów).
// Zwraca jobId, na którym opiera się licznik ceny i checkout.
export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const url = (body.url ?? "").trim();
  if (!url || !isValidYouTubeUrl(url)) {
    return NextResponse.json({ error: "Nieprawidłowy link YouTube" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("transkrypcje_jobs")
    .insert({ url, status: "pending" })
    .select("id")
    .single();

  if (error || !data) {
    console.error("transkrypcje/start insert failed", error);
    return NextResponse.json(
      { error: "Błąd serwera", _debug: error?.message ?? "no data", _hint: error?.hint, _code: error?.code },
      { status: 500 },
    );
  }

  return NextResponse.json({ jobId: data.id });
}
