"use client";

import { useEffect, useState } from "react";
import { POSTACIE, type PostacId } from "@/lib/bruno/postacie";

type Konto = { email: string; imie: string | null; firma: string | null; start_dostepu: string | null; dni: number; limit_sekund: number; aktywne: boolean };
type RozmowaSkrot = { email: string; status: string; sekundy: number | null; ocena: number | null; start: string };

export default function AdminForm({ klucz }: { klucz: string }) {
  const [konta, setKonta] = useState<Konto[]>([]);
  const [rozmowy, setRozmowy] = useState<RozmowaSkrot[]>([]);
  const [zaint, setZaint] = useState<{ email: string; wiadomosc: string; utworzono: string }[]>([]);
  const [f, setF] = useState({ email: "", imie: "", firma: "", kod: "", dni: 7, limit_min: 63, produkt: "", klient: "", obiekcje: "", udana_rozmowa: "", skrypt: "", postac: "czerwony" as PostacId });
  const [stan, setStan] = useState<string>("");

  const odswiez = async () => {
    const res = await fetch(`/api/bruno/admin?k=${encodeURIComponent(klucz)}`);
    if (!res.ok) {
      setStan("Zły klucz (dodaj ?k=STATS_KEY do adresu).");
      return;
    }
    const d = await res.json();
    setKonta(d.konta ?? []);
    setRozmowy(d.rozmowy ?? []);
    setZaint(d.zainteresowani ?? []);
  };
  useEffect(() => {
    void odswiez();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klucz]);

  const zapisz = async (e: React.FormEvent) => {
    e.preventDefault();
    setStan("Zapisuję...");
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
        konfig: { produkt: f.produkt, klient: f.klient, obiekcje: f.obiekcje, udana_rozmowa: f.udana_rozmowa, skrypt: f.skrypt, postac: f.postac },
      }),
    });
    const d = await res.json();
    const mail = d.mail === "wyslany" ? "Mail z dostępem wysłany." : d.mail === "blad" ? "UWAGA: mail nie poszedł, podaj kod sam." : "Mail nie poszedł (kod bez zmian).";
    setStan(res.ok ? `Konto ${d.email} zapisane.${d.kod ? ` Kod: ${d.kod}.` : ""} ${mail}` : `Błąd: ${d.blad}`);
    if (res.ok) void odswiez();
  };

  const pole = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const statystyki = (email: string) => {
    const r = rozmowy.filter((x) => x.email === email);
    const ok = r.filter((x) => x.status === "zakonczona");
    const sek = r.reduce((s, x) => s + (x.sekundy ?? 0), 0);
    const oceny = ok.filter((x) => x.ocena).map((x) => x.ocena as number);
    return `${ok.length} rozm., ${Math.round(sek / 60)} min${oceny.length ? `, śr. ${Math.round((oceny.reduce((a, b) => a + b, 0) / oceny.length) * 10) / 10}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={zapisz} className="bruno-szklo rounded-3xl p-6 flex flex-col gap-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="bruno-pole" placeholder="email *" type="email" required value={f.email} onChange={pole("email")} />
          <input className="bruno-pole" placeholder="imię" value={f.imie} onChange={pole("imie")} />
          <input className="bruno-pole" placeholder="firma" value={f.firma} onChange={pole("firma")} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm text-slate-600">kod 6 cyfr <span className="text-slate-400">(puste = losowy)</span>
            <input className="bruno-pole mt-1" inputMode="numeric" maxLength={6} placeholder="losowy" value={f.kod} onChange={(e) => setF((x) => ({ ...x, kod: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />
          </label>
          <label className="text-sm text-slate-600">dni <input className="bruno-pole mt-1" type="number" min={1} value={f.dni} onChange={(e) => setF((x) => ({ ...x, dni: Number(e.target.value) }))} /></label>
          <label className="text-sm text-slate-600">limit minut <input className="bruno-pole mt-1" type="number" min={5} value={f.limit_min} onChange={(e) => setF((x) => ({ ...x, limit_min: Number(e.target.value) }))} /></label>
          <label className="text-sm text-slate-600">typ klienta
            <select className="bruno-pole mt-1" value={f.postac} onChange={pole("postac")}>
              {(Object.keys(POSTACIE) as PostacId[]).map((id) => <option key={id} value={id}>{POSTACIE[id].nazwa}</option>)}
            </select>
          </label>
        </div>
        <textarea className="bruno-pole" rows={2} placeholder="produkt (z ankiety)" value={f.produkt} onChange={pole("produkt")} />
        <textarea className="bruno-pole" rows={3} placeholder="klient, którego gra Bruno" value={f.klient} onChange={pole("klient")} />
        <textarea className="bruno-pole font-mono text-sm" rows={4} placeholder={"obiekcje, jedna na linię"} value={f.obiekcje} onChange={pole("obiekcje")} />
        <input className="bruno-pole" placeholder="co znaczy udana rozmowa" value={f.udana_rozmowa} onChange={pole("udana_rozmowa")} />
        <textarea className="bruno-pole text-sm" rows={3} placeholder="skrypt (opcjonalnie)" value={f.skrypt} onChange={pole("skrypt")} />
        <div className="flex items-center gap-4">
          <button type="submit" className="bruno-przycisk">Zapisz konto</button>
          <span className="text-sm text-slate-600">{stan}</span>
        </div>
      </form>

      <section className="bruno-szklo rounded-3xl p-6">
        <h2 className="bruno-h2 text-lg mb-3">Konta ({konta.length})</h2>
        <ul className="divide-y divide-slate-200/70 text-sm">
          {konta.map((k) => (
            <li key={k.email} className="py-2 flex flex-wrap gap-x-4 gap-y-1">
              <span className="font-medium text-slate-900">{k.imie ?? ""} {k.firma ? `(${k.firma})` : ""} {k.email}</span>
              <span className="text-slate-500">{k.start_dostepu ? `start ${new Date(k.start_dostepu).toLocaleDateString("pl-PL")}` : "nie zalogował się"}, {k.dni} dni, {Math.round(k.limit_sekund / 60)} min{k.aktywne ? "" : ", NIEAKTYWNE"}</span>
              <span className="text-slate-500">{statystyki(k.email)}</span>
            </li>
          ))}
        </ul>
      </section>

      {zaint.length > 0 && (
        <section className="bruno-szklo rounded-3xl p-6">
          <h2 className="bruno-h2 text-lg mb-3">Zainteresowani pełnym dostępem</h2>
          <ul className="divide-y divide-slate-200/70 text-sm">
            {zaint.map((z, i) => (
              <li key={i} className="py-2"><b>{z.email}</b> <span className="text-slate-500">{new Date(z.utworzono).toLocaleString("pl-PL")}</span><br />{z.wiadomosc}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
