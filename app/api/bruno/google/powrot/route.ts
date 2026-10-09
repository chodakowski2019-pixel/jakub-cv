import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { CIASTECZKO, WAZNOSC_SESJI_S, nowyToken } from "@/lib/bruno/auth";
import { pobierzKonfig, pobierzKonto, stanDostepu } from "@/lib/bruno/db";
import { zapewnijKarty } from "@/lib/bruno/fsrs";
import { CIASTECZKO_GOOGLE, adresPowrotu, daneZGoogle } from "@/lib/bruno/google";
import { zalozKontoFree } from "@/lib/bruno/konto-free";
import { zapiszWejscie } from "@/lib/bruno/wejscia";

export const dynamic = "force-dynamic";

// Powrót z Google: sprawdzenie stanu, wymiana kodu, konto (istniejące albo nowe free), sesja.
// Nowe konto → „Dostosuj Bruno” (co sprzedajesz), istniejące → panel.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const c = await cookies();
  const [stan, jezyk] = (c.get(CIASTECZKO_GOOGLE)?.value ?? "").split(".");
  c.delete(CIASTECZKO_GOOGLE);
  const pl = jezyk === "pl";
  const wroc = (blad: string) => NextResponse.redirect(new URL(`/bruno?blad=${blad}${pl ? "&pl" : ""}`, url.origin));

  const kod = url.searchParams.get("code");
  if (!stan || !kod || url.searchParams.get("state") !== stan) return wroc("google");

  const dane = await daneZGoogle({ kod, powrot: adresPowrotu(url.origin) });
  if (!dane) return wroc("google");

  let konto = await pobierzKonto(dane.email);
  let nowe = false;
  if (!konto) {
    const z = await zalozKontoFree({ email: dane.email, imie: dane.imie, zKodem: false, zrodlo: "google", jezyk: pl ? "pl" : "en" });
    if (!z.ok && !z.istnieje) return wroc("google");
    nowe = z.ok;
    konto = await pobierzKonto(dane.email);
    if (!konto) return wroc("google");
  }
  if (!stanDostepu(konto).aktywny) return wroc("wygasl");

  await supabaseAdmin
    .from("bruno_konta")
    .update({ nieudane: 0, blokada_do: null, ...(konto.start_dostepu ? {} : { start_dostepu: new Date().toISOString() }) })
    .eq("email", dane.email);
  await zapewnijKarty(dane.email, await pobierzKonfig(dane.email));
  await zapiszWejscie({ email: dane.email, rodzaj: "logowanie", zrodlo: "google", agent: req.headers.get("user-agent") });

  c.set(CIASTECZKO, nowyToken(dane.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WAZNOSC_SESJI_S,
  });
  return NextResponse.redirect(new URL(nowe ? "/bruno/dostosuj" : "/bruno/panel", url.origin));
}
