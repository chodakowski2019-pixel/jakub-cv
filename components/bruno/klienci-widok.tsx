import Link from "next/link";
import { Naglowek } from "@/components/bruno/zespol-widok";
import type { Firma } from "@/lib/bruno/firmy";
import { locale, tDla, type Jezyk } from "@/lib/bruno/i18n";
import { formatKwota, type Aktywnosc, type Deal, type Etap } from "@/lib/bruno/lejek";
import { zJako } from "@/lib/bruno/jako";
import { zdjecieKlienta } from "@/lib/bruno/twarze";

// 4.11 (USER_001, pkt 2): ZAKŁADKA KLIENCI (lista) + KARTA KLIENTA. Dane na żywo z CRM (Pipedrive).
// Styl: czarno-złote szkło (bruno-szklo, bsz-*), własne klasy bkl-* w bruno.css.

type Osoba = { email: string; imie: string; zdjecie: string | null };

const dataKrotka = (iso: string | null | undefined, jezyk: Jezyk) => (iso ? new Date(iso).toLocaleDateString(locale(jezyk), { day: "numeric", month: "short" }) : null);
const dniTemu = (iso: string | null | undefined) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : null);

export default function KlienciLista({ firma, jezyk, szef, etapy, deale, osoby, q, status, blad = null, jako = null, imie = null }: { firma: Firma | null; jezyk: Jezyk; szef: boolean; etapy: Etap[]; deale: Deal[]; osoby: Osoba[]; q: string; status: "open" | "won" | "lost" | "all"; blad?: string | null; /** 4.11: szef w widoku handlowca: linki trzymają ?jako=. */ jako?: string | null; imie?: string | null }) {
  const t = tDla(jezyk);
  const dzis = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const szukaj = q.trim().toLowerCase();
  const lista = deale
    .filter((d) => (status === "all" ? true : d.status === status))
    .filter((d) => !szukaj || [d.tytul, d.osoba, d.organizacja].some((x) => (x ?? "").toLowerCase().includes(szukaj)))
    .sort((a, b) => (a.nastepna_aktywnosc ?? "9999").localeCompare(b.nastepna_aktywnosc ?? "9999") || b.wartosc - a.wartosc);
  const osoba = (e: string | null) => (e ? osoby.find((o) => o.email === e) : null);
  const etap = (id: number) => etapy.find((e) => e.id === id)?.nazwa ?? String(id);
  const kwota = (d: Deal) => formatKwota(d.wartosc, d.waluta, jezyk);
  const filtry: { k: typeof status; n: string }[] = [
    { k: "open", n: t("Open", "Otwarte") },
    { k: "won", n: t("Won", "Wygrane") },
    { k: "lost", n: t("Lost", "Przegrane") },
    { k: "all", n: t("All", "Wszystkie") },
  ];

  return (
    <div className="flex flex-col gap-6 bsz bkl">
      <Naglowek firma={firma} tytul={t("Clients", "Klienci")} akcent={firma?.naglowek?.trim() || firma?.nazwa || "CRM"} podtytul={`${imie ? `${imie} · ` : ""}${szef ? t("Every client of the team, live from the CRM.", "Wszyscy klienci zespołu, na żywo z CRM.") : t("Your clients, live from the CRM.", "Twoi klienci, na żywo z CRM.")}`} />
      {blad ? (
        <section className="bruno-szklo rounded-2xl p-6">
          <p className="text-rose-800 font-medium">{t("Couldn't read the CRM.", "Nie udało się odczytać CRM.")}</p>
          <p className="text-slate-500 text-sm mt-1 break-words">{blad}</p>
        </section>
      ) : (
        <section className="bruno-szklo rounded-2xl overflow-hidden">
          <form className="px-5 pt-5 pb-3 flex flex-wrap items-center gap-3" method="get">
            <input type="search" name="q" defaultValue={q} placeholder={t("Search: client, company…", "Szukaj: klient, firma…")} className="bruno-pole bkl-szukaj" aria-label={t("Search", "Szukaj")} />
            <input type="hidden" name="status" value={status} />
            {jako && <input type="hidden" name="jako" value={jako} />}
            <div className="flex gap-1.5 flex-wrap">
              {filtry.map((f) => (
                <Link key={f.k} href={zJako(`/bruno/klienci?status=${f.k}${q ? `&q=${encodeURIComponent(q)}` : ""}`, jako)} className={`bkl-filtr ${status === f.k ? "bkl-filtr-on" : ""}`}>
                  {f.n}
                </Link>
              ))}
            </div>
            <span className="ml-auto text-sm text-slate-500 tabular-nums">{lista.length} {t("clients", "klientów")}</span>
          </form>
          <div className="overflow-x-auto">
            <table className="bkl-tabela">
              <thead>
                <tr>
                  <th>{t("Client", "Klient")}</th>
                  <th>{t("Company", "Firma")}</th>
                  <th>{t("Stage", "Etap")}</th>
                  <th className="text-right">{t("Value", "Wartość")}</th>
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
                  return (
                    <tr key={d.id} style={{ animationDelay: `${i * 20}ms` }}>
                      <td>
                        <Link href={zJako(`/bruno/klienci/${d.id}`, jako)} className="flex items-center gap-2.5 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {zdjecieKlienta(d.osoba) ? <img src={zdjecieKlienta(d.osoba)!} alt="" className="bsz-inicjal bsz-zdjecie" style={{ width: 34, height: 34 }} /> : <span className="bsz-inicjal" style={{ width: 34, height: 34, fontSize: 13 }}>{(d.organizacja ?? d.tytul)[0]?.toUpperCase()}</span>}
                          <span className="min-w-0">
                            <span className="block font-semibold text-slate-900 truncate max-w-[220px]">{d.osoba ?? d.tytul}</span>
                            {d.osoba && d.tytul !== d.osoba && d.tytul !== d.organizacja && <span className="block text-[11px] text-slate-400 truncate max-w-[220px]">{d.tytul}</span>}
                          </span>
                        </Link>
                      </td>
                      <td className="text-slate-700">{d.organizacja ?? "–"}</td>
                      <td>
                        <span className={`bsz-pigulka ${d.status === "won" ? "bkl-won" : d.status === "lost" ? "bkl-lost" : ""}`}>{d.status === "won" ? t("Won", "Wygrany") : d.status === "lost" ? t("Lost", "Przegrany") : etap(d.etap_id)}</span>
                      </td>
                      <td className="text-right tabular-nums font-semibold text-slate-800">{kwota(d)}</td>
                      <td className="tabular-nums">
                        {dni === null ? <span className="text-slate-300">–</span> : <span className={dni > 7 ? "text-rose-800 font-semibold" : "text-slate-700"}>{dni === 0 ? t("today", "dziś") : t(`${dni} d ago`, `${dni} dni temu`)}</span>}
                      </td>
                      <td>
                        {d.nastepna_aktywnosc ? (
                          <span className={zalegle ? "text-rose-800 font-semibold" : "text-slate-700"}>
                            {dataKrotka(d.nastepna_aktywnosc, jezyk)}
                            {d.nastepna_aktywnosc_temat ? <span className="block text-[11px] text-slate-400 truncate max-w-[200px]">{d.nastepna_aktywnosc_temat}</span> : null}
                          </span>
                        ) : (
                          d.status === "open" ? <span className="text-amber-700 text-xs">{t("none, add one", "brak, dodaj")}</span> : <span className="text-slate-300">–</span>
                        )}
                      </td>
                      {szef && (
                        <td>
                          {o ? (
                            <Link href={`/bruno/szef/${encodeURIComponent(o.email)}`} className="flex items-center gap-2 min-w-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {o.zdjecie ? <img src={o.zdjecie} alt="" className="bsz-inicjal bsz-zdjecie" style={{ width: 26, height: 26 }} /> : <span className="bsz-inicjal" style={{ width: 26, height: 26, fontSize: 12 }}>{o.imie[0]?.toUpperCase()}</span>}
                              <span className="truncate">{o.imie}</span>
                            </Link>
                          ) : (
                            <span className="text-slate-300">–</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={szef ? 7 : 6} className="p-6 text-slate-600 text-sm">{t("No clients here.", "Brak klientów.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export function KlientKarta({ firma, jezyk, szef, deal, etapy, notatki, aktywnosci, handlowiec, linkCrm, jako = null }: { firma: Firma | null; jezyk: Jezyk; szef: boolean; deal: Deal; etapy: Etap[]; notatki: { id: number; tresc: string; kiedy: string }[]; aktywnosci: (Aktywnosc & { typNazwa: string })[]; handlowiec: Osoba | null; linkCrm: string | null; jako?: string | null }) {
  const t = tDla(jezyk);
  const etap = etapy.find((e) => e.id === deal.etap_id);
  const idx = etapy.findIndex((e) => e.id === deal.etap_id);
  const kwota = formatKwota(deal.wartosc, deal.waluta, jezyk);
  const dzis = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
  const doZrobienia = aktywnosci.filter((a) => !a.zrobione).sort((a, b) => a.data.localeCompare(b.data));
  const historia = aktywnosci.filter((a) => a.zrobione);
  const treningi = historia.filter((a) => /trening bruno/i.test(a.typNazwa));

  // Przycisk „Przećwicz rozmowę z tym klientem”: Bruno gra tę osobę, na tym etapie, z notatkami jako kontekstem.
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

  return (
    <div className="flex flex-col gap-6 bsz bkl">
      <div>
        <Link href={zJako("/bruno/klienci", jako)} className="text-sm text-slate-500 hover:text-slate-900">← {t("Clients", "Klienci")}</Link>
        <div className="mt-2">
          <Naglowek firma={firma} tytul={deal.osoba ?? deal.tytul} akcent="" podtytul={[deal.organizacja, deal.osoba && deal.tytul !== deal.osoba && deal.tytul !== deal.organizacja ? deal.tytul : null].filter(Boolean).join(" · ") || undefined} zdjecie={zdjecieKlienta(deal.osoba)} />
        </div>
      </div>

      <section className="bruno-szklo rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div><div className="bkl-etykieta">{t("Value", "Wartość")}</div><div className="bruno-h2 text-xl bruno-gradient-tekst tabular-nums">{kwota}</div></div>
          <div><div className="bkl-etykieta">{t("Status", "Status")}</div><div className="font-semibold text-slate-800">{deal.status === "won" ? t("Won", "Wygrany") : deal.status === "lost" ? t("Lost", "Przegrany") : t("Open", "Otwarty")}{deal.powod_przegranej ? <span className="text-slate-500 font-normal"> · {deal.powod_przegranej}</span> : null}</div></div>
          <div><div className="bkl-etykieta">{t("Last contact", "Ostatni kontakt")}</div><div className="font-semibold text-slate-800">{dataKrotka(deal.ostatni_kontakt ?? deal.aktualizacja, jezyk) ?? "–"}</div></div>
          <div><div className="bkl-etykieta">{t("Added", "Dodany")}</div><div className="font-semibold text-slate-800">{dataKrotka(deal.dodano, jezyk) ?? "–"}</div></div>
          {szef && handlowiec && <div><div className="bkl-etykieta">{t("Rep", "Handlowiec")}</div><Link href={`/bruno/szef/${encodeURIComponent(handlowiec.email)}`} className="font-semibold text-slate-800 underline underline-offset-2">{handlowiec.imie}</Link></div>}
        </div>
        <ol className="bkl-etapy mt-5" aria-label={t("Pipeline stage", "Etap lejka")}>
          {etapy.map((e, i) => (
            <li key={e.id} className={`${i < idx ? "bkl-byl" : ""} ${i === idx ? "bkl-jest" : ""}`}>
              <span>{e.nazwa}</span>
            </li>
          ))}
        </ol>
        <div className="flex gap-3 flex-wrap mt-5">
          <Link href={linkTreningu} className="bruno-przycisk inline-flex px-5 py-2.5 text-sm">{t("Practice a call with this client →", "Przećwicz rozmowę z tym klientem →")}</Link>
          <Link href={zJako(`/bruno/kokpit?deal=${encodeURIComponent(deal.tytul)}`, jako)} className="bkl-przycisk-2">{t("Update in chat", "Zaktualizuj w czacie")}</Link>
          {linkCrm && <a href={linkCrm} target="_blank" rel="noreferrer" className="bkl-przycisk-2">{t("Open in Pipedrive", "Otwórz w Pipedrive")}</a>}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-start">
        <section className="bruno-szklo rounded-2xl p-5 sm:p-6">
          <h2 className="bruno-h2 text-lg mb-3">{t("Notes", "Notatki")} <span className="text-slate-400 text-sm font-normal">{notatki.length}</span></h2>
          {notatki.length === 0 ? (
            <p className="text-sm text-slate-500">{t("No notes yet. Tell Bruno in chat what happened.", "Brak notatek. Powiedz Bruno w czacie, co się wydarzyło.")}</p>
          ) : (
            <ul className="bkl-notatki">
              {notatki.map((n) => (
                <li key={n.id}>
                  <span className="bkl-kiedy">{dataKrotka(n.kiedy, jezyk)}</span>
                  <p>{n.tresc}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bruno-szklo rounded-2xl p-5 sm:p-6">
          <h2 className="bruno-h2 text-lg mb-3">{t("Tasks", "Zadania")} <span className="text-slate-400 text-sm font-normal">{doZrobienia.length}</span></h2>
          {doZrobienia.length === 0 ? (
            <p className="text-sm text-amber-700">{t("No next step planned. Add one in chat.", "Brak następnego kroku. Dodaj w czacie.")}</p>
          ) : (
            <ul className="bkl-notatki">
              {doZrobienia.map((a) => (
                <li key={a.id}>
                  <span className={`bkl-kiedy ${a.data < dzis ? "text-rose-800" : ""}`}>{dataKrotka(a.data, jezyk)}{a.godzina ? ` ${a.godzina.slice(0, 5)}` : ""}</span>
                  <p><b>{a.temat}</b> <span className="text-slate-400 text-xs">· {a.typNazwa}</span>{a.notatka ? <span className="block text-slate-500 text-xs mt-0.5">{a.notatka}</span> : null}</p>
                </li>
              ))}
            </ul>
          )}

          <h2 className="bruno-h2 text-lg mt-6 mb-3">{t("History", "Historia")} <span className="text-slate-400 text-sm font-normal">{historia.length}{treningi.length ? ` · ${treningi.length} ${t("Bruno trainings", "treningów Bruno")}` : ""}</span></h2>
          {historia.length === 0 ? (
            <p className="text-sm text-slate-500">{t("Nothing done yet.", "Jeszcze nic zrobionego.")}</p>
          ) : (
            <ul className="bkl-notatki">
              {historia.map((a) => (
                <li key={a.id} className={/trening bruno/i.test(a.typNazwa) ? "bkl-trening" : ""}>
                  <span className="bkl-kiedy">{dataKrotka(a.data, jezyk)}</span>
                  <p><span className="bsz-pigulka mr-1.5">{a.typNazwa}</span>{a.temat}{a.notatka ? <span className="block text-slate-500 text-xs mt-0.5 line-clamp-3">{a.notatka}</span> : null}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
