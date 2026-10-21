"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PasekZloty from "@/components/bruno/pasek-zloty";
import NavTel from "@/components/bruno/nav-tel";
import ProwadzenieDemo from "@/components/bruno/prowadzenie-demo";

// 10.10 (USER_001: „brak paska po lewej, wszystko się rozjechało”): układ Next.js NIE renderuje
// się od nowa przy przejściu między zakładkami. Gdy pierwszym ekranem był /bruno/panel (własny pasek),
// to po kliknięciu „Live Call” układ zostawał panelowy: bez paska i bez marginesów. Decyzja „panel czy
// reszta” i blokada konta free po 3 rozmowach żyją więc tutaj, w przeglądarce, przy każdej zmianie adresu.

/** Po 3 darmowych rozmowach konto free widzi tylko te ekrany (reszta → Bruno Pro). */
// 18.10 (USER_001): po rozmowie demo przewodnik idzie jeszcze przez fiszki, więc Trening zostaje otwarty.
const PO_BLOKADZIE = ["/bruno/odblokuj", "/bruno/feedback", "/bruno/ustawienia", "/bruno/trening"];

export default function UkladZloty({
  children,
  dostep,
  inicjal,
  free,
  profilBrak = false,
  ankietaBrak = false,
  demoEmail = null,
}: {
  children: React.ReactNode;
  dostep: { ogien: boolean; statystyki: boolean };
  inicjal: string;
  free: { zuzyte: number; zostalo: number; zablokowane: boolean } | null;
  /** 11.10: konto bez profilu (świeża rejestracja) widzi tylko /bruno/start. */
  profilBrak?: boolean;
  /** 21.10: brak ankiety Mazura z ostatnich 30 dni: konto widzi tylko /bruno/ankieta. */
  ankietaBrak?: boolean;
  /** 17.10: konto demo (B2B, 1 rozmowa) = przewodnik w chmurkach zamiast filmu. E-mail = klucz postępu. */
  demoEmail?: string | null;
}) {
  const sciezka = usePathname() ?? "";
  const router = useRouter();
  const zablokowany = Boolean(free?.zablokowane) && !PO_BLOKADZIE.some((p) => sciezka === p || sciezka.startsWith(`${p}/`));

  const doProfilu = profilBrak && sciezka !== "/bruno/start";
  const doAnkiety = !doProfilu && ankietaBrak && sciezka !== "/bruno/ankieta";

  useEffect(() => {
    if (doProfilu) router.replace("/bruno/start");
    else if (doAnkiety) router.replace("/bruno/ankieta");
    else if (zablokowany) router.replace("/bruno/odblokuj");
  }, [doProfilu, doAnkiety, zablokowany, router]);

  // 11.10: ekran profilu po rejestracji: bez paska, sam formularz na środku. 21.10: ankieta Mazura tak samo.
  if (sciezka === "/bruno/start" || sciezka === "/bruno/ankieta") {
    return <main className="px-4 sm:px-6 pb-10 pt-10 max-w-3xl w-full mx-auto">{children}</main>;
  }
  if (doProfilu || doAnkiety) return null;

  // 14.10: na telefonie wszędzie ta sama nawigacja jak w aplikacji (górna belka + dolny pasek), CSS chowa ją na komputerze.
  const tel = (
    <>
      <NavTel dostep={dostep} inicjal={inicjal} free={free} />
      {demoEmail && <ProwadzenieDemo email={demoEmail} />}
    </>
  );

  // Panel czarno-złoty ma własny pasek i tło.
  if (sciezka === "/bruno/panel") return <>{tel}{children}</>;

  return (
    <div className="bz-uklad">
      {tel}
      <PasekZloty dostep={dostep} inicjal={inicjal} free={free} />
      <div className="bz-tresc">
        <main className="flex-1 px-4 sm:px-6 pb-10 pt-6 sm:pt-8 max-w-5xl w-full mx-auto overflow-x-hidden">{zablokowany ? null : children}</main>
        {/* 11.10 (USER_001: „po co tu regulamin?”): stopka z dokumentami przeniesiona do Ustawień → Dokumenty. */}
      </div>
    </div>
  );
}
