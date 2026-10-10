import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { dostepKonta, pobierzKonto, stanFree } from "@/lib/bruno/db";
import { stripeBrunoGotowy } from "@/lib/bruno/stripe";
import OdblokujForm from "@/components/bruno/odblokuj-form";
import ProCennik from "@/components/bruno/pro-cennik";

export const dynamic = "force-dynamic";

// „Odblokuj pełen dostęp" (USER_001 30.09, uproszczone 1.10): kafelki co się
// odblokowuje + sam przycisk „Chcę pełen dostęp". USER_001 dostaje mail
// i dzwoni. Bez ceny i bez pola tekstowego na stronie.
// 10.10: konto free (B2C) widzi zamiast tego cennik Bruno Pro ze Stripe.

const KAFELKI = [
  { tytul: "Konto dla każdego handlowca", opis: "Każdy w zespole ma swoje rozmowy, oceny i plan powtórek." },
  {
    tytul: "Panel szefa: raport zespołu",
    opis: "Kto trenował i ile rozmów odbył, trend oceny w czasie, najsłabsze kryterium zespołu i każdego handlowca, kto od 2 tygodni nie wszedł.",
  },
  {
    tytul: "Ocena prawdziwych nagrań",
    opis: "Wgrywasz nagranie realnej rozmowy z klientem, Bruno ocenia ją tą samą rubryką co trening. Widzisz, czy to, co handlowiec ćwiczy, robi też u klienta.",
  },
  { tytul: "Ranking zespołu", opis: "Punkty z Treningu i oceny rozmów w jednej tabeli. Widać, kto ciągnie w górę, a kto stoi." },
  {
    tytul: "Analiza mowy",
    opis: "Tempo, przerywniki („yyy”, „tak jakby”), ile mówił handlowiec, a ile klient, najdłuższy monolog i czas do pierwszego pytania.",
  },
  { tytul: "Bruno pod Wasz produkt", opis: "Konfigurujemy razem: klient, obiekcje, skrypt, definicja udanej rozmowy. Nie robisz tego sam." },
  { tytul: "Więcej odsłon Bruno", opis: "Nowe postacie i scenariusze pod Wasze etapy: pierwszy kontakt, negocjacja ceny, domykanie." },
  { tytul: "Bez ograniczeń", opis: "Pełen dostęp trwa na czas zawartej umowy." },
  {
    tytul: "Bezpieczeństwo danych",
    opis: "Produkt, obiekcje, skrypt i nagrania widzi tylko Wasz zespół. Dostawcy modeli nie uczą się na Waszych danych i kasują je po 30 dniach, umowa powierzenia jest w regulaminie, a nagrania usuwamy na żądanie.",
  },
  { tytul: "Polskie głosy Bruno", opis: "Bruno mówi natywnym polskim głosem, bez obcego akcentu. Do wyboru kilka głosów męskich i damskich." },
];

export default async function BrunoOdblokujPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const { ok } = await searchParams;
  const konto = await pobierzKonto(email);
  const dostep = dostepKonta(konto);

  if (dostep.free || ok === "1") {
    const free = await stanFree(konto);
    return <ProCennik stripe={stripeBrunoGotowy()} zablokowane={free.zablokowane} zuzyte={free.zuzyte} ok={ok === "1"} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">Odblokuj <span className="bruno-gradient-tekst">pełen dostęp</span></h1>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto">Pełen dostęp to Bruno dla całego zespołu, skonfigurowany pod Wasz produkt.</p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-4">
        {KAFELKI.map((k, i) => (
          <li key={k.tytul} className={`bruno-szklo rounded-2xl p-5 relative overflow-hidden ${i === KAFELKI.length - 1 && KAFELKI.length % 2 === 1 ? "sm:col-span-2" : ""}`}>
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
