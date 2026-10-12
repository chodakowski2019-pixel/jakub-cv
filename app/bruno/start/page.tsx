import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto } from "@/lib/bruno/db";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import ProfilForm from "@/components/bruno/profil-form";

export const dynamic = "force-dynamic";

// 11.10 (USER_001): drugi krok po rejestracji (e-mail + hasło albo Google): profil konta.
// Bez niego panel tu prowadzi (app/bruno/layout.tsx + UkladZloty). Uzupełniony profil = panel.

export default async function BrunoStartPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto) redirect("/bruno");
  if (konto.profil_at) redirect("/bruno/panel");
  const { t } = await tSerwer();
  return (
    <div className="flex flex-col gap-6 py-6">
      {/* 12.10 (USER_001): „Poznajmy się”, bez podtytułu. */}
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          {t("Nice to", "Poznajmy")} <span className="bruno-gradient-tekst">{t("meet you", "się")}</span>
        </h1>
      </div>
      <ProfilForm imieStart={konto.imie} />
    </div>
  );
}
