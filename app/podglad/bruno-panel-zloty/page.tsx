import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelA from "@/components/podglad/panel/panel-a";

// Podgląd 10.10 (USER_001: „bardziej nowocześnie, szklane kafelki”): styl strony /brunoai + szkło.
// Akcent pomarańczowy, z ?zielony zielony.

export const metadata: Metadata = {
  title: "Bruno AI: panel czarny ze złotym (podgląd)",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-bpa", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"] });
const outfit = Outfit({ variable: "--font-bpa-head", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });

export default async function BrunoPanelZloty() {
  const d = await danePanelu();
  return (
    <div className={`${inter.variable} ${outfit.variable}`} style={{ display: "contents" }}>
      <PanelA d={d} lp szklo zloty />
    </div>
  );
}
