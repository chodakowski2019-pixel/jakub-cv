"use client";

import { useState } from "react";
import s from "../start.module.css";
import type { PakietId } from "../dane";

// 5.11 (USER_001): formularz po płatności, rozbudowany („bardziej rozbudowany”). 4 części: o Tobie → Twoja sytuacja
// → co sprzedajesz (pola jak w „Dostosuj Bruno”: komu, co, kim jest klient, obiekcje, oferta, skrypt) → cel na 30 dni.
// Pakiet tylko z adresu (?pakiet=, ustawia Stripe), bez wyboru na stronie; brak = „start”. Po wysłaniu komunikat i koniec.
import { CELE, DOSW, KANALY, KOMU, MINUT, PORY, ROZMOW } from "./opcje";

function Czesc({ nr, tytul, opis, children }: { nr: number; tytul: string; opis?: string; children: React.ReactNode }) {
  return (
    <fieldset className={s.czesc}>
      <legend>
        <span className={s.czescNr}>{nr}</span>
        {tytul}
      </legend>
      {opis && <p className={s.czescOpis}>{opis}</p>}
      {children}
    </fieldset>
  );
}

export default function Formularz({ pakietId, zrodlo }: { pakietId: PakietId | null; zrodlo: string }) {
  const pakiet: PakietId = pakietId ?? "start";
  const [czeka, setCzeka] = useState(false);
  const [blad, setBlad] = useState("");
  const [gotowe, setGotowe] = useState(false);

  async function wyslij(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBlad("");
    setCzeka(true);
    const f = new FormData(e.currentTarget);
    const dane: Record<string, unknown> = { pakiet, zrodlo, kanaly: f.getAll("kanaly") };
    for (const k of ["imie", "email", "telefon", "zwracanie", "cel", "doswiadczenie", "praca", "rozmowTyg", "komu", "coSprzedaje", "klient", "obiekcje", "strona", "skrypt", "cel30", "trudnosc", "pora", "minut", "pewnosc"])
      dane[k] = f.get(k);
    const r = await fetch("/api/bruno/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dane) }).catch(() => null);
    const d = await r?.json().catch(() => null);
    if (d?.ok) {
      setGotowe(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBlad(d?.blad ?? "Nie udało się wysłać. Spróbuj ponownie.");
    setCzeka(false);
  }

  if (gotowe)
    return (
      <div className={s.gotowe}>
        <div className={s.ptaszek}>✓</div>
        <h2>Zespół Bruno tworzy dla Ciebie konto.</h2>
        <p>Zajmie to do 24 godzin. Dostęp do konta otrzymasz na e-mail.</p>
      </div>
    );

  return (
    <form className={s.form} onSubmit={wyslij}>
      <Czesc nr={1} tytul="O Tobie">
        <div className={s.pole}>
          <label htmlFor="imie">Imię i nazwisko</label>
          <input id="imie" name="imie" required maxLength={100} autoComplete="name" />
        </div>
        <div className={s.pole}>
          <label htmlFor="email">E-mail</label>
          <small>Ten sam, który podałeś przy płatności. Na niego wyślemy dostęp.</small>
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" />
        </div>
        <div className={s.pole}>
          <label htmlFor="telefon">Telefon</label>
          <small>Na wypadek, gdyby mail nie doszedł.</small>
          <input id="telefon" name="telefon" type="tel" required maxLength={40} autoComplete="tel" />
        </div>
        <div className={s.pole}>
          <label htmlFor="zwracanie">Jak ma się do Ciebie zwracać Bruno?</label>
          <small>Np. „Aniu”, „panie Marku”. Bruno gra klienta, więc będzie tak mówił w rozmowie.</small>
          <input id="zwracanie" name="zwracanie" maxLength={60} />
        </div>
      </Czesc>

      <Czesc nr={2} tytul="Twoja sytuacja" opis="Od tego zależy, od jakiego poziomu zaczniesz i jak trudnego klienta gra Bruno.">
        <div className={s.pole}>
          <label htmlFor="cel">Po co chcesz nauczyć się sprzedawać?</label>
          <select id="cel" name="cel" required defaultValue="">
            <option value="" disabled>
              Wybierz
            </option>
            {CELE.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className={s.pole}>
          <label htmlFor="doswiadczenie">Ile masz doświadczenia w sprzedaży?</label>
          <select id="doswiadczenie" name="doswiadczenie" required defaultValue="">
            <option value="" disabled>
              Wybierz
            </option>
            {DOSW.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className={s.pole}>
          <label htmlFor="praca">Czym się dziś zajmujesz?</label>
          <small>Np. „pracuję na produkcji”, „prowadzę salon kosmetyczny”, „jestem handlowcem w firmie OZE”.</small>
          <input id="praca" name="praca" required maxLength={200} />
        </div>
        <div className={s.pole}>
          <label htmlFor="rozmowTyg">Ile rozmów z klientami prowadzisz tygodniowo?</label>
          <select id="rozmowTyg" name="rozmowTyg" required defaultValue="">
            <option value="" disabled>
              Wybierz
            </option>
            {ROZMOW.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className={s.pole}>
          <label>Jak rozmawiasz (albo chcesz rozmawiać) z klientami?</label>
          <small>Zaznacz wszystkie, które pasują.</small>
          <div className={s.radio}>
            {KANALY.map((k) => (
              <label key={k}>
                <input type="checkbox" name="kanaly" value={k} />
                {k[0].toUpperCase() + k.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </Czesc>

      <Czesc nr={3} tytul="Co sprzedajesz" opis="Bruno czyta to przed każdą rozmową. Im więcej szczegółów, tym bardziej brzmi jak Twój klient.">
        <div className={s.pole}>
          <label>Komu sprzedajesz?</label>
          <small>Bruno gra inaczej firmę, a inaczej osobę prywatną.</small>
          <div className={s.radio}>
            {KOMU.map((k, i) => (
              <label key={k}>
                <input type="radio" name="komu" value={k} required defaultChecked={i === 0} />
                {k[0].toUpperCase() + k.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <div className={s.pole}>
          <label htmlFor="coSprzedaje">Co sprzedajesz?</label>
          <small>Produkt albo usługa, dla kogo, ile kosztuje i za co klient płaci. Np. „fotowoltaikę właścicielom domów, 40-60 tys. zł, raty”. Jeszcze nie wiesz? Napisz, co Cię interesuje.</small>
          <textarea id="coSprzedaje" name="coSprzedaje" required maxLength={2000} />
        </div>
        <div className={s.pole}>
          <label htmlFor="klient">Kim jest Twój klient?</label>
          <small>Wiek, sytuacja, czego się boi, kto decyduje. Np. „właściciel domu 45-60 lat, boi się, że instalacja się nie zwróci, decyduje z żoną”.</small>
          <textarea id="klient" name="klient" maxLength={2000} />
        </div>
        <div className={s.pole}>
          <label htmlFor="obiekcje">Jakie obiekcje słyszysz najczęściej?</label>
          <small>Każda w nowej linii. Np. „za drogo”, „muszę to przemyśleć”, „mam już dostawcę”. Bruno będzie ich używał.</small>
          <textarea id="obiekcje" name="obiekcje" maxLength={2000} />
        </div>
        <div className={s.pole}>
          <label htmlFor="strona">Strona www albo link do oferty (opcjonalnie)</label>
          <small>Bruno przeczyta ofertę i będzie znał Twoje ceny i produkt.</small>
          <input id="strona" name="strona" type="url" maxLength={300} placeholder="https://" />
        </div>
        <div className={s.pole}>
          <label htmlFor="skrypt">Skrypt rozmowy (opcjonalnie)</label>
          <small>Jeśli masz skrypt z firmy, wklej go. Trener sprawdzi, czy się go trzymasz tam, gdzie warto.</small>
          <textarea id="skrypt" name="skrypt" maxLength={5000} />
        </div>
      </Czesc>

      <Czesc nr={4} tytul="Twój cel na 30 dni">
        <div className={s.pole}>
          <label htmlFor="cel30">Co ma się zmienić po 30 dniach?</label>
          <small>Konkretnie. Np. „umawiać 5 spotkań tygodniowo z telefonu”, „podpisać pierwszą umowę”, „nie bać się dzwonić”.</small>
          <textarea id="cel30" name="cel30" required maxLength={1000} />
        </div>
        <div className={s.pole}>
          <label htmlFor="trudnosc">Najtrudniejszy moment w rozmowie z klientem</label>
          <small>Co najczęściej Cię blokuje albo czego się boisz. Bruno zacznie od tego.</small>
          <textarea id="trudnosc" name="trudnosc" maxLength={2000} />
        </div>
        <div className={s.pole}>
          <label htmlFor="pewnosc">Jak oceniasz dziś swoją pewność siebie w rozmowie z klientem? (1 = boję się, 10 = czuję się swobodnie)</label>
          <select id="pewnosc" name="pewnosc" required defaultValue="">
            <option value="" disabled>
              Wybierz
            </option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className={s.pole}>
          <label htmlFor="pora">Kiedy chcesz trenować?</label>
          <small>Bruno przypomni Ci o lekcji.</small>
          <select id="pora" name="pora" required defaultValue="">
            <option value="" disabled>
              Wybierz
            </option>
            {PORY.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className={s.pole}>
          <label htmlFor="minut">Ile minut dziennie dasz radę trenować?</label>
          <select id="minut" name="minut" required defaultValue="">
            <option value="" disabled>
              Wybierz
            </option>
            {MINUT.map((m) => (
              <option key={m} value={m}>
                {m} minut
              </option>
            ))}
          </select>
        </div>
      </Czesc>

      {blad && <p className={s.blad}>{blad}</p>}
      <button type="submit" className={s.btn} disabled={czeka}>
        {czeka ? "Wysyłam…" : "Wyślij i czekaj na dostęp"}
      </button>
      <p className={s.formPod}>Po wysłaniu zespół Bruno ustawia Twojego klienta AI i w ciągu 24 godzin dostajesz dostęp na e-mail.</p>
    </form>
  );
}
