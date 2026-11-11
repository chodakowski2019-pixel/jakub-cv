import type { Metadata } from "next";
import BazaPasek from "@/components/bruno/praca/baza-pasek";
import HandlowcyWyniki from "@/components/bruno/praca/handlowcy-wyniki";
import d from "@/components/bruno/praca/dolacz.module.css";
import h from "@/components/bruno/praca/handlowcy.module.css";
import { zalogowanePraca } from "@/lib/bruno/praca/konta";
import { BRANZE, DOSWIADCZENIE, RYNKI, TRYBY, czytajFiltry, odblokowaneId, szukajHandlowcow, zapiszWyszukiwanie } from "@/lib/bruno/praca/handlowcy";
import { PAKIETY, handlowcow } from "@/lib/bruno/praca/kontakty-cennik";

// 11.11 (USER_001): salesbruno.pl/praca/handlowcy = wyszukiwarka handlowców dla firm (link wysyłany firmom).
// Firma wpisuje, kogo szuka → „Mamy dla Ciebie X handlowców” (karty bez kontaktu) → płatność Stripe za pakiet kontaktów
// → konto firmy → kontakty w panelu (/praca/panel?z=handlowcy). Formularz to zwykły GET, więc wynik ma własny adres.
// Wygląd jak LP bazy handlowców (/praca). Poza indeksem.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL("https://salesbruno.pl"),
  title: "Znajdź handlowca | SalesBruno.pl",
  description: "Baza handlowców z doświadczeniem i wynikami. Wpisz, kogo szukasz, i zobacz, ilu handlowców pasuje.",
  alternates: { canonical: "/praca/handlowcy" },
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const f = czytajFiltry(sp);
  const szukano = sp.szukaj === "1";
  const konto = await zalogowanePraca();
  const pracodawca = konto?.typ === "pracodawca" ? konto : null;
  const karty = szukano ? await szukajHandlowcow(f) : null;
  if (karty) await zapiszWyszukiwanie(f, karty.length, pracodawca?.id ?? null);
  const odblokowane = pracodawca && karty?.length ? await odblokowaneId(pracodawca.id) : [];

  // Adres tego wyniku: powrót po anulowanej płatności.
  const q = new URLSearchParams();
  f.branze.forEach((b) => q.append("branza", b));
  f.tryb.forEach((t) => q.append("tryb", t));
  if (f.miasto) q.set("miasto", f.miasto);
  if (f.lata) q.set("lata", f.lata);
  if (f.rynek) q.set("rynek", f.rynek);
  q.set("szukaj", "1");

  return (
    <div className={d.v} lang="pl">
      <BazaPasek cta={pracodawca ? { href: "/praca/panel?z=handlowcy", tekst: "Mój panel" } : { href: "/praca/konto?typ=pracodawca&tryb=logowanie&dalej=/praca/panel?z=handlowcy", tekst: "Zaloguj się" }} />
      <main>
        <header className={`${d.gora} ${h.gora}`}>
          <div className={`${d.szer} ${h.goraSiatka}`}>
            <div>
              <span className={d.mono}>Dla firm</span>
              <h1 className={h.h1}>Znajdź handlowca, który już sprzedaje w Twojej branży.</h1>
              <p className={h.lead}>Wpisz, kogo szukasz. Zobaczysz, ilu handlowców z bazy pasuje. Płacisz tylko za kontakty.</p>
              <ol className={h.kroki}>
                {["Wpisz, kogo szukasz", "Zobacz pasujących handlowców", `Odblokuj kontakty, od ${PAKIETY[0].cena} zł`].map((k, i) => (
                  <li key={k}>
                    <i>{i + 1}</i>
                    {k}
                  </li>
                ))}
              </ol>
            </div>

            <form className={h.form} method="get" action="/praca/handlowcy#wynik">
              <input type="hidden" name="szukaj" value="1" />
              <fieldset className={h.pole}>
                <legend>Branża</legend>
                <div className={h.chipy}>
                  {BRANZE.map((b) => (
                    <label className={h.chip} key={b}>
                      <input type="checkbox" name="branza" value={b} defaultChecked={f.branze.includes(b)} />
                      {b}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className={h.dwa}>
                <fieldset className={h.pole}>
                  <legend>Doświadczenie</legend>
                  <div className={h.chipy}>
                    {[{ v: "", l: "Dowolne" }, ...DOSWIADCZENIE].map((x) => (
                      <label className={h.chip} key={x.v}>
                        <input type="radio" name="lata" value={x.v} defaultChecked={f.lata === x.v} />
                        {x.l}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className={h.pole}>
                  <legend>Sprzedaje</legend>
                  <div className={h.chipy}>
                    {["", ...RYNKI].map((x) => (
                      <label className={h.chip} key={x}>
                        <input type="radio" name="rynek" value={x} defaultChecked={f.rynek === x} />
                        {x || "Dowolnie"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <fieldset className={h.pole}>
                <legend>Tryb pracy</legend>
                <div className={h.chipy}>
                  {TRYBY.map((t) => (
                    <label className={h.chip} key={t}>
                      <input type="checkbox" name="tryb" value={t} defaultChecked={f.tryb.includes(t)} />
                      {t}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className={h.pole}>
                <span>Miasto</span>
                <input className={d.wpis} name="miasto" defaultValue={f.miasto} placeholder="np. Warszawa" maxLength={80} autoComplete="off" />
              </label>
              <div className={h.formDol}>
                <button type="submit" className={d.cta}>
                  Pokaż handlowców
                </button>
                {szukano && <a href="/praca/handlowcy">Wyczyść</a>}
              </div>
            </form>
          </div>
        </header>

        {karty && (
          <section className={h.wynik} id="wynik">
            <div className={d.szer}>
              <span className={d.mono}>Wynik</span>
              {karty.length > 0 ? (
                <>
                  <h2 className={h.wynikH}>
                    Mamy dla Ciebie <b>{handlowcow(karty.length)}</b>.
                  </h2>
                  <p className={h.wynikP}>Wybierz osoby, z którymi chcesz porozmawiać. Po płatności dostajesz telefon, e-mail i pełny profil każdej z nich.</p>
                  <HandlowcyWyniki key={q.toString()} karty={karty} odblokowane={odblokowane} naKoncie={pracodawca?.kontakty ?? 0} powrot={`/praca/handlowcy?${q}`} test={!process.env.BRUNO_STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production"} />
                </>
              ) : (
                <div className={h.pusto}>
                  <h3>Nie mamy jeszcze handlowca dla tych kryteriów</h3>
                  <p>Zmień branżę albo miasto. Baza rośnie codziennie. Możesz też napisać, kogo szukasz, a odezwiemy się, gdy pojawi się pasująca osoba.</p>
                  <a className={d.cta} href={`mailto:jakub@salesbruno.com?subject=${encodeURIComponent("Szukam handlowca")}`}>
                    Napisz, kogo szukasz
                  </a>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className={d.stopka}>
        <div className={d.szer}>
          <div className={d.stopkaDol}>
            <span className={d.mono}>SalesBruno.pl · Praca</span>
            <nav className={d.stopkaLinki} aria-label="Stopka">
              <a href="/praca/regulamin">Regulamin</a>
              <a href="/praca/polityka-prywatnosci">Polityka prywatności</a>
              <a href="/praca">Jestem handlowcem</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
