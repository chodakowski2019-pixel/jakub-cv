"use client";

import { useEffect, useRef } from "react";

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** Liczba, która dobiega do wartości (jak countTo w statycznych wzorach). */
export default function Licz({ do: cel, dec = 0, czas = 1100, przed = "", po = "", opoznienie = 0 }: { do: number; dec?: number; czas?: number; przed?: string; po?: string; opoznienie?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const od = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tekst = (v: number) => `${przed}${v.toFixed(dec).replace(".", ",")}${po}`;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = tekst(cel);
      od.current = cel;
      return;
    }
    const start = od.current;
    let raf = 0;
    const t0 = performance.now() + opoznienie;
    const krok = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / czas));
      el.textContent = tekst(start + (cel - start) * ease(k));
      if (k < 1) raf = requestAnimationFrame(krok);
      else od.current = cel;
    };
    raf = requestAnimationFrame(krok);
    return () => cancelAnimationFrame(raf);
  }, [cel, dec, czas, przed, po, opoznienie]);
  return <span ref={ref}>{`${przed}${(0).toFixed(dec).replace(".", ",")}${po}`}</span>;
}
