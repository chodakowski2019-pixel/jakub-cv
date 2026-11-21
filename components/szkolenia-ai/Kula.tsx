"use client";

import { useEffect, useRef } from "react";

// Kula z małych płytek, która wolno się obraca (wersja 4 wyglądu, styl wzorowany na stronie Kivo, 21.11.2026).
// Własny rysunek na zwykłym canvasie 2D, bez bibliotek: płytki leżą na siatce południków i równoleżników,
// część jest lekko wysunięta, jaśniejsze są te zwrócone do światła. Poza ekranem animacja stoi.
// Przy ograniczonym ruchu (ustawienie systemu) rysuje się jedna klatka.

type Plytka = { fi: number; th: number; dfi: number; dth: number; wys: number };

function losowe(ziarno: number) {
  let a = ziarno;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// kolor = barwa płytek jako „r, g, b” (domyślnie białe, bo kula leży na pomarańczowej karcie).
export default function Kula({ className, kolor = "255, 255, 255" }: { className?: string; kolor?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const spokojnie = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const los = losowe(11);
    const PASY = 26;
    const plytki: Plytka[] = [];
    for (let i = 1; i < PASY; i++) {
      const fi = (i / PASY) * Math.PI;
      const ile = Math.max(6, Math.round(Math.sin(fi) * 2 * PASY));
      for (let j = 0; j < ile; j++) {
        plytki.push({ fi, th: ((j + (i % 2) * 0.5) / ile) * Math.PI * 2, dfi: Math.PI / PASY, dth: (Math.PI * 2) / ile, wys: los() < 0.34 ? 0.025 + los() * 0.055 : 0 });
      }
    }
    const POCHYL = 0.42;
    let cosP = Math.cos(POCHYL);
    let sinP = Math.sin(POCHYL);
    // Kursor (−1 do 1) i jego wygładzona wersja: kula lekko obraca się za kursorem, bez skoków.
    const cel = { x: 0, y: 0 };
    const kursor = { x: 0, y: 0 };
    // światło z lewej góry, od strony patrzącego
    const L = [-0.45, 0.62, 0.64];
    let w = 0;
    let h = 0;
    let raf = 0;
    let widac = true;

    // punkt na kuli → ekran (x w prawo, y w górę, z do patrzącego)
    function punkt(fi: number, th: number, r: number) {
      const x = Math.sin(fi) * Math.cos(th);
      const y0 = Math.cos(fi);
      const z0 = Math.sin(fi) * Math.sin(th);
      const y = y0 * cosP - z0 * sinP;
      const z = y0 * sinP + z0 * cosP;
      return [x * r, y * r, z, x, y] as const;
    }

    function ustaw() {
      w = c!.clientWidth;
      h = c!.clientHeight;
      c!.width = Math.round(w * dpr);
      c!.height = Math.round(h * dpr);
    }

    function rysuj(t: number) {
      const R = Math.min(w, h) * 0.43;
      const cx = w / 2;
      const cy = h / 2;
      kursor.x += (cel.x - kursor.x) * 0.05;
      kursor.y += (cel.y - kursor.y) * 0.05;
      const obrot = t * 0.00011 + kursor.x * 0.7;
      cosP = Math.cos(POCHYL + kursor.y * 0.3);
      sinP = Math.sin(POCHYL + kursor.y * 0.3);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      const widoczne: { z: number; p: readonly (readonly number[])[]; jasnosc: number }[] = [];
      for (const k of plytki) {
        const th = k.th + obrot;
        const r = R * (1 + k.wys);
        const srodek = punkt(k.fi, th, r);
        if (srodek[2] < -0.02) continue;
        const a = k.dfi * 0.42;
        const b = k.dth * 0.42;
        const p = [punkt(k.fi - a, th - b, r), punkt(k.fi - a, th + b, r), punkt(k.fi + a, th + b, r), punkt(k.fi + a, th - b, r)];
        const swiatlo = Math.max(0, srodek[3] * L[0] + srodek[4] * L[1] + srodek[2] * L[2]);
        widoczne.push({ z: srodek[2] + k.wys, p, jasnosc: 0.3 + 0.6 * swiatlo + (k.wys ? 0.1 : 0) });
      }
      widoczne.sort((m, n) => m.z - n.z);
      for (const v of widoczne) {
        ctx!.fillStyle = `rgba(${kolor}, ${Math.min(1, v.jasnosc).toFixed(3)})`;
        ctx!.beginPath();
        ctx!.moveTo(cx + v.p[0][0], cy - v.p[0][1]);
        for (let i = 1; i < 4; i++) ctx!.lineTo(cx + v.p[i][0], cy - v.p[i][1]);
        ctx!.closePath();
        ctx!.fill();
      }
    }

    function petla(t: number) {
      rysuj(t);
      if (widac && !spokojnie) raf = requestAnimationFrame(petla);
    }

    ustaw();
    rysuj(0);
    const ro = new ResizeObserver(() => {
      ustaw();
      rysuj(performance.now());
    });
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => {
      widac = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (widac && !spokojnie) raf = requestAnimationFrame(petla);
    });
    io.observe(c);
    const ruch = (e: PointerEvent) => {
      cel.x = (e.clientX / window.innerWidth) * 2 - 1;
      cel.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!spokojnie) window.addEventListener("pointermove", ruch, { passive: true });
    return () => {
      window.removeEventListener("pointermove", ruch);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [kolor]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
