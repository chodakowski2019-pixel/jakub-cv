import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BazaPasek from "@/components/bruno/praca/baza-pasek";
import KontoForm from "@/components/bruno/praca/konto-form";
import d from "@/components/bruno/praca/dolacz.module.css";
import h from "@/components/bruno/praca/handlowcy.module.css";
import { getStripeBruno } from "@/lib/bruno/stripe";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { GWARANCJA } from "@/lib/bruno/praca/kontakty-cennik";
import { przypiszZlecenie, zleceniePoSesji, zlecenieZeStripe } from "@/lib/bruno/praca/zlecenia";

// 12.11 (USER_001): powrót ze Stripe po zakupie subskrypcji albo gwarancji w wyszukiwarce (/praca/handlowcy/zlecenie?sesja=…).
// Jak przy kontaktach: sprawdza płatność w Stripe (nie czeka na webhook), zapisuje zlecenie i:
// zalogowany pracodawca → przypina zlecenie do konta i idzie do panelu, pozostali → formularz konta firmy, potem ten sam adres.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wyszukiwarka handlowców | SalesBruno.pl", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const sesja = typeof sp.sesja === "string" ? sp.sesja.slice(0, 200) : "";
  let zlecenie = sesja ? await zleceniePoSesji(sesja) : null;
  if (!zlecenie && sesja.startsWith("cs_") && process.env.BRUNO_STRIPE_SECRET_KEY) {
    try {
      zlecenie = await zlecenieZeStripe(await getStripeBruno().checkout.sessions.retrieve(sesja));
    } catch (e) {
      console.error("[praca zlecenia] sesja", e);
    }
  }
  // Zlecenie testowe (lokalnie bez Stripe) nie działa na produkcji.
  if (zlecenie?.test && process.env.NODE_ENV === "production") zlecenie = null;

  const konto = await zalogowanePraca();
  let zajete = false;
  if (zlecenie && konto?.typ === "pracodawca") {
    const w = await przypiszZlecenie(zlecenie, konto.id);
    if (w.ok) redirect(`/praca/panel?z=handlowcy&odblokowane=${w.odblokowane}`);
    zajete = true;
  }

  const tuWroc = `/praca/handlowcy/zlecenie?sesja=${encodeURIComponent(sesja)}`;
  return (
    <div className={d.v} lang="pl">
      <BazaPasek />
      <main className={h.po}>
        {!zlecenie ? (
          <>
            <h1 className={h.poH}>Nie widzimy jeszcze tej płatności</h1>
            <p className={h.poP}>BLIK i przelew potrafią potwierdzić się po chwili. Odśwież stronę za minutę. Jeśli pieniądze zeszły z konta, a strona dalej tak wygląda, napisz: jakub@salesbruno.com.</p>
            <a className={d.cta} href={sesja ? tuWroc : "/wyszukiwarka"}>
              {sesja ? "Odśwież" : "Wróć do wyszukiwarki"}
            </a>
          </>
        ) : zajete ? (
          <>
            <h1 className={h.poH}>Ten zakup jest już na innym koncie</h1>
            <p className={h.poP}>Zaloguj się na konto firmy, na którym zakup został zapisany.</p>
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
              Płatność przyjęta{zlecenie.test ? " (test)" : ""}
            </span>
            <h1 className={h.poH}>Załóż konto firmy</h1>
            <p className={h.poP}>
              Został ostatni krok. Na koncie pojawią się kontakty do handlowców dopasowanych do opisu: „{zlecenie.opis}”.{" "}
              {zlecenie.rodzaj === "gwarancja"
                ? `Gwarancja: ${GWARANCJA.ile} handlowców do ${new Date(zlecenie.termin ?? Date.now()).toLocaleDateString("pl-PL")} albo zwrot ${GWARANCJA.cena} zł.`
                : "O każdym nowym dopasowanym handlowcu damy znać e-mailem."}
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
