import type { Metadata } from "next";
import BrunoLp from "@/components/podglad/bruno-lp/bruno-lp";

// 9.10 (USER_001, wariant A): LP Bruno, wersja „business”. Ten sam szablon co druga podstrona, inne teksty.
// 9.10: LIVE i w indeksie (USER_001 „opublikuj jako podstronę live”).
export const metadata: Metadata = {
  title: "Bruno AI for sales teams | AI sales practice",
  description: "Your sales reps practice calls with an AI customer before they talk to a real one. Every call gets a score. Free for 7 days.",
  alternates: { canonical: "/brunobusiness" },
  openGraph: { title: "Bruno AI for sales teams | AI sales practice", description: "Your sales reps practice calls with an AI customer before they talk to a real one. Every call gets a score. Free for 7 days.", url: "/brunobusiness", images: [{ url: "/jakub.jpg" }] },
};

export default function Page() {
  return <BrunoLp wersja="business" />;
}
