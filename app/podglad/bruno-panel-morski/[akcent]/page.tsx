import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelA from "@/components/podglad/panel/panel-a";
import { JezykProvider } from "@/components/bruno/jezyk-kontekst";
import { jezykZadania } from "@/lib/bruno/jezyk-serwer";

// 27.10 (USER_001: „złoty i pomarańcz nie pasują, może cienki szary, metaliczny? wymierz 3 kolory”):
// ten sam panel morski w 3 akcentach: /stal (metaliczna szarość), /szampan (ciepła platyna), /lod (stalowy błękit).

// 27.10: „lód, ale na biało” = /lod-bialy (klasy morski-lod + morski-bialy).
const AKCENTY = { stal: { nazwa: "Stal", klasa: "morski-stal" }, szampan: { nazwa: "Szampan", klasa: "morski-szampan" }, lod: { nazwa: "Lód", klasa: "morski-lod" }, "lod-bialy": { nazwa: "Lód na biało", klasa: "morski-lod morski-bialy" } } as const;
type Akcent = keyof typeof AKCENTY;

export async function generateMetadata({ params }: { params: Promise<{ akcent: string }> }): Promise<Metadata> {
  const { akcent } = await params;
  return { title: `Bruno AI: panel morski, akcent ${AKCENTY[akcent as Akcent]?.nazwa ?? akcent} (podgląd)`, robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-bpa", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"] });
const cormorant = Cormorant_Garamond({ variable: "--font-bpa-head", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

export default async function BrunoPanelMorskiAkcent({ params }: { params: Promise<{ akcent: string }> }) {
  const { akcent } = await params;
  if (!(akcent in AKCENTY)) notFound();
  const jezyk = await jezykZadania();
  const d = await danePanelu(jezyk);
  return (
    <JezykProvider jezyk={jezyk}>
      <div className={`${inter.variable} ${cormorant.variable}`} style={{ display: "contents" }}>
        <PanelA d={d} lp szklo zloty morski klasa={AKCENTY[akcent as Akcent].klasa} pelny />
      </div>
    </JezykProvider>
  );
}
