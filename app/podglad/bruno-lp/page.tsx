import type { Metadata } from "next";
import BrunoLp from "@/components/podglad/bruno-lp/bruno-lp";

// Podgląd LP Bruno (EN). Linkowany ze strony głównej od 9.10, do czasu przeniesienia na stały adres (E14).
export const metadata: Metadata = {
  title: "Bruno AI | Sales roleplay with an AI customer",
  description: "Your reps practice calls with an AI customer before they talk to a real one.",
  robots: { index: false, follow: false },
};

export default function BrunoLpPage() {
  return <BrunoLp />;
}
