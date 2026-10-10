import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Poppins, Open_Sans, Outfit } from "next/font/google";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { dostepKonta, pobierzKonto, stanFree } from "@/lib/bruno/db";
import UkladZloty from "@/components/bruno/uklad-zloty";
import CzatDymek from "@/components/bruno/czat-dymek";
import "./bruno.css";

// Panel testowy Bruno AI (USER_001 30.09): logowanie stałym kodem, dostęp
// 7 dni od pierwszego logowania, 3 rozmowy po 3 minuty dziennie (1.10), feedback
// trenera, powtórki FSRS, „Dostosuj Bruno", „Ustawienia", „Odblokuj pełen dostęp".
// Na jakubchodakowski.com do czasu zakupu salesbruno.com.

export const metadata: Metadata = {
  title: "Bruno AI: Sales Practice",
  description: "Practice sales calls with Bruno AI.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"] });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

/** 10.10: po 3 darmowych rozmowach konto free widzi tylko te ekrany (reszta → Bruno Pro). */
const PO_BLOKADZIE = ["/bruno/odblokuj", "/bruno/feedback", "/bruno/ustawienia"];

export default async function BrunoLayout({ children }: { children: React.ReactNode }) {
  const email = await zalogowanyEmail();
  const konto = email ? await pobierzKonto(email) : null;
  // 9.10: zakładka „Ogień" tylko w pełnym dostępie; 10.10: „Statystyki" nie dla free.
  const dostep = dostepKonta(konto);
  const fonty = `${poppins.variable} ${openSans.variable} ${outfit.variable}`;
  // 9.10 (USER_001): niezalogowany widzi logowanie Aurora na cały ekran, bez paska, tła i stopki panelu.
  if (!email) return <div className={fonty}>{children}</div>;

  // Blokada free po 3 rozmowach na pierwszym wejściu (twarde wejście z adresu). Przejścia między
  // zakładkami pilnuje UkladZloty w przeglądarce, bo układ nie renderuje się przy nich od nowa.
  const sciezka = (await headers()).get("x-sciezka") ?? "";
  const free = dostep.free ? await stanFree(konto) : null;
  if (free?.zablokowane && sciezka && !PO_BLOKADZIE.some((p) => sciezka === p || sciezka.startsWith(`${p}/`))) {
    redirect("/bruno/odblokuj");
  }

  // 10.10 (USER_001: „cały ten Bruno się zmienia”): wszystkie ekrany czarno-złote. Panel ma własny pasek,
  // reszta wspólny; o tym decyduje UkladZloty po adresie w przeglądarce.
  const inicjal = (konto?.imie?.trim()?.[0] ?? email[0] ?? "B").toUpperCase();
  return (
    <div className={`bruno zloty ${fonty} font-[var(--font-open-sans)]`}>
      <UkladZloty dostep={dostep} inicjal={inicjal} free={free}>
        {children}
      </UkladZloty>
      <CzatDymek />
    </div>
  );
}
