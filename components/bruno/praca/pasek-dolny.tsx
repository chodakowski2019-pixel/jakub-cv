"use client";

import { useEffect, useState } from "react";
import Aplikuj, { type DaneKandydata, type Klauzule } from "./aplikuj";
import { Serce } from "./karta";
import s from "./praca.module.css";

// 17.10 v3 (wzór RocketJobs): po przewinięciu strony oferty na dole przyklejony pasek: tytuł, Zapisz, Aplikuj.
export default function PasekDolny({ tytul, id, firma, logo, kandydat, klauzule }: { tytul: string; id: string; firma: string; logo?: string | null; kandydat?: DaneKandydata | null; klauzule?: Klauzule }) {
  const [widac, setWidac] = useState(false);
  useEffect(() => {
    const f = () => setWidac(window.scrollY > 520);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <div className={`${s.pasekDolny} ${widac ? s.pasekDolnyOn : ""}`} aria-hidden={!widac}>
      <span className={s.pasekDolnyTytul}>{tytul}</span>
      <Serce id={id} z />
      <Aplikuj className={s.btn} id={id} firma={firma} stanowisko={tytul} logo={logo} kandydat={kandydat} klauzule={klauzule} />
    </div>
  );
}
