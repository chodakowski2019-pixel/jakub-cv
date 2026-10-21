import type { Metadata } from "next";
import RejestracjaForm from "@/components/podglad/aurora/rejestracja-form";

// Podgląd: zgłoszenie o dostęp do Bruno w wyglądzie Aurora (wzór aurora-onboard.html).
// Ten sam formularz i endpoint co /aisaleskontakt.

export const metadata: Metadata = {
  title: "Bruno AI: zgłoś się po dostęp",
  robots: { index: false, follow: false },
};

export default function PodgladBrunoRejestracja() {
  return <RejestracjaForm google />;
}
