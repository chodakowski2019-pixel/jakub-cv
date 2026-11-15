"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import a from "./akademia.module.css";

// 15.11 (USER_001: „nowocześniej, UX/UI na najwyższym poziomie”): bloki z data-pojaw wjeżdżają przy przewijaniu.
// Bez JS i przy „ogranicz ruch” wszystko widać od razu (klasę ukrywającą dodaje dopiero ten skrypt, tylko poza ekranem).
const izo = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Pojawianie() {
  izo(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Sprawdzanie pozycji przy każdym przewinięciu (IntersectionObserver gubił bloki przy szybkim przewijaniu):
    // blok odsłania się, gdy jego górna krawędź wejdzie na ekran, także gdy przeskoczono go w całości.
    let czekaja = Array.from(document.querySelectorAll<HTMLElement>("[data-pojaw]")).filter((e) => e.getBoundingClientRect().top > window.innerHeight);
    czekaja.forEach((e) => e.classList.add(a.ukryte));
    let klatka = 0;
    const sprawdz = () => {
      klatka = 0;
      const granica = window.innerHeight * 0.92;
      czekaja = czekaja.filter((e) => {
        if (e.getBoundingClientRect().top > granica) return true;
        e.classList.remove(a.ukryte);
        return false;
      });
      if (!czekaja.length) window.removeEventListener("scroll", naScroll);
    };
    const naScroll = () => {
      if (!klatka) klatka = requestAnimationFrame(sprawdz);
    };
    window.addEventListener("scroll", naScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", naScroll);
      cancelAnimationFrame(klatka);
      czekaja.forEach((e) => e.classList.remove(a.ukryte));
    };
  }, []);
  return null;
}

// Telefon: cena + przycisk przyklejają się na dole dopiero za cennikiem (15.11 USER_001), wyżej ich nie ma.
export function PasekDolny({ cena, href }: { cena: number; href: string }) {
  const [widac, setWidac] = useState(false);
  useEffect(() => {
    const cenaEl = document.getElementById("cena");
    const sprawdz = () => {
      const r = cenaEl?.getBoundingClientRect();
      setWidac(r ? r.bottom < window.innerHeight : false);
    };
    sprawdz();
    window.addEventListener("scroll", sprawdz, { passive: true });
    return () => window.removeEventListener("scroll", sprawdz);
  }, []);
  return (
    <div className={`${a.pasekDolny} ${widac ? a.pasekDolnyWidac : ""}`} aria-hidden={!widac}>
      <div>
        <b>{cena} zł</b>
        <span> / mies.</span>
      </div>
      <a href={href} tabIndex={widac ? 0 : -1}>
        Dołącz do Academy
      </a>
    </div>
  );
}

// 15.11 (USER_001): pod logo i przyciskiem u góry szklany pasek, gdy strona jest przewinięta w dół.
export function SzklanyPasek() {
  const [widac, setWidac] = useState(false);
  useEffect(() => {
    const sprawdz = () => setWidac(window.scrollY > 12);
    sprawdz();
    window.addEventListener("scroll", sprawdz, { passive: true });
    return () => window.removeEventListener("scroll", sprawdz);
  }, []);
  return <div className={`${a.szklo} ${widac ? a.szkloWidac : ""}`} aria-hidden="true" />;
}
