"use client";

import { useState } from "react";
import OdblokujForm from "@/components/bruno/odblokuj-form";

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
  "Fire Up: a 5-minute warm-up before a real call",
  "4 customer types, 3 difficulty levels, your own objections",
];

export default function ProCennik({ stripe, zablokowane, zuzyte, ok }: { stripe: boolean; zablokowane: boolean; zuzyte: number; ok?: boolean }) {
  const [stan, setStan] = useState<"idle" | "miesiac" | "rok" | "blad">("idle");

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
        <div className="bruno-h2 text-xl mb-2">Thank you. Bruno Pro is active.</div>
        <p className="text-slate-600">If your account didn't unlock right away, refresh the page in a minute. We sent a confirmation email.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          {zablokowane ? (
            <>You used <span className="bruno-gradient-tekst">{zuzyte} free {zuzyte === 1 ? "call" : "calls"}</span></>
          ) : (
            <>Bruno <span className="bruno-gradient-tekst">Pro</span></>
          )}
        </h1>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto">
          {zablokowane ? "To keep practicing, unlock Bruno Pro. Every feature, 5 calls a day." : "Every feature, 5 calls a day, no yearly contract."}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
        <div className="bruno-szklo rounded-2xl p-6 flex flex-col gap-3">
          <div className="bruno-h2 text-base">Monthly</div>
          <div className="text-4xl font-bold text-slate-900">$250<span className="text-base font-normal text-slate-500"> / month</span></div>
          <p className="text-sm text-slate-600">Cancel anytime.</p>
          {stripe ? (
            <button type="button" onClick={() => kup("miesiac")} disabled={stan === "miesiac" || stan === "rok"} className="bruno-przycisk-2 mt-auto">
              {stan === "miesiac" ? "Redirecting..." : "Choose monthly"}
            </button>
          ) : null}
        </div>
        <div className="bruno-szklo rounded-2xl p-6 flex flex-col gap-3 border-amber-300/80">
          <div className="bruno-h2 text-base flex items-center gap-2">
            Yearly <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">2 months free</span>
          </div>
          <div className="text-4xl font-bold text-slate-900">$2,500<span className="text-base font-normal text-slate-500"> / year</span></div>
          <p className="text-sm text-slate-600">Paid upfront, $208 a month.</p>
          {stripe ? (
            <button type="button" onClick={() => kup("rok")} disabled={stan === "miesiac" || stan === "rok"} className="bruno-przycisk mt-auto">
              {stan === "rok" ? "Redirecting..." : "Choose yearly"}
            </button>
          ) : null}
        </div>
      </div>
      {stan === "blad" && <p className="text-center text-sm text-red-700">Couldn't open checkout. Try again or email hello@jakubchodakowski.com.</p>}

      <ul className="bruno-szklo rounded-2xl p-6 max-w-3xl mx-auto w-full grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-800">
        {PRO_PUNKTY.map((p) => (
          <li key={p} className="flex gap-2"><span className="text-emerald-600 font-semibold">✓</span>{p}</li>
        ))}
      </ul>

      {!stripe && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-slate-500">Online payment is coming soon. For now:</p>
          <OdblokujForm />
        </div>
      )}
    </div>
  );
}
