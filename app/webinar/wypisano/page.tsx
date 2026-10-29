import type { Metadata } from "next";
import { WebinarWypisano } from "@/components/bruno/webinar-lp-zapis";

// 29.10 (Aniserowicz 01-05): strona po kliknięciu „Wypisz się” w mailu o webinarze. Noindex.
export const metadata: Metadata = { title: "Wypisano | Jakub Chodakowski", robots: { index: false, follow: false } };

export default function Page() {
  return <WebinarWypisano motyw="elmatic" />;
}
