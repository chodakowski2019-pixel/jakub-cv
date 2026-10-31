import type { Metadata } from "next";
import s from "../kursy.module.css";
import Rama from "../rama";
import { kursPoSlugu } from "@/lib/bruno/kursy";

// 30.10 (USER_001): strona po płatności Stripe za kurs (success_url z /api/bruno/kursy/platnosc).
export const metadata: Metadata = { title: "Dziękujemy | Bruno AI", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const slug = (await searchParams).kurs;
  const k = typeof slug === "string" ? kursPoSlugu(slug) : null;
  return (
    <Rama>
      <div className={s.wasko}>
        <section className={s.hero}>
          <span className={s.znaczek}>Płatność przyjęta</span>
          <h1 className={s.tytul}>Witaj na kursie!</h1>
          <p className={s.podtytul}>
            {k ? `${k.tytul}: ` : ""}w ciągu 24 godzin Jakub zadzwoni do Ciebie, ustalicie start i dostaniesz dostęp do treningu z Bruno. Potwierdzenie jest już na Twoim mailu.
          </p>
        </section>
      </div>
    </Rama>
  );
}
