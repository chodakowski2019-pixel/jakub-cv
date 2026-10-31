import type { Metadata } from "next";
import { WebinarDziekiBardzo } from "@/components/bruno/webinar-lp-zapis";

// 29.10 (Aniserowicz 02.06, double opt-in): strona po kliknięciu w link potwierdzający: link Zoom, kalendarz, kontakty. Noindex.
// 31.10 (USER_001): z tokenem (?t=) od razu test predyspozycji, żeby każdy zrobił go przed webinarem.
export const metadata: Metadata = { title: "Masz miejsce na webinarze | Jakub Chodakowski", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const t = (await searchParams).t;
  const token = typeof t === "string" && /^[a-f0-9]{32}$/.test(t) ? t : undefined;
  return <WebinarDziekiBardzo motyw="elmatic" token={token} />;
}
