"use client";

import "@/app/bruno/motyw-rinesk.css";
import KulaLimonka, { fsPlyn, type ParamPlyn } from "@/components/bruno/kula-limonka";

// 8.11 (USER_001: „5 propozycji takiej kuli, troszkę za dużo odcieni”). Podgląd lokalny: localhost:3077/podglad/bruno-kule.
// Każda wersja = wąska paleta (2-3 odcienie limonki zamiast 7 od oliwki do bieli) + inne parametry cieczy.

type Wersja = { nr: number; nazwa: string; opis: string; kolory: string[]; p: ParamPlyn };

const WERSJE: Wersja[] = [
  {
    nr: 1,
    nazwa: "Dwie limonki",
    opis: "Tylko 2 odcienie: limonka i jasna limonka. Duże, spokojne plamy.",
    kolory: ["#a9ba00", "#b3c400", "#c2d200", "#cfdd10", "#dbe735", "#e6ef5c", "#eef57e"],
    p: { skala: 2.2, zawin: 2.4, oktawy: 5, kontrast: 2.2, jasnosc: 0 },
  },
  {
    nr: 2,
    nazwa: "Mleczna",
    opis: "Limonka z białymi smugami, jak mleko wlane do soku. Bez ciemnych miejsc.",
    kolory: ["#c3d200", "#cddc12", "#d8e533", "#e3ed64", "#eef49a", "#f7fac9", "#fdfee9"],
    p: { skala: 2.6, zawin: 2.6, oktawy: 5, kontrast: 2.4, jasnosc: 0.06 },
  },
  {
    nr: 3,
    nazwa: "Jednolita z połyskiem",
    opis: "Prawie jeden kolor, ciecz widać tylko w delikatnym ruchu. Najspokojniejsza.",
    kolory: ["#bccb00", "#c2d100", "#c9d700", "#d0dd0a", "#d7e31e", "#dee838", "#e5ed55"],
    p: { skala: 1.8, zawin: 2.2, oktawy: 4, kontrast: 1.6, jasnosc: 0 },
  },
  {
    nr: 4,
    nazwa: "Lampa lawa",
    opis: "3 odcienie, wielkie miękkie bańki, które powoli się przelewają.",
    kolory: ["#8fa000", "#9db000", "#b4c600", "#cbdb00", "#dbe82a", "#e7f155", "#eef57a"],
    p: { skala: 1.3, zawin: 2.0, oktawy: 3, kontrast: 2.6, jasnosc: 0.02 },
  },
  {
    nr: 5,
    nazwa: "Limonka i grafit",
    opis: "2 kolory marki: limonka + ciemny grafit w cienkich smugach. Najmocniejszy kontrast, mało odcieni.",
    kolory: ["#2a2f12", "#7d8a06", "#c6d500", "#d2e000", "#d9e61a", "#e1ec3c", "#e9f163"],
    p: { skala: 2.4, zawin: 2.4, oktawy: 5, kontrast: 1.7, jasnosc: 0.14 },
  },
];

export default function KulePodglad() {
  return (
    <main style={{ minHeight: "100vh", background: "#f2f3f5", padding: "48px 24px", fontFamily: "system-ui, sans-serif", color: "#141416" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px", textAlign: "center" }}>Kula Bruno: 5 propozycji</h1>
      <p style={{ margin: "0 0 40px", textAlign: "center", color: "#6b6e78" }}>Mniej odcieni niż teraz. Kolory pod każdą kulą = cała paleta.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 32, maxWidth: 1400, margin: "0 auto" }}>
        {WERSJE.map((w) => (
          <Karta key={w.nr} w={w} />
        ))}
      </div>
    </main>
  );
}

function Karta({ w }: { w: Wersja }) {
  return (
    <section style={{ background: "#fff", borderRadius: 24, padding: "36px 20px 24px", textAlign: "center" }}>
      <div style={{ width: 200, height: 200, margin: "0 auto 32px" }}>
        <KulaLimonka fs={fsPlyn(w.p)} kolory={w.kolory} zakres={[0, 1]} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#9aa000", letterSpacing: 1 }}>WERSJA {w.nr}</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0 6px" }}>{w.nazwa}</h2>
      <p style={{ fontSize: 14, lineHeight: 1.45, color: "#6b6e78", margin: 0 }}>{w.opis}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 14 }}>
        {[...new Set([w.kolory[0], w.kolory[3], w.kolory[6]])].map((k) => (
          <span key={k} title={k} style={{ width: 18, height: 18, borderRadius: 9, background: k, border: "1px solid rgba(0,0,0,.08)" }} />
        ))}
      </div>
    </section>
  );
}
