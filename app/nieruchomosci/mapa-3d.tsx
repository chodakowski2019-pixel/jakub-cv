"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { zl } from "@/lib/nieruchomosci/format";

// 26.11.2026 (USER_001: „mapa 3D Polski”, „mało tekstu, wszystko zwizualizowane”).
// Każdy powiat = bryła. Wysokość = mediana ceny za m² (GUS), od zera, ta sama skala dla wszystkich lat.
// Kolor = ta sama cena (ciemny → limonka). Lata 2010-2025 lecą same po wejściu na ekran, potem suwak.
// Najechanie = nazwa i cena, kliknięcie = podstrona powiatu. Reduced motion: od razu ostatni rok, bez ruchu kamery.

type Geo = { powiaty: { slug: string; p: number[][][] }[]; wojewodztwa: { p: number[][] }[] };
export type Ceny = Record<string, { nazwa: string; m2: (number | null)[] }>;

const WYS_MAX = 170; // km nad mapą dla najwyższej ceny (szerokość Polski ok. 690 km)
const CIEMNY = new THREE.Color("#1d1f0d");
const JASNY = new THREE.Color("#e9f542");
const BRAK = new THREE.Color("#3a3a3a");

export function Mapa3D({ ceny, lata, baza }: { ceny: Ceny; lata: number[]; baza: string }) {
  const pudlo = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [rokIdx, setRokIdx] = useState(lata.length - 1);
  const [gra, setGra] = useState(false);
  const [wskazany, setWskazany] = useState<{ slug: string; x: number; y: number } | null>(null);
  const stan = useRef({ rokIdx: lata.length - 1, ustaw: (_: number) => {} });

  useEffect(() => {
    const el = pudlo.current;
    if (!el) return;
    let zniszczone = false;
    const cichy = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dotyk = window.matchMedia("(pointer: coarse)").matches;
    const wszystkie = Object.values(ceny).flatMap((c) => c.m2.filter((v): v is number => v != null));
    const max = Math.max(...wszystkie);
    const min = Math.min(...wszystkie);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor("#0b0b0b");
    el.appendChild(renderer.domElement);

    const scena = new THREE.Scene();
    scena.fog = new THREE.Fog("#0b0b0b", 900, 1700);
    const kamera = new THREE.PerspectiveCamera(32, 1, 1, 4000);
    kamera.position.set(0, 560, 760);
    const ster = new OrbitControls(kamera, renderer.domElement);
    ster.enableDamping = true;
    ster.enablePan = false;
    ster.minDistance = 300;
    ster.maxDistance = 1900;
    ster.maxPolarAngle = Math.PI * 0.42;
    ster.enableRotate = !dotyk; // na telefonie palec przewija stronę, nie obraca mapy
    ster.enableZoom = !dotyk;
    ster.target.set(0, 0, 95);

    scena.add(new THREE.HemisphereLight("#ffffff", "#0b0b0b", 0.9));
    const slonce = new THREE.DirectionalLight("#ffffff", 2.8);
    slonce.position.set(-300, 600, 400);
    scena.add(slonce);

    const grupa = new THREE.Group();
    grupa.rotation.x = -Math.PI / 2; // mapa leży, bryły rosną w górę
    scena.add(grupa);

    const bryly: { mesh: THREE.Mesh; slug: string; mat: THREE.MeshStandardMaterial }[] = [];
    let wysokosci: number[] = [];

    import("@/lib/nieruchomosci/mapa.json").then((mod) => {
      if (zniszczone) return;
      const geo = mod.default as unknown as Geo;
      const pierscien = (r: number[]) => {
        const pts: THREE.Vector2[] = [];
        for (let i = 0; i < r.length; i += 2) pts.push(new THREE.Vector2(r[i], r[i + 1]));
        return pts;
      };
      for (const pw of geo.powiaty) {
        const ksztalty = pw.p.map((wiel) => {
          const s = new THREE.Shape(pierscien(wiel[0]));
          s.holes = wiel.slice(1).map((h) => new THREE.Path(pierscien(h)));
          return s;
        });
        const g = new THREE.ExtrudeGeometry(ksztalty, { depth: 1, bevelEnabled: false });
        const mat = new THREE.MeshStandardMaterial({ color: BRAK, roughness: 0.55, metalness: 0.05 });
        const mesh = new THREE.Mesh(g, mat);
        mesh.userData.slug = pw.slug;
        grupa.add(mesh);
        bryly.push({ mesh, slug: pw.slug, mat });
      }
      // Kontury województw na dnie, cienka jasna linia.
      const liniaMat = new THREE.LineBasicMaterial({ color: "#5c5c58", transparent: true, opacity: 0.7 });
      for (const w of geo.wojewodztwa)
        for (const r of w.p) {
          const g = new THREE.BufferGeometry().setFromPoints(pierscien(r).map((v) => new THREE.Vector3(v.x, v.y, 0.3)));
          grupa.add(new THREE.LineLoop(g, liniaMat));
        }
      wysokosci = bryly.map(() => 0.01);
      ustawRok(stan.current.rokIdx, true);
    });

    const cel: number[] = [];
    function ustawRok(i: number, odRazu = false) {
      stan.current.rokIdx = i;
      bryly.forEach((b, k) => {
        const v = ceny[b.slug]?.m2[i] ?? null;
        cel[k] = v == null ? 0.6 : Math.max(0.6, (v / max) * WYS_MAX);
        // Kolor liniowo od najtańszego do najdroższego powiatu (wszystkie lata): tanie ciemne, drogie świecą.
        b.mat.color.copy(v == null ? BRAK : CIEMNY.clone().lerp(JASNY, Math.min(1, Math.max(0, (v - min) / (max - min))) ** 0.85));
        if (odRazu && cichy) wysokosci[k] = cel[k];
      });
    }
    stan.current.ustaw = (i) => ustawRok(i);

    const rozmiar = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      kamera.aspect = w / h;
      // Na wąskim ekranie kamera dalej, żeby cała Polska weszła w kadr.
      const d = w < 640 ? 1650 : 1180;
      kamera.position.setLength(d);
      kamera.updateProjectionMatrix();
    };
    rozmiar();
    const ro = new ResizeObserver(rozmiar);
    ro.observe(el);

    // Wskazywanie powiatu.
    const promien = new THREE.Raycaster();
    const mysz = new THREE.Vector2();
    let podswietlony: (typeof bryly)[number] | null = null;
    const wskaz = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mysz.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      promien.setFromCamera(mysz, kamera);
      const traf = promien.intersectObjects(bryly.map((b) => b.mesh))[0];
      const b = traf ? bryly.find((x) => x.mesh === traf.object) ?? null : null;
      if (podswietlony && podswietlony !== b) podswietlony.mat.emissive.setHex(0x000000);
      podswietlony = b;
      if (b) b.mat.emissive.setHex(0x3a3a3a);
      el.style.cursor = b ? "pointer" : "grab";
      setWskazany(b ? { slug: b.slug, x: e.clientX - r.left, y: e.clientY - r.top } : null);
      return b;
    };
    let start = { x: 0, y: 0 };
    const dol = (e: PointerEvent) => (start = { x: e.clientX, y: e.clientY });
    const gora = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return; // to był obrót, nie kliknięcie
      const b = wskaz(e);
      if (b && !dotyk) router.push(`${baza}/${b.slug}`);
    };
    renderer.domElement.addEventListener("pointermove", wskaz);
    renderer.domElement.addEventListener("pointerdown", dol);
    renderer.domElement.addEventListener("pointerup", gora);
    renderer.domElement.addEventListener("pointerleave", () => setWskazany(null));

    let widoczna = false;
    const io = new IntersectionObserver(([w]) => (widoczna = w.isIntersecting), { threshold: 0.05 });
    io.observe(el);

    let klatka = 0;
    let czas = 0;
    const petla = (t: number) => {
      klatka = requestAnimationFrame(petla);
      if (!widoczna) return;
      const dt = Math.min(0.05, (t - czas) / 1000 || 0);
      czas = t;
      bryly.forEach((b, k) => {
        wysokosci[k] += (cel[k] - wysokosci[k]) * (cichy ? 1 : Math.min(1, dt * 6));
        b.mesh.scale.z = wysokosci[k];
      });
      if (!cichy && !dotyk) grupa.rotation.z = Math.sin(t / 9000) * 0.06; // lekkie kołysanie
      ster.update();
      renderer.render(scena, kamera);
    };
    klatka = requestAnimationFrame(petla);

    return () => {
      zniszczone = true;
      cancelAnimationFrame(klatka);
      ro.disconnect();
      io.disconnect();
      ster.dispose();
      bryly.forEach((b) => {
        b.mesh.geometry.dispose();
        b.mat.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [ceny, baza, router]);

  // Lata lecą same raz, gdy mapa wejdzie na ekran (bez reduced motion).
  useEffect(() => {
    const el = pudlo.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([w]) => {
        if (w.isIntersecting) {
          setRokIdx(0);
          setGra(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    stan.current.ustaw(rokIdx);
    if (!gra) return;
    if (rokIdx >= lata.length - 1) {
      setGra(false);
      return;
    }
    const t = setTimeout(() => setRokIdx((i) => i + 1), rokIdx === 0 ? 900 : 420);
    return () => clearTimeout(t);
  }, [rokIdx, gra, lata.length]);

  const info = wskazany ? ceny[wskazany.slug] : null;
  return (
    <div className="nr3d">
      <div ref={pudlo} className="nr3d-scena" role="img" aria-label={`Mapa 3D Polski: wysokość i jasność powiatu to mediana ceny za metr mieszkania w ${lata[rokIdx]} roku, dane GUS.`} />
      <p className="nr3d-rok" aria-live="polite">
        {lata[rokIdx]}
      </p>
      {info && wskazany ? (
        <div className="nr3d-dymek" style={{ left: wskazany.x, top: wskazany.y }}>
          <span>{info.nazwa}</span>
          <strong>{zl(info.m2[rokIdx])}/m²</strong>
        </div>
      ) : null}
      <div className="nr3d-pasek">
        <button
          type="button"
          className="nr3d-graj"
          aria-label={gra ? "Zatrzymaj" : "Odtwórz lata"}
          onClick={() => {
            if (gra) return setGra(false);
            if (rokIdx >= lata.length - 1) setRokIdx(0);
            setGra(true);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            {gra ? <path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor" /> : <path d="M3 1.5v11l9.5-5.5z" fill="currentColor" />}
          </svg>
        </button>
        <input
          type="range"
          min={0}
          max={lata.length - 1}
          value={rokIdx}
          aria-label="Rok"
          onChange={(e) => {
            setGra(false);
            setRokIdx(Number(e.target.value));
          }}
        />
        <div className="nr3d-skala" aria-hidden>
          <span>taniej</span>
          <i />
          <span>drożej</span>
        </div>
      </div>
    </div>
  );
}
