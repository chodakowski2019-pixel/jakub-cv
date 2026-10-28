"use client";

import { useEffect, useRef } from "react";

// Shader zorzy 1:1 z wzoru aurora-onboard.html. Czysty WebGL (bez three):
// jeden trójkąt na cały ekran + fragment shader. Pełne sprzątanie przy odmontowaniu.

const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FS = `precision highp float;
uniform vec2 R;uniform float T;uniform vec2 Z;
uniform vec3 C0,C1,C2,C3,C4,C5,C6;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/R;
  float asp=R.x/R.y;
  vec2 p=vec2(uv.x*asp,uv.y);
  float t=T*.045;
  vec2 q=vec2(fbm(p*1.3+vec2(t,-t*.6)),fbm(p*1.3+vec2(4.2-t*.7,1.3+t)));
  float w=fbm(p*1.8+q*1.6+vec2(0.,t*1.4));
  float cur=fbm(vec2(p.x*3.2+q.x*2.+t*1.5,p.y*.45-t*.4));
  float yz=Z.x+uv.y*(Z.y-Z.x);
  float y=yz+(w-.5)*.16+(cur-.5)*.04;
  vec3 c0=C0,c1=C1,c2=C2,c3=C3,c4=C4,c5=C5,c6=C6;
  vec3 col=c0;
  col=mix(col,c1,smoothstep(.0,.3,y));
  col=mix(col,c2,smoothstep(.28,.5,y));
  col=mix(col,c3,smoothstep(.48,.68,y));
  col=mix(col,c4,smoothstep(.66,.86,y));
  col=mix(col,c5,smoothstep(.86,.96,y));
  col=mix(col,c6,smoothstep(.95,1.06,y));
  float band=smoothstep(.4,.7,yz)*(1.-smoothstep(.75,1.,yz));
  float rib=pow(cur,2.2)*band;
  col+=c4*.7*rib*.3;
  col+=c5*.6*pow(w,3.)*band*.35;
  col=mix(col,col*vec3(1.06,1.,.88),smoothstep(.2,.8,fbm(p*.7+t)));
  float vg=smoothstep(1.25,.25,length((uv-vec2(.5,.55))*vec2(1.,1.2)));
  col*=mix(.82,1.,vg);
  float g=h(gl_FragCoord.xy+fract(T*7.)*vec2(91.7,37.3))-.5;
  col+=g*mix(.075,.035,smoothstep(.0,.7,uv.y));
  gl_FragColor=vec4(col,1.);
}`;

// 28.10: `predkosc` = mnożnik czasu (kula Bruno: czeka 1, słucha 1,8, mówi 3,2). Zmiana w locie, bez restartu shadera.
// `zakres` = jaki wycinek zorzy (0 = czerń na dole, 1 = jasny szczyt) wypełnia płótno; kula Bruno bierze [0.22, 1.04], żeby pomarańcz był w środku.
// 28.10: `kolory` = 7 barw od dołu (ciemno) do szczytu (jasno); domyślnie pomarańczowa zorza z rejestracji.
export const ZORZA_POMARANCZ = ["#050301", "#140a03", "#2e1606", "#6b3010", "#e07a24", "#fac78c", "#fff5e6"];
const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
export default function AuroraCanvas({ fallbackClass, predkosc = 1, zakres = [0, 1], kolory = ZORZA_POMARANCZ }: { fallbackClass: string; predkosc?: number; zakres?: [number, number]; kolory?: string[] }) {
  const paleta = kolory.join(",");
  const ref = useRef<HTMLCanvasElement>(null);
  const predkoscRef = useRef(predkosc);
  useEffect(() => {
    predkoscRef.current = predkosc;
  }, [predkosc]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const gl = c.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    const rodzic = c.parentElement;
    if (!gl) {
      rodzic?.classList.add(fallbackClass);
      return () => rodzic?.classList.remove(fallbackClass);
    }

    const sh = (typ: number, src: string) => {
      const o = gl.createShader(typ)!;
      gl.shaderSource(o, src);
      gl.compileShader(o);
      return o;
    };
    const vs = sh(gl.VERTEX_SHADER, VS);
    const fs = sh(gl.FRAGMENT_SHADER, FS);
    const pr = gl.createProgram()!;
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, "R");
    const uT = gl.getUniformLocation(pr, "T");
    const uZ = gl.getUniformLocation(pr, "Z");
    gl.uniform2f(uZ, zakres[0], zakres[1]);
    paleta.split(",").slice(0, 7).forEach((k, i) => { const [r, g, b] = hex(k); gl.uniform3f(gl.getUniformLocation(pr, `C${i}`), r, g, b); });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    // Czas shadera liczony przyrostowo, żeby zmiana prędkości nie skakała.
    let czas = 12;
    let poprz = t0;
    const rysuj = (now: number) => {
      czas += ((now - poprz) / 1000) * predkoscRef.current;
      poprz = now;
      gl.uniform2f(uR, c.width, c.height);
      gl.uniform1f(uT, reduce ? 12 : czas);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const rozmiar = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = c.getBoundingClientRect();
      c.width = Math.max(1, (r.width * d) | 0);
      c.height = Math.max(1, (r.height * d) | 0);
      gl.viewport(0, 0, c.width, c.height);
      if (reduce) rysuj(t0);
    };
    const ro = new ResizeObserver(rozmiar);
    ro.observe(c);
    rozmiar();

    const petla = (now: number) => {
      rysuj(now);
      raf = requestAnimationFrame(petla);
    };
    if (reduce) rysuj(t0);
    else raf = requestAnimationFrame(petla);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(pr);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [fallbackClass, zakres[0], zakres[1], paleta]);

  return <canvas ref={ref} aria-hidden />;
}
