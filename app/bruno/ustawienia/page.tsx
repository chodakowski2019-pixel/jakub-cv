import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonfig, pobierzKonto } from "@/lib/bruno/db";
import UstawieniaForm from "@/components/bruno/ustawienia-form";
import KodForm from "@/components/bruno/kod-form";

export const dynamic = "force-dynamic";

// „Ustawienia" (USER_001 1.10): konto, przypomnienie mailem, kod logowania.
// Wyniesione z „Dostosuj Bruno", które zostaje tylko o kliencie i produkcie.

export default async function BrunoUstawieniaPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const [konfig, konto] = await Promise.all([pobierzKonfig(email), pobierzKonto(email)]);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">Ustawienia <span className="bruno-gradient-tekst">konta</span></h1>
        <p className="text-slate-600 mt-2">
          {konto?.imie ? `${konto.imie}, ` : ""}{email}{konto?.firma ? `, ${konto.firma}` : ""}
        </p>
      </div>
      <UstawieniaForm godzina={konfig.godzina_przypomnienia} />
      <KodForm />
    </div>
  );
}
