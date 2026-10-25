"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 25.10 (USER_001): szef ma dwa widoki w jednym koncie. Pigułka w górnej belce (tam, gdzie było
// „Odblokuj pełen dostęp”) przełącza: na ekranach zespołu → „Widok handlowca” (własny trening szefa),
// wszędzie indziej → „Widok szefa” (/bruno/szef). Przejście z animacją wjazdu ekranu (template.tsx).

export default function PrzelacznikWidoku({ className = "", krotki = false }: { className?: string; krotki?: boolean }) {
  const { t } = useT();
  const sciezka = usePathname() ?? "";
  const wZespole = sciezka === "/bruno/szef" || sciezka.startsWith("/bruno/szef/");
  const href = wZespole ? "/bruno/panel" : "/bruno/szef";
  const tekst = wZespole ? t("Rep view", "Widok handlowca") : t("Manager view", "Widok szefa");
  const tekstKrotki = wZespole ? t("Rep", "Handlowiec") : t("Manager", "Szef");
  return (
    <Link href={href} className={className} title={tekst} data-widok={wZespole ? "szef" : "handlowiec"}>
      {wZespole ? (
        <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M15.5 20a5 5 0 0 1 6-4.6" /></svg>
      )}
      <span>{krotki ? tekstKrotki : tekst}</span>
    </Link>
  );
}
