"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/bruno/jezyk-kontekst";
import { ROLE, ROLE_ETYKIETY, type Rola } from "@/lib/bruno/role";

// 11.10 (USER_001): ekran po rejestracji (e-mail + hasło). Konto uzupełnia profil,
// dopiero potem wchodzi do panelu i ma 3 bezpłatne rozmowy.
// 12.10 (USER_001): tylko imię, rola (przy „Inne” pojawia się pole) i liczba handlowców.
// Bez telefonu i „co sprzedajesz” (to jest w „Dostosuj Bruno”). Po zapisie: film, potem panel.

export default function ProfilForm({ imieStart }: { imieStart?: string | null }) {
  const { t, jezyk } = useT();
  const router = useRouter();
  const [f, setF] = useState({ imie: imieStart ?? "", rola: "" as Rola | "", rolaInna: "", handlowcy: "" });
  const [stan, setStan] = useState<"idle" | "zapis" | "blad">("idle");
  const [blad, setBlad] = useState<string | null>(null);
  const pole = (k: "imie" | "rolaInna" | "handlowcy") => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  const zapisz = async (e: React.FormEvent) => {
    e.preventDefault();
    setStan("zapis");
    setBlad(null);
    const res = await fetch("/api/bruno/profil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imie: f.imie, rola: f.rola, rola_inna: f.rolaInna, handlowcy: f.handlowcy }),
    });
    const d = (await res.json().catch(() => null)) as { ok?: boolean; blad?: string; dalej?: string } | null;
    if (res.ok && d?.ok) {
      router.push(d.dalej ?? "/bruno/panel");
      router.refresh();
      return;
    }
    setBlad(d?.blad ?? t("Could not save. Try again.", "Nie udało się zapisać. Spróbuj ponownie."));
    setStan("blad");
  };

  return (
    <form onSubmit={zapisz} className="bruno-szklo rounded-3xl p-6 sm:p-8 flex flex-col gap-5 max-w-xl w-full mx-auto">
      <div>
        <label className="bruno-etykieta" htmlFor="imie">{t("First name", "Imię")} *</label>
        <input id="imie" className="bruno-pole" required autoComplete="given-name" placeholder="Adam" value={f.imie} onChange={pole("imie")} />
      </div>
      <fieldset>
        <legend className="bruno-etykieta">{t("Your role", "Twoja rola")} *</legend>
        <div className="flex flex-wrap gap-2 mt-1">
          {ROLE.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={f.rola === r}
              onClick={() => setF((v) => ({ ...v, rola: r }))}
              className={f.rola === r ? "bruno-przycisk text-sm px-4 py-2" : "bruno-przycisk-2 text-sm px-4 py-2"}
            >
              {ROLE_ETYKIETY[r][jezyk]}
            </button>
          ))}
        </div>
        {f.rola === "other" && (
          <input
            id="rola-inna"
            className="bruno-pole mt-3"
            required
            autoFocus
            maxLength={80}
            placeholder={t("What is your role?", "Jaka to rola?")}
            aria-label={t("Your role", "Twoja rola")}
            value={f.rolaInna}
            onChange={pole("rolaInna")}
          />
        )}
      </fieldset>
      <div>
        <label className="bruno-etykieta" htmlFor="handlowcy">{t("How many sales reps work at your company?", "Ilu handlowców jest w Twojej firmie?")}</label>
        <input id="handlowcy" className="bruno-pole" type="number" inputMode="numeric" min={1} max={100000} placeholder={t("e.g. 8", "np. 8")} value={f.handlowcy} onChange={pole("handlowcy")} />
      </div>
      {blad && <p className="text-sm text-red-700" role="alert">{blad}</p>}
      <button type="submit" disabled={stan === "zapis" || !f.rola || (f.rola === "other" && f.rolaInna.trim().length < 2)} className={`bruno-przycisk text-base py-3 ${stan === "zapis" ? "bruno-czeka" : ""}`} aria-busy={stan === "zapis"}>
        {/* 15.10 (USER_001): kręcące się kółko, póki zapis i przejście do panelu trwają. */}
        {stan === "zapis" && <span className="bruno-kolko" aria-hidden />}
        {stan === "zapis" ? t("Saving...", "Zapisuję...") : t("Start practicing →", "Zaczynam trening →")}
      </button>
    </form>
  );
}
