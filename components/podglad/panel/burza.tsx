"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Niebo burzowe + pole (WebGL) i błyskawice (canvas 2D), port 1:1 z forecast-center.html.
// Pełne sprzątanie przy odmontowaniu: rAF, timery, nasłuch, kontekst WebGL.

const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FS = `
precision highp float;
uniform vec2 r; uniform float t; uniform float flash; uniform vec2 fpos;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<6;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }
float fbm3(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<3;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / r; float asp = r.x / r.y;
  float hz = .28;
  vec3 col;
  float trees = hz + .006 + fbm3(vec2(uv.x*38., 2.))*.028 + noise(vec2(uv.x*160.,7.))*.006;
  if (uv.y > hz) {
    float h = (uv.y - hz) / (1. - hz);
    vec3 sky = mix(vec3(.86,.74,.48), vec3(.16,.25,.25), smoothstep(0., .3, h));
    sky = mix(sky, vec3(.04,.08,.09), smoothstep(.25, .9, h));
    sky += vec3(.55,.42,.2) * exp(-pow((uv.x - .86) * 2.6, 2.) - h * 4.);
    sky += vec3(.1,.2,.2) * exp(-pow((uv.x - .45) * 3., 2.) - pow((h - .95) * 4., 2.));
    vec2 c = vec2(uv.x * asp * .95 + t * .008, pow(h, .8) * 1.8);
    vec2 w = vec2(fbm(c * .8 + vec2(0., t * .012)), fbm(c * .8 + vec2(5.2, 1.3) - vec2(t * .01, 0.)));
    vec2 q = c * 1.5 + 1.3 * w;
    float d = fbm(q);
    float d2 = fbm(q + vec2(-.07, -.11));
    float base = .3 + (d - .5) * .35 + .07 * sin(uv.x * 5. + 1.);
    float mass = smoothstep(base, base + .07, h);
    mass *= 1. - .55 * smoothstep(.62, 1., uv.x) * smoothstep(.55, 1., h);
    mass *= 1. - .6 * smoothstep(.55, .95, uv.x) * smoothstep(.55, .3, h);
    float dens = mass * smoothstep(.2, .42, d);
    dens = max(dens, smoothstep(.58, .82, d) * .55 * smoothstep(.15, .4, h));
    float lit = clamp((d - d2) * 9. + .4, 0., 1.);
    float under = smoothstep(base + .22, base + .02, h);
    vec3 dark = vec3(.015, .03, .035);
    vec3 lite = vec3(.42, .55, .54);
    vec3 cc = mix(dark, lite, pow(lit, 2.6) * (.5 + .5 * smoothstep(.4, 1., h)));
    cc = mix(cc, vec3(.05,.12,.12), smoothstep(.75, 1., h) * .5);
    cc *= 1. - under * .5;
    cc *= mix(1., .35, smoothstep(.45, .75, d));
    cc += vec3(.5,.42,.28) * pow(lit, 3.) * smoothstep(.6, .95, uv.x) * .35;
    col = mix(sky, cc, dens);
    float shaft = exp(-pow((uv.x - .76) * 5., 2.)) * smoothstep(.5, .02, h);
    float streak = noise(vec2(uv.x * 140. + uv.y * 30., uv.y * 3. - t * 6.));
    col = mix(col, vec3(.42,.42,.36), shaft * (.35 + .25 * streak));
    float fl = flash * exp(-length((uv - fpos) * vec2(asp, 1.)) * 2.4);
    col += fl * vec3(.75,.85,1.) * (.4 + dens * 1.2);
    col += flash * .06 * vec3(.8,.9,1.);
    if (uv.y < trees) col = mix(vec3(.05,.10,.06), vec3(.2,.26,.2), .25) * (1. + flash * .6);
  } else {
    float y = hz - uv.y;
    float z = 1. / (y + .015);
    float x = (uv.x - .55) * asp;
    float bend = sin(uv.x * 2.2 + 1.) * .12 * y * 4.;
    float rows = sin((x + bend) * z * 20.) * smoothstep(.01, .08, y);
    float plants = noise(vec2((x + bend) * z * 10., z * 9.));
    float patch = fbm3(vec2(x * z * .06, z * .045));
    vec3 g1 = vec3(.08,.19,.06), g2 = vec3(.21,.37,.10), g3 = vec3(.32,.42,.16);
    vec3 fc = mix(g1, g2, patch);
    fc = mix(fc, g3, smoothstep(.62, .8, patch) * .6);
    float rowMask = smoothstep(-.2, .7, rows);
    fc *= mix(.55, 1.15, rowMask * smoothstep(.0, .05, y) + (1. - smoothstep(.0, .05, y)) * .5);
    fc *= .78 + .42 * mix(.5, plants, smoothstep(.0, .06, y));
    fc = mix(fc, vec3(.18,.25,.18), smoothstep(.06, .0, y) * .6);
    float tl = smoothstep(.022, .008, y) * smoothstep(.0, .004, y);
    fc = mix(fc, vec3(.06,.12,.06), tl * (.6 + .4 * noise(vec2(uv.x * 90., 1.))));
    fc += vec3(.12,.1,.03) * exp(-pow((uv.x - .86) * 2.2, 2.)) * smoothstep(.15, .0, y);
    fc *= 1. + flash * .5;
    col = fc;
  }
  col = pow(col, vec3(.95));
  vec2 v = uv - .5; col *= 1. - dot(v, v) * .55;
  gl_FragColor = vec4(col, 1.);
}`;

export type BurzaApi = { uderz: (xFrac?: number) => void };

type Seg = { pts: [number, number][]; w: number };

const Burza = forwardRef<BurzaApi>(function Burza(_, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const boltRef = useRef<HTMLCanvasElement>(null);
  const uderzRef = useRef<(x?: number) => void>(() => {});
  useImperativeHandle(ref, () => ({ uderz: (x?: number) => uderzRef.current(x) }), []);

  useEffect(() => {
    const host = hostRef.current, bc = boltRef.current;
    if (!host || !bc) return;
    // Świeże płótno przy każdym montowaniu: po loseContext() stare płótno nie daje już kontekstu (StrictMode montuje dwa razy).
    const sky = document.createElement("canvas");
    sky.className = "sky";
    host.appendChild(sky);
    const ruch = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = sky.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    const bx = bc.getContext("2d");
    const SCALE = 0.75;
    let flash = 0, fpos: [number, number] = [0.5, 0.5], VW = 0, VH = 0, raf = 0;
    const timery = new Set<number>();
    const pozniej = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timery.delete(id); fn(); }, ms); timery.add(id); };
    const U: Record<string, WebGLUniformLocation | null> = {};
    let prog: WebGLProgram | null = null, buf: WebGLBuffer | null = null;
    const shadery: WebGLShader[] = [];
    if (gl) {
      const sh = (typ: number, src: string) => { const s = gl.createShader(typ)!; gl.shaderSource(s, src); gl.compileShader(s); shadery.push(s); return s; };
      prog = gl.createProgram();
      if (prog) {
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
        buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const l = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
        for (const k of ["r", "t", "flash", "fpos"]) U[k] = gl.getUniformLocation(prog, k);
      }
    }

    let pioruny: { segs: Seg[]; born: number }[] = [];
    const zrobPiorun = (x: number, y0: number, y1: number, w: number, glebia: number): Seg[] => {
      const pts: [number, number][] = [[x, y0]]; let cx = x, cy = y0; const segs: Seg[] = [];
      while (cy < y1) { cy += 8 + Math.random() * 18; cx += (Math.random() - 0.5) * 26; pts.push([cx, Math.min(cy, y1)]); }
      segs.push({ pts, w });
      if (glebia < 2) for (let i = 2; i < pts.length - 3; i++) if (Math.random() < 0.14) {
        const [px, py] = pts[i]; const br = zrobPiorun(px, py, py + (y1 - py) * (0.3 + Math.random() * 0.4), w * 0.5, glebia + 1);
        br.forEach((s) => { s.pts = s.pts.map(([a, b2], k) => [a + k * (Math.random() < 0.5 ? -6 : 6), b2] as [number, number]); segs.push(s); });
      }
      return segs;
    };
    const uderz = (xFrac?: number) => {
      if (!ruch) return;
      const male = VW < 860;
      const x = (xFrac ?? (male ? 0.2 + Math.random() * 0.6 : 0.3 + Math.random() * 0.4)) * VW;
      const y0 = VH * (0.44 + Math.random() * 0.08), y1 = VH * 0.72;
      pioruny.push({ segs: zrobPiorun(x, y0, y1, 2.2, 0), born: performance.now() });
      fpos = [x / VW, 1 - (y0 + 30) / VH];
      [1, 0.25, 0.9, 0.4, 0].forEach((v, i) => pozniej(() => { flash = Math.max(flash, v); }, i * 70));
    };
    uderzRef.current = uderz;
    const rysujPioruny = (now: number) => {
      if (!bx) return;
      bx.clearRect(0, 0, VW, VH);
      pioruny = pioruny.filter((b) => now - b.born < 700);
      for (const b of pioruny) {
        const age = (now - b.born) / 700, a = (1 - age) * (age < 0.1 || (age > 0.18 && age < 0.3) ? 1 : 0.55);
        for (const s of b.segs) {
          bx.beginPath(); s.pts.forEach(([x, y], i) => (i ? bx.lineTo(x, y) : bx.moveTo(x, y)));
          bx.strokeStyle = `rgba(190,220,255,${a * 0.35})`; bx.lineWidth = s.w * 5; bx.shadowColor = "rgba(180,210,255,.9)"; bx.shadowBlur = 24; bx.stroke();
          bx.strokeStyle = `rgba(255,255,255,${a})`; bx.lineWidth = s.w; bx.shadowBlur = 8; bx.stroke();
        }
      }
      bx.shadowBlur = 0;
    };

    const t0 = performance.now();
    const klatka = (now: number) => {
      flash *= 0.9;
      if (gl && prog) {
        gl.uniform2f(U.r, sky.width, sky.height); gl.uniform1f(U.t, (now - t0) * 0.001 + 40);
        gl.uniform1f(U.flash, flash); gl.uniform2f(U.fpos, fpos[0], fpos[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      rysujPioruny(now);
    };
    const petla = (now: number) => { klatka(now); raf = requestAnimationFrame(petla); };
    const rozmiar = () => {
      VW = window.innerWidth; VH = window.innerHeight;
      sky.width = Math.round(VW * SCALE); sky.height = Math.round(VH * SCALE);
      if (gl) gl.viewport(0, 0, sky.width, sky.height);
      const d = Math.min(2, window.devicePixelRatio || 1); bc.width = VW * d; bc.height = VH * d; bx?.setTransform(d, 0, 0, d, 0, 0);
      if (!ruch) klatka(performance.now());
    };
    rozmiar();
    window.addEventListener("resize", rozmiar);
    if (ruch) {
      raf = requestAnimationFrame(petla);
      const seria = () => pozniej(() => { uderz(); seria(); }, 3200 + Math.random() * 4800);
      seria();
      pozniej(() => uderz(0.46), 1400);
    }
    return () => {
      cancelAnimationFrame(raf);
      timery.forEach((id) => clearTimeout(id));
      window.removeEventListener("resize", rozmiar);
      uderzRef.current = () => {};
      if (gl) {
        if (buf) gl.deleteBuffer(buf);
        shadery.forEach((s) => gl.deleteShader(s));
        if (prog) gl.deleteProgram(prog);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      sky.remove();
    };
  }, []);

  return (
    <>
      <div ref={hostRef} aria-hidden />
      <canvas ref={boltRef} className="bolts" aria-hidden />
      <div className="shade" aria-hidden />
    </>
  );
});

export default Burza;
