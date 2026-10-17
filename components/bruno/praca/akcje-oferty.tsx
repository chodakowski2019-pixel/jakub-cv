"use client";

import { useState } from "react";
import { Serce } from "./karta";
import s from "./praca.module.css";

// 17.10 (USER_001, jak Pracuj.pl / RocketJobs): Zapisz (serce, w tej przeglądarce), Drukuj, Udostępnij.
export default function AkcjeOferty({ id, tytul }: { id: string; tytul: string }) {
  const [skopiowano, setSkopiowano] = useState(false);
  const udostepnij = async () => {
    // Link publiczny, bez tokenu firmy (?k=).
    const url = `${location.origin}${location.pathname}`;
    if (navigator.share) {
      await navigator.share({ title: tytul, url }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => {});
    setSkopiowano(true);
    setTimeout(() => setSkopiowano(false), 2000);
  };
  return (
    <div className={s.akcjeMale}>
      <Serce id={id} z />
      <button type="button" onClick={() => window.print()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7Z" /></svg>
        Drukuj
      </button>
      <button type="button" onClick={udostepnij}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></svg>
        {skopiowano ? "Skopiowano" : "Udostępnij"}
      </button>
    </div>
  );
}
