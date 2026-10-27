import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelA from "@/components/podglad/panel/panel-a";
import { JezykProvider } from "@/components/bruno/jezyk-kontekst";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";

// Podgląd 27.10 (USER_001: „jeszcze jeden w stylu Revoluta”): jasne tło, białe karty z dużym promieniem bez ramki,
// gruby Inter z ciasnym trackingiem, czarne pigułki, niebieski akcent, pastelowy gradient na karcie z kółkiem.

export const metadata: Metadata = {
  title: "Bruno AI: panel w stylu Revolut (podgląd)",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-bpa", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"] });

export default async function BrunoPanelRevolut() {
  const jezyk = await jezykZadania();
  const d = await danePanelu(jezyk);
  return (
    <JezykProvider jezyk={jezyk}>
      <div className={`${inter.variable}`} style={{ display: "contents", ["--font-bpa-head" as string]: "var(--font-bpa)" }}>
        <PanelA d={d} lp klasa="revolut" pelny />
      </div>
    </JezykProvider>
  );
}
