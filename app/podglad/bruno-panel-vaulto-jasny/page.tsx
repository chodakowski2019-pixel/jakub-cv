import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelV from "@/components/podglad/panel/panel-v";
import { JezykProvider } from "@/components/bruno/jezyk-kontekst";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";

// Podgląd 27.10 (USER_001: „zrób dokładnie w takim stylu” = Vaulto, Orbix Studio z galerii muz.li).

export const metadata: Metadata = {
  title: "Bruno AI: panel w stylu Vaulto, jasny + prawa kolumna (podgląd)",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-bpv", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });
const grotesk = Space_Grotesk({ variable: "--font-bpv-num", subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"] });

export default async function BrunoPanelVaultoJasny() {
  const jezyk = await jezykZadania();
  const d = await danePanelu(jezyk);
  return (
    <JezykProvider jezyk={jezyk}>
      <div className={`${inter.variable} ${grotesk.variable}`} style={{ display: "contents" }}>
        <PanelV d={d} jasny prawa />
      </div>
    </JezykProvider>
  );
}
