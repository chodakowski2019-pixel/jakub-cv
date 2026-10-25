import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonfig, pobierzKonto } from "@/lib/bruno/db";
import UstawieniaForm from "@/components/bruno/ustawienia-form";
import GlosForm from "@/components/bruno/glos-form";
import KodForm from "@/components/bruno/kod-form";
import WiadomoscForm from "@/components/bruno/wiadomosc-form";
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
      {/* 14.10 (USER_001): „Napisz do nas” tu zamiast dymka czatu w rogu. */}
      <WiadomoscForm />
      {/* 25.10 (USER_001): sekcja „Instrukcja” z filmem usunięta (na demo oprowadza USER_001). Pliki filmu zostają w public/bruno. */}
      {/* 11.10: dokumenty w jednym miejscu panelu (wcześniej stopka na każdym ekranie). Rozmowy są nagrywane: RODO = łatwy dostęp. */}
      <section className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-3">
        <h2 className="bruno-h2 text-lg">{t("Documents", "Dokumenty")}</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <a href="/regulamin" className="underline">{t("Terms", "Regulamin")}</a>
          <a href="/polityka-prywatnosci" className="underline">{t("Privacy Policy", "Polityka prywatności")}</a>
          {/* 12.10 (E11): strona dla firm. Adres /bezpieczenstwo działa na każdym hoście; na salesbruno.com proxy przekierowuje na /security. */}
          <a href="/bezpieczenstwo" className="underline">{t("Security & Data", "Bezpieczeństwo i dane")}</a>
        </div>
      </section>
    </div>
  );
}
