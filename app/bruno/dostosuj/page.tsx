import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { dostepKonta, pobierzKonfig, pobierzKonto } from "@/lib/bruno/db";
import DostosujForm from "@/components/bruno/dostosuj-form";

export const dynamic = "force-dynamic";

export default async function BrunoDostosujPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const [konfig, konto] = await Promise.all([pobierzKonfig(email), pobierzKonto(email)]);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">Dostosuj <span className="bruno-gradient-tekst">Bruno</span></h1>
        <p className="text-slate-600 mt-2">Bruno czyta to przed każdą rozmową. Im więcej szczegółów, tym bardziej brzmi jak Twój klient.</p>
      </div>
      {/* 10.10: „wczytaj ofertę ze strony / PDF" także dla konta free (USER_001: link do strony i oferta przy konfiguracji). */}
      <DostosujForm start={konfig} oferta={dostepKonta(konto).oferta} />
    </div>
  );
}
