"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PasekZloty from "@/components/bruno/pasek-zloty";

// 10.10 (USER_001: „brak paska po lewej, wszystko się rozjechało”): układ Next.js NIE renderuje
// się od nowa przy przejściu między zakładkami. Gdy pierwszym ekranem był /bruno/panel (własny pasek),
// to po kliknięciu „Live Call” układ zostawał panelowy: bez paska i bez marginesów. Decyzja „panel czy
// reszta” i blokada konta free po 3 rozmowach żyją więc tutaj, w przeglądarce, przy każdej zmianie adresu.

/** Po 3 darmowych rozmowach konto free widzi tylko te ekrany (reszta → Bruno Pro). */
const PO_BLOKADZIE = ["/bruno/odblokuj", "/bruno/feedback", "/bruno/ustawienia"];

export default function UkladZloty({
  children,
  dostep,
  inicjal,
  free,
  profilBrak = false,
}: {
  children: React.ReactNode;
  dostep: { ogien: boolean; statystyki: boolean };
  inicjal: string;
  free: { zuzyte: number; zostalo: number; zablokowane: boolean } | null;
  /** 11.10: konto bez profilu (świeża rejestracja) widzi tylko /bruno/start. */
  profilBrak?: boolean;
}) {
  const sciezka = usePathname() ?? "";
  const router = useRouter();
  const zablokowany = Boolean(free?.zablokowane) && !PO_BLOKADZIE.some((p) => sciezka === p || sciezka.startsWith(`${p}/`));

  const doProfilu = profilBrak && sciezka !== "/bruno/start";

  useEffect(() => {
    if (doProfilu) router.replace("/bruno/start");
    else if (zablokowany) router.replace("/bruno/odblokuj");
  }, [doProfilu, zablokowany, router]);

  // 11.10: ekran profilu po rejestracji: bez paska, sam formularz na środku.
  if (sciezka === "/bruno/start") {
    return <main className="px-4 sm:px-6 pb-10 pt-10 max-w-3xl w-full mx-auto">{children}</main>;
  }
  if (doProfilu) return null;

  // Panel czarno-złoty ma własny pasek i tło.
  if (sciezka === "/bruno/panel") return <>{children}</>;

  return (
    <div className="bz-uklad">
      <PasekZloty dostep={dostep} inicjal={inicjal} free={free} />
      <div className="bz-tresc">
        <main className="flex-1 px-4 sm:px-6 pb-10 pt-6 sm:pt-8 max-w-5xl w-full mx-auto overflow-x-hidden">{zablokowany ? null : children}</main>
        {/* 11.10 (USER_001: „po co tu regulamin?”): stopka z dokumentami przeniesiona do Ustawień → Dokumenty. */}
      </div>
    </div>
  );
}
