"use client";

import { useEffect, useRef, useState } from "react";

// Rozkład dnia jako orbita: 4 bloki pracy to 4 punkty na elipsie, w środku opis wybranego bloku.
// Blok zmienia się sam co 8 s (tyle trwa spokojne przeczytanie opisu), dopóki ktoś nie kliknie albo nie najedzie na orbitę.
// Przy każdym punkcie stoi godzina i nazwa bloku zwykłym pismem: cały plan dnia widać bez klikania.
// Na telefonie i bez JS zamiast orbity jest zwykła lista (klasa .lista-dnia w komponencie strony).

type Blok = { g: string; blok: string; opis?: string; zostaje?: string };

// Elipsa w układzie 1000 × 440. Kąty liczone zgodnie z ruchem wskazówek zegara od prawej strony.
const CX = 500;
const CY = 220;
const RX = 470;
const RY = 196;
const KATY = [212, 318, 28, 150];

export default function Orbita({ bloki }: { bloki: Blok[] }) {
  const [nr, setNr] = useState(0);
  const [sam, setSam] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sam) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let widac = false;
    const io = new IntersectionObserver(([e]) => (widac = e.isIntersecting), { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    const id = window.setInterval(() => {
      if (widac) setNr((n) => (n + 1) % bloki.length);
    }, 8000);
    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, [sam, bloki.length]);

  const punkty = bloki.map((_, i) => {
    const k = (KATY[i % KATY.length] * Math.PI) / 180;
    return { x: CX + RX * Math.cos(k), y: CY + RY * Math.sin(k) };
  });
  const b = bloki[nr];

  return (
    <div className="orbita" ref={ref} onPointerEnter={() => setSam(false)}>
      <svg viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true">
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
      </svg>

      <div className="orbita-punkty" role="tablist" aria-label="Bloki szkolenia">
        {bloki.map((x, i) => (
          <button
            key={x.g}
            type="button"
            role="tab"
            aria-selected={i === nr}
            className={i === nr ? "wybrany" : undefined}
            style={{ left: `${punkty[i].x / 10}%`, top: `${(punkty[i].y / 440) * 100}%` }}
            onClick={() => {
              setSam(false);
              setNr(i);
            }}
          >
            <i aria-hidden="true" />
            <span>
              <b>{x.g}</b> {x.blok}
            </span>
          </button>
        ))}
      </div>

      <div className="orbita-srodek" role="tabpanel" aria-live="polite" key={b.g}>
        <p className="mono">
          Blok 0{nr + 1} · {b.g}
        </p>
        <h3>{b.blok}</h3>
        <p className="opis">{b.opis}</p>
        <p className="zostaje">
          <b>Zostaje:</b> {b.zostaje}
        </p>
      </div>
    </div>
  );
}
