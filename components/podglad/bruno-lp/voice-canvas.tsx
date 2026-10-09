"use client";

import { useEffect, useRef } from "react";

// Spokojna fala głosu w miejscu helisy: cienkie słupki, wolny ruch, mało kontrastu.
export default function VoiceCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Stałe akcenty: co ~14. słupek pomarańczowy, wybrane raz.
    const akcent = (i: number) => (i * 37) % 14 === 3;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const mobile = w < 760;
      const szer = mobile ? w * 0.86 : Math.min(w * 0.34, 520);
      const x0 = (w - szer) / 2;
      const n = mobile ? 46 : 64;
      const krok = szer / n;
      const bar = Math.max(2, krok * 0.34);
      const srodek = h * (mobile ? 0.24 : 0.46);
      const maks = h * (mobile ? 0.08 : 0.2);

      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        // Obwiednia: wygaszenie na brzegach, jak wypowiedź w połowie zdania.
        const obw = Math.pow(Math.sin(Math.PI * u), 1.4);
        const fala =
          0.55 * Math.sin(u * 9 + t * 0.0009) +
          0.3 * Math.sin(u * 23 - t * 0.0013) +
          0.15 * Math.sin(u * 51 + t * 0.0021);
        const amp = (0.18 + 0.82 * Math.abs(fala)) * obw;
        const bh = Math.max(bar, amp * maks);
        const x = x0 + i * krok + (krok - bar) / 2;

        ctx.fillStyle = akcent(i) ? `rgba(232, 140, 70, ${0.35 + 0.35 * obw})` : `rgba(20, 20, 20, ${0.07 + 0.13 * obw})`;
        ctx.beginPath();
        ctx.roundRect(x, srodek - bh, bar, bh * 2, bar / 2);
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      if (visible) draw(t);
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
