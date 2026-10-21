import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { danePanelu } from "@/components/podglad/panel/dane";
import PanelB from "@/components/podglad/panel/panel-b";

// Podgląd: panel Bruno w wersji B (wzór forecast-center). Dane jak w /bruno/panel.

export const metadata: Metadata = {
  title: "Bruno AI: panel, wersja B (podgląd)",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const inter = Inter({ variable: "--font-bpb", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"] });

export default async function BrunoPanelB() {
  const d = await danePanelu();
  return (
    <div className={inter.variable} style={{ display: "contents" }}>
      <PanelB d={d} />
    </div>
  );
}
