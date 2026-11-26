"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 26.11.2026 (USER_001: „jak mówimy o mieszkaniach, to mieszkanie 3D”). Ile metrów kupisz za tę samą kwotę w danym mieście.
// Metraż = budżet / mediana ceny za m² (GUS, ostatni rok). Meble i człowiek w prawdziwej skali, więc ciasnotę widać od razu.
// Kamera stała dla wszystkich miast, żeby zmiana wielkości była widoczna. Reduced motion: bez obrotu i bez płynnej zmiany.

export type Miasto = { slug: string; nazwa: string; m2: number };
const BUDZETY = [300_000, 500_000, 1_000_000];
const PROPORCJA = 1.35;
const SCIANA = { h: 1.1, g: 0.12 };

const wymiary = (pole: number) => {
  const w = Math.sqrt(pole * PROPORCJA);
  return { w, d: pole / w };
};
const tys = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000} mln zł` : `${n / 1000} tys. zł`);

export function Mieszkanie3D({ miasta, rok }: { miasta: Miasto[]; rok: number }) {
  const pudlo = useRef<HTMLDivElement>(null);
  const [wybrane, setWybrane] = useState(miasta[0]?.slug);
  const [budzet, setBudzet] = useState(BUDZETY[1]);
  const cel = useRef(wymiary(budzet / (miasta[0]?.m2 ?? 10_000)));
  const kadr = useRef({ ustaw: (_: number) => {} });
  const miasto = miasta.find((m) => m.slug === wybrane) ?? miasta[0];
  const pole = Math.round(budzet / miasto.m2);

  useEffect(() => {
    cel.current = wymiary(budzet / miasto.m2);
    // Kamera dopasowana do NAJWIĘKSZEGO mieszkania przy tym budżecie: małe wygląda na małe.
    kadr.current.ustaw(Math.max(...miasta.map((m) => budzet / m.m2)));
  }, [budzet, miasto, miasta]);

  useEffect(() => {
    const el = pudlo.current;
    if (!el) return;
    const cichy = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dotyk = window.matchMedia("(pointer: coarse)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor("#0b0b0b");
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scena = new THREE.Scene();
    const kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
    const ster = new OrbitControls(kamera, renderer.domElement);
    ster.enableDamping = true;
    ster.enablePan = false;
    ster.enableZoom = false;
    ster.enableRotate = !dotyk;
    ster.maxPolarAngle = Math.PI * 0.42;
    ster.minPolarAngle = Math.PI * 0.18;
    ster.autoRotate = !cichy;
    ster.autoRotateSpeed = 0.6;

    scena.add(new THREE.HemisphereLight("#ffffff", "#202020", 1.4));
    const slonce = new THREE.DirectionalLight("#ffffff", 2.4);
    slonce.position.set(-8, 14, 6);
    slonce.castShadow = true;
    slonce.shadow.mapSize.set(1024, 1024);
    Object.assign(slonce.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 });
    scena.add(slonce);

    const box = (kolor: string) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: kolor, roughness: 0.7 }));
      m.castShadow = true;
      m.receiveShadow = true;
      scena.add(m);
      return m;
    };
    const podloga = box("#d9e000");
    podloga.castShadow = false;
    const sciany = [box("#e9e9e4"), box("#e9e9e4"), box("#e9e9e4"), box("#e9e9e4")];
    const MEBEL = "#8c8c86";
    // [szer, wys, głęb] w metrach + przyklejenie do rogu (sx, sz = -1 lewa/tylna ściana, +1 prawa/przednia).
    const meble = [
      { m: box("#bdbdb6"), r: [1.6, 0.5, 2.0], sx: -1, sz: -1 }, // łóżko
      { m: box(MEBEL), r: [2.4, 0.9, 0.6], sx: 1, sz: -1 }, // kuchnia
      { m: box(MEBEL), r: [2.0, 0.8, 0.9], sx: -1, sz: 1 }, // kanapa
      { m: box("#bdbdb6"), r: [1.2, 0.75, 0.8], sx: 1, sz: 1, odsun: 0.8 }, // stół
    ];
    // Człowiek 1,75 m: walec + głowa.
    const czlowiek = new THREE.Group();
    const cialo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.5, 20), new THREE.MeshStandardMaterial({ color: "#ffffff" }));
    cialo.position.y = 0.75;
    const glowa = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), new THREE.MeshStandardMaterial({ color: "#ffffff" }));
    glowa.position.y = 1.64;
    [cialo, glowa].forEach((m) => ((m.castShadow = true), czlowiek.add(m)));
    scena.add(czlowiek);
    const grunt = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.35 }));
    grunt.rotation.x = -Math.PI / 2;
    grunt.position.y = -0.06;
    grunt.receiveShadow = true;
    scena.add(grunt);

    const teraz = { ...cel.current };
    let odleglosc = 30;
    kadr.current.ustaw = (najwieksze) => {
      const { w } = wymiary(najwieksze);
      odleglosc = Math.max(11, w * 1.75);
    };
    kadr.current.ustaw(Math.max(...miasta.map((m) => BUDZETY[1] / m.m2)));
    kamera.position.set(odleglosc * 0.7, odleglosc * 0.75, odleglosc * 0.7);

    const uloz = () => {
      const { w, d } = teraz;
      podloga.scale.set(w, 0.1, d);
      podloga.position.y = -0.05;
      const [a, b, c, e] = sciany;
      a.scale.set(w + SCIANA.g, SCIANA.h, SCIANA.g); a.position.set(0, SCIANA.h / 2, -d / 2);
      b.scale.set(w + SCIANA.g, SCIANA.h * 0.35, SCIANA.g); b.position.set(0, (SCIANA.h * 0.35) / 2, d / 2); // przednia niska, żeby widzieć środek
      c.scale.set(SCIANA.g, SCIANA.h, d); c.position.set(-w / 2, SCIANA.h / 2, 0);
      e.scale.set(SCIANA.g, SCIANA.h * 0.35, d); e.position.set(w / 2, (SCIANA.h * 0.35) / 2, 0);
      for (const { m, r, sx, sz, odsun = 0.1 } of meble) {
        m.scale.set(r[0], r[1], r[2]);
        m.position.set(sx * (w / 2 - odsun - r[0] / 2), r[1] / 2, sz * (d / 2 - odsun - r[2] / 2));
      }
      czlowiek.position.set(-w * 0.05, 0, d * 0.12);
    };

    const rozmiar = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      kamera.aspect = el.clientWidth / el.clientHeight;
      kamera.updateProjectionMatrix();
    };
    rozmiar();
    const ro = new ResizeObserver(rozmiar);
    ro.observe(el);
    let widoczna = false;
    const io = new IntersectionObserver(([w]) => (widoczna = w.isIntersecting), { threshold: 0.05 });
    io.observe(el);

    let klatka = 0;
    const petla = () => {
      klatka = requestAnimationFrame(petla);
      if (!widoczna) return;
      const k = cichy ? 1 : 0.09;
      teraz.w += (cel.current.w - teraz.w) * k;
      teraz.d += (cel.current.d - teraz.d) * k;
      const dl = kamera.position.length();
      kamera.position.setLength(dl + (odleglosc - dl) * (cichy ? 1 : 0.06));
      uloz();
      ster.update();
      renderer.render(scena, kamera);
    };
    petla();

    return () => {
      cancelAnimationFrame(klatka);
      ro.disconnect();
      io.disconnect();
      ster.dispose();
      scena.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [miasta]);

  return (
    <div className="nrm">
      <div className="nrm-wybor" role="group" aria-label="Miasto">
        {miasta.map((m) => (
          <button key={m.slug} type="button" className="nrm-guzik" aria-pressed={m.slug === wybrane} onClick={() => setWybrane(m.slug)}>
            {m.nazwa}
          </button>
        ))}
      </div>
      <div className="nrm-scena-rama">
        <div
          ref={pudlo}
          className="nrm-scena"
          role="img"
          aria-label={`Mieszkanie 3D: za ${tys(budzet)} w ${rok} roku kupisz w miejscu ${miasto.nazwa} ok. ${pole} m², meble i człowiek w prawdziwej skali.`}
        />
        <p className="nrm-metraz">
          {pole}
          <span> m²</span>
        </p>
      </div>
      <div className="nrm-wybor nrm-budzet" role="group" aria-label="Budżet">
        {BUDZETY.map((b) => (
          <button key={b} type="button" className="nrm-guzik" aria-pressed={b === budzet} onClick={() => setBudzet(b)}>
            {tys(b)}
          </button>
        ))}
      </div>
    </div>
  );
}
