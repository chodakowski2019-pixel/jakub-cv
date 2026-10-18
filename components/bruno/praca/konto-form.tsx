"use client";

import { useState } from "react";
import s from "./praca.module.css";

// 17.10 (USER_001): logowanie / rejestracja w portalu /praca, osobno kandydat i pracodawca.
// Używane na stronie /praca/konto i w oknie po kliknięciu „Dodaj ogłoszenie”. Po sukcesie → panel.
type Typ = "kandydat" | "pracodawca";
type Tryb = "logowanie" | "rejestracja";

export default function KontoForm({ typ: typStart = "kandydat", tryb: trybStart = "rejestracja", dalej, jedenTyp }: { typ?: Typ; tryb?: Tryb; dalej?: string; jedenTyp?: boolean }) {
  const [typ, setTyp] = useState<Typ>(typStart);
  const [tryb, setTryb] = useState<Tryb>(trybStart);
  const [stan, setStan] = useState<"" | "wysylam">("");
  const [blad, setBlad] = useState("");
  const [pokazHaslo, setPokazHaslo] = useState(false);
  const rej = tryb === "rejestracja";

  async function wyslij(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBlad("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setStan("wysylam");
    const odp = await fetch(`/api/bruno/praca/konto/${rej ? "rejestracja" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, typ, zgoda: f.zgoda === "on" }),
    }).catch(() => null);
    const j = await odp?.json().catch(() => null);
    if (!odp?.ok || !j?.ok) {
      setBlad(j?.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
      setStan("");
      if (odp?.status === 409) setTryb("logowanie");
      return;
    }
    window.location.href = dalej ?? j.panel ?? "/praca/panel";
  }

  return (
    <form className={s.kontoForm} onSubmit={wyslij}>
      {!jedenTyp && (
        <div className={s.przelacznikTypu} role="tablist" aria-label="Rodzaj konta">
          {(["kandydat", "pracodawca"] as Typ[]).map((t) => (
            <button type="button" role="tab" aria-selected={typ === t} key={t} className={typ === t ? s.typOn : ""} onClick={() => setTyp(t)}>
              {t === "kandydat" ? "Kandydat" : "Pracodawca"}
            </button>
          ))}
        </div>
      )}
      <h2 className={s.kontoH}>{rej ? (typ === "pracodawca" ? "Załóż konto firmy" : "Załóż konto") : typ === "pracodawca" ? "Zaloguj się jako pracodawca" : "Zaloguj się"}</h2>
      <p className={s.kontoP}>
        {rej
          ? typ === "pracodawca"
            ? "Dodawaj ogłoszenia i przeglądaj kandydatów w jednym miejscu."
            : "Zapisuj oferty, aplikuj jednym kliknięciem i śledź swoje zgłoszenia."
          : "Wpisz e-mail i hasło do swojego konta."}
      </p>

      <input name="www" tabIndex={-1} autoComplete="off" className={s.pulapka} aria-hidden="true" />
      {rej && (
        <div className={s.polaSiatka}>
          <label className={s.pole}>
            <span>Imię <i className={s.gw}>*</i></span>
            <input name="imie" required autoComplete="given-name" placeholder="Anna" />
          </label>
          <label className={s.pole}>
            <span>
              Telefon <em className={s.opcjonalne}>nieobowiązkowe</em>
            </span>
            <input name="telefon" type="tel" autoComplete="tel" placeholder="500 600 700" />
          </label>
        </div>
      )}
      {rej && typ === "pracodawca" && (
        <div className={s.polaSiatka}>
          <label className={s.pole}>
            <span>Nazwa firmy <i className={s.gw}>*</i></span>
            <input name="firma" required autoComplete="organization" placeholder="np. Solar Polska" />
          </label>
          <label className={s.pole}>
            <span>
              NIP <em className={s.opcjonalne}>nieobowiązkowe</em>
            </span>
            <input name="nip" inputMode="numeric" placeholder="1234567890" />
          </label>
        </div>
      )}
      <label className={s.pole}>
        <span>E-mail <i className={s.gw}>*</i></span>
        <input name="email" type="email" required autoComplete="email" placeholder={typ === "pracodawca" ? "rekrutacja@firma.pl" : "anna@gmail.com"} />
      </label>
      <label className={s.pole}>
        <span>Hasło <i className={s.gw}>*</i></span>
        <span className={s.hasloPole}>
          <input name="haslo" type={pokazHaslo ? "text" : "password"} required minLength={rej ? 8 : 6} autoComplete={rej ? "new-password" : "current-password"} placeholder={rej ? "Co najmniej 8 znaków" : ""} />
          <button type="button" onClick={() => setPokazHaslo(!pokazHaslo)}>
            {pokazHaslo ? "Ukryj" : "Pokaż"}
          </button>
        </span>
      </label>
      {rej && (
        <label className={s.zgodaKarta}>
          <input type="checkbox" name="zgoda" required />
          <span>
            Akceptuję <a href="/praca/regulamin" target="_blank">regulamin</a> i <a href="/praca/polityka-prywatnosci" target="_blank">politykę prywatności</a> SalesBruno.pl. <i className={s.gw}>*</i>
          </span>
        </label>
      )}
      {blad && <p className={s.blad}>{blad}</p>}
      <button type="submit" className={`${s.btn} ${s.btnDuzy} ${s.wyslijBtn}`} disabled={stan === "wysylam"}>
        {stan === "wysylam" ? "Chwileczkę…" : rej ? "Załóż konto" : "Zaloguj się"}
      </button>
      <p className={s.kontoZmiana}>
        {rej ? "Masz już konto?" : "Nie masz konta?"}{" "}
        <button
          type="button"
          onClick={() => {
            setBlad("");
            setTryb(rej ? "logowanie" : "rejestracja");
          }}
        >
          {rej ? "Zaloguj się" : "Załóż konto"}
        </button>
      </p>
    </form>
  );
}
