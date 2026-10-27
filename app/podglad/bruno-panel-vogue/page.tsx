import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelW from "@/components/podglad/panel/panel-w";
import { JezykProvider } from "@/components/bruno/jezyk-kontekst";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";

// Podgląd 27.10 (USER_001: wzór VogueAI z galerii, na biało).

export const metadata: Metadata = { title: "Bruno AI: panel w stylu VogueAI, biały (podgląd)", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const inter = Inter({ variable: "--font-bpw", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });

export default async function BrunoPanelVogue() {
  const jezyk = await jezykZadania();
  const d = await danePanelu(jezyk);
  return (
    <JezykProvider jezyk={jezyk}>
      <div className={inter.variable} style={{ display: "contents" }}><PanelW d={d} /></div>
    </JezykProvider>
  );
}
