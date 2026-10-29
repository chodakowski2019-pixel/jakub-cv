import type { Metadata } from "next";
import { WebinarDziekiBardzo } from "@/components/bruno/webinar-lp-zapis";

// 29.10 (Aniserowicz 02.06, double opt-in): strona po kliknięciu w link potwierdzający: link Zoom, kalendarz, kontakty. Noindex.
export const metadata: Metadata = { title: "Masz miejsce na webinarze | Jakub Chodakowski", robots: { index: false, follow: false } };

export default function Page() {
  return <WebinarDziekiBardzo motyw="blekit" />;
}
