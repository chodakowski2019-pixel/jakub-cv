"use client";

import { useEffect } from "react";

// 12.11 (USER_001): na telefonie krok, przy którym się jest, lekko podświetla się na pomarańczowo.
// Aktywny = karta, która przecina środek ekranu. Wygląd w dolacz.module.css (.kroki li[data-aktywny], tylko do 640 px).
export default function KrokiAktywny({ lista }: { lista: string }) {
  useEffect(() => {
    const karty = document.querySelectorAll<HTMLElement>(`#${lista} > li`);
    if (!karty.length || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (wpisy) => {
        for (const w of wpisy) {
          if (w.isIntersecting) w.target.setAttribute("data-aktywny", "");
          else w.target.removeAttribute("data-aktywny");
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    karty.forEach((k) => obs.observe(k));
    return () => obs.disconnect();
  }, [lista]);
  return null;
}
