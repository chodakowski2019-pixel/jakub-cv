import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { dostepKonta, pobierzKonto, stanFree } from "@/lib/bruno/db";
import { stripeBrunoGotowy } from "@/lib/bruno/stripe";
import OdblokujForm from "@/components/bruno/odblokuj-form";
import ProCennik from "@/components/bruno/pro-cennik";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import type { T } from "@/lib/bruno/i18n";

export const dynamic = "force-dynamic";

// „Odblokuj pełen dostęp" (USER_001 30.09, uproszczone 1.10): kafelki co się
// odblokowuje + sam przycisk „Chcę pełen dostęp". USER_001 dostaje mail
// i dzwoni. Bez ceny i bez pola tekstowego na stronie.
// 10.10: konto free (B2C) widzi zamiast tego cennik Bruno Pro ze Stripe.

const kafelki = (t: T) => [
  { tytul: t("An account for every rep", "Konto dla każdego handlowca"), opis: t("Everyone on the team gets their own calls, scores, and review plan.", "Każdy w zespole ma swoje rozmowy, oceny i plan powtórek.") },
  {
    tytul: t("Manager dashboard: team report", "Panel szefa: raport zespołu"),
    opis: t(
      "Who practiced and how many calls they did, score trends over time, the weakest area for the team and each rep, and who hasn't logged in for 2 weeks.",
      "Kto trenował i ile rozmów odbył, trend oceny w czasie, najsłabsze kryterium zespołu i każdego handlowca, kto od 2 tygodni nie wszedł.",
    ),
  },
  {
    tytul: t("Score real call recordings", "Ocena prawdziwych nagrań"),
    opis: t(
      "Upload a recording of a real customer call. Bruno scores it the same way as practice. You see if what a rep practices shows up with real customers.",
      "Wgrywasz nagranie realnej rozmowy z klientem, Bruno ocenia ją tą samą rubryką co trening. Widzisz, czy to, co handlowiec ćwiczy, robi też u klienta.",
    ),
  },
  { tytul: t("Team leaderboard", "Ranking zespołu"), opis: t("Drill points and call scores in one table. See who's moving up and who's stuck.", "Punkty z Treningu i oceny rozmów w jednej tabeli. Widać, kto ciągnie w górę, a kto stoi.") },
  {
    tytul: t("Speech analysis", "Analiza mowy"),
    opis: t(
      "Pace, filler words (\"um\", \"like\"), how much the rep talked vs. the customer, the longest monologue, and time to the first question.",
      "Tempo, przerywniki („yyy”, „tak jakby”), ile mówił handlowiec, a ile klient, najdłuższy monolog i czas do pierwszego pytania.",
    ),
  },
  { tytul: t("Bruno set up for your product", "Bruno pod Wasz produkt"), opis: t("We set it up together: customer, objections, script, and what counts as a win. You don't do it alone.", "Konfigurujemy razem: klient, obiekcje, skrypt, definicja udanej rozmowy. Nie robisz tego sam.") },
  { tytul: t("More Bruno characters", "Więcej odsłon Bruno"), opis: t("New characters and scenarios for your sales stages: first contact, price negotiation, closing.", "Nowe postacie i scenariusze pod Wasze etapy: pierwszy kontakt, negocjacja ceny, domykanie.") },
  { tytul: t("No limits", "Bez ograniczeń"), opis: t("Full access lasts for the length of your contract.", "Pełen dostęp trwa na czas zawartej umowy.") },
  {
    tytul: t("Data security", "Bezpieczeństwo danych"),
    opis: t(
      "Only your team sees your product, objections, script, and recordings. AI providers don't train on your data, and the voice provider deletes it after 1 day. The data processing agreement is in our Terms, and we delete recordings on request.",
      "Produkt, obiekcje, skrypt i nagrania widzi tylko Wasz zespół. Dostawcy AI nie uczą się na Waszych danych, a dostawca głosu kasuje je po 1 dniu. Umowa powierzenia jest w regulaminie, a nagrania usuwamy na żądanie.",
    ),
  },
  { tytul: t("Natural voices", "Polskie głosy Bruno"), opis: t("Bruno speaks with a natural American voice. Pick from several male and female voices.", "Bruno mówi natywnym polskim głosem, bez obcego akcentu. Do wyboru kilka głosów męskich i damskich.") },
];

export default async function BrunoOdblokujPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const { ok } = await searchParams;
  const konto = await pobierzKonto(email);
  const dostep = dostepKonta(konto);
  const { t } = await tSerwer();
  const KAFELKI = kafelki(t);

  if (dostep.free || ok === "1") {
    const free = await stanFree(konto);
    return <ProCennik stripe={stripeBrunoGotowy()} zablokowane={free.zablokowane} zuzyte={free.zuzyte} ok={ok === "1"} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">{t("Unlock", "Odblokuj")} <span className="bruno-gradient-tekst">{t("full access", "pełen dostęp")}</span></h1>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto">{t("Full access means Bruno for your whole team, set up for your product.", "Pełen dostęp to Bruno dla całego zespołu, skonfigurowany pod Wasz produkt.")}</p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-4">
        {KAFELKI.map((k, i) => (
          <li key={k.tytul} className={`bruno-szklo rounded-2xl p-5 relative overflow-hidden ${i === KAFELKI.length - 1 && KAFELKI.length % 2 === 1 ? "sm:col-span-2" : ""}`}>
            <span aria-hidden className="pointer-events-none select-none absolute -top-4 right-3 text-[7rem] leading-none font-extrabold font-[var(--font-poppins)] tracking-[-0.06em] text-cyan-700/10">{i + 1}</span>
            <div className="relative bruno-h2 text-base mb-1">{k.tytul}</div>
            <p className="bruno-opis relative text-sm text-slate-600">{k.opis}</p>
          </li>
        ))}
      </ul>
      <OdblokujForm />
    </div>
  );
}
