import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelA from "@/components/podglad/panel/panel-a";
import { JezykProvider } from "@/components/bruno/jezyk-kontekst";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";

// Podgląd 27.10 (USER_001: „strona panelu w takim stylu” = baner Attis Broker): sztormowe morze w tle,
// grafitowe szkło, srebro, serif Cormorant w nagłówkach i liczbach, podpisy wersalikami.
// Język jak w prawdziwym panelu (konto / domena / ?pl).

export const metadata: Metadata = {
  title: "Bruno AI: panel morski (podgląd)",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-bpa", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"] });
const cormorant = Cormorant_Garamond({ variable: "--font-bpa-head", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

export default async function BrunoPanelMorski() {
  const jezyk = await jezykZadania();
  const d = await danePanelu(jezyk);
  return (
    <JezykProvider jezyk={jezyk}>
      <div className={`${inter.variable} ${cormorant.variable}`} style={{ display: "contents" }}>
        <PanelA d={d} lp szklo zloty morski pelny />
      </div>
    </JezykProvider>
  );
}
