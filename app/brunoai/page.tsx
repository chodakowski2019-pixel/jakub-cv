import type { Metadata } from "next";
import BrunoLp from "@/components/podglad/bruno-lp/bruno-lp";

// 9.10 (USER_001, wariant A): LP Bruno, wersja „reps”. Ten sam szablon co druga podstrona, inne teksty.
// noindex do czasu akceptacji tekstów i wyglądu przez USER_001.
export const metadata: Metadata = {
  title: "Bruno AI for sales reps | Practice your next call",
  description: "Practice your next sales call with an AI customer before it counts. Every call gets a score and a practice plan. Free for 7 days.",
  alternates: { canonical: "/brunoai" },
  robots: { index: false, follow: false },
  openGraph: { title: "Bruno AI for sales reps | Practice your next call", description: "Practice your next sales call with an AI customer before it counts. Every call gets a score and a practice plan. Free for 7 days.", url: "/brunoai", images: [{ url: "/jakub.jpg" }] },
};

export default function Page() {
  return <BrunoLp wersja="reps" />;
}
