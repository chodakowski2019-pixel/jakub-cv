"use client";

import { useEffect, useState } from "react";
import { POSTACIE, type PostacId } from "@/lib/bruno/postacie";

type Konto = { email: string; imie: string | null; firma: string | null; start_dostepu: string | null; dni: number; limit_sekund: number; aktywne: boolean; plan?: string | null };
type RozmowaSkrot = { email: string; status: string; sekundy: number | null; ocena: number | null; start: string };
type KartaSkrot = { email: string; typ: string; tresc: string; pytanie: string | null; reps: number; lapses: number; last_review: string | null; due: string };
type MailSkrot = { email: string; rodzaj: string; temat: string | null; wyslano: string; wynik: string; blad: string | null };
type WejscieSkrot = { email: string; rodzaj: string; zrodlo: string | null; kiedy: string };

export default function AdminForm({ klucz }: { klucz: string }) {
  const [konta, setKonta] = useState<Konto[]>([]);
  const [rozmowy, setRozmowy] = useState<RozmowaSkrot[]>([]);
  const [karty, setKarty] = useState<KartaSkrot[]>([]);
  const [fiszkiKonta, setFiszkiKonta] = useState<string | null>(null);
  const [maile, setMaile] = useState<MailSkrot[]>([]);
  const [wejscia, setWejscia] = useState<WejscieSkrot[]>([]);
  const [zaint, setZaint] = useState<{ email: string; wiadomosc: string; utworzono: string }[]>([]);
  const [f, setF] = useState({ email: "", imie: "", firma: "", kod: "", dni: 7, limit_min: 63, rozmow_dziennie: 3, fiszek_dziennie: 5, plan: "trial", produkt: "", klient: "", obiekcje: "", udana_rozmowa: "", skrypt: "", postac: "czerwony" as PostacId });
  const [stan, setStan] = useState<string>("");

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
        konfig: { produkt: f.produkt, klient: f.klient, obiekcje: f.obiekcje, udana_rozmowa: f.udana_rozmowa, skrypt: f.skrypt, postac: f.postac },
      }),
    });
    const d = await res.json();
    const mail = d.mail === "wyslany" ? "Access email sent." : d.mail === "blad" ? "WARNING: email failed, send the code yourself." : "No email sent (code unchanged).";
    setStan(res.ok ? `Account ${d.email} saved.${d.kod ? ` Code: ${d.kod}.` : ""} ${mail}` : `Error: ${d.blad}`);
    if (res.ok) void odswiez();
  };

  const pole = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const statystyki = (email: string) => {
    const r = rozmowy.filter((x) => x.email === email);
    const ok = r.filter((x) => x.status === "zakonczona");
    const sek = r.reduce((s, x) => s + (x.sekundy ?? 0), 0);
    const oceny = ok.filter((x) => x.ocena).map((x) => x.ocena as number);
    return `${ok.length} ${ok.length === 1 ? "call" : "calls"}, ${Math.round(sek / 60)} min${oceny.length ? `, avg ${Math.round((oceny.reduce((a, b) => a + b, 0) / oceny.length) * 10) / 10}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
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
              <option value="free">free (B2C sign-up: 3 calls, flashcards, offer import)</option>
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
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${k.plan === "pelny" ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"}`}>{k.plan === "pelny" ? "full" : "trial"}</span>
                  <span className="text-slate-500">{k.start_dostepu ? `start ${new Date(k.start_dostepu).toLocaleDateString("en-US")}` : "never logged in"}, {k.dni} {k.dni === 1 ? "day" : "days"}, {Math.round(k.limit_sekund / 60)} min{k.aktywne ? "" : ", INACTIVE"}</span>
                  <span className="text-slate-500">{statystyki(k.email)}</span>
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
