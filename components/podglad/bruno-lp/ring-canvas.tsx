"use client";

import { useEffect, useRef } from "react";

// Oddychający opalizujący pierścień z bio-digital.html: jeden shader na całym tle hero.
// Render w zmniejszonej rozdzielczości (pierścień jest miękki), pauza poza ekranem.

const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
const FS = `
precision highp float;
uniform vec2 uRes; uniform float uT; uniform vec2 uM;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
float arc(float a, float center, float width){ float d = atan(sin(a-center), cos(a-center)); return exp(-d*d/(width*width)); }
void main(){
  vec2 uv = (gl_FragCoord.xy - .5*uRes) / uRes.y;
  uv.y -= 0.03;
  uv += uM * 0.015;
  float t = uT;
  float breathe = 0.5 + 0.5*sin(t*0.6);
  float n = fbm(uv*2.2 + vec2(t*0.05, -t*0.04));
  float ang = atan(uv.y, uv.x);
  float sc = min(1.0, (uRes.x/uRes.y)*0.8 + 0.25);
  float r0 = sc*(0.305 + 0.012*breathe) + 0.03*(n-0.5) + 0.008*sin(ang*3.0 + t*0.4);
  float r = length(uv);
  float d = r - r0;
  float w = sc*(0.05 + 0.012*breathe);
  vec3 col = mix(vec3(0.965), vec3(0.905), smoothstep(0.0, 0.9, r));
  col = mix(col, vec3(0.985), 0.22*exp(-pow(r/(r0*0.95),4.0)));
  col -= 0.03*exp(-pow((d-0.07*sc)/(0.07*sc), 2.0));
  float body = exp(-d*d/(w*w));
  col = mix(col, vec3(1.0), 0.6*body);
  float rot = t*0.07;
  float rim = exp(-pow((d-0.015*sc)/(w*0.5), 2.0));
  vec3 red   = vec3(0.95,0.42,0.36);
  vec3 blue  = vec3(0.36,0.62,0.98);
  vec3 green = vec3(0.45,0.86,0.58);
  float aR = arc(ang, 0.85 + rot, 0.26);
  float aB = arc(ang, -0.4 + rot, 0.55);
  float aG = arc(ang, -1.75 + rot, 0.22);
  float aW = arc(ang, 2.6 + rot, 0.9);
  vec3 tint = red*aR + blue*aB + green*aG;
  float tAmt = clamp(aR+aB+aG, 0.0, 1.0);
  float k = rim * (0.36 + 0.16*breathe) * (0.75 + 0.5*fbm(vec2(ang*2.0, t*0.2)));
  col = mix(col, tint/(max(tAmt,0.001)), k*tAmt*0.85);
  col += 0.03*aW*rim;
  col += (hash(gl_FragCoord.xy + t) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;

export default function RingCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const gl = c.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) {
      c.style.display = "none";
      return;
    }

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vs = shader(gl.VERTEX_SHADER, VS);
    const fs = shader(gl.FRAGMENT_SHADER, FS);
    const pr = gl.createProgram()!;
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      c.style.display = "none";
      return;
    }
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(pr, "uRes");
    const uT = gl.getUniformLocation(pr, "uT");
    const uM = gl.getUniformLocation(pr, "uM");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mx = 0,
      my = 0,
      tx = 0,
      ty = 0;
    const t0 = performance.now();
    let raf = 0;
    let visible = true;

    const draw = () => {
      mx += (tx - mx) * 0.04;
      my += (ty - my) * 0.04;
      gl.uniform2f(uRes, c.width, c.height);
      gl.uniform1f(uT, reduce ? 2.0 : (performance.now() - t0) / 1000);
      gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = () => {
      draw();
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

    const size = () => {
      const s = Math.min(window.devicePixelRatio, 1.5) * 0.75;
      c.width = Math.max(1, Math.round(c.clientWidth * s));
      c.height = Math.max(1, Math.round(c.clientHeight * s));
      gl.viewport(0, 0, c.width, c.height);
      if (reduce) draw();
    };
    const ro = new ResizeObserver(size);
    ro.observe(c);
    size();

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(c);
    if (reduce) draw();
    else start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.deleteBuffer(buf);
      gl.deleteProgram(pr);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Bez loseContext: StrictMode montuje efekt drugi raz na tym samym canvasie.
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
