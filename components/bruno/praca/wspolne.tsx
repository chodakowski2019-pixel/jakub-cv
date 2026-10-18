import s from "./praca.module.css";
import DodajOgloszenie from "./dodaj-ogloszenie";

// 17.10: wspólne kawałki portalu /praca (bez stanu, działają w komponentach serwera i przeglądarki).
// Rejestracja PL żyje na salesbruno.pl (na .com /rejestracja przekierowuje na angielski /signup).
export const REJESTRACJA = "https://salesbruno.pl/rejestracja?src=praca";
export const KONTAKT_FIRMY = `mailto:jakub@salesbruno.com?subject=${encodeURIComponent("Ogłoszenie na salesbruno.com/praca")}`;

// 17.10 (USER_001): oferujemy tylko to, co jest: SalesBruno.pl = trening rozmów sprzedażowych (AI gra klienta). Bez „rekrutera”.
export const SALESBRUNO = "https://salesbruno.pl/?src=praca";
export function KartaBruno() {
  return (
    <div className={s.bruno}>
      <span className={s.brunoEtykieta}>SalesBruno.pl</span>
      <h3 className={s.brunoH}>Ćwicz rozmowy sprzedażowe z AI, zanim zadzwonisz do klienta</h3>
      <p className={s.brunoP}>Bruno gra Twojego klienta, a potem mówi, co poprawić.</p>
      <a className={s.brunoBtn} href={SALESBRUNO}>3 rozmowy bezpłatnie</a>
      <span className={s.brunoMaly}>Wystarczy telefon albo komputer.</span>
    </div>
  );
}

const KORZYSCI: [string, string, string][] = [
  ["M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7Z", "Tylko sprzedaż", "Portal wyłącznie z ofertami dla handlowców"],
  ["M5 6h14v14H5ZM5 10h14M9 3v4M15 3v4", "Bez umowy", "Płacisz raz za 30 dni, bez abonamentu"],
  ["M4 6h16v12H4ZM4 7l8 6 8-6", "Zgłoszenia do Ciebie", "CV kandydata trafia prosto na Twój mail"],
];

export function KartaFirmy({ cena, id, zalogowanyPracodawca }: { cena: number; id?: string; zalogowanyPracodawca?: boolean }) {
  return (
    <div className={s.firmy} id={id}>
      <h3 className={s.firmyH}>Szukasz handlowca?</h3>
      <span className={s.promoZnaczek}>Promocja na pierwsze ogłoszenie</span>
      <p className={s.cena}>
        <s className={s.cenaStara}>200 zł</s> {cena} zł <small>/ 30 dni</small>
      </p>
      {/* 17.10 (USER_001): korzyści w tabelce, zamiast listy z ptaszkami. */}
      <dl className={s.korzysci}>
        {KORZYSCI.map(([ikona, co, opis]) => (
          <div key={co}>
            <span className={s.korzyscIkona} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d={ikona} />
              </svg>
            </span>
            <dt>{co}</dt>
            <dd>{opis}</dd>
          </div>
        ))}
      </dl>
      <DodajOgloszenie className={s.btn} zalogowanyPracodawca={zalogowanyPracodawca} />
    </div>
  );
}

export function Stopka() {
  return (
    <footer className={s.stopka}>
      <span>© 2026 SalesBruno.pl</span>
      <a href="/">salesbruno.com</a>
      <a href="/praca">Oferty pracy</a>
      <a href="/praca/regulamin">Regulamin</a>
      <a href="/praca/polityka-prywatnosci">Polityka prywatności</a>
      <a href={KONTAKT_FIRMY}>jakub@salesbruno.com</a>
    </footer>
  );
}

export function opisDni(dni: number): string {
  if (dni === 0) return "dziś";
  if (dni === 1) return "wczoraj";
  return `${dni} dni temu`;
}

export function pensja(min: number | null, max: number | null): string | null {
  const f = (n: number) => `${Math.round(n).toLocaleString("pl-PL")} zł`;
  if (min && max && min !== max) return `${f(min)} - ${f(max)}`;
  if (min || max) return f((min || max)!);
  return null;
}

/** Znak firmy zamiast logo (logo dostaniemy od firmy po aktywacji): 2 litery na kolorze liczonym z nazwy. */
const KOLORY = ["#f08a2b", "#3b6ef5", "#1f9d6b", "#9b51e0", "#e0457b", "#0f8fa8", "#c27c0e", "#5b6472"];
export function Inicjaly({ firma, duze, logo }: { firma: string; duze?: boolean; logo?: string | null }) {
  if (logo)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={`${s.inicjaly} ${s.logoObraz} ${duze ? s.inicjalyDuze : ""}`} src={logo} alt={`Logo ${firma}`} loading="lazy" />
    );
  const slowa = firma
    .replace(/sp\.?\s*z\s*o\.?\s*o\.?|spółka.*$|s\.a\.|sp\.\s*j\.|sp\.\s*k\.|\(.*?\)/gi, "")
    .split(/[\s/-]+/)
    .filter((w) => /[a-ząćęłńóśźż0-9]/i.test(w));
  const lit = (slowa.length > 1 ? slowa[0][0] + slowa[1][0] : (slowa[0] ?? "?").slice(0, 2)).toUpperCase();
  let h = 0;
  for (const c of firma) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span className={`${s.inicjaly} ${duze ? s.inicjalyDuze : ""}`} style={{ background: KOLORY[h % KOLORY.length] }} aria-hidden="true">
      {lit}
    </span>
  );
}

/** „PAN VIKING SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ” → „Pan Viking sp. z o.o.” (na kartach i w nagłówku). */
export function krotkaFirma(f: string): string {
  let x = f.replace(/\s+/g, " ").trim();
  // Same wielkie litery w nazwie → zwykły zapis (skróty do 4 liter zostają).
  const bezFormy = x.replace(/\bsp\.?\s*z\.?\s*o\.?\s*o\.?/gi, "");
  if (bezFormy === bezFormy.toUpperCase() && /[A-ZĄĆĘŁŃÓŚŹŻ]{5,}/.test(bezFormy))
    x = x.replace(/[A-ZĄĆĘŁŃÓŚŹŻ0-9]+/g, (w) => (w.length <= 4 ? w : w[0] + w.slice(1).toLowerCase()));
  return x
    .replace(/sp(ółka|\.)?\s*z\s*ogranicz\p{L}*\s*odpowiedzialno\p{L}*/giu, "sp. z o.o.")
    .replace(/spółka\s+komandytow\p{L}*/giu, "sp.k.")
    .replace(/spółka\s+akcyjn\p{L}*/giu, "S.A.")
    .replace(/\bsp\.?\s*z\.?\s*o\.?\s*o\.?/giu, "sp. z o.o.")
    .trim();
}

/**
 * 18.10 (USER_001: „opisy ładniej: pogrubione, wypunktowane”): prosty formatter opisu ogłoszenia.
 * Pusta linia = nowy akapit · linia od „-”, „•”, „*” albo „1.” = punkt listy · linia kończąca się „:” albo cała w **…** = pogrubiony nagłówek
 * · **tekst** w zdaniu = pogrubienie. Pierwszy akapit opisu firmy z panelu jest pogrubiony (jak lead).
 */
function pogrub(t: string): React.ReactNode[] {
  return t.split(/(\*\*[^*]+\*\*)/g).map((x, i) => (x.startsWith("**") && x.endsWith("**") ? <b key={i}>{x.slice(2, -2)}</b> : x));
}
export function Tekst({ tekst, lead }: { tekst: string; lead?: boolean }) {
  const bloki: React.ReactNode[] = [];
  let lista: string[] = [];
  let akapit: string[] = [];
  const zamknij = () => {
    if (akapit.length) {
      const t = akapit.join(" ");
      bloki.push(<p key={bloki.length} className={lead && bloki.length === 0 ? s.tekstLead : undefined}>{pogrub(t)}</p>);
      akapit = [];
    }
    if (lista.length) {
      bloki.push(
        <ul key={bloki.length}>
          {lista.map((x, i) => (
            <li key={i}>{pogrub(x)}</li>
          ))}
        </ul>,
      );
      lista = [];
    }
  };
  for (const surowa of tekst.replace(/\r/g, "").split("\n")) {
    const l = surowa.trim();
    if (!l) {
      zamknij();
      continue;
    }
    const punkt = l.match(/^(?:[-•*–]|\d+[.)])\s+(.*)$/);
    if (punkt) {
      if (akapit.length) {
        bloki.push(<p key={bloki.length} className={lead && bloki.length === 0 ? s.tekstLead : undefined}>{pogrub(akapit.join(" "))}</p>);
        akapit = [];
      }
      lista.push(punkt[1]);
      continue;
    }
    if ((/:$/.test(l) && l.length < 80) || /^\*\*[^*]+\*\*$/.test(l)) {
      zamknij();
      bloki.push(<h3 key={bloki.length}>{l.replace(/^\*\*|\*\*$/g, "")}</h3>);
      continue;
    }
    if (lista.length) zamknij();
    akapit.push(l);
  }
  zamknij();
  return <div className={s.tekst}>{bloki}</div>;
}
