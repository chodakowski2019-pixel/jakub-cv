import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 15.11 (USER_001): salesbruno.pl/l/<kod> = link z newslettera. Zapisuje kliknięcie i przekierowuje na cel linku.
// Nieznany kod → /academy, żeby odbiorca nigdy nie trafił na błąd.
export async function GET(request: NextRequest, { params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  let cel = "/academy";
  if (/^[a-z0-9]{6,32}$/i.test(kod)) {
    const { data } = await supabaseAdmin.from("newsletter_linki").select("cel").eq("kod", kod).maybeSingle();
    if (data?.cel) {
      cel = data.cel;
      await supabaseAdmin.from("newsletter_klikniecia").insert({ kod, user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null });
    }
  }
  return NextResponse.redirect(new URL(cel, request.url), 302);
}
