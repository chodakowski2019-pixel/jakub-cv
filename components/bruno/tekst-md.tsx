import type { ReactNode } from "react";

// 5.11 (USER_001, pkt 2: „gwiazdki się pokazują, punktowanie, pogrubienia”): mały renderer tekstu Bruno.
// Obsługuje: **pogrubienie**, `kod`, listy „- ” / „• ” / „1. ”, nagłówki „# ” (jako pogrubiona linia), akapity.
// Bez zależności (react-markdown nie ma w projekcie). Wszystko inne idzie jako zwykły tekst.

function wiersz(s: string, klucz: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|__[^_]+__)/g;
  let i = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push(s.slice(i, m.index));
    const t = m[0];
    if (t.startsWith("`")) out.push(<code key={`${klucz}c${n++}`}>{t.slice(1, -1)}</code>);
    else out.push(<b key={`${klucz}b${n++}`}>{t.slice(2, -2)}</b>);
    i = m.index + t.length;
  }
  if (i < s.length) out.push(s.slice(i));
  // Samotne gwiazdki (np. „*uwaga*”) → bez gwiazdek.
  return out.map((x) => (typeof x === "string" ? x.replace(/(^|\s)\*([^*\s][^*]*?)\*(?=\s|$|[.,;:!?])/g, "$1$2") : x));
}

export default function TekstMd({ tekst, className = "" }: { tekst: string; className?: string }) {
  const linie = tekst.replace(/\r/g, "").split("\n");
  const bloki: ReactNode[] = [];
  let lista: { typ: "ul" | "ol"; el: string[] } | null = null;
  let akapit: string[] = [];
  const zamknijAkapit = () => {
    if (akapit.length) bloki.push(<p key={`p${bloki.length}`}>{akapit.map((l, i) => (i ? [<br key={`br${i}`} />, ...wiersz(l, `p${bloki.length}-${i}`)] : wiersz(l, `p${bloki.length}-${i}`)))}</p>);
    akapit = [];
  };
  const zamknijListe = () => {
    if (!lista) return;
    const L = lista.typ;
    bloki.push(<L key={`l${bloki.length}`}>{lista.el.map((e, i) => <li key={i}>{wiersz(e, `l${bloki.length}-${i}`)}</li>)}</L>);
    lista = null;
  };
  for (const raw of linie) {
    const l = raw.trim();
    const ul = /^([-•*–]|•)\s+(.*)$/.exec(l);
    const ol = /^(\d+)[.)]\s+(.*)$/.exec(l);
    const h = /^#{1,4}\s+(.*)$/.exec(l);
    if (!l) { zamknijAkapit(); zamknijListe(); continue; }
    if (ul || ol) {
      zamknijAkapit();
      const typ = ol ? "ol" : "ul";
      if (lista && lista.typ !== typ) zamknijListe();
      if (!lista) lista = { typ, el: [] };
      lista.el.push((ul ? ul[2] : ol![2]).trim());
      continue;
    }
    zamknijListe();
    if (h) { zamknijAkapit(); bloki.push(<p key={`h${bloki.length}`} className="bmd-h">{wiersz(h[1], `h${bloki.length}`)}</p>); continue; }
    akapit.push(l);
  }
  zamknijAkapit();
  zamknijListe();
  return <div className={`bmd ${className}`}>{bloki}</div>;
}
