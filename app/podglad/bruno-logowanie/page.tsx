import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import LogowanieForm from "@/components/podglad/aurora/logowanie-form";

// Podgląd: logowanie Bruno w wyglądzie Aurora (wzór aurora-onboard.html).
// Ten sam przepływ co app/bruno/page.tsx: zalogowany = od razu do panelu.

export const metadata: Metadata = {
  title: "Bruno AI: zaloguj się",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PodgladBrunoLogowanie() {
  if (await zalogowanyEmail()) redirect("/bruno/panel");
  return <LogowanieForm google />;
}
