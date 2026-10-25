import Link from "next/link";
import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pelnyDostep, pobierzKonto } from "@/lib/bruno/db";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import StronaRozmowy from "@/components/bruno/strona-rozmowy";

export const dynamic = "force-dynamic";

// 25.10 (USER_001): „Rozmowa, którą masz jutro” jako osobna zakładka (wcześniej krok 7 kreatora rozmowy).
// Handlowiec wkleja prawdziwą sytuację, wybiera głos i startuje. Moduł pełnego dostępu.
export default async function BrunoJutroPage({ searchParams }: { searchParams: Promise<{ karta?: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!pelnyDostep(konto)) {
    const { t } = await tSerwer();
    return (
      <div className="bruno-szklo rounded-3xl p-8 sm:p-10 max-w-xl mx-auto mt-6 text-center flex flex-col items-center gap-4">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          {t("Tomorrow's", "Rozmowa, którą masz")} <span className="bruno-gradient-tekst">{t("call", "jutro")}</span>
        </h1>
        <p className="text-slate-600 max-w-md">{t("Paste the real call you have tomorrow, and Bruno plays that exact customer. Included with full access.", "Wklejasz prawdziwą rozmowę, którą masz jutro, a Bruno gra dokładnie tego klienta. Dostępne w pełnym dostępie.")}</p>
        <Link href="/bruno/ustawienia" className="bruno-przycisk text-base px-6 py-3">{t("Message us", "Napisz do nas")}</Link>
      </div>
    );
  }
  return <StronaRozmowy searchParams={searchParams} jutro />;
}
