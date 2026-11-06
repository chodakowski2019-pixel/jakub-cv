"use client";

import { useEffect, useState } from "react";
import s from "./start.module.css";

// 5.11: przyklejony przycisk na telefonie. Chowa się, gdy na ekranie jest sekcja pakietów (żeby nie zasłaniać „Kupuję”).
export default function PasekTel({ tekst }: { tekst: string }) {
  const [ukryty, setUkryty] = useState(false);
  useEffect(() => {
    const cel = document.getElementById("pakiety");
    if (!cel) return;
    const o = new IntersectionObserver(([e]) => setUkryty(e.isIntersecting), { threshold: 0.05 });
    o.observe(cel);
    return () => o.disconnect();
  }, []);
  return (
    <a className={s.pasekTel} href="#pakiety" data-ukryty={ukryty ? "1" : "0"}>
      {tekst}
    </a>
  );
}
