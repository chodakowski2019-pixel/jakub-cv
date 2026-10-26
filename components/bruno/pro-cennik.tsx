"use client";

import { useState } from "react";
import OdblokujForm from "@/components/bruno/odblokuj-form";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 10.10 (USER_001): paywall B2C. Konto free po 3 rozmowach (albo wcześniej z własnej woli)
// kupuje Bruno Pro: 250 $ / mies. albo 2 500 $ / rok (decyzja 9.10). Klik = Stripe Checkout
// (subskrypcja), po płatności webhook przełącza plan na „pelny". Gdy Stripe nie jest
// skonfigurowany (brak cen w env), zostaje stary przycisk „Chcę pełen dostęp" (mail do USER_001).

export const PRO_PUNKTY = [
  "5 calls with Bruno every day, weekends too",
  "A coach's score after every call: 5 criteria, closing techniques, quotes",
  "Recordings and transcripts of every call",
  "Flashcards from your mistakes, reviews at the right time",
  "Stats: score trend, weakest area, minutes",
  "Import your offer from a website or PDF: Bruno knows your product",
  "Tomorrow's call: paste in a real situation, Bruno plays that customer",
  "Mental Zone: a 5-minute warm-up before a real call",
  "4 customer types, 3 difficulty levels, your own objections",
];

/** 11.10: te same punkty po polsku (salesbruno.pl), 1:1 z wersji sprzed tłumaczenia. */
export const PRO_PUNKTY_PL = [
  "5 rozmów z Bruno każdego dnia, także w weekend",
  "Ocena trenera po każdej rozmowie: 5 kryteriów, techniki zamykania, cytaty",
  "Nagrania i transkrypcje wszystkich rozmów",
  "Fiszki z Twoich błędów, powtórki w dobrym momencie",
  "Statystyki: trend oceny, najsłabsze kryterium, minuty",
  "Oferta ze strony albo PDF: Bruno zna Twój produkt",
  "„Rozmowa, którą masz jutro”: wklejasz prawdziwą sytuację, Bruno gra tego klienta",
  "„Strefa mentalna”: 5-minutowy rytuał przed prawdziwym telefonem",
  "4 typy klienta, 3 poziomy trudności, własne obiekcje",
];

export default function ProCennik({ stripe, zablokowane, zuzyte, ok }: { stripe: boolean; zablokowane: boolean; zuzyte: number; ok?: boolean }) {
  const [stan, setStan] = useState<"idle" | "miesiac" | "rok" | "blad">("idle");
  const { t, jezyk, mnoga } = useT();

  const kup = async (okres: "miesiac" | "rok") => {
    setStan(okres);
    try {
      const res = await fetch("/api/bruno/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ okres }) });
      const d = await res.json();
      if (res.ok && d.url) {
        window.location.href = d.url;
        return;
      }
    } catch {}
    setStan("blad");
  };

  if (ok) {
    return (
      <div className="bruno-szklo rounded-3xl p-8 text-center max-w-xl mx-auto w-full">
        <div className="bruno-h2 text-xl mb-2">{t("Thank you. Bruno Pro is active.", "Dziękuję. Bruno Pro jest aktywne.")}</div>
        <p className="text-slate-600">{t("If your account didn't unlock right away, refresh the page in a minute. We sent a confirmation email.", "Jeśli panel nie odblokował się od razu, odśwież stronę za minutę. Potwierdzenie przyszło mailem.")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          {zablokowane ? (
            <>{t("You used", "Wykorzystane")} <span className="bruno-gradient-tekst">{zuzyte} {mnoga(zuzyte, ["free call", "free calls"], ["bezpłatna rozmowa", "bezpłatne rozmowy", "bezpłatnych rozmów"])}</span></>
          ) : (
            <>Bruno <span className="bruno-gradient-tekst">Pro</span></>
          )}
        </h1>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto">
          {zablokowane ? t("To keep practicing, unlock Bruno Pro. Every feature, 5 calls a day.", "Żeby trenować dalej, odblokuj Bruno Pro. Wszystkie funkcje, 5 rozmów dziennie.") : t("Unlock every feature", "Odblokuj wszystkie funkcje")}
        </p>
      </div>

      {/* 11.10 (USER_001): rocznie po lewej (wyróżnione), miesięcznie po prawej. Rocznie = płatność jednorazowa. */}
      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
        <div className="bruno-szklo rounded-2xl p-6 flex flex-col gap-3 border-amber-300/80">
          <div className="bruno-h2 text-base flex items-center gap-2">
            {t("Yearly", "Rocznie")} <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{t("2 months free", "2 miesiące gratis")}</span>
          </div>
          <div className="text-4xl font-bold text-slate-900">{t("$2,500", "2 500 zł")}<span className="text-base font-normal text-slate-500">{t(" / year", " / rok")}</span></div>
          <p className="text-sm text-slate-600">{t("One payment, no auto-renewal. That's $208 a month.", "Jedna płatność, bez odnawiania. To 208 zł miesięcznie.")}</p>
          {stripe ? (
            <button type="button" onClick={() => kup("rok")} disabled={stan === "miesiac" || stan === "rok"} className="bruno-przycisk mt-auto">
              {stan === "rok" ? t("Redirecting...", "Przekierowuję...") : t("Choose yearly", "Wybieram rocznie")}
            </button>
          ) : null}
        </div>
        <div className="bruno-szklo rounded-2xl p-6 flex flex-col gap-3">
          <div className="bruno-h2 text-base">{t("Monthly", "Miesięcznie")}</div>
          <div className="text-4xl font-bold text-slate-900">{t("$250", "250 zł")}<span className="text-base font-normal text-slate-500">{t(" / month", " / mies.")}</span></div>
          <p className="text-sm text-slate-600">{t("One payment for 30 days, no auto-renewal.", "Jedna płatność na 30 dni, bez odnawiania.")}</p>
          {stripe ? (
            <button type="button" onClick={() => kup("miesiac")} disabled={stan === "miesiac" || stan === "rok"} className="bruno-przycisk-2 mt-auto">
              {stan === "miesiac" ? t("Redirecting...", "Przekierowuję...") : t("Choose monthly", "Wybieram miesięcznie")}
            </button>
          ) : null}
        </div>
      </div>
      {stan === "blad" && <p className="text-center text-sm text-red-700">{t("Couldn't open checkout. Try again or email hello@jakubchodakowski.com.", "Nie udało się otworzyć płatności. Spróbuj jeszcze raz albo napisz: hello@jakubchodakowski.com.")}</p>}

      {/* 14.10 (USER_001): 3 kafelki z badaniami o korzyściach treningu. Te same liczby i źródła co LP handlowców (bruno-lp.tsx, wersja reps). */}
      <section className="max-w-3xl mx-auto w-full">
        <h2 className="bruno-h2 text-base mb-3">{t("What sales training gives you", "Co daje trening sprzedaży?")}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { liczba: "+32%", tekst: t("Reps coached regularly, on a plan, win 32% more forecast deals.", "Handlowcy trenowani regularnie, według planu, wygrywają o 32% więcej szans sprzedaży."), zrodlo: t("CSO Insights, 2019 Sales Enablement Study, 900+ companies", "CSO Insights, 2019 Sales Enablement Study, ponad 900 firm") },
            { liczba: "+28%", tekst: t("Regular, structured coaching lifts quota attainment by 28%.", "Regularny trening według planu podnosi realizację planu o 28%."), zrodlo: t("CSO Insights, 2019 Sales Enablement Study, 900+ companies", "CSO Insights, 2019 Sales Enablement Study, ponad 900 firm") },
            { liczba: "17%", tekst: t("17% of sales reps bring in 81% of the revenue. Practice is the shortest way into that group.", "17% handlowców przynosi 81% przychodu. Trening to najkrótsza droga do tej grupy."), zrodlo: "Ebsta x Pavilion, GTM Benchmarks 2025" },
          ].map((k) => (
            <div key={k.liczba} className="bruno-szklo rounded-2xl p-5 flex flex-col gap-2">
              <div className="text-3xl font-bold bruno-gradient-tekst">{k.liczba}</div>
              <p className="text-sm text-slate-800">{k.tekst}</p>
              <p className="text-[11px] text-slate-500 mt-auto">{t("Source:", "Źródło:")} {k.zrodlo}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 11.10 (USER_001): co jest w Bruno Pro jako prawdziwa tabelka (jak plusy i minusy w Feedbacku). */}
      {(() => {
        const punkty = jezyk === "pl" ? PRO_PUNKTY_PL : PRO_PUNKTY;
        const wiersze = Array.from({ length: Math.ceil(punkty.length / 2) }, (_, i) => [punkty[2 * i], punkty[2 * i + 1]]);
        return (
          <section className="bruno-szklo rounded-2xl p-5 max-w-3xl mx-auto w-full overflow-x-auto">
            <table className="w-full text-sm table-fixed border-collapse">
              <thead>
                <tr>
                  <th colSpan={2} className="text-left pb-3 font-normal">
                    <span className="bruno-h2 text-base">{t("What you get in Bruno Pro", "Co otrzymasz w Bruno Pro")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {wiersze.map(([a, b], i) => (
                  <tr key={i} className="align-top border-t border-slate-200/60">
                    <td className="py-2.5 pr-4 text-slate-800"><span className="flex gap-2"><span className="text-emerald-600 font-semibold shrink-0">✓</span><span>{a}</span></span></td>
                    <td className="py-2.5 pl-4 text-slate-800 border-l border-slate-200/60">{b ? <span className="flex gap-2"><span className="text-emerald-600 font-semibold shrink-0">✓</span><span>{b}</span></span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })()}

      {!stripe && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-slate-500">{t("Online payment is coming soon. For now:", "Płatność online wkrótce. Na razie:")}</p>
          <OdblokujForm />
        </div>
      )}
    </div>
  );
}
