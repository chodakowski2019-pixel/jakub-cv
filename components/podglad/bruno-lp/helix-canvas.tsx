"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Metalowa helisa DNA z cząsteczkami z adaptive-learning.html.
// Pełne sprzątanie przy odmontowaniu, pauza poza ekranem, statyczna klatka przy reduced motion.

const H = 24,
  R = 1.4,
  TURNS = 3.3,
  SEG = 700,
  RUNGS = 34;
const PH2 = Math.PI * 0.82;

function strandPoint(t: number, phase: number) {
  const a = t * TURNS * Math.PI * 2 + phase;
  return new THREE.Vector3(Math.cos(a) * R, (t - 0.5) * H, Math.sin(a) * R);
}

class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private phase: number) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    return target.copy(strandPoint(t, this.phase));
  }
}

const VERT = `
attribute vec3 aDir; attribute vec4 aRnd;
uniform float uTime, uSpin, uPR, uScale;
varying float vA; varying float vOrange; varying float vRing;
void main(){
  float c = cos(uSpin), s = sin(uSpin);
  vec3 p = position;
  p = vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);
  float side = smoothstep(-0.9, 1.4, p.x + 0.35*p.z);
  float wave = 0.55 + 0.45*sin(p.y*0.55 - uTime*0.35 + aRnd.w*1.5);
  float f = side * wave;
  f = pow(f, 1.4) * (0.25 + 1.0*aRnd.x);
  float drift = fract(aRnd.y + uTime*0.05*(0.4+aRnd.x));
  vec3 off = aDir * f * (0.4 + 2.6*drift);
  off.y += f * drift * 1.2;
  off += 0.08*f*vec3(sin(uTime*1.3+aRnd.y*30.), cos(uTime*1.1+aRnd.x*30.), 0.);
  p += off;
  vec4 mv = modelViewMatrix * vec4(p,1.);
  gl_Position = projectionMatrix * mv;
  float sz = mix(1.4, 4.2, aRnd.y*aRnd.y) * (0.5 + f);
  gl_PointSize = sz * uPR * uScale * (26. / -mv.z);
  vA = max(smoothstep(0.05, 0.25, f) * (1. - drift*0.85), 0.22*side) * (0.35 + 0.65*aRnd.x);
  vOrange = aRnd.z;
  vRing = step(0.8, aRnd.y);
}`;

const FRAG = `
varying float vA; varying float vOrange; varying float vRing;
void main(){
  vec2 q = gl_PointCoord - .5; float d = length(q);
  float disc = smoothstep(.5, .38, d);
  float ring = smoothstep(.5,.42,d) * smoothstep(.22,.32,d);
  float m = mix(disc, ring, vRing);
  vec3 col = mix(vec3(.55,.57,.6), vec3(1.,.55,.16), vOrange);
  float a = m * vA * mix(.75, 1., vOrange);
  if (a < .01) discard;
  gl_FragColor = vec4(col, a);
}`;

export default function HelixCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      canvas.style.display = "none";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const disposables: { dispose: () => void }[] = [];
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envRT = pmrem.fromScene(room, 0.04);
    scene.environment = envRT.texture;
    disposables.push(envRT, pmrem, room);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 26);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-6, 8, 10);
    scene.add(key);
    const warm = new THREE.PointLight(0xff8a2a, 140, 30, 1.6);
    warm.position.set(4, 8, 4);
    scene.add(warm);
    const warm2 = new THREE.PointLight(0xffa04a, 22, 22, 1.6);
    warm2.position.set(3, -1, 3);
    scene.add(warm2);

    const tilt = new THREE.Group();
    const spin = new THREE.Group();
    tilt.add(spin);
    scene.add(tilt);

    // faktura liny jako bump map
    const tc = document.createElement("canvas");
    tc.width = 64;
    tc.height = 512;
    const tx = tc.getContext("2d")!;
    tx.fillStyle = "#808080";
    tx.fillRect(0, 0, 64, 512);
    for (let i = 0; i < 512; i += 4) {
      const v = i % 8 ? 255 : 0;
      tx.fillStyle = `rgba(${v},${v},${v},.25)`;
      tx.fillRect(0, i, 64, 2);
    }
    for (let i = 0; i < 900; i++) {
      tx.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
      tx.fillRect(Math.random() * 64, Math.random() * 512, 2, 1);
    }
    const bump = new THREE.CanvasTexture(tc);
    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
    bump.repeat.set(1, 18);
    disposables.push(bump);

    const metal = new THREE.MeshPhysicalMaterial({
      color: 0x8f949b,
      metalness: 0.9,
      roughness: 0.36,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      bumpMap: bump,
      bumpScale: 2.2,
      envMapIntensity: 1.1,
    });
    disposables.push(metal);
    [0, PH2].forEach((ph) => {
      const g = new THREE.TubeGeometry(new HelixCurve(ph), SEG, 0.17, 20, false);
      disposables.push(g);
      spin.add(new THREE.Mesh(g, metal));
    });

    const rungMat = metal.clone();
    rungMat.color.set(0x9ea2a8);
    rungMat.bumpScale = 0.8;
    disposables.push(rungMat);
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < RUNGS; i++) {
      const t = (i + 0.5) / RUNGS;
      const a = strandPoint(t, 0),
        b = strandPoint(t, PH2);
      const g = new THREE.CylinderGeometry(0.075, 0.075, a.distanceTo(b) * 0.96, 12, 1);
      disposables.push(g);
      const m = new THREE.Mesh(g, rungMat);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
      spin.add(m);
    }

    // cząsteczki: na niciach, rozpadają się z jednej strony (liczone w shaderze)
    const N = window.innerWidth < 720 ? 14000 : 34000;
    const base = new Float32Array(N * 3),
      dir = new Float32Array(N * 3),
      rnd = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      let p: THREE.Vector3;
      if (Math.random() < 0.82) {
        p = strandPoint(Math.random(), Math.random() < 0.5 ? 0 : PH2);
        p.x += (Math.random() - 0.5) * 0.36;
        p.z += (Math.random() - 0.5) * 0.36;
        p.y += (Math.random() - 0.5) * 0.2;
      } else {
        const t = (Math.floor(Math.random() * RUNGS) + 0.5) / RUNGS;
        p = strandPoint(t, 0).lerp(strandPoint(t, PH2), Math.random());
        p.y += (Math.random() - 0.5) * 0.12;
      }
      base.set([p.x, p.y, p.z], i * 3);
      const d = new THREE.Vector3(Math.random() * 1.2 + 0.2, (Math.random() - 0.35) * 1.4, (Math.random() - 0.5) * 1.2).normalize();
      dir.set([d.x, d.y, d.z], i * 3);
      rnd.set([Math.random(), Math.random(), Math.random() < 0.07 ? 1 : 0, Math.random()], i * 4);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(base, 3));
    pg.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
    pg.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 4));
    const pm = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSpin: { value: 0 },
        uPR: { value: renderer.getPixelRatio() },
        uScale: { value: 1 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    disposables.push(pg, pm);
    tilt.add(new THREE.Points(pg, pm));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mx = 0,
      my = 0;
    const t0 = performance.now();
    let raf = 0;
    let visible = true;

    const render = () => {
      const t = (performance.now() - t0) / 1000;
      const sp = reduce ? 0.6 : t * 0.22;
      spin.rotation.y = sp;
      pm.uniforms.uSpin.value = sp;
      pm.uniforms.uTime.value = reduce ? 0 : t;
      camera.position.x += (mx * 1.6 - camera.position.x) * 0.03;
      camera.position.y += (-my * 1.0 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      warm.position.x = 4 + Math.sin(t * 0.4) * 2;
      renderer.render(scene, camera);
    };
    const loop = () => {
      render();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce || raf || !visible) return;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const layout = () => {
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const mobile = w < 720;
      tilt.rotation.z = mobile ? 0.22 : 0.26;
      tilt.rotation.x = 0.12;
      const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const viewW = viewH * camera.aspect;
      tilt.position.x = mobile ? 1.4 : -viewW * 0.015;
      tilt.position.y = viewH * 0.06;
      tilt.scale.setScalar(mobile ? 0.62 : Math.min(1.15, Math.max(0.85, h / 1000)));
      pm.uniforms.uScale.value = h / 900;
      if (reduce) render();
    };
    const ro = new ResizeObserver(layout);
    ro.observe(canvas);
    layout();

    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    if (reduce) render();
    else start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      disposables.forEach((d) => d.dispose());
      scene.environment = null;
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
