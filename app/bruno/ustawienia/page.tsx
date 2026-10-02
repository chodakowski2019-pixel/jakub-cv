import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonfig, pobierzKonto } from "@/lib/bruno/db";
import UstawieniaForm from "@/components/bruno/ustawienia-form";
import KodForm from "@/components/bruno/kod-form";
import { FILM_DLUGOSC, FILM_OPROWADZAJACY } from "@/lib/bruno/film";

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
      {/* Instrukcja (USER_001 2.10): ten sam film, co w popupie przy pierwszym logowaniu, do odtworzenia na miejscu. */}
      <section className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-4">
        <div>
          <h2 className="bruno-h2 text-lg">Instrukcja</h2>
          <p className="text-sm text-slate-600 mt-1">{FILM_DLUGOSC}: jak zacząć trening z Bruno. Ten sam film, który widzisz przy pierwszym logowaniu.</p>
        </div>
        <video
          src={FILM_OPROWADZAJACY}
          controls
          preload="metadata"
          playsInline
          className="w-full rounded-2xl bg-slate-900 aspect-[16/10]"
        />
      </section>
    </div>
  );
}
