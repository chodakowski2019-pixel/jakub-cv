import Link from "next/link";
import KulaLimonka from "@/components/bruno/kula-limonka";
import type { FirmaZKontaktem, MojProfil } from "@/lib/bruno/praca/handlowcy";
import { DNI_WERYFIKACJI } from "@/lib/bruno/praca/profil-handlowca";
import g from "./gielda.module.css";

// 11.11 (USER_001): widoki panelu giełdy handlowców w stylu panelu Bruno AI (karty p-*, ekran startowy z kulą bcz-*).
// Start = ten sam układ co Czat w Bruno: kula, „Cześć …!”, pigułki z licznikami; zamiast pola czatu kafle ze stanem.

const data = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });
const FORMULARZ = "/praca/dolacz/profil";

export type Pigulka = { tekst: string; licznik?: string | number; href: string; alarm?: boolean };
export type Kafel = { etykieta: string; wartosc: string | number; dol: string; href: string };

export function StartGieldy({ imie, pytanie, pigulki, kafle }: { imie: string; pytanie: string; pigulki: Pigulka[]; kafle: Kafel[] }) {
  return (
    <div className={`bcz bcz-start ${g.start}`}>
      <div className="bcz-kula-wrap" aria-hidden>
        <div className="bcz-kula"><KulaLimonka tempo="czeka" /></div>
      </div>
      <div className="bcz-powitanie">
        <h1 className="bcz-hej">
          Cześć {imie}! <span className="bcz-hej-2">{pytanie}</span>
        </h1>
        <div className="bcz-pigulki">
          {pigulki.map((x) => (
            <Link key={x.tekst} href={x.href} className={`bcz-pigulka ${g.pigulka} ${x.alarm ? "bcz-pigulka-alarm" : ""}`}>
              {x.tekst}
              {x.licznik != null && <em>{x.licznik}</em>}
            </Link>
          ))}
        </div>
      </div>
      <div className={`p-kafle ${g.kafle}`}>
        {kafle.map((k) => (
          <Link key={k.etykieta} href={k.href} className={`p-kafel ${g.kafelLink}`}>
            <span className="p-kafel-et">{k.etykieta}</span>
            <span className="p-kafel-wart">{k.wartosc}</span>
            <span className="p-kafel-dol">{k.dol}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const STATUS: Record<MojProfil["status"], { nazwa: string; chip: string; opis: string }> = {
  weryfikacja: { nazwa: "W weryfikacji", chip: "p-chip-uwaga", opis: `Sprawdzamy informacje z formularza. Trwa do ${DNI_WERYFIKACJI} dni, wynik przyjdzie na e-mail.` },
  zatwierdzony: { nazwa: "Sprawdzony profil", chip: "p-chip-ok", opis: "Twój profil widzą firmy, które szukają handlowców." },
  odrzucony: { nazwa: "Do poprawy", chip: "p-chip-zle", opis: "Profil wymaga uzupełnienia. Szczegóły wysłaliśmy na e-mail." },
};

/** Zakładka „Mój profil”: stan weryfikacji, 4 kroki i to, co firma widzi na karcie. */
export function MojProfilWidok({ profil, firm }: { profil: MojProfil | null; firm: number }) {
  if (!profil) {
    return (
      <div className="p-strona">
        <div className="p-naglowek"><h1>Mój profil</h1></div>
        <div className="p-karta p-karta-p">
          <p className="p-pusto">Nie masz jeszcze profilu w bazie handlowców. Formularz ma 5 krótkich kroków i zajmuje około 5 minut.</p>
          <p style={{ textAlign: "center", paddingBottom: 14 }}>
            <a className="p-btn p-btn-3" href={FORMULARZ}>Wypełnij profil</a>
          </p>
        </div>
      </div>
    );
  }
  const st = STATUS[profil.status];
  const k = profil.karta;
  const etap = profil.status === "zatwierdzony" ? (firm > 0 ? 4 : 3) : 2;
  const kroki = ["Konto założone", "Profil wypełniony", "Weryfikacja profilu", "Firmy piszą do Ciebie"];
  const dane: [string, string][] = [
    ["Stanowisko", k.stanowisko],
    ["Miasto", k.miasto],
    ["W sprzedaży", k.lata],
    ["Sytuacja", k.sytuacja],
    ["Sprzedaje", k.rynek],
    ["Plan w ostatnim roku", k.plan],
    ["Średnia wartość sprzedaży", k.transakcja],
    ["Oczekiwana podstawa", k.pensja ? `${k.pensja.toLocaleString("pl-PL")} zł netto` : ""],
    ["Może zacząć", k.start],
    ["Tryb pracy", k.tryb.join(", ")],
    ["Umowa", k.umowa.join(", ")],
    ["Jak sprzedaje", k.kanaly.join(", ")],
  ];
  return (
    <div className="p-strona">
      <div className="p-naglowek">
        <div>
          <h1>{k.imie}</h1>
          <span className={`p-chip ${st.chip}`} style={{ marginTop: 10 }}>{st.nazwa}</span>
        </div>
        <div className="p-naglowek-prawo">
          <a className="p-btn p-btn-2" href={FORMULARZ}>Edytuj profil</a>
        </div>
      </div>

      <div className="p-karta p-karta-p">
        <p style={{ fontSize: 14, color: "var(--p-ink-2)", marginBottom: 16 }}>
          {st.opis} Wysłano {data(profil.wyslano)}.
        </p>
        <ol className={g.kroki}>
          {kroki.map((nazwa, i) => (
            <li key={nazwa} className={`${g.krok} ${i < etap ? g.krokOk : i === etap ? g.krokTeraz : ""}`}>
              <i>{i < etap ? "✓" : i + 1}</i>
              {nazwa}
            </li>
          ))}
        </ol>
      </div>

      <div className="p-karta">
        <div className="p-karta-hd">
          <h3>To widzi firma</h3>
          <span className="p-karta-hd-meta">Telefon, e-mail i CV dopiero po odblokowaniu kontaktu</span>
        </div>
        <div className="p-karta-p">
          <dl className={g.dane}>
            {dane.filter(([, v]) => v).map(([et, v]) => (
              <div key={et}>
                <dt>{et}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className={g.chipy} style={{ marginTop: 18 }}>
            {k.branze.map((x) => (
              <span key={x} className="p-chip">{x}</span>
            ))}
            {k.mocne.map((x) => (
              <span key={x} className="p-chip p-chip-lim">{x}</span>
            ))}
          </div>
        </div>
      </div>

      {profil.sukces && (
        <div className="p-karta">
          <div className="p-karta-hd">
            <h3>Największy wynik</h3>
            <span className="p-karta-hd-meta">Widoczny po odblokowaniu kontaktu</span>
          </div>
          <p className="p-karta-p" style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-line" }}>{profil.sukces}</p>
        </div>
      )}
    </div>
  );
}

/** Zakładka „Firmy”: kto odblokował kontakt do handlowca. */
export function FirmyWidok({ firmy, sprawdzony }: { firmy: FirmaZKontaktem[]; sprawdzony: boolean }) {
  return (
    <div className="p-strona">
      <div className="p-naglowek">
        <div>
          <h1>Firmy</h1>
          <span className="p-chip" style={{ marginTop: 10 }}>Mają Twój kontakt: {firmy.length}</span>
        </div>
      </div>
      <div className="p-karta">
        {firmy.length === 0 ? (
          <p className="p-pusto">{sprawdzony ? "Żadna firma nie odblokowała jeszcze Twojego kontaktu. Gdy to zrobi, zobaczysz ją tutaj." : "Firmy zobaczą Twój profil po weryfikacji. Te, które odblokują kontakt, pojawią się tutaj."}</p>
        ) : (
          <ul className={g.lista}>
            {firmy.map((f, i) => (
              <li key={i} className={g.wiersz}>
                {f.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={g.logo} src={f.logo} alt="" />
                ) : (
                  <span className="p-inicjal" style={{ width: 36, height: 36 }}>{f.nazwa[0]?.toUpperCase()}</span>
                )}
                <div>
                  <b>{f.nazwa}</b>
                  {f.www && <small>{f.www.replace(/^https?:\/\//, "")}</small>}
                </div>
                <span>Odblokowała kontakt {data(f.kiedy)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
