"use client";

import { useState } from "react";
import { useT } from "@/components/bruno/jezyk-kontekst";

// 11.10 (USER_001): w Ustawieniach wybór głosu Bruno: mężczyzna albo kobieta (PL i EN).
// Zapis częściowy do /api/bruno/konfig: leci tylko `glos`. Działa od następnej rozmowy.

export default function GlosForm({ glos }: { glos: "m" | "k" }) {
  const { t } = useT();
  const [g, setG] = useState<"m" | "k">(glos);
  const [stan, setStan] = useState<"idle" | "zapis" | "ok" | "blad">("idle");

  const wybierz = async (nowy: "m" | "k") => {
    setG(nowy);
    setStan("zapis");
    const res = await fetch("/api/bruno/konfig", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ glos: nowy }) });
    setStan(res.ok ? "ok" : "blad");
  };

  return (
    <section className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-4">
      <div>
        <h2 className="bruno-h2 text-lg">{t("Bruno's voice", "Głos Bruno")}</h2>
        <p className="text-sm text-slate-600 mt-1">{t("Who plays your customer in the call.", "Kto gra Twojego klienta w rozmowie.")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {(["m", "k"] as const).map((x) => (
          <button
            key={x}
            type="button"
            aria-pressed={g === x}
            disabled={stan === "zapis"}
            onClick={() => wybierz(x)}
            className={g === x ? "bruno-przycisk" : "bruno-przycisk-2"}
          >
            {x === "m" ? t("Man", "Mężczyzna") : t("Woman", "Kobieta")}
          </button>
        ))}
        {stan === "ok" && <span className="text-sm text-teal-800">{t("Saved. The next call uses this voice.", "Zapisane. Następna rozmowa z tym głosem.")}</span>}
        {stan === "blad" && <span className="text-sm text-red-700">{t("Couldn't save.", "Nie udało się zapisać.")}</span>}
      </div>
    </section>
  );
}
