import type { Metadata } from "next";
import { WebinarDzieki } from "@/components/bruno/webinar-lp-zapis";

// 29.10: strona „Dzięki, to prawie wszystko” po zapisie (Aniserowicz 02.06). Podgląd w motywie błękitnym.
export const metadata: Metadata = { title: "Dzięki, to prawie wszystko | Jakub Chodakowski", robots: { index: false, follow: false } };

export default function Page() {
  return <WebinarDzieki motyw="elmatic" />;
}
