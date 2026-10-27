import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelC from "@/components/podglad/panel/panel-c";
import { JezykProvider } from "@/components/bruno/jezyk-kontekst";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";

// Podgląd 27.10 (USER_001: 3 wzory z muz.li: kokpit Alexatel, wykresy Rabbet, pasek exon), motyw jasny.

export const metadata: Metadata = {
  title: "Bruno AI: panel C, jasny (podgląd)",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-bpc", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });

export default async function BrunoPanelC() {
  const jezyk = await jezykZadania();
  const d = await danePanelu(jezyk);
  return (
    <JezykProvider jezyk={jezyk}>
      <div className={inter.variable} style={{ display: "contents" }}>
        <PanelC d={d} jasny={true} />
      </div>
    </JezykProvider>
  );
}
