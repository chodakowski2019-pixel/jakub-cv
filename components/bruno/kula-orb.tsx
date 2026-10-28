"use client";

import { useEffect, useRef } from "react";

// Kula Bruno w stylu orba z elevenlabs.io (USER_001 15.10): kula z płynącym gradientem, ziarno, cały czas w ruchu.
// Własny shader WebGL (bez bibliotek). Kolor bazowy = kolor typu klienta (decyzja 2.10), jasny i ciemny ton liczone z niego.
// tempo: „czeka” wolno, „mowi” szybciej i jaśniej, „slucha” spokojnie.

export type TempoKuli = "czeka" | "mowi" | "slucha";

const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p; gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `
precision highp float;
varying vec2 uv;
uniform float t;
uniform float energia;
uniform vec3 jasny;
uniform vec3 baza;
uniform vec3 ciemny;

float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6. - 15.) + 10.);
  return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for (int k = 0; k < 4; k++) { v += a * n(p); p = p * 2.02 + vec2(1.7, 9.2); a *= .5; }
  return v;
}

void main(){
  float r = length(uv);
  if (r > 1.) { gl_FragColor = vec4(0.); return; }
  // współrzędne na powierzchni kuli: duże, miękkie plamy koloru „opływają” brzegi jak na 3D
  float z = sqrt(1. - r * r);
  vec2 s = uv / (z + .9);
  float tt = t * (.09 + energia * .2);
  vec2 q = vec2(fbm(s * .7 + vec2(tt, -tt * .7)), fbm(s * .7 + vec2(5.2 - tt * .8, 1.3 + tt)));
  float w = fbm(s * .8 + q * 1.6 + vec2(tt * .5, tt * .3));
  float w2 = fbm(s * 1.1 - q * 1.2 - vec2(tt * .4, -tt * .6));

  // fbm siedzi wąsko koło 0,5: rozciągamy kontrast, żeby były duże jasne i ciemne plamy jak u ElevenLabs
  float v = clamp((w - .6) * 3.2 + .5, 0., 1.);
  float v2 = clamp((w2 - .58) * 3.2 + .5, 0., 1.);
  vec3 col = mix(ciemny, baza, smoothstep(.05, .45, v));
  col = mix(col, jasny, smoothstep(.3, .8, v * .45 + v2 * .6));
  // miękkie światło z lewej góry, delikatny cień w prawym dole, jasna obwódka jak u ElevenLabs
  float swiatlo = dot(normalize(vec3(uv, z)), normalize(vec3(-.45, .55, .7)));
  col *= .82 + .26 * swiatlo + energia * .06;
  col = mix(col, jasny, pow(1. - z, 4.) * .3);
  // ziarno
  col += (h(gl_FragCoord.xy + fract(t * 13.) * 91.7) - .5) * .06;

  float a = smoothstep(1., .985, r);
  gl_FragColor = vec4(clamp(col, 0., 1.) * a, a);
}`;

function rgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const p = m.length === 3 ? m.split("").map((c) => c + c).join("") : m.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(p.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export default function KulaOrb({
  kolor = "#f08a2b",
  tempo = "czeka",
  className,
  jasny,
  ciemny,
}: {
  kolor?: string;
  tempo?: TempoKuli;
  /** 28.10: własne tony (motyw Rinesk, limonka): wzór z koloru klienta daje dla limonki brązowy cień. */
  jasny?: string;
  ciemny?: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cel = useRef(0);
  cel.current = tempo === "mowi" ? 1 : tempo === "slucha" ? 0.35 : 0;

  useEffect(() => {
    const cv = ref.current;
    const gl = cv?.getContext("webgl", { premultipliedAlpha: true, antialias: true });
    if (!cv || !gl) return;

    const sh = (typ: number, zrodlo: string) => {
      const x = gl.createShader(typ)!;
      gl.shaderSource(x, zrodlo);
      gl.compileShader(x);
      return x;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (nazwa: string) => gl.getUniformLocation(prog, nazwa);
    const [r, g, b] = rgb(kolor);
    gl.uniform3f(u("baza"), r, g, b);
    const [jr, jg, jb] = jasny ? rgb(jasny) : [r + (1 - r) * 0.72, g + (1 - g) * 0.62, b + (1 - b) * 0.45];
    const [cr, cg, cb] = ciemny ? rgb(ciemny) : [r * 0.72, g * 0.26, b * 0.22];
    gl.uniform3f(u("jasny"), jr, jg, jb);
    gl.uniform3f(u("ciemny"), cr, cg, cb);

    const rozmiar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
    };
    rozmiar();
    const ro = new ResizeObserver(rozmiar);
    ro.observe(cv);

    const bezRuchu = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let energia = 0;
    let czas = 0;
    let poprz = performance.now();
    let raf = 0;
    const klatka = (teraz: number) => {
      const dt = Math.min(0.05, (teraz - poprz) / 1000);
      poprz = teraz;
      energia += (cel.current - energia) * Math.min(1, dt * 4);
      czas += dt * (1 + energia * 1.5);
      gl.uniform1f(u("t"), czas + 20);
      gl.uniform1f(u("energia"), energia);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!bezRuchu) raf = requestAnimationFrame(klatka);
    };
    raf = requestAnimationFrame(klatka);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [kolor, jasny, ciemny]);

  return <canvas ref={ref} className={className} style={{ width: "100%", height: "100%", display: "block" }} aria-hidden />;
}
