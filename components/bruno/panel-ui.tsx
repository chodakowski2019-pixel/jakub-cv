import Link from "next/link";
import Licz from "@/components/podglad/panel/licz";

// 6.11 (USER_001: „każda zakładka nowoczesna i czytelna”): WSPÓLNE KLOCKI zakładek panelu (klasy p-* z panel-2.css).
// Nagłówek strony, kafelek z liczbą, twarz / inicjał, pigułka, miernik, pusty stan, błąd. Używają ich:
// Klienci, Lejek, Statystyki zespołu, Raport, Kalendarz. Jedna paleta, jedna karta, jedna tabela.

export function Twarz({ src, imie, rozmiar = 36, klasa = "" }: { src?: string | null; imie: string; rozmiar?: number; klasa?: string }) {
  const k = rozmiar >= 48 ? "p-twarz" : rozmiar >= 32 ? "p-twarz-s" : "p-twarz-xs";
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img src={src} alt="" className={`${k} ${klasa}`} style={{ width: rozmiar, height: rozmiar }} />;
  return (
    <span className={`p-inicjal ${klasa}`} style={{ width: rozmiar, height: rozmiar, fontSize: Math.round(rozmiar * 0.38) }} aria-hidden>
      {imie.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

export function NaglowekP({ tytul, akcent, podtytul, obraz, imie, prawo, wstecz }: { tytul: string; akcent?: string | null; podtytul?: string | null; obraz?: string | null; imie?: string; prawo?: React.ReactNode; wstecz?: { href: string; tekst: string } }) {
  return (
    <div>
      {wstecz && (
        <Link href={wstecz.href} className="p-wstecz">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10 3L5 8l5 5" /></svg>
          {wstecz.tekst}
        </Link>
      )}
      <header className="p-naglowek">
        <div className="p-naglowek-lewo">
          {(obraz || imie) && <Twarz src={obraz} imie={imie ?? tytul} rozmiar={56} />}
          <div className="min-w-0">
            <h1>
              {tytul}
              {akcent ? <> <b>{akcent}</b></> : null}
            </h1>
            {podtytul && <p>{podtytul}</p>}
          </div>
        </div>
        {prawo && <div className="p-naglowek-prawo">{prawo}</div>}
      </header>
    </div>
  );
}

export function Kafel({ wartosc, dec = 0, po = "", etykieta, dol, zle = false, kropka, opoznienie = 0 }: { wartosc: number | string | null; dec?: number; po?: string; etykieta: string; dol?: React.ReactNode; zle?: boolean; kropka?: string; opoznienie?: number }) {
  return (
    <div className={`p-kafel ${zle ? "p-kafel-zle" : ""}`}>
      <div className="p-kafel-et">
        <span>{etykieta}</span>
        {kropka && <i style={{ background: kropka }} aria-hidden />}
      </div>
      <div className="p-kafel-wart">{wartosc === null ? "–" : typeof wartosc === "number" ? <Licz do={wartosc} dec={dec} po={po} opoznienie={opoznienie} /> : wartosc}</div>
      {dol !== undefined && <div className="p-kafel-dol">{dol}</div>}
    </div>
  );
}

export function Delta({ v, dobrzeGdyRosnie = true, dec = 1, locale = "pl-PL", po = "" }: { v: number | null; dobrzeGdyRosnie?: boolean; dec?: number; locale?: string; po?: string }) {
  if (v === null) return <span className="p-delta">–</span>;
  const k = Math.abs(v) < 0.05 ? "zero" : (v > 0) === dobrzeGdyRosnie ? "ok" : "zle";
  return (
    <span className="p-delta" data-k={k}>
      {v > 0 ? "▲" : v < 0 ? "▼" : "="} {Math.abs(v).toLocaleString(locale, { minimumFractionDigits: dec, maximumFractionDigits: dec })}{po}
    </span>
  );
}

export function Chip({ k = "", children, title }: { k?: "" | "lim" | "ok" | "zle" | "uwaga" | "ciemny"; children: React.ReactNode; title?: string }) {
  return (
    <span className={`p-chip ${k ? `p-chip-${k}` : ""}`} title={title}>
      <i aria-hidden />
      {children}
    </span>
  );
}

export function Miernik({ proc, k = "", tekst }: { proc: number | null; k?: "" | "ok" | "zle" | "uwaga" | "lim"; tekst?: string }) {
  return (
    <span className="p-miernik">
      <span className="p-miernik-tor"><i data-k={k || undefined} style={{ width: `${Math.max(0, Math.min(100, proc ?? 0))}%` }} /></span>
      <b className={k === "zle" ? "p-zle-t" : ""}>{tekst ?? (proc === null ? "–" : `${proc} %`)}</b>
    </span>
  );
}

export function Pusto({ tytul, opis }: { tytul: string; opis?: string }) {
  return (
    <div className="p-pusto">
      <b>{tytul}</b>
      {opis}
    </div>
  );
}

export function Blad({ tytul, tekst }: { tytul: string; tekst: string }) {
  return (
    <section className="p-karta p-blad">
      <b>{tytul}</b>
      <span>{tekst}</span>
    </section>
  );
}

/** Pierścień 0-10 (ocena) albo 0-100 (procent): czarny, czerwony poniżej progu. Tekst w kolorze tekstu. */
export function Pierscien({ v, max = 10, prog, rozmiar = 34, tekst }: { v: number | null; max?: number; prog?: number; rozmiar?: number; tekst?: string }) {
  const r = 14;
  const obwod = 2 * Math.PI * r;
  const udzial = v === null ? 0 : Math.max(0, Math.min(1, v / max));
  const zle = v !== null && prog !== undefined && v < prog;
  return (
    <svg viewBox="0 0 34 34" width={rozmiar} height={rozmiar} className="pr-kolko" role="img" aria-label={v === null ? "–" : `${v}/${max}`}>
      <circle className="tor" cx="17" cy="17" r={r} fill="none" strokeWidth="3" />
      {v !== null && <circle className="wart" data-k={zle ? "zle" : undefined} cx="17" cy="17" r={r} fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${obwod * udzial} ${obwod}`} transform="rotate(-90 17 17)" />}
      <text x="17" y="21" textAnchor="middle">{tekst ?? (v === null ? "–" : v.toLocaleString("pl-PL", { maximumFractionDigits: 1 }))}</text>
    </svg>
  );
}
