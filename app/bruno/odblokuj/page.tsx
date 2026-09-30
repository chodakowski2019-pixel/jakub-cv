import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import OdblokujForm from "@/components/bruno/odblokuj-form";

export const dynamic = "force-dynamic";

// „Odblokuj pełen dostęp" (USER_001 30.09): kafelki co się odblokowuje,
// krótki formularz „jestem zainteresowany", USER_001 dostaje mail i dzwoni.
// Bez ceny na stronie: wycena po rozmowie.

const KAFELKI = [
  { tytul: "Bez limitu dni", opis: "Test kończy się po 7 dniach. Pełen dostęp trwa, dopóki trenujesz." },
  { tytul: "Konto dla każdego handlowca", opis: "Każdy w zespole ma swoje rozmowy, oceny i plan powtórek." },
  { tytul: "Panel szefa sprzedaży", opis: "Widzisz, kto trenuje, kto rośnie, kto od 2 tygodni nie odbył rozmowy." },
  { tytul: "Bruno pod Wasz produkt", opis: "Konfigurujemy razem: klient, obiekcje, skrypt, definicja udanej rozmowy. Nie robisz tego sam." },
  { tytul: "Więcej odsłon Bruno", opis: "Nowe postacie i scenariusze pod Wasze etapy: pierwszy kontakt, negocjacja ceny, domykanie." },
  { tytul: "Raport tygodniowy", opis: "Co poniedziałek: średnia zespołu, najsłabsze kryterium, 3 rozmowy do odsłuchania." },
];

export default async function BrunoOdblokujPage() {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">Odblokuj <span className="bruno-gradient-tekst">pełen dostęp</span></h1>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto">Test to jedno konto i 7 dni. Pełen dostęp to Bruno dla całego zespołu, ustawiony pod Wasz produkt.</p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-4">
        {KAFELKI.map((k, i) => (
          <li key={k.tytul} className="bruno-szklo rounded-2xl p-5 relative overflow-hidden">
            <span aria-hidden className="pointer-events-none select-none absolute -top-4 right-3 text-[7rem] leading-none font-extrabold font-[var(--font-poppins)] tracking-[-0.06em] text-cyan-700/10">{i + 1}</span>
            <div className="relative bruno-h2 text-base mb-1">{k.tytul}</div>
            <p className="relative text-sm text-slate-600">{k.opis}</p>
          </li>
        ))}
      </ul>
      <OdblokujForm />
    </div>
  );
}
