import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelR from "@/components/podglad/panel/panel-r";
import { JezykProvider } from "@/components/bruno/jezyk-kontekst";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";

// Podgląd 27.10 (USER_001: wzór Rinesk call-centre z galerii, na biało). Panel szefa zespołu.

export const metadata: Metadata = { title: "Bruno AI: panel szefa w stylu Rinesk, biały (podgląd)", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const outfit = Outfit({ variable: "--font-bpr", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });

export default async function BrunoPanelRinesk() {
  const jezyk = await jezykZadania();
  const d = await danePanelu(jezyk);
  return (
    <JezykProvider jezyk={jezyk}>
      <div className={outfit.variable} style={{ display: "contents" }}><PanelR d={d} /></div>
    </JezykProvider>
  );
}
