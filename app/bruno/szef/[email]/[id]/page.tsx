import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import { pobierzKonto, pobierzRozmowe } from "@/lib/bruno/db";
import { etykiety } from "@/lib/bruno/etykiety";
import { czySzef, handlowiecFirmy } from "@/lib/bruno/firmy";
import { locale } from "@/lib/bruno/i18n";
import { tSerwer } from "@/lib/bruno/jezyk-serwer";
import { postacLubDomyslna, poziomLubDomyslny, trybLubDomyslny } from "@/lib/bruno/postacie";
import FeedbackWidok from "@/components/bruno/feedback";

export const dynamic = "force-dynamic";

// 25.10 (USER_001): rozmowa handlowca oczami szefa: ten sam feedback i transkrypcja, co widzi handlowiec
// (app/bruno/feedback/[id]), tylko dostęp sprawdzany po firmie.

function czas(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default async function BrunoSzefRozmowaPage({ params }: { params: Promise<{ email: string; id: string }> }) {
  const email = await zalogowanyEmail();
  if (!email) redirect("/bruno");
  const konto = await pobierzKonto(email);
  if (!konto || !czySzef(konto)) redirect("/bruno/panel");
  const { email: surowy, id } = await params;
  const handlowiec = await handlowiecFirmy(konto.firma_id!, decodeURIComponent(surowy).toLowerCase());
  if (!handlowiec) notFound();
  const r = await pobierzRozmowe(handlowiec.email, id);
  if (!r) notFound();
  const { t, jezyk } = await tSerwer();
  const { POSTACIE, POZIOMY, TRYBY } = etykiety(jezyk);
  const imie = handlowiec.imie?.trim() || handlowiec.email;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/bruno/szef/${encodeURIComponent(handlowiec.email)}`} className="text-sm text-slate-500 hover:text-slate-900">← {imie}</Link>
        <h1 className="bruno-h1 text-[1.7rem] sm:text-[2.2rem] mt-2">
          {imie}: {r.tryb ? TRYBY[trybLubDomyslny(r.tryb)].nazwa.toLowerCase() : t("call", "rozmowa")}, {t("customer", "klient")} <span className="bruno-gradient-tekst">{POSTACIE[postacLubDomyslna(r.postac)].nazwa.toLowerCase()}</span>
        </h1>
        {r.obiekcja && <p className="text-sm text-cyan-800 mt-1">{jezyk === "pl" ? <>Trenowana obiekcja: „{r.obiekcja.split(" | ")[0]}”</> : <>Objection practiced: &ldquo;{r.obiekcja.split(" | ")[0]}&rdquo;</>}</p>}
        <p className="text-sm text-slate-500">
          {new Date(r.start).toLocaleString(locale(jezyk), { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
          {r.sekundy ? `, ${czas(r.sekundy)}` : ""}
          {`, ${t("level", "poziom")} ${POZIOMY[poziomLubDomyslny(r.poziom)].nazwa.toLowerCase()}`}
        </p>
      </div>

      {r.feedback ? <FeedbackWidok feedback={r.feedback} jezyk={jezyk} /> : <div className="bruno-szklo rounded-2xl p-5 text-slate-600">{t("The coach hasn't scored this call yet.", "Trener nie zostawił jeszcze oceny.")}</div>}

      {r.transkrypcja && r.transkrypcja.length > 0 && (
        <section className="bruno-szklo rounded-2xl p-5">
          <h2 className="bruno-h2 text-base mb-3">{t("Transcript", "Transkrypcja")}</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {r.transkrypcja.map((w, i) => (
              <li key={i} className={w.rola === "klient" ? "text-slate-800" : "text-cyan-900"}>
                <span className="text-[11px] text-slate-400 tabular-nums mr-2">[{czas(w.t)}]</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mr-2">{w.rola === "klient" ? "Bruno" : imie}</span>
                {w.tekst}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
