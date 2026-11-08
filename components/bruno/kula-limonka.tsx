"use client";

import AuroraCanvas from "@/components/podglad/aurora/aurora-canvas";

// 28.10 (USER_001: „najlepiej wyglądała płynna, ale kolor zielony zostaje”): kula Bruno pod jasny motyw Rinesk.
// 8.11 (USER_001: „czy w środku może być bardziej płynna?”): zamiast poziomych pasów zorzy = własny shader cieczy:
// podwójnie zawinięty szum (domain warping), wir zależny od odległości od środka, załamanie jak w szklanej kuli,
// jasne smugi na grzbietach fal, bez ziarna. Te same uniformy co zorza (R, T, Z, C0-C6), więc AuroraCanvas go rysuje.
// Na tym szklany blik, ciemniejszy brzeg i cienka obwódka (efekt sfery). Wokół: cień i rozchodzące się pierścienie.
// Tempo: czeka (wolno), słucha, mówi (szybciej + puls). Style: motyw-rinesk.css (.kl-*).
export type TempoKuli = "czeka" | "slucha" | "mowi";
const PREDKOSC: Record<TempoKuli, number> = { czeka: 1, slucha: 1.8, mowi: 3.2 };
/** Wycinek palety w kuli: ciemna oliwka w zagłębieniach, limonka w środku, jasne grzbiety. */
const ZAKRES: [number, number] = [0.18, 1.02];
const LIMONKA = ["#1f2600", "#36420a", "#5c6d00", "#93a600", "#d4e000", "#eef76a", "#fbfdd0"];

/** 8.11: shader cieczy z parametrami (podgląd 5 wersji: /podglad/bruno-kule).
 * skala = wielkość plam (mniej = większe), zawin = siła zawijania, oktawy = ile drobnych detali, kontrast = rozrzut odcieni. */
export type ParamPlyn = { skala: number; zawin: number; oktawy: number; kontrast: number; jasnosc: number };
const f = (n: number) => n.toFixed(3);
export function fsPlyn({ skala, zawin, oktawy, kontrast, jasnosc }: ParamPlyn): string {
  return `precision highp float;
uniform vec2 R;uniform float T;uniform vec2 Z;
uniform vec3 C0,C1,C2,C3,C4,C5,C6;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
const mat2 M=mat2(1.6,1.2,-1.2,1.6);
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<${Math.round(oktawy)};i++){v+=a*n(p);p=M*p;a*=.5;}return v;}
vec3 pal(float y){
  vec3 c=C0;
  c=mix(c,C1,smoothstep(.0,.22,y));
  c=mix(c,C2,smoothstep(.18,.4,y));
  c=mix(c,C3,smoothstep(.36,.58,y));
  c=mix(c,C4,smoothstep(.54,.76,y));
  c=mix(c,C5,smoothstep(.74,.9,y));
  c=mix(c,C6,smoothstep(.88,1.,y));
  return c;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/min(R.x,R.y)*2.;
  float r=min(length(uv),1.);
  float z=sqrt(max(0.,1.-r*r));
  vec2 s=uv/(.55+z*.65);
  float t=T*.11;
  float a=.6*sin(t*.5)+(1.-r)*1.4+t*.35;
  float ca=cos(a),sa=sin(a);
  s=mat2(ca,-sa,sa,ca)*s*${f(skala)};
  vec2 q=vec2(fbm(s+vec2(0.,t*.9)),fbm(s+vec2(5.2,1.3)-t*.7));
  vec2 w=vec2(fbm(s+${f(zawin)}*q+vec2(1.7,9.2)+t*.55),fbm(s+${f(zawin)}*q+vec2(8.3,2.8)-t*.45));
  float fv=fbm(s+${f(zawin * 1.08)}*w);
  float y=clamp(.5+(fv-${f((1 - 0.5 ** Math.round(oktawy)) / 2)})*${f(kontrast)}+uv.y*.12+${f(jasnosc)},0.,1.);
  y=Z.x+y*(Z.y-Z.x);
  vec3 col=pal(clamp(y,0.,1.));
  float grzbiet=smoothstep(.62,.9,fv)*smoothstep(.0,.6,length(w));
  col+=C6*grzbiet*.18;
  col*=mix(.8,1.03,z);
  gl_FragColor=vec4(col,1.);
}`;
}
const FS_PLYN = `precision highp float;
uniform vec2 R;uniform float T;uniform vec2 Z;
uniform vec3 C0,C1,C2,C3,C4,C5,C6;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
const mat2 M=mat2(1.6,1.2,-1.2,1.6);
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=M*p;a*=.5;}return v;}
vec3 pal(float y){
  vec3 c=C0;
  c=mix(c,C1,smoothstep(.0,.22,y));
  c=mix(c,C2,smoothstep(.18,.4,y));
  c=mix(c,C3,smoothstep(.36,.58,y));
  c=mix(c,C4,smoothstep(.54,.76,y));
  c=mix(c,C5,smoothstep(.74,.9,y));
  c=mix(c,C6,smoothstep(.88,1.,y));
  return c;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/min(R.x,R.y)*2.;
  float r=min(length(uv),1.);
  float z=sqrt(max(0.,1.-r*r));
  vec2 s=uv/(.55+z*.65);
  float t=T*.11;
  float a=.6*sin(t*.5)+(1.-r)*1.4+t*.35;
  float ca=cos(a),sa=sin(a);
  s=mat2(ca,-sa,sa,ca)*s*1.25;
  vec2 q=vec2(fbm(s+vec2(0.,t*.9)),fbm(s+vec2(5.2,1.3)-t*.7));
  vec2 w=vec2(fbm(s+2.4*q+vec2(1.7,9.2)+t*.55),fbm(s+2.4*q+vec2(8.3,2.8)-t*.45));
  float f=fbm(s+2.6*w);
  float y=clamp((f-.18)*1.55+(uv.y*.5+.5)*.22+.04+length(w-q)*.18,0.,1.);
  y=Z.x+y*(Z.y-Z.x);
  vec3 col=pal(clamp(y,0.,1.));
  float grzbiet=smoothstep(.62,.9,f)*smoothstep(.0,.6,length(w));
  col+=C6*grzbiet*.22;
  col+=C5*pow(max(0.,q.x*w.y),2.)*.25;
  col*=mix(.72,1.04,z);
  gl_FragColor=vec4(col,1.);
}`;

/** 8.11 (USER_001 wybrał z 5 propozycji): WERSJA 2 „Mleczna” = limonka z białymi smugami, bez ciemnych miejsc. */
export const KOLORY_MLECZNA = ["#c3d200", "#cddc12", "#d8e533", "#e3ed64", "#eef49a", "#f7fac9", "#fdfee9"];
export const PARAM_MLECZNA: ParamPlyn = { skala: 2.6, zawin: 2.6, oktawy: 5, kontrast: 2.4, jasnosc: 0.06 };
const FS_MLECZNA = fsPlyn(PARAM_MLECZNA);

export default function KulaLimonka({ tempo = "czeka", className = "", fs = FS_MLECZNA, kolory = KOLORY_MLECZNA, zakres = [0, 1] }: { tempo?: TempoKuli; className?: string; fs?: string; kolory?: string[]; zakres?: [number, number] }) {
  return (
    <div className={`kl kl-${tempo} ${className}`} aria-hidden>
      <div className="kl-cien" />
      <div className="kl-pierscien kl-p1" />
      <div className="kl-pierscien kl-p2" />
      <div className="kl-kula">
        <AuroraCanvas fallbackClass="kl-fallback" predkosc={PREDKOSC[tempo]} zakres={zakres} kolory={kolory} fs={fs} />
        <div className="kl-szklo" />
        <div className="kl-blask" />
        <div className="kl-rim" />
      </div>
    </div>
  );
}
