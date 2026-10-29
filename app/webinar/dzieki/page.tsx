import type { Metadata } from "next";
import { WebinarDzieki } from "@/components/bruno/webinar-lp-zapis";

// 29.10 (Aniserowicz 02.06, double opt-in): strona po zapisie: znajdź mail, kliknij „Potwierdzam zapis”. Noindex.
export const metadata: Metadata = { title: "Dzięki, to prawie wszystko | Jakub Chodakowski", robots: { index: false, follow: false } };

export default function Page() {
  return <WebinarDzieki motyw="blekit" />;
}
