"use client";

import { useEffect } from "react";

// Ruch na stronie szkolenia: pojawianie się bloków przy przewijaniu i dolny pasek z przyciskiem na telefonie.
// Bez JS wszystko jest widoczne: ukrywanie włącza dopiero atrybut data-js.
// 21.11.2026 (USER_001: „dodaj kilka bardziej nowoczesnych elementów, szklany pasek u góry itd.”):
// karty mają miękkie światło pod kursorem (tylko wersja Kivo), a liczby ze źródłem liczą się od zera, gdy wjadą na ekran.
// Linków sekcji w pasku już nie ma (USER_001 21.11: „usuń”), więc nie ma też suwaka aktywnej sekcji.

// Karty, które dostają światło pod kursorem.
const KARTY = ".panel, .liczba, .k-kroki li, .wiersze:not(.zycie) li, .schody li";

// „39,8%” liczy się od 0 do 39,8 w ok. 1 s. Tekst po liczbie zostaje bez zmian.
function licz(el: Element) {
  const b = el.querySelector("b");
  const pelny = b?.textContent ?? "";
  const m = pelny.match(/^(\d+)(?:,(\d+))?([\s\S]*)$/);
  if (!b || !m) return;
  const cel = parseFloat(`${m[1]}.${m[2] ?? "0"}`);
  const miejsca = m[2]?.length ?? 0;
  const start = performance.now();
  const krok = (t: number) => {
    const p = Math.min(1, (t - start) / 1100);
    b.textContent = p < 1 ? (cel * (1 - Math.pow(1 - p, 3))).toFixed(miejsca).replace(".", ",") + m[3] : pelny;
    if (p < 1) requestAnimationFrame(krok);
  };
  requestAnimationFrame(krok);
}
export default function Ruch() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".sza");
    if (!root) return;
    const spokojnie = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let io: IntersectionObserver | null = null;
    if (!spokojnie) {
      root.dataset.js = "1";
      io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("on");
            if (e.target.classList.contains("liczba")) licz(e.target);
            io?.unobserve(e.target);
          }),
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );
      // .poj = bloki, które wjeżdżają; .zd = zdania, których słowa rozjaśniają się po kolei.
      root.querySelectorAll(".poj, .zd").forEach((n) => io!.observe(n));
    }

    // Dolny pasek: widoczny, gdy przycisk z hero zniknął, a formularza jeszcze nie widać.
    const cta = root.querySelector('[data-cta="hero"]');
    const form = root.querySelector("#formularz")?.closest("section");
    const widac = { cta: true, form: false };
    const ustaw = () => {
      root.dataset.dol = !widac.cta && !widac.form ? "1" : "0";
      // data-dalej: czytelnik zjechał poniżej pierwszego ekranu (pasek lekko się zbiera).
      root.dataset.dalej = widac.cta ? "0" : "1";
    };
    const io2 = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.target === cta) widac.cta = e.isIntersecting;
        if (e.target === form) widac.form = e.isIntersecting;
      });
      ustaw();
    });
    if (cta) io2.observe(cta);
    if (form) io2.observe(form);

    // Światło pod kursorem: pozycja kursora względem karty trafia do zmiennych --mx i --my.
    let czeka = false;
    const naRuch = (e: PointerEvent) => {
      if (czeka) return;
      czeka = true;
      requestAnimationFrame(() => {
        czeka = false;
        const k = e.target instanceof Element ? e.target.closest<HTMLElement>(KARTY) : null;
        if (!k) return;
        const r = k.getBoundingClientRect();
        k.style.setProperty("--mx", `${e.clientX - r.left}px`);
        k.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    const zKursorem = window.matchMedia("(hover: hover)").matches;
    if (zKursorem) root.addEventListener("pointermove", naRuch, { passive: true });

    return () => {
      io?.disconnect();
      io2.disconnect();
      if (zKursorem) root.removeEventListener("pointermove", naRuch);
    };
  }, []);

  return null;
}
