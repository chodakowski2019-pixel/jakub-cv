import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelA from "@/components/podglad/panel/panel-a";

// Podgląd 10.10 (USER_001): panel A w kolorach i stylu strony /brunoai (szare tło, białe kafelki,
// czarne przyciski, pomarańczowy akcent, Outfit + Inter).

export const metadata: Metadata = {
  title: "Bruno AI: panel w stylu strony (podgląd)",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-bpa", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"] });
const outfit = Outfit({ variable: "--font-bpa-head", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });

export default async function BrunoPanelLp() {
  const d = await danePanelu();
  return (
    <div className={`${inter.variable} ${outfit.variable}`} style={{ display: "contents" }}>
      <PanelA d={d} lp />
    </div>
  );
}
