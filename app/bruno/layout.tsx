import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Poppins, Open_Sans, Outfit } from "next/font/google";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { dostepKonta, pobierzKonto, stanFree } from "@/lib/bruno/db";
import PasekZloty from "@/components/bruno/pasek-zloty";
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

  const sciezka = (await headers()).get("x-sciezka") ?? "";
  // 10.10 (USER_001): konto free po 3 rozmowach = wszystko zablokowane, zostaje zakup Bruno Pro
  // (plus feedback z ostatniej rozmowy i ustawienia z wylogowaniem).
  const free = dostep.free ? await stanFree(konto) : null;
  if (free?.zablokowane && sciezka && !PO_BLOKADZIE.some((p) => sciezka === p || sciezka.startsWith(`${p}/`))) {
    redirect("/bruno/odblokuj");
  }

  // 10.10 (USER_001): panel czarno-złoty ma własny pasek i tło. Czat zostaje.
  if (sciezka === "/bruno/panel") {
    return (
      <div className={`bruno zloty ${fonty}`}>
        {children}
        <CzatDymek />
      </div>
    );
  }
  // 10.10 (USER_001: „cały ten Bruno się zmienia”): wszystkie ekrany czarno-złote, wspólny pasek.
  const inicjal = (konto?.imie?.trim()?.[0] ?? email[0] ?? "B").toUpperCase();
  return (
    <div className={`bruno zloty ${fonty} font-[var(--font-open-sans)]`}>
      <div className="bz-uklad">
        <PasekZloty dostep={dostep} inicjal={inicjal} free={free} />
        <div className="bz-tresc">
          <main className="flex-1 px-4 sm:px-6 pb-10 pt-6 sm:pt-8 max-w-5xl w-full mx-auto overflow-x-hidden">{children}</main>
          {/* Dokumenty muszą być dostępne z każdego ekranu panelu (2.10): rozmowy są nagrywane. */}
          <footer className="bz-stopka">
            <a href="/regulamin">Terms</a>
            <a href="/polityka-prywatnosci">Privacy Policy</a>
          </footer>
        </div>
      </div>
      <CzatDymek />
    </div>
  );
}
