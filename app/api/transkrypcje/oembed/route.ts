import { NextRequest, NextResponse } from "next/server";
import { extractVideoId, buildWatchUrl } from "@/lib/transkrypcje/youtube";

export const runtime = "nodejs";

// Zwraca tytuł + autora filmu (YouTube oEmbed, bez klucza API).
export async function GET(req: NextRequest) {
  const idOrUrl = req.nextUrl.searchParams.get("v") ?? "";
  const id = extractVideoId(idOrUrl);
  if (!id) return NextResponse.json({ error: "Brak/nieprawidłowe ID" }, { status: 400 });

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(buildWatchUrl(id))}&format=json`,
      { cache: "force-cache" },
    );
    if (!res.ok) return NextResponse.json({ error: "Nie znaleziono filmu" }, { status: 404 });
    const data = await res.json();
    return NextResponse.json({ title: data.title ?? "", author: data.author_name ?? "" });
  } catch {
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}
