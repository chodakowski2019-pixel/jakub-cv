"use client";

import { useEffect, useRef } from "react";

// 5.11: sekcje wjeżdżają przy przewijaniu (IntersectionObserver, klasa `widac`). Przy prefers-reduced-motion CSS wyłącza ruch.
export default function Pokaz({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("js");
    const cele = el.querySelectorAll<HTMLElement>("[data-pokaz]");
    const o = new IntersectionObserver(
      (wpisy) => {
        for (const w of wpisy)
          if (w.isIntersecting) {
            w.target.classList.add("widac");
            o.unobserve(w.target);
          }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    cele.forEach((c) => o.observe(c));
    return () => o.disconnect();
  }, []);
  return <div ref={ref}>{children}</div>;
}
