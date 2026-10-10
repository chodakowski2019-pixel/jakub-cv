"use client";

import { useState } from "react";

// „Ustawienia" (USER_001 1.10): godzina przypomnienia mailem, wyniesiona
// z „Dostosuj Bruno". Zapis częściowy do /api/bruno/konfig: leci tylko godzina.

export default function UstawieniaForm({ godzina }: { godzina: number }) {
  const [h, setH] = useState(godzina);
  const [stan, setStan] = useState<"idle" | "zapis" | "ok" | "blad">("idle");

  const zapisz = async (e: React.FormEvent) => {
    e.preventDefault();
    setStan("zapis");
    const res = await fetch("/api/bruno/konfig", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ godzina_przypomnienia: h }),
    });
    setStan(res.ok ? "ok" : "blad");
  };

  return (
    <form onSubmit={zapisz} className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-5">
      <div>
        <h2 className="bruno-h2 text-lg">Practice reminders</h2>
        <p className="text-sm text-slate-600 mt-1">If you haven't practiced yet that day, we'll send you an email reminder. Reviews are what make a rep great.</p>
      </div>
      <div className="max-w-xs">
        <label className="bruno-etykieta" htmlFor="godzina">Reminder time <span className="font-normal text-slate-400">(during the trial: around 8:00 AM)</span></label>
        <select id="godzina" className="bruno-pole" value={h} onChange={(e) => setH(Number(e.target.value))}>
          {Array.from({ length: 18 }, (_, i) => i + 5).map((g) => (
            <option key={g} value={g}>{g}:00</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={stan === "zapis"} className="bruno-przycisk">{stan === "zapis" ? "Saving..." : "Save"}</button>
        {stan === "ok" && <span className="text-sm text-teal-800">Saved.</span>}
        {stan === "blad" && <span className="text-sm text-red-700">Couldn't save.</span>}
      </div>
    </form>
  );
}
