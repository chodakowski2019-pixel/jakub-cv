"use client";

import { useRouter } from "next/navigation";
import Rezerwacja, { type DaneStartowe } from "@/components/podglad/bruno-lp/rezerwacja";
import s from "@/components/podglad/bruno-lp/bruno-lp.module.css";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 17.10 (USER_001): Bruno tylko B2B. Strona sprzedażowa po rozmowie demo (dawniej cennik Bruno Pro):
// BEZ CEN (cenę USER_001 podaje na rozmowie), tylko to, co Bruno naprawdę ma dziś, i kalendarz USER_001
// (ten sam formularz co na stronie firm, z danymi konta). Zasada: nie obiecujemy funkcji, których nie ma.

const PUNKTY = (t: (en: string, pl: string) => string) => [
  { tytul: t("An account for every rep", "Konto dla każdego handlowca"), opis: t("Everyone practices on their own: calls, scores and a review plan.", "Każdy ćwiczy osobno: rozmowy, oceny i plan powtórek.") },
  { tytul: t("Bruno set up for your product", "Bruno ustawiony pod Wasz produkt"), opis: t("We set it up together: your customer, your objections, your script.", "Ustawiamy razem: Wasz klient, Wasze obiekcje, Wasz skrypt.") },
  { tytul: t("A score after every call", "Ocena po każdej rozmowie"), opis: t("5 criteria, closing techniques, quotes from the call and one thing to fix.", "5 kryteriów, techniki zamykania, cytaty z rozmowy i jedna rzecz do poprawy.") },
  { tytul: t("Flashcards from mistakes", "Fiszki z błędów"), opis: t("Bruno brings back what a rep got wrong, at the right time, so it sticks.", "Bruno wraca do tego, co handlowiec zrobił źle, w dobrym momencie, żeby zostało w głowie.") },
  { tytul: t("4 customer types, 3 levels", "4 typy klientów, 3 poziomy"), opis: t("From an easy customer to a tough one who pushes back on price.", "Od łatwego klienta po trudnego, który zbija cenę.") },
  { tytul: t("Your data stays yours", "Wasze dane zostają u Was"), opis: t("AI providers don't train on your data. The voice provider deletes it after 1 day.", "Dostawcy AI nie uczą się na Waszych danych. Dostawca głosu kasuje je po 1 dniu.") },
];

export default function ZespolDemo({ dane }: { dane: DaneStartowe }) {
  const { t, jezyk } = useT();
  const router = useRouter();
  const punkty = PUNKTY(t);
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          {t("Bruno for", "Bruno dla")} <span className="bruno-gradient-tekst">{t("your team", "Twojego zespołu")}</span>
        </h1>
        <p className="bruno-opis text-slate-600 mt-2 max-w-xl mx-auto">
          {t("Book a 30-minute phone call. I'll show you how to set Bruno up for your reps.", "Umów 30-minutową rozmowę telefoniczną. Pokażę, jak ustawić Bruno pod Twoich handlowców.")}
        </p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-4">
        {punkty.map((k, i) => (
          <li key={k.tytul} className="bruno-szklo rounded-2xl p-5 relative overflow-hidden">
            <span aria-hidden className="pointer-events-none select-none absolute -top-4 right-3 text-[7rem] leading-none font-extrabold font-[var(--font-poppins)] tracking-[-0.06em] text-cyan-700/10">{i + 1}</span>
            <div className="relative bruno-h2 text-base mb-1">{k.tytul}</div>
            <p className="bruno-opis relative text-sm text-slate-600">{k.opis}</p>
          </li>
        ))}
      </ul>
      {/* Kalendarz = formularz ze strony firm (wygląd LP), w jasnej karcie. */}
      <div
        id="rozmowa"
        className={`${s.root} bruno-lp-jasne rounded-3xl overflow-hidden`}
        style={{ minHeight: 0, ["--head" as string]: "var(--font-outfit), system-ui, sans-serif", ["--body" as string]: "var(--font-open-sans), system-ui, sans-serif" }}
      >
        <div className="[&>section]:!min-h-0 [&>section]:!pt-10">
          <Rezerwacja jezyk={jezyk === "pl" ? "pl" : "en"} start={dane} zrodlo="bruno-demo" onWstecz={() => router.push("/bruno/panel")} />
        </div>
      </div>
    </div>
  );
}
