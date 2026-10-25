"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 25.10 (USER_001): „Przygotuj spotkanie”. Imię rozmówcy + adres strony firmy → Bruno czyta stronę,
// bierze logo, układa produkt i obiekcje, robi 5 przykładowych handlowców z rozmowami. Trwa do 2 minut.
// Wynik: panel szefa („Zespół [firma]”, „Cześć, [imię]”) gotowy do pokazania na spotkaniu.

export default function PrzygotujForm({ obecna }: { obecna: { nazwa: string; imie: string | null; logo: string | null } | null }) {
  const router = useRouter();
  const [imie, setImie] = useState("");
  const [url, setUrl] = useState("");
  const [nazwa, setNazwa] = useState("");
  const [stan, setStan] = useState<"idle" | "praca" | "blad">("idle");
  const [blad, setBlad] = useState("");

  const przygotuj = async (e: React.FormEvent) => {
    e.preventDefault();
    setStan("praca");
    setBlad("");
    const res = await fetch("/api/bruno/spotkanie", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imie, url, nazwa }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStan("blad");
      setBlad(d.blad ?? "Nie udało się przygotować panelu.");
      return;
    }
    router.push("/bruno/szef");
    router.refresh();
  };

  return (
    <div className="bruno-szklo rounded-3xl p-6 sm:p-10 max-w-xl mx-auto flex flex-col gap-6">
      <div className="text-center">
        <h1 className="bruno-h1 text-[1.9rem] sm:text-[2.4rem]">
          Przygotuj <span className="bruno-gradient-tekst">spotkanie</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm">Bruno przeczyta stronę firmy i dopasuje panel do rozmowy.</p>
      </div>
      <form onSubmit={przygotuj} className="flex flex-col gap-4">
        <label>
          <span className="bruno-etykieta">Imię rozmówcy</span>
          <input className="bruno-pole" value={imie} onChange={(e) => setImie(e.target.value)} placeholder="np. Marek" required maxLength={60} autoFocus />
        </label>
        <label>
          <span className="bruno-etykieta">Strona firmy</span>
          <input className="bruno-pole" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="np. firma.pl" required maxLength={300} inputMode="url" />
        </label>
        <label>
          <span className="bruno-etykieta">Nazwa firmy <span className="font-normal text-slate-400">(puste = ze strony)</span></span>
          <input className="bruno-pole" value={nazwa} onChange={(e) => setNazwa(e.target.value)} placeholder="np. Firma Sp. z o.o." maxLength={80} />
        </label>
        <button type="submit" disabled={stan === "praca"} className="bruno-przycisk bruno-czeka mt-2">
          {stan === "praca" ? (
            <>
              <span className="bruno-kolko" aria-hidden />
              Bruno czyta stronę i układa panel (do 2 minut)…
            </>
          ) : (
            "Przygotuj panel"
          )}
        </button>
        {stan === "blad" && <p className="text-sm text-red-700 text-center">{blad}</p>}
      </form>
      {obecna && stan !== "praca" && (
        <button type="button" onClick={() => router.push("/bruno/szef")} className="text-sm text-slate-500 underline text-center">
          Wejdź bez zmian: {obecna.nazwa}{obecna.imie ? `, ${obecna.imie}` : ""}
        </button>
      )}
    </div>
  );
}
