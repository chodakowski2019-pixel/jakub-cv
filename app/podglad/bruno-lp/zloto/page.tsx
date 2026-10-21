import type { Metadata } from "next";
import BrunoLp from "@/components/podglad/bruno-lp/bruno-lp";

// Podgląd 10.10 (USER_001): strona dla handlowców (/brunoai) ze złotym akcentem zamiast pomarańczowego.
export const metadata: Metadata = {
  title: "Bruno AI for sales reps (podgląd: złoto)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BrunoLp wersja="reps" zloto />;
}
