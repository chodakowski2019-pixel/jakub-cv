import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Inter, Outfit } from "next/font/google";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { zapiszWejscie, zrodloZParametru } from "@/lib/bruno/wejscia";
import { dostepKonta, pobierzKonto, stanDostepu, stanFree, zamknijPorzucone } from "@/lib/bruno/db";
import { kontekstFirmy } from "@/lib/bruno/firmy";
import { motywAsset, motywRinesk } from "@/lib/bruno/motyw";
import PanelRinesk from "@/components/bruno/panel-rinesk";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelA from "@/components/podglad/panel/panel-a";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";

export const dynamic = "force-dynamic";

// 10.10 (USER_001): panel w wyglądzie CZARNY ZE ZŁOTYM (podgląd /podglad/bruno-panel-zloty).
// Dane: components/podglad/panel/dane.ts (te same funkcje z lib/bruno co poprzedni panel).
// Układ /bruno nie dokłada tu starego paska, tła ani stopki (nagłówek x-sciezka z proxy.ts).
// 25.10 (USER_001): bez popupu z filmem (tour-popup.tsx zostaje w repo, odpięty): na demo oprowadza USER_001.

const inter = Inter({ variable: "--font-bpa", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"] });
const outfit = Outfit({ variable: "--font-bpa-head", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });

export default async function BrunoPanelPage({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const { src } = await searchParams;
  const email = await zalogowanyEmail();
  // Niezalogowany z linku w mailu: źródło jedzie na stronę logowania, formularz odda je do logu (E18).
  if (!email) redirect(src ? `/bruno?src=${encodeURIComponent(src)}` : "/bruno");
  // Zalogowany wszedł z linku w mailu: zapis wejścia (E18).
  const zrodlo = zrodloZParametru(src);
  if (zrodlo) await zapiszWejscie({ email, rodzaj: "wejscie", zrodlo, agent: (await headers()).get("user-agent") });

  const konto = await pobierzKonto(email);
  if (konto && stanDostepu(konto).aktywny) await zamknijPorzucone(email);
  const [d, { szef, logo }] = await Promise.all([danePanelu(await jezykZadania()), kontekstFirmy(konto)]);
  const dostep = dostepKonta(konto);

  // 27.10 (USER_001: „Rinesk wygrywa”): domyślny panel = styl Rinesk (components/bruno/panel-rinesk.tsx), belka i szerokość z układu.
  if (motywRinesk()) {
    const inicjal = (konto?.imie?.trim()?.[0] ?? email[0] ?? "B").toUpperCase();
    return <PanelRinesk d={d} dostep={{ ...dostep, szef }} logo={logo} inicjal={inicjal} />;
  }

  return (
    <div className={`${inter.variable} ${outfit.variable}`} style={{ display: "contents" }}>
      <PanelA d={d} lp szklo zloty={!motywAsset()} asset={motywAsset()} dostep={{ ...dostep, szef }} free={dostep.free ? await stanFree(konto) : null} logo={logo} />
    </div>
  );
}
