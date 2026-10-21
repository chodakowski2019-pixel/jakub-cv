import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelA from "@/components/podglad/panel/panel-a";

// Podgląd: panel Bruno w wersji A (wzór fitness-dashboard). Dane jak w /bruno/panel.

export const metadata: Metadata = {
  title: "Bruno AI: panel, wersja A, ciemne kafelki na białym tle (podgląd)",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-bpa", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"] });
const poppins = Poppins({ variable: "--font-bpa-head", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

export default async function BrunoPanelABialeTlo() {
  const d = await danePanelu();
  return (
    <div className={`${inter.variable} ${poppins.variable}`} style={{ display: "contents" }}>
      <PanelA d={d} bialeTlo />
    </div>
  );
}
