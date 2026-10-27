"use client";

import { useEffect, useRef } from "react";

// 27.10 (USER_001: panel „w stylu Attis Broker”): sztormowe niebo i morze (WebGL), bez błyskawic,
// tylko rzadki, cichy rozbłysk w chmurach. Wzór kodu: burza.tsx. Pełne sprzątanie przy odmontowaniu.
// v2 (jasne chmury + liny mostu) ODRZUCONA 27.10 (USER_001: „tamto było lepsze”), wrócona v1 + złoto w CSS.

const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FS = `
precision highp float;
uniform vec2 r; uniform float t; uniform float flash; uniform vec2 fpos;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<6;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / r; float asp = r.x / r.y;
  float hz = .34;
  vec3 col;
  if (uv.y > hz) {
    float h = (uv.y - hz) / (1. - hz);
    vec3 sky = mix(vec3(.60,.62,.64), vec3(.14,.16,.19), smoothstep(0., .55, h));
    sky = mix(sky, vec3(.07,.08,.10), smoothstep(.5, 1., h));
    sky += vec3(.22,.19,.14) * exp(-pow((uv.x - .68) * 2.4, 2.) - h * 5.);
    vec2 c = vec2(uv.x * asp * .9 + t * .006, pow(h, .85) * 1.6);
    vec2 w = vec2(fbm(c * .8 + vec2(0., t * .01)), fbm(c * .8 + vec2(5.2, 1.3) - vec2(t * .008, 0.)));
    vec2 q = c * 1.4 + 1.2 * w;
    float d = fbm(q);
    float d2 = fbm(q + vec2(-.07, -.11));
    float base = .2 + (d - .5) * .3;
    float mass = smoothstep(base, base + .08, h);
    float dens = mass * smoothstep(.22, .48, d);
    dens = max(dens, smoothstep(.55, .8, d) * .5 * smoothstep(.1, .35, h));
    float lit = clamp((d - d2) * 9. + .45, 0., 1.);
    vec3 dark = vec3(.06, .07, .08);
    vec3 lite = vec3(.56, .58, .60);
    vec3 cc = mix(dark, lite, pow(lit, 2.2) * (.45 + .55 * smoothstep(.3, 1., h)));
    col = mix(sky, cc, dens);
    float fl = flash * exp(-length((uv - fpos) * vec2(asp, 1.)) * 2.4);
    col += fl * vec3(.9, .85, .7) * (.3 + dens);
  } else {
    float y = hz - uv.y;
    float z = 1. / (y + .02);
    float x = (uv.x - .5) * asp;
    float wv = fbm(vec2(x * z * 1.6 + t * .05, z * 1.1 - t * .25));
    float wv2 = noise(vec2(x * z * 6. + t * .3, z * 4. - t * .6));
    vec3 deep = vec3(.05, .07, .09);
    vec3 crest = vec3(.50, .54, .57);
    float foam = smoothstep(.62, .8, wv) * smoothstep(.0, .08, y);
    vec3 sea = mix(deep, vec3(.16, .20, .23), wv);
    sea = mix(sea, crest, foam * .6 + wv2 * .08);
    sea = mix(vec3(.45, .47, .49), sea, smoothstep(0., .06, y));
    sea += vec3(.14, .12, .08) * exp(-pow((uv.x - .68) * 2.4, 2.)) * smoothstep(.2, .0, y);
    sea *= 1. + flash * .4;
    col = sea;
  }
  col = pow(col, vec3(.98));
  vec2 v = uv - .5; col *= 1. - dot(v, v) * .6;
  gl_FragColor = vec4(col, 1.);
}`;

export default function Morze() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const cv = document.createElement("canvas");
    cv.className = "morze-sky";
    host.appendChild(cv);
    const ruch = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    const SCALE = 0.6;
    let flash = 0, fpos: [number, number] = [0.6, 0.75], raf = 0;
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
    // Cichy rozbłysk w chmurach (bez pioruna), co 9-16 s.
    const rozblysk = () => {
      fpos = [0.3 + Math.random() * 0.5, 0.6 + Math.random() * 0.3];
      [0.35, 0.12, 0.28, 0.1, 0].forEach((v, i) => pozniej(() => { flash = Math.max(flash, v); }, i * 90));
    };
    const t0 = performance.now();
    const klatka = (now: number) => {
      flash *= 0.92;
      if (gl && prog) {
        gl.uniform2f(U.r, cv.width, cv.height); gl.uniform1f(U.t, (now - t0) * 0.001 + 40);
        gl.uniform1f(U.flash, flash); gl.uniform2f(U.fpos, fpos[0], fpos[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    };
    const petla = (now: number) => { klatka(now); raf = requestAnimationFrame(petla); };
    const rozmiar = () => {
      cv.width = Math.round(window.innerWidth * SCALE); cv.height = Math.round(window.innerHeight * SCALE);
      if (gl) gl.viewport(0, 0, cv.width, cv.height);
      if (!ruch) klatka(performance.now());
    };
    rozmiar();
    window.addEventListener("resize", rozmiar);
    if (ruch) {
      raf = requestAnimationFrame(petla);
      const seria = () => pozniej(() => { rozblysk(); seria(); }, 9000 + Math.random() * 7000);
      seria();
    }
    return () => {
      cancelAnimationFrame(raf);
      timery.forEach((id) => clearTimeout(id));
      window.removeEventListener("resize", rozmiar);
      if (gl) {
        if (buf) gl.deleteBuffer(buf);
        shadery.forEach((s) => gl.deleteShader(s));
        if (prog) gl.deleteProgram(prog);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      cv.remove();
    };
  }, []);

  return <div ref={hostRef} className="morze" aria-hidden />;
}
