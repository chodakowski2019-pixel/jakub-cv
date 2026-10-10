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
  { tytul: "An account for every rep", opis: "Everyone on the team gets their own calls, scores, and review plan." },
  {
    tytul: "Manager dashboard: team report",
    opis: "Who practiced and how many calls they did, score trends over time, the weakest area for the team and each rep, and who hasn't logged in for 2 weeks.",
  },
  {
    tytul: "Score real call recordings",
    opis: "Upload a recording of a real customer call. Bruno scores it the same way as practice. You see if what a rep practices shows up with real customers.",
  },
  { tytul: "Team leaderboard", opis: "Drill points and call scores in one table. See who's moving up and who's stuck." },
  {
    tytul: "Speech analysis",
    opis: "Pace, filler words (\"um\", \"like\"), how much the rep talked vs. the customer, the longest monologue, and time to the first question.",
  },
  { tytul: "Bruno set up for your product", opis: "We set it up together: customer, objections, script, and what counts as a win. You don't do it alone." },
  { tytul: "More Bruno characters", opis: "New characters and scenarios for your sales stages: first contact, price negotiation, closing." },
  { tytul: "No limits", opis: "Full access lasts for the length of your contract." },
  {
    tytul: "Data security",
    opis: "Only your team sees your product, objections, script, and recordings. AI providers don't train on your data, and the voice provider deletes it after 1 day. The data processing agreement is in our Terms, and we delete recordings on request.",
  },
  { tytul: "Natural voices", opis: "Bruno speaks with a natural American voice. Pick from several male and female voices." },
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
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">Unlock <span className="bruno-gradient-tekst">full access</span></h1>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto">Full access means Bruno for your whole team, set up for your product.</p>
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
