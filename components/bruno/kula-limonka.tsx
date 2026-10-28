"use client";

import AuroraCanvas from "@/components/podglad/aurora/aurora-canvas";

// 28.10 (USER_001: „najlepiej wyglądała płynna, ale kolor zielony zostaje”): kula Bruno pod jasny motyw Rinesk.
// Środek = shader zorzy z rejestracji (aurora-canvas.tsx) w limonkowej palecie, przycięty do koła; na tym szklany
// blik, ciemniejszy brzeg i cienka obwódka (efekt sfery). Wokół: miękki cień pod kulą i rozchodzące się pierścienie.
// Tempo jak w orb-bruno.tsx: czeka (wolno), słucha, mówi (szybciej + puls). Style: motyw-rinesk.css (.kl-*).
export type TempoKuli = "czeka" | "slucha" | "mowi";
const PREDKOSC: Record<TempoKuli, number> = { czeka: 1, slucha: 1.8, mowi: 3.2 };
/** Wycinek zorzy w kuli: ciemna oliwka na dole, limonka w środku, jasny szczyt. */
const ZAKRES: [number, number] = [0.2, 1.04];
const LIMONKA = ["#1f2600", "#36420a", "#5c6d00", "#93a600", "#d4e000", "#eef76a", "#fbfdd0"];

export default function KulaLimonka({ tempo = "czeka", className = "" }: { tempo?: TempoKuli; className?: string }) {
  return (
    <div className={`kl kl-${tempo} ${className}`} aria-hidden>
      <div className="kl-cien" />
      <div className="kl-pierscien kl-p1" />
      <div className="kl-pierscien kl-p2" />
      <div className="kl-kula">
        <AuroraCanvas fallbackClass="kl-fallback" predkosc={PREDKOSC[tempo]} zakres={ZAKRES} kolory={LIMONKA} />
        <div className="kl-szklo" />
        <div className="kl-blask" />
        <div className="kl-rim" />
      </div>
    </div>
  );
}
