import Link from "next/link";
import KulaLimonka from "@/components/bruno/kula-limonka";
import type { FirmaZKontaktem, MojProfil } from "@/lib/bruno/praca/handlowcy";
import { DNI_WERYFIKACJI } from "@/lib/bruno/praca/profil-handlowca";
import { znaczkiRynku } from "@/lib/bruno/praca/kontakty-cennik";
import g from "./gielda.module.css";

// 11.11 (USER_001): widoki panelu giełdy handlowców w stylu panelu Bruno AI (karty p-*, ekran startowy z kulą bcz-*).
// Start = ten sam układ co Czat w Bruno: kula, „Cześć …!”, pigułki z licznikami; zamiast pola czatu kafle ze stanem.

const data = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });

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

const Znaczek = () => (
  <svg viewBox="0 0 20 20" width={16} height={16} aria-hidden="true">
    <path d="M10 1.5l2.3 1.6 2.8-.2 1 2.6 2.3 1.6-.8 2.7.8 2.7-2.3 1.6-1 2.6-2.8-.2L10 18.5l-2.3-1.6-2.8.2-1-2.6-2.3-1.6.8-2.7-.8-2.7 2.3-1.6 1-2.6 2.8.2z" fill="#2f7a4b" />
    <path d="M6.6 10.2l2.3 2.3 4.5-4.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 11.11 (USER_001: „dodajmy emoji przy każdym z tych”): znaczek przed etykietą wiersza w tabelkach profilu.
const EMOJI: Record<string, string> = {
  Stanowisko: "💼",
  "W sprzedaży": "⏳",
  Sytuacja: "🧭",
  Sprzedaje: "🤝",
  "Jak sprzedaje": "📞",
  Branże: "🏭",
  "Mocne strony": "💪",
  "Plan w ostatnim roku": "🎯",
  "Średnia wartość sprzedaży": "💰",
  "Największy wynik": "🏆",
  Miasto: "📍",
  "Zmiana miasta": "🧳",
  "Tryb pracy": "🏠",
  Umowa: "📝",
  "Podstawa miesięcznie": "💵",
  "Może zacząć": "🚀",
  Telefon: "📱",
  "E-mail": "✉️",
  CV: "📄",
  LinkedIn: "🔗",
  Strona: "🌐",
  Facebook: "👥",
  Instagram: "📸",
};

/** Tabelka etykieta | wartość (USER_001 11.11: dane profilu „bardziej w tabelkach”). Puste wiersze odpadają. */
function Tabela({ wiersze }: { wiersze: [string, React.ReactNode][] }) {
  return (
    <table className={g.tabela}>
      <tbody>
        {wiersze.filter(([, v]) => v !== "" && v != null && v !== false).map(([et, v]) => (
          <tr key={et}>
            <th scope="row">
              {EMOJI[et] && <span className={g.emoji} aria-hidden="true">{EMOJI[et]}</span>}
              {et}
            </th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const Chipy = ({ lista, lim }: { lista: string[]; lim?: boolean }) =>
  lista.length ? (
    <span className={g.chipy}>
      {lista.map((x) => (
        <span key={x} className={`p-chip ${lim ? "p-chip-lim" : ""}`}>{x}</span>
      ))}
    </span>
  ) : null;

/** Zakładka „Mój profil” (USER_001 11.11): profil tak, jak pokazuje się pracodawcy. Po lewej karta jak na LP /praca
 * (zdjęcie, „Sprawdzony profil”, mocne strony, plan), po prawej wersja rozwinięta. Edycja jest w osobnej zakładce. */
export function MojProfilWidok({
  profil,
  email,
  cvNazwa,
  cvLink,
  firm,
  admin,
}: {
  profil: MojProfil | null;
  email: string;
  cvNazwa: string | null;
  /** Link do pobrania CV (tylko widok administratora). */
  cvLink?: string | null;
  firm: number;
  /** 11.11: ten sam widok u administratora giełdy: zamiast „Edytuj profil” powrót do listy, nad profilem jego własna treść (odhaczenie weryfikacji). */
  admin?: { gora: React.ReactNode };
}) {
  if (!profil) {
    return (
      <div className="p-strona">
        <div className="p-naglowek"><h1>Mój profil</h1></div>
        <div className="p-karta p-karta-p">
          <p className="p-pusto">Nie masz jeszcze profilu w bazie handlowców. Uzupełnij go, a firmy zobaczą Cię po weryfikacji.</p>
          <p style={{ textAlign: "center", paddingBottom: 14 }}>
            <Link className="p-btn p-btn-3" href="/praca/panel?z=edycja">Uzupełnij profil</Link>
          </p>
        </div>
      </div>
    );
  }
  const st = STATUS[profil.status];
  const k = profil.karta;
  return (
    <div className="p-strona">
      <div className="p-naglowek">
        <div>
          {admin && <Link className="p-wstecz" href="/praca/panel">← Handlowcy</Link>}
          <h1>{admin ? k.imie : "Mój profil"}</h1>
          <p className={g.podtytul}>{admin ? "Tak widzi go firma, która odblokowała kontakt." : "Tak widzi Cię firma, która odblokowała Twój kontakt."}</p>
        </div>
        <div className="p-naglowek-prawo">
          <span className="p-chip">Firmy z kontaktem: {firm}</span>
          {!admin && <Link className="p-btn p-btn-2" href="/praca/panel?z=edycja">Edytuj profil</Link>}
        </div>
      </div>
      {admin?.gora}

      <div className={g.profil}>
        {/* Karta jak na LP: to firma widzi w wynikach wyszukiwania (bez nazwiska i zdjęcia, dopóki nie odblokuje kontaktu). */}
        <article className={g.pk}>
          <div className={g.pkFoto}>
            {profil.zdjecie ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profil.zdjecie} alt="" />
            ) : (
              <span aria-hidden="true">{k.imie[0]?.toUpperCase()}</span>
            )}
            <i />
          </div>
          <div className={g.pkTresc}>
            <h2>{k.imie}</h2>
            {profil.status === "zatwierdzony" ? (
              <p className={g.pkOk}><Znaczek /> Sprawdzony profil</p>
            ) : (
              <p className={`${g.pkOk} ${g.pkCzeka}`}>{st.nazwa}</p>
            )}
            <p className={g.pkRola}>{[k.stanowisko, k.miasto].filter(Boolean).join(" · ")}</p>
            <span className={g.pkEtykieta}>Mocne strony</span>
            <ul className={g.pkChipy}>
              {k.mocne.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            {/* 11.11 (USER_001): na karcie oczekiwane wynagrodzenie zamiast planu (plan jest w tabelce „Wyniki”). */}
            <span className={g.pkEtykieta}>Oczekiwane wynagrodzenie</span>
            <p className={g.pkWynik}>{k.pensja ? `${k.pensja.toLocaleString("pl-PL").replace(/\u00a0/g, " ")} zł netto` : "Do ustalenia"}</p>
          </div>
        </article>

        <div className={g.profilPrawa}>
          {profil.opis && (
            <div className="p-karta">
              <div className="p-karta-hd"><h3>O mnie</h3></div>
              <p className={`p-karta-p ${g.tekst}`}>{profil.opis}</p>
            </div>
          )}
          <div className="p-karta">
            <div className="p-karta-hd"><h3>Doświadczenie</h3></div>
            <Tabela
              wiersze={[
                ["Stanowisko", k.stanowisko],
                ["W sprzedaży", k.lata],
                ["Sytuacja", k.sytuacja],
                ["Sprzedaje", <Chipy key="r" lista={znaczkiRynku(k.rynek)} />],
                ["Jak sprzedaje", k.kanaly.join(", ")],
                ["Branże", <Chipy key="b" lista={k.branze} />],
                ["Mocne strony", <Chipy key="m" lista={k.mocne} lim />],
              ]}
            />
          </div>
          <div className="p-karta">
            <div className="p-karta-hd"><h3>Wyniki</h3></div>
            <Tabela
              wiersze={[
                ["Plan w ostatnim roku", k.plan],
                ["Średnia wartość sprzedaży", k.transakcja],
                ["Największy wynik", profil.sukces && <span className={g.tekst}>{profil.sukces}</span>],
              ]}
            />
          </div>
          <div className="p-karta">
            <div className="p-karta-hd"><h3>Oczekiwania</h3></div>
            <Tabela
              wiersze={[
                ["Miasto", k.miasto],
                ["Zmiana miasta", k.przeprowadzka && (k.przeprowadzka === "Tak" ? "Tak, bierze pod uwagę" : "Nie")],
                ["Tryb pracy", k.tryb.join(", ")],
                ["Umowa", k.umowa.join(", ")],
                ["Podstawa miesięcznie", k.pensja ? `${k.pensja.toLocaleString("pl-PL")} zł netto` : ""],
                ["Może zacząć", k.start],
              ]}
            />
          </div>
          <div className="p-karta">
            <div className="p-karta-hd"><h3>Kontakt</h3></div>
            <Tabela
              wiersze={[
                ["Telefon", profil.telefon],
                ["E-mail", email],
                ["CV", cvNazwa && cvLink ? <a key="cv" href={cvLink} target="_blank" rel="noreferrer">{cvNazwa}</a> : cvNazwa ?? ""],
                ...profil.linki.map(([nazwa, adres]): [string, React.ReactNode] => [nazwa, <a key={nazwa} href={adres} target="_blank" rel="noreferrer">{adres.replace(/^https?:\/\/(www\.)?/, "")}</a>]),
              ]}
            />
          </div>
          <p className={g.stopka}>Zaktualizowano {data(profil.wyslano)}.</p>
        </div>
      </div>
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
