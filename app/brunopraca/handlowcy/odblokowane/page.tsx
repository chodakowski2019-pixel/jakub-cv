import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BazaPasek from "@/components/bruno/praca/baza-pasek";
import KontoForm from "@/components/bruno/praca/konto-form";
import d from "@/components/bruno/praca/dolacz.module.css";
import h from "@/components/bruno/praca/handlowcy.module.css";
import { getStripePraca, kluczStripePraca } from "@/lib/bruno/stripe";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { przypiszZakup, zakupPoSesji, zakupZeStripe } from "@/lib/bruno/praca/kontakty";
import { kontaktow } from "@/lib/bruno/praca/kontakty-cennik";

// 11.11 (USER_001): powrót ze Stripe po zakupie kontaktów do handlowców (/praca/handlowcy/odblokowane?sesja=…).
// Sprawdza płatność w Stripe (nie czeka na webhook), zapisuje zakup i:
// zalogowany pracodawca → przypina zakup do konta i idzie do panelu, pozostali → formularz konta firmy, potem ten sam adres.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kontakty do handlowców | SalesBruno.pl", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const sesja = typeof sp.sesja === "string" ? sp.sesja.slice(0, 200) : "";
  let zakup = sesja ? await zakupPoSesji(sesja) : null;
  if (!zakup && sesja.startsWith("cs_") && kluczStripePraca()) {
    try {
      zakup = await zakupZeStripe(await getStripePraca().checkout.sessions.retrieve(sesja));
    } catch (e) {
      console.error("[praca kontakty] sesja", e);
    }
  }
  // Zakup testowy (lokalnie bez Stripe) nie działa na produkcji.
  if (zakup?.test && process.env.NODE_ENV === "production") zakup = null;

  const konto = await zalogowanePraca();
  let zajety = false;
  if (zakup && konto?.typ === "pracodawca") {
    const w = await przypiszZakup(zakup, konto.id);
    if (w.ok) redirect(`/praca/panel?z=handlowcy&odblokowane=${zakup.wybrani.length}`);
    zajety = true;
  }

  const tuWroc = `/praca/handlowcy/odblokowane?sesja=${encodeURIComponent(sesja)}`;
  return (
    <div className={d.v} lang="pl">
      <BazaPasek />
      <main className={h.po}>
        {!zakup ? (
          <>
            <h1 className={h.poH}>Nie widzimy jeszcze tej płatności</h1>
            <p className={h.poP}>BLIK i przelew potrafią potwierdzić się po chwili. Odśwież stronę za minutę. Jeśli pieniądze zeszły z konta, a strona dalej tak wygląda, napisz: jakub@salesbruno.com.</p>
            <a className={d.cta} href={sesja ? tuWroc : "/praca/handlowcy"}>
              {sesja ? "Odśwież" : "Wróć do wyszukiwarki"}
            </a>
          </>
        ) : zajety ? (
          <>
            <h1 className={h.poH}>Ten zakup jest już na innym koncie</h1>
            <p className={h.poP}>Zaloguj się na konto firmy, na którym kontakty zostały odblokowane.</p>
            <a className={d.cta} href="/praca/panel?z=handlowcy">
              Mój panel
            </a>
          </>
        ) : (
          <>
            <span className={h.poZnak}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              Płatność przyjęta{zakup.test ? " (test)" : ""}
            </span>
            <h1 className={h.poH}>Załóż konto firmy</h1>
            <p className={h.poP}>
              Został ostatni krok. Na koncie czeka pakiet: {kontaktow(zakup.pakiet)}
              {zakup.wybrani.length > 0 ? `, wybrane osoby (${zakup.wybrani.length}) odblokują się od razu` : ""}.
            </p>
            <div className={d.karta}>
              <KontoForm typ="pracodawca" jedenTyp dalej={tuWroc} naglowek="Konto firmy" opis="" przycisk="Załóż konto i pokaż kontakty" />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
