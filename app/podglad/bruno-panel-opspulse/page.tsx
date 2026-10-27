import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelO from "@/components/podglad/panel/panel-o";
import { JezykProvider } from "@/components/bruno/jezyk-kontekst";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";

// Podgląd 27.10 (USER_001: wzór OpsPulse / Orbix Studio z galerii): mrożone szkło na rozmytym tle.

export const metadata: Metadata = { title: "Bruno AI: panel w stylu OpsPulse (podgląd)", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const outfit = Outfit({ variable: "--font-bpo", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });

export default async function BrunoPanelOpsPulse() {
  const jezyk = await jezykZadania();
  const d = await danePanelu(jezyk);
  return (
    <JezykProvider jezyk={jezyk}>
      <div className={outfit.variable} style={{ display: "contents" }}><PanelO d={d} /></div>
    </JezykProvider>
  );
}
