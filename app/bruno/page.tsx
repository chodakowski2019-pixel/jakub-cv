import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import LogowanieForm from "@/components/podglad/aurora/logowanie-form";

export const dynamic = "force-dynamic";

export default async function BrunoLoginPage({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const { src } = await searchParams;
  // Zalogowany z linku w mailu: źródło jedzie dalej do panelu, który je zapisze (E18).
  if (await zalogowanyEmail()) redirect(src ? `/bruno/panel?src=${encodeURIComponent(src)}` : "/bruno/panel");
  // 9.10 (USER_001): logowanie w wyglądzie Aurora, EN domyślnie, PL z ?pl.
  return <LogowanieForm />;
}
