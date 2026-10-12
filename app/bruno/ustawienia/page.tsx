import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonfig, pobierzKonto } from "@/lib/bruno/db";
import UstawieniaForm from "@/components/bruno/ustawienia-form";
import GlosForm from "@/components/bruno/glos-form";
import KodForm from "@/components/bruno/kod-form";
import { filmDla } from "@/lib/bruno/film";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";

export const dynamic = "force-dynamic";

// „Ustawienia" (USER_001 1.10): konto, przypomnienie mailem, kod logowania.
// Wyniesione z „Dostosuj Bruno", które zostaje tylko o kliencie i produkcie.

export default async function BrunoUstawieniaPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const [konfig, konto, { t }] = await Promise.all([pobierzKonfig(email), pobierzKonto(email), tSerwer()]);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">{t("Account", "Ustawienia")} <span className="bruno-gradient-tekst">{t("settings", "konta")}</span></h1>
        <p className="text-slate-600 mt-2">
          {konto?.imie ? `${konto.imie}, ` : ""}{email}{konto?.firma ? `, ${konto.firma}` : ""}
        </p>
      </div>
      <GlosForm glos={konfig.glos === "k" ? "k" : "m"} />
      <UstawieniaForm godzina={konfig.godzina_przypomnienia} />
      <KodForm />
      {/* Instrukcja (USER_001 2.10): ten sam film, co w popupie przy pierwszym logowaniu, do odtworzenia na miejscu. */}
      {/* 12.10 (USER_001): film dla każdego konta (po profilu), więc Instrukcja też dla każdego. */}
      <section className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-4">
        <h2 className="bruno-h2 text-lg">{t("How it works", "Instrukcja")}</h2>
        <video
          src={filmDla(konto).src}
          poster={filmDla(konto).okladka}
          controls
          preload="metadata"
          playsInline
          className="w-full rounded-2xl bg-slate-900 aspect-[16/10]"
        />
      </section>
      {/* 11.10: dokumenty w jednym miejscu panelu (wcześniej stopka na każdym ekranie). Rozmowy są nagrywane: RODO = łatwy dostęp. */}
      <section className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-3">
        <h2 className="bruno-h2 text-lg">{t("Documents", "Dokumenty")}</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <a href="/regulamin" className="underline">{t("Terms", "Regulamin")}</a>
          <a href="/polityka-prywatnosci" className="underline">{t("Privacy Policy", "Polityka prywatności")}</a>
        </div>
      </section>
    </div>
  );
}
