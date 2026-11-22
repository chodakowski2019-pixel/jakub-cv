import type { Metadata } from "next";
import { WebinarRodziceDzieki } from "@/components/webinar-rodzice/WebinarRodzice";

// 22.11.2026: strona po zapisie na webinar dla rodziców. ?potwierdzone=1 = po kliknięciu „Potwierdzam zapis” w mailu
// (przekierowanie z app/api/newsletter/potwierdz). Noindex.
export const metadata: Metadata = { title: { absolute: "Webinar dla rodziców: zapis" }, robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <WebinarRodziceDzieki potwierdzone={sp.potwierdzone === "1"} />;
}
