"use client";

import { useState } from "react";
import s from "./praca.module.css";

// 17.10 (USER_001): firma wchodzi z linku w mailu (/praca/<id>?k=<token>) i widzi swoje NIEAKTYWNE ogłoszenie.
// Aktywuj = 50 zł/mc (na razie zgłoszenie do USER_001, płatność Stripe do podpięcia). Usuń = usuwamy, koniec kontaktu.
type Okno = null | "aktywuj" | "usun";

export default function PasekFirmy({ id, k, firma, cena }: { id: string; k: string; firma: string; cena: number }) {
  const [okno, setOkno] = useState<Okno>(null);
  const [wysylam, setWysylam] = useState(false);
  const [wynik, setWynik] = useState<null | "aktywowano" | "usunieto">(null);
  const [blad, setBlad] = useState("");
  const otworz = (o: Okno) => {
    setBlad("");
    setOkno(o);
  };

  async function wyslij(akcja: "aktywuj" | "usun", dane: Record<string, unknown> = {}) {
    setBlad("");
    setWysylam(true);
    const odp = await fetch("/api/bruno/praca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, k, akcja, ...dane }),
    }).catch(() => null);
    const j = await odp?.json().catch(() => null);
    setWysylam(false);
    if (!odp?.ok || !j?.ok) {
      setBlad(j?.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
      return;
    }
    setOkno(null);
    setWynik(akcja === "aktywuj" ? "aktywowano" : "usunieto");
  }

  if (wynik === "usunieto") {
    return (
      <div className={s.wlasciciel}>
        <div className={s.wlascicielKarta}>
          <div>
            <h2 className={s.wlascicielH}>Gotowe. Usuwamy ogłoszenie</h2>
            <p className={s.wlascicielP}>Zniknie w ciągu 24 godzin. Nie będziemy więcej pisać w tej sprawie.</p>
          </div>
        </div>
      </div>
    );
  }
  if (wynik === "aktywowano") {
    return (
      <div className={s.wlasciciel}>
        <div className={s.wlascicielKarta}>
          <div>
            <span className={s.status}>
              <i className={s.live} /> Przyjęte
            </span>
            <h2 className={s.wlascicielH}>Dziękujemy! Link do płatności {cena} zł wyślemy na maila</h2>
            <p className={s.wlascicielP}>Po płatności ogłoszenie od razu staje się widoczne dla handlowców.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.wlasciciel}>
      <div className={s.wlascicielKarta}>
        <div>
          <span className={s.status}>
            <i className={s.statusKropka} /> Nieprzejęte przez firmę
          </span>
          <h2 className={s.wlascicielH}>To ogłoszenie {firma}</h2>
          <p className={s.wlascicielP}>
            Ogłoszenie już widzą handlowcy z całej Polski. Przejmij je: Twoje logo i opis, zgłoszenia z CV prosto na Twój mail.
          </p>
        </div>
        <div className={s.wlascicielAkcje}>
          <button type="button" className={s.btn} onClick={() => otworz("aktywuj")}>
            Przejmij za {cena} zł <s className={s.cenaStaraJasna}>200 zł</s>
          </button>
          <button type="button" className={s.usun} onClick={() => otworz("usun")}>
            Nie chcę, usuń ogłoszenie
          </button>
        </div>
      </div>

      {okno === "aktywuj" && (
        <div className={s.tlo} onClick={(e) => e.target === e.currentTarget && setOkno(null)}>
          <form
            className={s.okno}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              // 18.10: przejęcie = płatność Stripe (subskrypcja 50 zł / mies.), powiadomienie USER_001 idzie z webhooka.
              void (async () => {
                setBlad("");
                setWysylam(true);
                const odp = await fetch("/api/bruno/praca/platnosc", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id, k, email: f.get("email"), aplikuj: f.get("aplikuj"), nip: f.get("nip") }),
                }).catch(() => null);
                const j = await odp?.json().catch(() => null);
                if (j?.url) location.href = j.url;
                else {
                  setWysylam(false);
                  setBlad(j?.blad ?? "Nie udało się otworzyć płatności.");
                }
              })();
            }}
          >
            <h2 className={s.oknoH}>Przejmij ogłoszenie</h2>
            <p className={s.oknoP}>
              Promocja na pierwsze ogłoszenie: {cena} zł zamiast 200 zł za 30 dni publikacji. Płatność jednorazowa: karta, BLIK albo przelew.
            </p>
            <label className={s.pole}>
              <span>E-mail do faktury <i className={s.gw}>*</i></span>
              <input name="email" type="email" required autoComplete="email" placeholder="rekrutacja@firma.pl" />
            </label>
            <label className={s.pole}>
              <span>Gdzie kandydaci mają aplikować? (e-mail albo link) <i className={s.gw}>*</i></span>
              <input name="aplikuj" required placeholder="praca@firma.pl" />
            </label>
            <label className={s.pole}>
              <span>NIP (do faktury, nieobowiązkowe)</span>
              <input name="nip" inputMode="numeric" placeholder="1234567890" />
            </label>
            {blad && <p className={s.blad}>{blad}</p>}
            <div className={s.oknoAkcje}>
              <button type="button" className={`${s.btn} ${s.btnJasny}`} onClick={() => setOkno(null)}>
                Wróć
              </button>
              <button type="submit" className={s.btn} disabled={wysylam}>
                {wysylam ? "Otwieram płatność…" : `Przejdź do płatności (${cena} zł)`}
              </button>
            </div>
          </form>
        </div>
      )}

      {okno === "usun" && (
        <div className={s.tlo} onClick={(e) => e.target === e.currentTarget && setOkno(null)}>
          <div className={s.okno}>
            <h2 className={s.oknoH}>Usunąć ogłoszenie?</h2>
            <p className={s.oknoP}>Usuniemy je w ciągu 24 godzin i nie będziemy więcej pisać w tej sprawie.</p>
            {blad && <p className={s.blad}>{blad}</p>}
            <div className={s.oknoAkcje}>
              <button type="button" className={`${s.btn} ${s.btnJasny}`} onClick={() => setOkno(null)}>
                Zostaw
              </button>
              <button type="button" className={s.btn} disabled={wysylam} onClick={() => wyslij("usun")}>
                {wysylam ? "Usuwam…" : "Usuń"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
