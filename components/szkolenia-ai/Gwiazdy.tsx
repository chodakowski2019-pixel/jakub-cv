"use client";

import { useEffect, useRef } from "react";

// Wolno płynące gwiazdy w tle (hero i stopka). Trzy „głębokości”: bliższe gwiazdy płyną szybciej
// i mocniej reagują na kursor, więc scena ma głębię. Rysowane na zwykłym canvasie 2D, bez bibliotek.
// Poza ekranem animacja stoi. Przy ograniczonym ruchu (ustawienie systemu) rysuje się jedna klatka.

type Gwiazda = { x: number; y: number; z: number; r: number; f: number; s: number };

// Stałe ziarno: układ gwiazd jest taki sam przy każdym wejściu.
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

// Kolory przychodzą z arkusza stylów (zmienne na korzeniu .sza): --gw-kolor = punkty, --gw-poswiata = otoczka największych,
// --gw-moc = mnożnik widoczności. Dzięki temu wersja kolorów strony siedzi w całości w CSS, a zmiana klasy od razu przemalowuje gwiazdy.
export default function Gwiazdy({ className, ziarno = 7 }: { className?: string; ziarno?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const spokojnie = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const korzen = c.closest<HTMLElement>(".sza");
    let kolor = "#eef3f3";
    let poswiata = "#e9f542";
    let moc = 1;
    function czytajKolory() {
      if (!korzen) return;
      const st = getComputedStyle(korzen);
      kolor = st.getPropertyValue("--gw-kolor").trim() || kolor;
      poswiata = st.getPropertyValue("--gw-poswiata").trim() || poswiata;
      moc = parseFloat(st.getPropertyValue("--gw-moc")) || 1;
    }
    let w = 0;
    let h = 0;
    let gwiazdy: Gwiazda[] = [];
    let raf = 0;
    let widac = true;
    // Pozycja kursora (−1 do 1) i jej wygładzona wersja: scena dogania kursor, nie skacze.
    const cel = { x: 0, y: 0 };
    const kursor = { x: 0, y: 0 };

    function ustaw() {
      w = c!.clientWidth;
      h = c!.clientHeight;
      c!.width = Math.round(w * dpr);
      c!.height = Math.round(h * dpr);
      const los = losowe(ziarno);
      const ile = Math.min(520, Math.round((w * h) / 4200));
      gwiazdy = Array.from({ length: ile }, () => {
        const z = 0.25 + los() * 0.75;
        return { x: los() * w, y: los() * h, z, r: 0.35 + z * z * (los() < 0.06 ? 1.9 : 0.85), f: los() * 6.283, s: 0.5 + los() * 1.4 };
      });
    }

    function rysuj(t: number) {
      kursor.x += (cel.x - kursor.x) * 0.04;
      kursor.y += (cel.y - kursor.y) * 0.04;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      ctx!.fillStyle = kolor;
      for (const g of gwiazdy) {
        let x = (g.x + t * 0.0035 * g.z - kursor.x * 18 * g.z) % w;
        if (x < 0) x += w;
        let y = (g.y - t * 0.0012 * g.z - kursor.y * 12 * g.z) % h;
        if (y < 0) y += h;
        const blask = 0.35 + 0.65 * Math.abs(Math.sin(g.f + t * 0.0007 * g.s));
        ctx!.globalAlpha = blask * g.z * moc;
        ctx!.beginPath();
        ctx!.arc(x, y, g.r, 0, 6.283);
        ctx!.fill();
        if (g.r > 1.3) {
          ctx!.globalAlpha = blask * 0.2 * (moc < 1 ? 2.2 : 1);
          ctx!.fillStyle = poswiata;
          ctx!.beginPath();
          ctx!.arc(x, y, g.r * 3.2, 0, 6.283);
          ctx!.fill();
          ctx!.fillStyle = kolor;
        }
      }
      ctx!.globalAlpha = 1;
    }

    function petla(t: number) {
      rysuj(t);
      if (widac && !spokojnie) raf = requestAnimationFrame(petla);
    }

    function ruch(e: PointerEvent) {
      cel.x = (e.clientX / window.innerWidth) * 2 - 1;
      cel.y = (e.clientY / window.innerHeight) * 2 - 1;
    }

    czytajKolory();
    ustaw();
    rysuj(0);
    // Zmiana wersji kolorów (klasa na korzeniu) = nowe kolory gwiazd.
    const mo = new MutationObserver(() => {
      czytajKolory();
      rysuj(performance.now());
    });
    if (korzen) mo.observe(korzen, { attributes: true, attributeFilter: ["class", "style"] });
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
    if (!spokojnie) window.addEventListener("pointermove", ruch, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", ruch);
    };
  }, [ziarno]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
