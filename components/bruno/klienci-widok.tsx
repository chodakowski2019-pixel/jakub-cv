import Link from "next/link";
import { Blad, Chip, Kafel, NaglowekP, Pusto, Twarz } from "@/components/bruno/panel-ui";
import type { Firma } from "@/lib/bruno/firmy";
import { locale, tDla, type Jezyk } from "@/lib/bruno/i18n";
import { formatKwota, naglowekZadania, type Aktywnosc, type Deal, type Etap, type Zdarzenie } from "@/lib/bruno/lejek";
import { zJako } from "@/lib/bruno/jako";
import { zdjecieKlienta } from "@/lib/bruno/twarze";

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

export default function KlienciLista({ firma, jezyk, szef, etapy, deale, osoby, q, status, blad = null, jako = null, imie = null }: { firma: Firma | null; jezyk: Jezyk; szef: boolean; etapy: Etap[]; deale: Deal[]; osoby: Osoba[]; q: string; status: "open" | "won" | "lost" | "all"; blad?: string | null; /** 4.11: szef w widoku handlowca: linki trzymają ?jako=. */ jako?: string | null; imie?: string | null }) {
  const t = tDla(jezyk);
  const dzis = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const szukaj = q.trim().toLowerCase();
  const lista = deale
    .filter((d) => (status === "all" ? true : d.status === status))
    .filter((d) => !szukaj || [d.tytul, d.osoba, d.organizacja].some((x) => (x ?? "").toLowerCase().includes(szukaj)))
    .sort((a, b) => (a.nastepna_aktywnosc ?? "9999").localeCompare(b.nastepna_aktywnosc ?? "9999") || b.wartosc - a.wartosc);
  const osoba = (e: string | null) => (e ? osoby.find((o) => o.email === e) : null);
  const etapNazwa = (id: number) => etapy.find((e) => e.id === id)?.nazwa ?? String(id);
  const waluta = deale[0]?.waluta ?? "PLN";
  const kwota = (n: number) => formatKwota(n, waluta, jezyk);
  const liczby = (k: typeof status) => deale.filter((d) => (k === "all" ? true : d.status === k)).length;
  const filtry: { k: typeof status; n: string }[] = [
    { k: "open", n: t("Open", "Otwarte") },
    { k: "won", n: t("Won", "Wygrane") },
    { k: "lost", n: t("Lost", "Przegrane") },
    { k: "all", n: t("All", "Wszystkie") },
  ];
  const wartosc = lista.reduce((s, d) => s + d.wartosc, 0);
  const maxWartosc = Math.max(1, ...lista.map((d) => d.wartosc));
  const zalegle = lista.filter((d) => d.status === "open" && d.nastepna_aktywnosc && d.nastepna_aktywnosc < dzis).length;
  const bezKroku = lista.filter((d) => d.status === "open" && !d.nastepna_aktywnosc).length;
  const akcent = imie ?? firma?.naglowek?.trim() ?? firma?.nazwa ?? "";

  return (
    <div className="p-strona">
      <NaglowekP tytul={t("Clients", "Klienci")} akcent={akcent} podtytul={szef ? t("Every client of the team, live from the CRM.", "Wszyscy klienci zespołu, na żywo z CRM.") : t("Your clients, live from the CRM.", "Twoi klienci, na żywo z CRM.")} />
      {blad ? (
        <Blad tytul={t("Couldn't read the CRM.", "Nie udało się odczytać CRM.")} tekst={blad} />
      ) : (
        <>
          <div className="p-kafle">
            <Kafel wartosc={lista.length} etykieta={filtry.find((f) => f.k === status)?.n ?? ""} dol={<span>{t("in this view", "w tym widoku")}</span>} />
            <Kafel wartosc={kwota(wartosc)} etykieta={t("Value", "Wartość")} dol={<span>{t("sum of deals shown", "suma pokazanych deali")}</span>} />
            <Kafel wartosc={zalegle} etykieta={t("Overdue tasks", "Zaległe zadania")} zle={zalegle > 0} kropka={zalegle > 0 ? "#e5484d" : undefined} dol={<span>{t("next step in the past", "następny krok w przeszłości")}</span>} />
            <Kafel wartosc={bezKroku} etykieta={t("No next step", "Bez następnego kroku")} zle={bezKroku > 0} kropka={bezKroku > 0 ? "#e2a300" : undefined} dol={<span>{t("open deals without a task", "otwarte bez zadania")}</span>} />
          </div>
          <section className="p-karta">
            <form className="pk-pasek" method="get">
              <label className="p-szukaj">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" /></svg>
                <input type="search" name="q" defaultValue={q} placeholder={t("Search: client, company…", "Szukaj: klient, firma…")} aria-label={t("Search", "Szukaj")} />
              </label>
              <input type="hidden" name="status" value={status} />
              {jako && <input type="hidden" name="jako" value={jako} />}
              <div className="p-segment">
                {filtry.map((f) => (
                  <Link key={f.k} href={zJako(`/bruno/klienci?status=${f.k}${q ? `&q=${encodeURIComponent(q)}` : ""}`, jako)} className={status === f.k ? "p-on" : ""}>
                    {f.n} <em>{liczby(f.k)}</em>
                  </Link>
                ))}
              </div>
            </form>
            <div className="p-tabela-wrap">
              <table className="p-tabela">
                <thead>
                  <tr>
                    <th>{t("Client", "Klient")}</th>
                    <th>{t("Stage", "Etap")}</th>
                    <th className="p-num">{t("Value", "Wartość")}</th>
                    <th>{t("Last contact", "Ostatni kontakt")}</th>
                    <th>{t("Next task", "Następne zadanie")}</th>
                    {szef && <th>{t("Rep", "Handlowiec")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {lista.slice(0, 200).map((d, i) => {
                    const o = osoba(d.handlowiec);
                    const dni = dniTemu(d.ostatni_kontakt ?? d.aktualizacja);
                    const zalegle = Boolean(d.nastepna_aktywnosc && d.nastepna_aktywnosc < dzis);
                    const idx = etapy.findIndex((e) => e.id === d.etap_id);
                    const swiezosc = dni === null ? "" : dni <= 3 ? "ok" : dni <= 7 ? "uwaga" : "zle";
                    return (
                      <tr key={d.id} style={{ animationDelay: `${Math.min(i, 20) * 20}ms` }}>
                        <td>
                          <Link href={zJako(`/bruno/klienci/${d.id}`, jako)} className="p-osoba">
                            <Twarz src={zdjecieKlienta(d.osoba)} imie={d.organizacja ?? d.tytul} rozmiar={36} />
                            <span className="min-w-0">
                              <b style={{ maxWidth: 240 }}>{d.osoba ?? d.tytul}</b>
                              <small style={{ maxWidth: 240 }}>{[d.organizacja, d.osoba && d.tytul !== d.osoba && d.tytul !== d.organizacja ? d.tytul : null].filter(Boolean).join(" · ") || "–"}</small>
                            </span>
                          </Link>
                        </td>
                        <td>
                          <span className="pk-etap-cela">
                            <span>{d.status === "won" ? <span className="p-ok-t">{t("Won", "Wygrany")}</span> : d.status === "lost" ? <span className="p-zle-t">{t("Lost", "Przegrany")}</span> : etapNazwa(d.etap_id)}</span>
                            <EtapKropki etapy={etapy} idx={idx} status={d.status} />
                          </span>
                        </td>
                        <td className="p-num">
                          <span className="pk-wartosc">
                            <b>{kwota(d.wartosc)}</b>
                            <span className="p-miernik-tor"><i data-k={d.status === "won" ? "ok" : d.status === "lost" ? "zle" : undefined} style={{ width: `${(100 * d.wartosc) / maxWartosc}%` }} /></span>
                          </span>
                        </td>
                        <td className="pk-dni">
                          {dni === null ? <span className="p-cichy">–</span> : <Chip k={d.status === "open" ? (swiezosc as "ok" | "uwaga" | "zle") : ""}>{dni === 0 ? t("today", "dziś") : dni === 1 ? t("yesterday", "wczoraj") : t(`${dni} d ago`, `${dni} dni temu`)}</Chip>}
                        </td>
                        <td>
                          {d.nastepna_aktywnosc ? (
                            <span className="pk-zadanie">
                              <span className={zalegle ? "p-zle-t" : ""}>{zalegle ? "⚠ " : ""}{dataKrotka(d.nastepna_aktywnosc, jezyk)}</span>
                              {d.nastepna_aktywnosc_temat ? <small title={d.nastepna_aktywnosc_temat}>{naglowekZadania(d.nastepna_aktywnosc_temat)}</small> : null}
                            </span>
                          ) : d.status === "open" ? (
                            <Chip k="uwaga">{t("none, add one", "brak, dodaj")}</Chip>
                          ) : (
                            <span className="p-cichy">–</span>
                          )}
                        </td>
                        {szef && (
                          <td>
                            {o ? (
                              <Link href={`/bruno/szef/${encodeURIComponent(o.email)}`} className="p-osoba">
                                <Twarz src={o.zdjecie} imie={o.imie} rozmiar={26} />
                                <span className="min-w-0"><b style={{ fontWeight: 400 }}>{o.imie}</b></span>
                              </Link>
                            ) : (
                              <span className="p-cichy">–</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {lista.length === 0 && (
                    <tr>
                      <td colSpan={szef ? 6 : 5}><Pusto tytul={t("No clients here", "Brak klientów")} opis={szukaj ? t("Try another search.", "Spróbuj innej frazy.") : undefined} /></td>
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
  const linkTreningu = `/bruno/rozmowa?sytuacja=${encodeURIComponent(sytuacja.slice(0, 2900))}`;

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
