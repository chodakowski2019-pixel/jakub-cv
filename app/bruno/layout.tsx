import type { Metadata, Viewport } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import BrunoNav from "@/components/bruno/nav";
import CzatDymek from "@/components/bruno/czat-dymek";
import "./bruno.css";

// Panel testowy Bruno AI (USER_001 30.09): logowanie stałym kodem, dostęp
// 7 dni od pierwszego logowania, 3 rozmowy po 3 minuty dziennie (1.10), feedback
// trenera, powtórki FSRS, „Dostosuj Bruno", „Ustawienia", „Odblokuj pełen dostęp".
// Na jakubchodakowski.com do czasu zakupu salesbruno.com.

export const metadata: Metadata = {
  title: "Bruno AI: panel treningowy",
  description: "Trening rozmów sprzedażowych z Bruno AI.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"] });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

export default async function BrunoLayout({ children }: { children: React.ReactNode }) {
  const email = await zalogowanyEmail();
  return (
    <div className={`bruno ${poppins.variable} ${openSans.variable} font-[var(--font-open-sans)]`}>
      <div className="bruno-plamy" aria-hidden>
        <i style={{ top: -140, left: -100, width: 620, height: 620, opacity: 0.7, background: "radial-gradient(closest-side, #a5f3fc, transparent)" }} />
        <i style={{ top: "33%", right: -140, width: 560, height: 560, opacity: 0.6, background: "radial-gradient(closest-side, #99f6e4, transparent)" }} />
        <i style={{ bottom: -160, left: "25%", width: 640, height: 520, opacity: 0.5, background: "radial-gradient(closest-side, #bae6fd, transparent)" }} />
      </div>
      <div className="relative z-[1] min-h-screen flex flex-col">
        <BrunoNav zalogowany={Boolean(email)} />
        <main className="flex-1 px-4 sm:px-6 pb-28 pt-6 sm:pt-10 max-w-3xl w-full mx-auto">{children}</main>
        {email && <CzatDymek />}
      </div>
    </div>
  );
}
