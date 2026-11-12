"use client";

import { useEffect } from "react";

// 12.11 (USER_001): na telefonie element, przy którym się jest (krok, panel rejestracji), lekko podświetla się na pomarańczowo.
// Aktywny = element, który przecina środek ekranu. Wygląd w dolacz.module.css ([data-aktywny], tylko do 640 px).
export default function KrokiAktywny({ selektor }: { selektor: string }) {
  useEffect(() => {
    const el = document.querySelectorAll<HTMLElement>(selektor);
    if (!el.length || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (wpisy) => {
        for (const w of wpisy) {
          if (w.isIntersecting) w.target.setAttribute("data-aktywny", "");
          else w.target.removeAttribute("data-aktywny");
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    el.forEach((k) => obs.observe(k));
    return () => obs.disconnect();
  }, [selektor]);
  return null;
}
