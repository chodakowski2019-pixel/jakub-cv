"use client";

import { useEffect, useState } from "react";
import { POSTACIE, type PostacId } from "@/lib/bruno/postacie";

type Konto = { email: string; imie: string | null; firma: string | null; start_dostepu: string | null; dni: number; limit_sekund: number; aktywne: boolean; plan?: string | null };
type RozmowaSkrot = { email: string; status: string; sekundy: number | null; ocena: number | null; start: string };
type KartaSkrot = { email: string; typ: string; tresc: string; pytanie: string | null; reps: number; lapses: number; last_review: string | null; due: string };
type MailSkrot = { email: string; rodzaj: string; temat: string | null; wyslano: string; wynik: string; blad: string | null };
type WejscieSkrot = { email: string; rodzaj: string; zrodlo: string | null; kiedy: string };
type Prosba = { id: number; utworzono: string; email: string; imie: string; telefon: string | null; firma: string; handlowcy: string; produkt: string; jezyk: string; status: string; decyzja_at: string | null };

export default function AdminForm({ klucz }: { klucz: string }) {
  const [konta, setKonta] = useState<Konto[]>([]);
  const [rozmowy, setRozmowy] = useState<RozmowaSkrot[]>([]);
  const [karty, setKarty] = useState<KartaSkrot[]>([]);
  const [fiszkiKonta, setFiszkiKonta] = useState<string | null>(null);
  const [maile, setMaile] = useState<MailSkrot[]>([]);
  const [wejscia, setWejscia] = useState<WejscieSkrot[]>([]);
  const [zaint, setZaint] = useState<{ email: string; wiadomosc: string; utworzono: string }[]>([]);
  const [f, setF] = useState({ email: "", imie: "", firma: "", kod: "", dni: 7, limit_min: 63, rozmow_dziennie: 3, fiszek_dziennie: 5, plan: "trial", jezyk: "en", produkt: "", klient: "", obiekcje: "", udana_rozmowa: "", skrypt: "", postac: "czerwony" as PostacId });
  const [stan, setStan] = useState<string>("");
  const [prosby, setProsby] = useState<Prosba[]>([]);
  const [stanProsby, setStanProsby] = useState<Record<number, string>>({});

  const odswiez = async () => {
    const res = await fetch(`/api/bruno/admin?k=${encodeURIComponent(klucz)}`);
    if (!res.ok) {
      setStan("Wrong key (add ?k=STATS_KEY to the URL).");
      return;
    }
    const d = await res.json();
    setKonta(d.konta ?? []);
    setRozmowy(d.rozmowy ?? []);
    setKarty(d.karty ?? []);
    setMaile(d.maile ?? []);
    setWejscia(d.wejscia ?? []);
    setZaint(d.zainteresowani ?? []);
    setProsby(d.prosby ?? []);
  };

  // 17.10 (USER_001): „Daj dostęp” = konto demo (1 rozmowa, 3 min) + mail z kodem. Obiecane: do 24 h.
  const decyzja = async (id: number, akcja: "przyznaj" | "odrzuc") => {
    if (akcja === "odrzuc" && !confirm("Odrzucić prośbę? Mail nie pójdzie.")) return;
    setStanProsby((x) => ({ ...x, [id]: "..." }));
    const res = await fetch(`/api/bruno/admin/prosba?k=${encodeURIComponent(klucz)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, akcja }),
    });
    const d = await res.json().catch(() => ({}));
    const mail = d.mail === "wyslany" ? "mail wysłany" : d.mail === "blad" ? "UWAGA: mail nie poszedł, wyślij kod sam" : "mail pominięty (brak RESEND_API_KEY)";
    setStanProsby((x) => ({ ...x, [id]: res.ok ? (akcja === "odrzuc" ? "odrzucona" : `konto założone, kod ${d.kod}, ${mail}`) : `Błąd: ${d.blad ?? res.status}` }));
    if (res.ok) void odswiez();
  };
  useEffect(() => {
    void odswiez();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klucz]);

  const zapisz = async (e: React.FormEvent) => {
    e.preventDefault();
    setStan("Saving...");
    const res = await fetch(`/api/bruno/admin?k=${encodeURIComponent(klucz)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: f.email,
        imie: f.imie,
        firma: f.firma,
        kod: f.kod || undefined,
        dni: f.dni,
        limit_sekund: f.limit_min * 60,
        rozmow_dziennie: f.rozmow_dziennie,
        fiszek_dziennie: f.fiszek_dziennie,
        plan: f.plan,
        jezyk: f.jezyk,
        konfig: { produkt: f.produkt, klient: f.klient, obiekcje: f.obiekcje, udana_rozmowa: f.udana_rozmowa, skrypt: f.skrypt, postac: f.postac },
      }),
    });
    const d = await res.json();
    const mail = d.mail === "wyslany" ? "Access email sent." : d.mail === "blad" ? "WARNING: email failed, send the code yourself." : "No email sent (code unchanged).";
    setStan(res.ok ? `Account ${d.email} saved.${d.kod ? ` Code: ${d.kod}.` : ""} ${mail}` : `Error: ${d.blad}`);
    if (res.ok) void odswiez();
  };

  const pole = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  // 25.10 (USER_001): „Demo pod firmę” przed spotkaniem: adres strony + nazwa → firma, szef z kodem, 5 handlowców, 30 rozmów.
  const [demo, setDemo] = useState({ url: "", nazwa: "", jezyk: "pl", szef: "", imie: "", kod: "" });
  const [demoStan, setDemoStan] = useState<string>("");
  const [demoWynik, setDemoWynik] = useState<{ szef: string; kod: string | null; firma: { id: string; nazwa: string; logo_url: string | null }; zespol: { handlowcy: { imie: string; typ: string; rozmow: number }[]; rozmow: number }; zModelu: boolean; uwagi: string[] } | null>(null);
  const zalozDemo = async (reset: boolean) => {
    if (!demo.nazwa.trim() || (!reset && !demo.url.trim())) {
      setDemoStan("Podaj adres strony i nazwę firmy.");
      return;
    }
    setDemoStan(reset ? "Układam handlowców i rozmowy od nowa…" : "Czytam stronę, model układa produkt i rozmowy (do 2 minut)…");
    setDemoWynik(null);
    const res = await fetch(`/api/bruno/admin/demo-firma?k=${encodeURIComponent(klucz)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...demo, reset }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDemoStan(`Błąd: ${d.blad ?? res.status}`);
      return;
    }
    setDemoStan("");
    setDemoWynik(d);
    void odswiez();
  };
  const statystyki = (email: string) => {
    const r = rozmowy.filter((x) => x.email === email);
    const ok = r.filter((x) => x.status === "zakonczona");
    const sek = r.reduce((s, x) => s + (x.sekundy ?? 0), 0);
    const oceny = ok.filter((x) => x.ocena).map((x) => x.ocena as number);
    return `${ok.length} ${ok.length === 1 ? "call" : "calls"}, ${Math.round(sek / 60)} min${oceny.length ? `, avg ${Math.round((oceny.reduce((a, b) => a + b, 0) / oceny.length) * 10) / 10}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="bruno-szklo rounded-3xl p-6 flex flex-col gap-4">
        <div>
          <h2 className="bruno-h2 text-lg">Demo pod firmę</h2>
          <p className="text-sm text-slate-500 mt-1">Adres strony + nazwa → firma z logo, konto szefa z kodem, 5 handlowców i 30 rozmów na ich produkcie. Przed spotkaniem online.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="bruno-pole sm:col-span-2" placeholder="https://firma.pl *" value={demo.url} onChange={(e) => setDemo((x) => ({ ...x, url: e.target.value }))} />
          <input className="bruno-pole" placeholder="nazwa firmy *" value={demo.nazwa} onChange={(e) => setDemo((x) => ({ ...x, nazwa: e.target.value }))} />
          <select className="bruno-pole" value={demo.jezyk} onChange={(e) => setDemo((x) => ({ ...x, jezyk: e.target.value }))}>
            <option value="pl">PL (salesbruno.pl)</option>
            <option value="en">EN (salesbruno.com)</option>
          </select>
          <input className="bruno-pole" placeholder="e-mail szefa (puste = szef.<firma>@demo.salesbruno.pl)" value={demo.szef} onChange={(e) => setDemo((x) => ({ ...x, szef: e.target.value }))} />
          <input className="bruno-pole" placeholder="imię szefa (puste = Jakub)" value={demo.imie} onChange={(e) => setDemo((x) => ({ ...x, imie: e.target.value }))} />
          <input className="bruno-pole" inputMode="numeric" maxLength={6} placeholder="kod 6 cyfr (puste = losowy)" value={demo.kod} onChange={(e) => setDemo((x) => ({ ...x, kod: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="bruno-przycisk" onClick={() => void zalozDemo(false)}>Załóż demo</button>
          <button type="button" className="text-slate-500 underline" onClick={() => void zalozDemo(true)}>Reset handlowców (ta sama nazwa)</button>
          <span className="text-sm text-slate-600">{demoStan}</span>
        </div>
        {demoWynik && (
          <div className="text-sm flex flex-col gap-2">
            <p className="text-slate-900">
              <b>{demoWynik.firma.nazwa}</b> ({demoWynik.firma.id}) · szef <b>{demoWynik.szef}</b>{demoWynik.kod ? <> · kod <b className="tabular-nums">{demoWynik.kod}</b></> : " · kod bez zmian"} · rozmowy {demoWynik.zModelu ? "z modelu" : "domyślne"}
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
              {demoWynik.zespol.handlowcy.map((h) => <li key={h.imie}>{h.imie}: {h.typ}, {h.rozmow} rozmów</li>)}
            </ul>
            {demoWynik.uwagi.map((u, i) => <p key={i} className="text-amber-700">{u}</p>)}
            <p className="text-slate-500">Zaloguj się jako szef na /bruno → zakładka „Zespół”.</p>
          </div>
        )}
      </section>

      <section className="bruno-szklo rounded-3xl p-6">
        <h2 className="bruno-h2 text-lg mb-3">Prośby o dostęp ({prosby.filter((p) => p.status === "nowa").length} nowe)</h2>
        {prosby.length === 0 ? (
          <p className="text-sm text-slate-500">Brak próśb.</p>
        ) : (
          <ul className="divide-y divide-slate-200/70 text-sm">
            {prosby.map((p) => {
              const godzin = Math.floor((Date.now() - new Date(p.utworzono).getTime()) / 3_600_000);
              return (
                <li key={p.id} className="py-3 flex flex-col gap-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                    <span className="font-medium text-slate-900">{p.imie || p.firma ? `${p.imie}, ${p.firma}` : "(tylko e-mail i hasło)"}</span>
                    <span className="text-slate-600">{p.email} · {p.telefon ?? "-"}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{p.handlowcy} handlowców · {p.jezyk}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${p.status === "nowa" ? (godzin >= 20 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800") : p.status === "przyznany" ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-500"}`}>
                      {p.status === "nowa" ? `nowa, ${godzin} h temu` : p.status === "krok1" ? `krok 1, bez danych firmy, ${godzin} h temu` : p.status}
                    </span>
                  </div>
                  <p className="text-slate-700">{p.produkt}</p>
                  {p.status === "nowa" && (
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <button type="button" className="bruno-przycisk" onClick={() => void decyzja(p.id, "przyznaj")}>Daj dostęp</button>
                      <button type="button" className="text-slate-500 underline" onClick={() => void decyzja(p.id, "odrzuc")}>Odrzuć</button>
                    </div>
                  )}
                  {stanProsby[p.id] && <span className="text-slate-600">{stanProsby[p.id]}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form onSubmit={zapisz} className="bruno-szklo rounded-3xl p-6 flex flex-col gap-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="bruno-pole" placeholder="email *" type="email" required value={f.email} onChange={pole("email")} />
          <input className="bruno-pole" placeholder="first name" value={f.imie} onChange={pole("imie")} />
          <input className="bruno-pole" placeholder="company" value={f.firma} onChange={pole("firma")} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm text-slate-600">6-digit code <span className="text-slate-400">(empty = random)</span>
            <input className="bruno-pole mt-1" inputMode="numeric" maxLength={6} placeholder="random" value={f.kod} onChange={(e) => setF((x) => ({ ...x, kod: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />
          </label>
          <label className="text-sm text-slate-600">days <input className="bruno-pole mt-1" type="number" min={1} value={f.dni} onChange={(e) => setF((x) => ({ ...x, dni: Number(e.target.value) }))} /></label>
          <label className="text-sm text-slate-600">minute limit <input className="bruno-pole mt-1" type="number" min={5} value={f.limit_min} onChange={(e) => setF((x) => ({ ...x, limit_min: Number(e.target.value) }))} /></label>
          <label className="text-sm text-slate-600">calls per day <input className="bruno-pole mt-1" type="number" min={1} value={f.rozmow_dziennie} onChange={(e) => setF((x) => ({ ...x, rozmow_dziennie: Number(e.target.value) }))} /></label>
          <label className="text-sm text-slate-600">flashcards per day <input className="bruno-pole mt-1" type="number" min={1} value={f.fiszek_dziennie} onChange={(e) => setF((x) => ({ ...x, fiszek_dziennie: Number(e.target.value) }))} /></label>
          <label className="text-sm text-slate-600">customer type
            <select className="bruno-pole mt-1" value={f.postac} onChange={pole("postac")}>
              {(Object.keys(POSTACIE) as PostacId[]).map((id) => <option key={id} value={id}>{POSTACIE[id].nazwa}</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-600">plan
            <select className="bruno-pole mt-1" value={f.plan} onChange={pole("plan")}>
              <option value="trial">trial (test, no paid modules)</option>
              <option value="pelny">full (B2B after deal / Bruno Pro: everything)</option>
              <option value="free">free (demo B2B: calls = „calls per day”, 17.10: 1)</option>
            </select>
          </label>
          <label className="text-sm text-slate-600">language
            <select className="bruno-pole mt-1" value={f.jezyk} onChange={pole("jezyk")}>
              <option value="en">EN (salesbruno.com)</option>
              <option value="pl">PL (salesbruno.pl)</option>
            </select>
          </label>
        </div>
        <textarea className="bruno-pole" rows={2} placeholder="product (from survey)" value={f.produkt} onChange={pole("produkt")} />
        <textarea className="bruno-pole" rows={3} placeholder="customer Bruno plays" value={f.klient} onChange={pole("klient")} />
        <textarea className="bruno-pole font-mono text-sm" rows={4} placeholder={"objections, one per line"} value={f.obiekcje} onChange={pole("obiekcje")} />
        <input className="bruno-pole" placeholder="what counts as a win" value={f.udana_rozmowa} onChange={pole("udana_rozmowa")} />
        <textarea className="bruno-pole text-sm" rows={3} placeholder="script (optional)" value={f.skrypt} onChange={pole("skrypt")} />
        <div className="flex items-center gap-4">
          <button type="submit" className="bruno-przycisk">Save account</button>
          <span className="text-sm text-slate-600">{stan}</span>
        </div>
      </form>

      <section className="bruno-szklo rounded-3xl p-6">
        <h2 className="bruno-h2 text-lg mb-3">Accounts ({konta.length})</h2>
        <ul className="divide-y divide-slate-200/70 text-sm">
          {konta.map((k) => {
            const kk = karty.filter((x) => x.email === k.email);
            const przerobione = kk.filter((x) => x.reps > 0);
            const otwarte = fiszkiKonta === k.email;
            return (
              <li key={k.email} className="py-2 flex flex-col gap-1">
                <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                  <span className="font-medium text-slate-900">{k.imie ?? ""} {k.firma ? `(${k.firma})` : ""} {k.email}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${k.plan === "pelny" ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"}`}>{k.plan === "pelny" ? "full" : k.plan === "free" ? "demo" : "trial"}</span>
                  <span className="text-slate-500">{k.start_dostepu ? `start ${new Date(k.start_dostepu).toLocaleDateString("en-US")}` : "never logged in"}, {k.dni} {k.dni === 1 ? "day" : "days"}, {Math.round(k.limit_sekund / 60)} min{k.aktywne ? "" : ", INACTIVE"}</span>
                  <span className="text-slate-500">{statystyki(k.email)}</span>
                  <button
                    type="button"
                    className={k.aktywne ? "text-slate-500 underline" : "text-teal-800 underline font-medium"}
                    onClick={async () => {
                      await fetch(`/api/bruno/admin/aktywne?k=${encodeURIComponent(klucz)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: k.email, aktywne: !k.aktywne }) });
                      void odswiez();
                    }}
                  >
                    {k.aktywne ? "wyłącz" : "włącz"}
                  </button>
                  <button type="button" className="text-cyan-800 underline" onClick={() => setFiszkiKonta(otwarte ? null : k.email)}>
                    flashcards {przerobione.length}/{kk.length}
                  </button>
                  {(() => {
                    // E18: maile wysłane do konta i wejścia z nich (od wdrożenia logu; wcześniejsze = brak danych).
                    const m = maile.filter((x) => x.email === k.email);
                    const w = wejscia.filter((x) => x.email === k.email);
                    const zMaila = w.filter((x) => x.zrodlo?.startsWith("mail-"));
                    const ostatniMail = m[0];
                    return (
                      <span className="text-slate-500" title={ostatniMail ? `last: ${ostatniMail.rodzaj}, ${new Date(ostatniMail.wyslano).toLocaleString("en-US")}, ${ostatniMail.wynik}${ostatniMail.blad ? `: ${ostatniMail.blad}` : ""}` : "no emails in log"}>
                        emails {m.filter((x) => x.wynik === "wyslany").length}{m.some((x) => x.wynik === "blad") ? ` (errors ${m.filter((x) => x.wynik === "blad").length})` : ""}, visits {w.length}, from email {zMaila.length}
                        {w[0] ? `, last ${new Date(w[0].kiedy).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}` : ""}
                      </span>
                    );
                  })()}
                </div>
                {otwarte && (
                  <div className="overflow-x-auto mt-1">
                    <table className="text-xs min-w-[640px] w-full">
                      <thead className="text-slate-500 text-left">
                        <tr><th className="pr-3 py-1">type</th><th className="pr-3 py-1">content</th><th className="pr-3 py-1">question</th><th className="pr-3 py-1">reviews</th><th className="pr-3 py-1">misses</th><th className="pr-3 py-1">last</th><th className="py-1">next</th></tr>
                      </thead>
                      <tbody>
                        {[...kk]
                          .sort((a, b) => (b.last_review ?? "").localeCompare(a.last_review ?? "") || a.due.localeCompare(b.due))
                          .map((x, i) => (
                            <tr key={i} className={`border-t border-slate-200/60 ${x.reps === 0 ? "text-slate-400" : "text-slate-800"}`}>
                              <td className="pr-3 py-1 whitespace-nowrap">{x.typ}</td>
                              <td className="pr-3 py-1 max-w-[18rem]">{x.tresc.slice(0, 90)}</td>
                              <td className="pr-3 py-1 max-w-[20rem]">{(x.pytanie ?? "").slice(0, 110)}</td>
                              <td className="pr-3 py-1 tabular-nums">{x.reps}</td>
                              <td className="pr-3 py-1 tabular-nums">{x.lapses}</td>
                              <td className="pr-3 py-1 whitespace-nowrap">{x.last_review ? new Date(x.last_review).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }) : "never"}</td>
                              <td className="py-1 whitespace-nowrap">{new Date(x.due).toLocaleDateString("en-US")}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {zaint.length > 0 && (
        <section className="bruno-szklo rounded-3xl p-6">
          <h2 className="bruno-h2 text-lg mb-3">Interested in full access</h2>
          <ul className="divide-y divide-slate-200/70 text-sm">
            {zaint.map((z, i) => (
              <li key={i} className="py-2"><b>{z.email}</b> <span className="text-slate-500">{new Date(z.utworzono).toLocaleString("en-US")}</span><br />{z.wiadomosc}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
