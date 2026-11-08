import Link from "next/link";
import { Blad, Chip, Kafel, NaglowekP, Pusto, Twarz } from "@/components/bruno/panel-ui";
import type { Firma } from "@/lib/bruno/firmy";
import { locale, tDla, type Jezyk } from "@/lib/bruno/i18n";
import { formatKwota, naglowekZadania, type Aktywnosc, type Deal, type Etap, type Zdarzenie } from "@/lib/bruno/lejek";
import { zJako } from "@/lib/bruno/jako";
import { zdjecieKlienta } from "@/lib/bruno/twarze";
import { AwatarKlienta, DodajKlienta, ImportKlientow } from "@/components/bruno/klienci-akcje";
import { plecZImienia } from "@/lib/bruno/plec";

// 4.11 (USER_001, pkt 2): ZAKŁADKA KLIENCI (lista) + KARTA KLIENTA. Dane na żywo z CRM (Pipedrive).
// 6.11: nowy system zakładek (panel-2.css, p-* / pk-*): kafelki nad listą (klienci, wartość, zaległe, bez kroku),
// szukajka + przełącznik segmentowy, tabela z postępem etapu (kreski), paskiem wartości i kolorem świeżości kontaktu.
// Karta klienta: fakty, stepper etapów, akcje, 2 kolumny: historia (oś czasu) + do zrobienia.

type Osoba = { email: string; imie: string; zdjecie: string | null };

const dataKrotka = (iso: string | null | undefined, jezyk: Jezyk) => (iso ? new Date(iso).toLocaleDateString(locale(jezyk), { day: "numeric", month: "short" }) : null);
const dniTemu = (iso: string | null | undefined) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : null);

function EtapKropki({ etapy, idx, status }: { etapy: Etap[]; idx: number; status: string }) {
  return (
    <span className="pk-etapy-kropki" aria-hidden>
      {etapy.map((e, k) => <i key={e.id} className={status === "won" ? "on" : status === "lost" ? "" : k < idx ? "on" : k === idx ? "teraz" : ""} style={status === "won" ? { background: "var(--p-ok)" } : status === "lost" && k <= idx ? { background: "var(--p-zle)" } : undefined} />)}
    </span>
  );
}

/** 8.11: szanse etapów do prognozy przychodu (jak w Lejku: 10/25/40/60/80/100 %). */
const SZANSE = [10, 25, 40, 60, 80, 100];

/** 8.11 (USER_001: „ładna wizualizacja, wykres kreskowy: liczba klientów i przewidywany łączny przychód”). Serwerowy SVG. */
function WykresLinia({ punkty, etykiety, kolor, format }: { punkty: number[]; etykiety: string[]; kolor: string; format: (n: number) => string }) {
  const W = 520;
  const H = 120;
  const max = Math.max(1, ...punkty);
  const x = (i: number) => (punkty.length < 2 ? W / 2 : (i / (punkty.length - 1)) * (W - 8) + 4);
  const y = (v: number) => H - 14 - (v / max) * (H - 30);
  const linia = punkty.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const pole = `${linia} L${x(punkty.length - 1).toFixed(1)},${H - 14} L${x(0).toFixed(1)},${H - 14} Z`;
  const id = `kl2g${kolor.replace(/\W/g, "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label={punkty.map((v, i) => `${etykiety[i]}: ${format(v)}`).join(", ")} className="kl2-wykres">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={kolor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={kolor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={H - 14} y2={H - 14} stroke="#e6e7eb" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d={pole} fill={`url(#${id})`} />
      <path d={linia} fill="none" stroke={kolor} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {punkty.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === punkty.length - 1 ? 4 : 0} fill="#fff" stroke={kolor} strokeWidth="2.4" vectorEffect="non-scaling-stroke">
          <title>{`${etykiety[i]}: ${format(v)}`}</title>
        </circle>
      ))}
    </svg>
  );
}

export type ProfilKlienta = { plec: "m" | "k" | null; zdjecie: string | null };

export default function KlienciLista({ firma, jezyk, szef, etapy, deale, q, blad = null, jako = null, imie = null, profile = {}, kartaKlienta = true }: { firma: Firma | null; jezyk: Jezyk; szef: boolean; etapy: Etap[]; deale: Deal[]; osoby?: Osoba[]; q: string; status?: string; blad?: string | null; /** 4.11: szef w widoku handlowca: linki trzymają ?jako=. */ jako?: string | null; imie?: string | null; /** 8.11: płeć i zdjęcie per deal. */ profile?: Record<number, ProfilKlienta>; /** 8.11: karta klienta tylko z Pipedrive. */ kartaKlienta?: boolean }) {
  const t = tDla(jezyk);
  const szukaj = q.trim().toLowerCase();
  // 8.11 (USER_001): bez przełącznika Otwarte / Wygrane / Przegrane / Wszystkie: jedna lista, najnowsi u góry.
  const lista = deale
    .filter((d) => !szukaj || [d.tytul, d.osoba, d.organizacja, d.telefon, d.email].some((x) => (x ?? "").toLowerCase().includes(szukaj)))
    .sort((a, b) => (b.dodano ?? "").localeCompare(a.dodano ?? ""));
  const etapNazwa = (id: number) => etapy.find((e) => e.id === id)?.nazwa ?? String(id);
  const waluta = deale[0]?.waluta ?? "PLN";
  const kwota = (n: number) => formatKwota(n, waluta, jezyk);
  const akcent = imie ?? firma?.naglowek?.trim() ?? firma?.nazwa ?? "";

  // Wykresy: 12 tygodni wstecz, stan na koniec każdego tygodnia (klienci dodani do tej daty).
  const szansa = (d: Deal) => {
    if (d.status === "won") return 1;
    if (d.status === "lost") return 0;
    const i = etapy.findIndex((e) => e.id === d.etap_id);
    return (SZANSE[Math.min(Math.max(i, 0), SZANSE.length - 1)] ?? 10) / 100;
  };
  const TYG = 12;
  const teraz = Date.now();
  const konce = Array.from({ length: TYG }, (_, i) => teraz - (TYG - 1 - i) * 7 * 86_400_000);
  const aktywni = deale.filter((d) => d.status !== "lost");
  const doDaty = (ts: number) => aktywni.filter((d) => !d.dodano || new Date(d.dodano).getTime() <= ts);
  const serieKlienci = konce.map((ts) => doDaty(ts).length);
  const seriePrzychod = konce.map((ts) => Math.round(doDaty(ts).reduce((s, d) => s + d.wartosc * szansa(d), 0)));
  const etyk = konce.map((ts) => new Date(ts).toLocaleDateString(locale(jezyk), { day: "numeric", month: "short" }));
  const delta = (s: number[]) => s[s.length - 1] - s[Math.max(0, s.length - 5)];
  const dK = delta(serieKlienci);
  const dP = delta(seriePrzychod);

  return (
    <div className="p-strona">
      <NaglowekP tytul={t("Clients", "Klienci")} akcent={akcent} prawo={<span className="kl2-naglowek-akcje"><ImportKlientow jezyk={jezyk} szef={szef} /><DodajKlienta etapy={etapy.map((e) => ({ id: e.id, nazwa: e.nazwa }))} jezyk={jezyk} /></span>} />
      {blad ? (
        <Blad tytul={t("Couldn't read the CRM.", "Nie udało się odczytać CRM.")} tekst={blad} />
      ) : (
        <>
          <div className="kl2-wykresy">
            <section className="p-karta kl2-wk">
              <div className="kl2-wk-et">{t("Clients", "Liczba klientów")}</div>
              <div className="kl2-wk-w">{serieKlienci[TYG - 1]}<small className={dK > 0 ? "p-ok-t" : "p-cichy"}>{dK > 0 ? `+${dK}` : dK} {t("in 4 weeks", "w 4 tyg.")}</small></div>
              <WykresLinia punkty={serieKlienci} etykiety={etyk} kolor="#141416" format={(n) => String(n)} />
              <div className="kl2-wk-os"><span>{etyk[0]}</span><span>{t("today", "dziś")}</span></div>
            </section>
            <section className="p-karta kl2-wk">
              <div className="kl2-wk-et">{t("Expected total revenue", "Przewidywany łączny przychód")}</div>
              <div className="kl2-wk-w">{kwota(seriePrzychod[TYG - 1])}<small className={dP > 0 ? "p-ok-t" : "p-cichy"}>{dP > 0 ? `+${kwota(dP)}` : kwota(dP)} {t("in 4 weeks", "w 4 tyg.")}</small></div>
              <WykresLinia punkty={seriePrzychod} etykiety={etyk} kolor="#17a05e" format={kwota} />
              <div className="kl2-wk-os"><span>{etyk[0]}</span><span>{t("won + open × stage odds", "wygrane + otwarte × szansa etapu")}</span></div>
            </section>
          </div>
          <section className="p-karta">
            <form className="pk-pasek" method="get">
              <label className="p-szukaj">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" /></svg>
                <input type="search" name="q" defaultValue={q} placeholder={t("Search: name, company, phone, e-mail…", "Szukaj: imię, firma, telefon, e-mail…")} aria-label={t("Search", "Szukaj")} />
              </label>
              {jako && <input type="hidden" name="jako" value={jako} />}
            </form>
            <div className="p-tabela-wrap">
              <table className="p-tabela kl2-tabela">
                <thead>
                  <tr>
                    <th aria-label={t("Photo", "Zdjęcie")} />
                    <th>{t("Full name", "Imię i nazwisko")}</th>
                    <th>{t("Company", "Firma")}</th>
                    <th>{t("Phone", "Numer telefonu")}</th>
                    <th>E-mail</th>
                    <th>{t("Stage", "Etap")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.slice(0, 300).map((d, i) => {
                    const idx = etapy.findIndex((e) => e.id === d.etap_id);
                    const nazwa = d.osoba ?? d.tytul;
                    const pr = profile[d.id];
                    return (
                      <tr key={d.id} style={{ animationDelay: `${Math.min(i, 20) * 20}ms` }}>
                        <td className="kl2-td-foto"><AwatarKlienta dealId={d.id} zdjecie={pr?.zdjecie ?? null} plec={pr?.plec ?? plecZImienia(d.osoba)} imie={nazwa} jezyk={jezyk} /></td>
                        <td>{kartaKlienta ? <Link href={zJako(`/bruno/klienci/${d.id}`, jako)} className="kl2-imie">{nazwa}</Link> : <span className="kl2-imie">{nazwa}</span>}</td>
                        <td>{d.organizacja ?? <span className="p-cichy">–</span>}</td>
                        <td>{d.telefon ? <a href={`tel:${d.telefon.replace(/\s/g, "")}`} className="kl2-kontakt">{d.telefon}</a> : <span className="p-cichy">–</span>}</td>
                        <td>{d.email ? <a href={`mailto:${d.email}`} className="kl2-kontakt">{d.email}</a> : <span className="p-cichy">–</span>}</td>
                        <td>
                          <span className="pk-etap-cela">
                            <span>{d.status === "won" ? <span className="p-ok-t">{t("Won", "Wygrany")}</span> : d.status === "lost" ? <span className="p-zle-t">{t("Lost", "Przegrany")}</span> : etapNazwa(d.etap_id)}</span>
                            <EtapKropki etapy={etapy} idx={idx} status={d.status} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {lista.length === 0 && (
                    <tr>
                      <td colSpan={6}><Pusto tytul={t("No clients yet", "Brak klientów")} opis={szukaj ? t("Try another search.", "Spróbuj innej frazy.") : t("Add the first one with “+ Add client”.", "Dodaj pierwszego przyciskiem „+ Dodaj klienta”.")} /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export function KlientKarta({ firma, jezyk, szef, deal, etapy, notatki, aktywnosci, historia = [], handlowiec, linkCrm, jako = null }: { firma: Firma | null; jezyk: Jezyk; szef: boolean; deal: Deal; etapy: Etap[]; notatki: { id: number; tresc: string; kiedy: string }[]; aktywnosci: (Aktywnosc & { typNazwa: string })[]; /** 5.11 (pkt 4): jedna oś czasu z Pipedrive, wpisy Bruno oznaczone. */ historia?: Zdarzenie[]; handlowiec: Osoba | null; linkCrm: string | null; jako?: string | null }) {
  const t = tDla(jezyk);
  void firma;
  const etap = etapy.find((e) => e.id === deal.etap_id);
  const idx = etapy.findIndex((e) => e.id === deal.etap_id);
  const kwota = formatKwota(deal.wartosc, deal.waluta, jezyk);
  const dzis = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const doZrobienia = aktywnosci.filter((a) => !a.zrobione).sort((a, b) => a.data.localeCompare(b.data));
  const odBruno = historia.filter((h) => h.bruno).length;
  const dni = dniTemu(deal.ostatni_kontakt ?? deal.aktualizacja);

  // Przycisk „Trenuj rozmowę z tym klientem”: Bruno gra tę osobę, na tym etapie, z notatkami jako kontekstem.
  const sytuacja = [
    jezyk === "pl"
      ? `Zagraj klienta: ${deal.osoba ?? "osoba decyzyjna"}${deal.organizacja ? ` z firmy ${deal.organizacja}` : ""}. Deal „${deal.tytul}”, wartość ${kwota}, etap lejka: ${etap?.nazwa ?? "?"}.`
      : `Play the customer: ${deal.osoba ?? "decision maker"}${deal.organizacja ? ` from ${deal.organizacja}` : ""}. Deal “${deal.tytul}”, value ${kwota}, pipeline stage: ${etap?.nazwa ?? "?"}.`,
    notatki.length ? (jezyk === "pl" ? `Co wiemy z notatek: ${notatki.slice(0, 4).map((n) => n.tresc).join(" | ").slice(0, 900)}.` : `What we know from notes: ${notatki.slice(0, 4).map((n) => n.tresc).join(" | ").slice(0, 900)}.`) : "",
    deal.status === "lost" && deal.powod_przegranej ? (jezyk === "pl" ? `Ten deal przegraliśmy, powód: ${deal.powod_przegranej}. Zagraj ten moment jeszcze raz.` : `We lost this deal, reason: ${deal.powod_przegranej}. Replay that moment.`) : "",
    jezyk === "pl" ? "Zachowuj się jak ta konkretna osoba w tym momencie procesu." : "Behave like this exact person at this point of the process.",
  ]
    .filter(Boolean)
    .join(" ");
  const linkTreningu = `/bruno/rozmowa?sytuacja=${encodeURIComponent(sytuacja.slice(0, 2900))}&klient=${deal.id}`;

  // 5.11 (pkt 5: „mniej tekstów, bardziej przejrzyste”): etykiety typów krótkie, jedna linia na wpis.
  const nazwaTypu = (h: Zdarzenie) =>
    h.typ === "notatka" ? t("Note", "Notatka") : h.typ === "zadanie" ? (h.zrobione ? t("Done", "Zrobione") : t("Task", "Zadanie")) : h.typ === "etap" ? t("Stage", "Etap") : h.typ === "status" ? (h.tekst === "won" ? t("Won", "Wygrany") : h.tekst === "lost" ? t("Lost", "Przegrany") : t("Status", "Status")) : h.typ === "wartosc" ? t("Value", "Wartość") : h.typ === "plik" ? t("File", "Plik") : h.typ === "mail" ? "E-mail" : "";
  const tekstWpisu = (h: Zdarzenie) => (h.typ === "status" ? h.pod ?? "" : h.typ === "wartosc" ? h.tekst.replace(/(\d+)/g, (m) => formatKwota(Number(m), deal.waluta, jezyk)) : h.tekst);
  const chipTypu = (h: Zdarzenie): "" | "ok" | "zle" | "lim" | "ciemny" => (h.typ === "status" ? (h.tekst === "won" ? "ok" : h.tekst === "lost" ? "zle" : "") : h.typ === "etap" ? "ciemny" : h.typ === "zadanie" && h.zrobione ? "ok" : h.bruno ? "lim" : "");
  const statusChip = deal.status === "won" ? <Chip k="ok">{t("Won", "Wygrany")}</Chip> : deal.status === "lost" ? <Chip k="zle">{t("Lost", "Przegrany")}</Chip> : <Chip k="lim">{etap?.nazwa ?? t("Open", "Otwarty")}</Chip>;

  return (
    <div className="p-strona">
      <NaglowekP
        wstecz={{ href: zJako("/bruno/klienci", jako), tekst: t("Clients", "Klienci") }}
        tytul={deal.osoba ?? deal.tytul}
        podtytul={[deal.organizacja, deal.osoba && deal.tytul !== deal.osoba && deal.tytul !== deal.organizacja ? deal.tytul : null].filter(Boolean).join(" · ") || undefined}
        obraz={zdjecieKlienta(deal.osoba)}
        imie={deal.osoba ?? deal.tytul}
        prawo={statusChip}
      />

      <section className="p-karta p-karta-p">
        <div className="pk-hero">
          <div><div className="pk-hero-et">{t("Value", "Wartość")}</div><div className="pk-hero-w">{kwota}</div></div>
          <div><div className="pk-hero-et">{t("Status", "Status")}</div><div className="pk-hero-w" style={{ fontSize: 16 }}>{deal.status === "won" ? <span className="p-ok-t">{t("Won", "Wygrany")}</span> : deal.status === "lost" ? <span className="p-zle-t">{t("Lost", "Przegrany")}</span> : etap?.nazwa ?? t("Open", "Otwarty")}</div></div>
          <div><div className="pk-hero-et">{t("Last contact", "Ostatni kontakt")}</div><div className="pk-hero-w" style={{ fontSize: 16 }}>{dataKrotka(deal.ostatni_kontakt ?? deal.aktualizacja, jezyk) ?? "–"}{dni !== null && dni > 0 ? <span className="p-cichy" style={{ fontSize: 12.5, marginLeft: 6 }}>{t(`${dni} d ago`, `${dni} dni temu`)}</span> : null}</div></div>
          {szef && handlowiec && <div><div className="pk-hero-et">{t("Rep", "Handlowiec")}</div><div className="pk-hero-w" style={{ fontSize: 16 }}><span className="p-osoba"><Twarz src={handlowiec.zdjecie} imie={handlowiec.imie} rozmiar={26} /><Link href={`/bruno/szef/${encodeURIComponent(handlowiec.email)}`}>{handlowiec.imie}</Link></span></div></div>}
          {deal.status === "lost" && deal.powod_przegranej && <div><div className="pk-hero-et">{t("Lost reason", "Powód przegranej")}</div><div className="pk-hero-w p-zle-t" style={{ fontSize: 14 }}>{deal.powod_przegranej}</div></div>}
        </div>
        <ol className="pk-stepper" aria-label={t("Pipeline stage", "Etap lejka")}>
          {etapy.map((e, i) => (
            <li key={e.id} className={deal.status === "won" ? "won" : deal.status === "lost" && i <= idx ? "lost" : i < idx ? "byl" : i === idx ? "jest" : ""} title={e.nazwa}>
              <i />
              <span>{i + 1}. {e.nazwa}</span>
            </li>
          ))}
        </ol>
        <div className="pk-akcje">
          <Link href={linkTreningu} className="p-btn">{t("Train this call", "Trenuj rozmowę")} →</Link>
          <Link href={zJako(`/bruno/kokpit?deal=${encodeURIComponent(deal.tytul)}`, jako)} className="p-btn p-btn-2">{t("Tell Bruno", "Powiedz Bruno")}</Link>
          {linkCrm && <a href={linkCrm} target="_blank" rel="noreferrer" className="p-btn p-btn-2">Pipedrive ↗</a>}
        </div>
      </section>

      <div className="p-2kol">
        <section className="p-karta p-karta-p">
          <div className="p-karta-hd">
            <h2>{t("History", "Historia")}</h2>
            <span className="p-karta-hd-meta"><b>{historia.length}</b>{odBruno ? <span>· {odBruno} {t("from Bruno", "od Bruno")}</span> : null}</span>
          </div>
          {historia.length === 0 ? (
            <Pusto tytul={t("Nothing yet", "Jeszcze nic")} />
          ) : (
            <ul className="pk-os">
              {historia.map((h) => (
                <li key={h.id}>
                  <span className="pk-os-kiedy">{dataKrotka(h.kiedy, jezyk)}</span>
                  <i className={`pk-os-kropka ${h.bruno ? "bruno" : ""} ${h.typ === "etap" || h.typ === "status" ? "zmiana" : ""} ${h.typ === "zadanie" && h.zrobione ? "zrobione" : ""}`} aria-hidden />
                  <div className="pk-os-tresc">
                    <Chip k={chipTypu(h)}>{nazwaTypu(h)}{h.bruno ? " · Bruno" : ""}</Chip>
                    {h.typ === "zadanie" ? naglowekZadania(tekstWpisu(h)) : tekstWpisu(h)}
                    {h.pod && h.typ !== "status" ? <small>{h.pod}</small> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="p-karta p-karta-p">
          <div className="p-karta-hd">
            <h2>{t("To do", "Do zrobienia")}</h2>
            <span className="p-karta-hd-meta"><b>{doZrobienia.length}</b></span>
          </div>
          {doZrobienia.length === 0 ? (
            <div className="p-pusto" style={{ padding: "12px 0" }}>
              <b>{t("No next step", "Brak następnego kroku")}</b>
              <Link href={zJako(`/bruno/kokpit?deal=${encodeURIComponent(deal.tytul)}`, jako)} className="p-btn p-btn-2 p-btn-s" style={{ marginTop: 10 }}>{t("Tell Bruno", "Powiedz Bruno")}</Link>
            </div>
          ) : (
            <ul className="pk-os">
              {doZrobienia.map((a) => (
                <li key={a.id}>
                  <span className={`pk-os-kiedy ${a.data < dzis ? "zalegle" : ""}`}>{dataKrotka(a.data, jezyk)}{a.godzina ? ` ${a.godzina.slice(0, 5)}` : ""}</span>
                  <i className={`pk-os-kropka ${a.data < dzis ? "" : ""}`} style={a.data < dzis ? { borderColor: "var(--p-zle)", background: "var(--p-zle)" } : undefined} aria-hidden />
                  <div className="pk-os-tresc">
                    <Chip k={a.data < dzis ? "zle" : ""}>{a.data < dzis ? t("Overdue", "Zaległe") : a.typNazwa}</Chip>
                    {naglowekZadania(a.temat)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
