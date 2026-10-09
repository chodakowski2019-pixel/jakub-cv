"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<6;i++){f+=a*snoise(p);p*=2.03;a*=.5;}return f;}
`;

export default function Planet({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return; // brak WebGL: zostaje gradient tła
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
    camera.position.set(0, 0, 10);

    const planetMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLight: { value: new THREE.Vector3(-0.55, 0.75, 0.45).normalize() },
      },
      vertexShader: `
        varying vec3 vPos; varying vec3 vN; varying vec3 vView;
        void main(){
          vPos = position;
          vN = normalize(normalMatrix*normal);
          vec4 mv = modelViewMatrix*vec4(position,1.);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix*mv;
        }`,
      fragmentShader:
        NOISE +
        `
        uniform float uTime; uniform vec3 uLight;
        varying vec3 vPos; varying vec3 vN; varying vec3 vView;
        void main(){
          vec3 p = normalize(vPos);
          float land = fbm(p*2.2);
          float detail = fbm(p*9.0)*.5;
          float h = land + detail*.35;
          vec3 ocean = mix(vec3(.01,.07,.06), vec3(.03,.16,.13), smoothstep(-.4,.1,h));
          vec3 ground = mix(vec3(.08,.26,.17), vec3(.30,.48,.30), smoothstep(.05,.5,h));
          ground = mix(ground, vec3(.55,.62,.45), smoothstep(.45,.75,h+detail*.3));
          vec3 col = mix(ocean, ground, smoothstep(.02,.08,h));
          vec3 cp = p*3.0 + vec3(uTime*.012,0.,uTime*.006);
          float cl = fbm(cp + fbm(cp*1.7)*.6);
          float clouds = smoothstep(.0,.7,cl);
          col = mix(col, vec3(.80,.97,.90), clouds*.55);
          float haze = pow(1.-max(dot(vN,vView),0.),1.6);
          col = mix(col, vec3(.35,.75,.58), haze*.45);
          float diff = clamp(dot(vN,uLight),0.,1.);
          float wrap = clamp((dot(vN,uLight)+.25)/1.25,0.,1.);
          col *= .05 + wrap*1.15;
          vec3 hv = normalize(uLight+vView);
          float spec = pow(max(dot(vN,hv),0.),40.)*(1.-smoothstep(.02,.08,h))*(1.-clouds);
          col += vec3(.5,1.,.8)*spec*.35;
          float fr = pow(1.-max(dot(vN,vView),0.),3.);
          col += vec3(.45,1.,.75)*fr*(.25+diff*1.6);
          gl_FragColor = vec4(col,1.);
        }`,
    });

    const R = 3.2;
    const planetGeo = new THREE.SphereGeometry(R, 128, 128);
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.rotation.z = 0.35;
    const group = new THREE.Group();
    group.add(planet);

    const atmoMat = new THREE.ShaderMaterial({
      uniforms: { uLight: { value: planetMat.uniforms.uLight.value } },
      vertexShader: `
        varying vec3 vN; varying vec3 vView;
        void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vView=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `
        uniform vec3 uLight; varying vec3 vN; varying vec3 vView;
        void main(){
          float d = dot(vN,vView);
          float glow = pow(clamp(-d/0.55, 0., 1.), 3.2);
          float lit = clamp(dot(-vN,uLight)*.5+.65,0.,1.);
          vec3 c = mix(vec3(.18,.80,.55), vec3(.80,1.,.92), glow*glow);
          gl_FragColor = vec4(c, glow*lit*1.25);
        }`,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmoGeo = new THREE.SphereGeometry(R * 1.2, 96, 96);
    group.add(new THREE.Mesh(atmoGeo, atmoMat));
    scene.add(group);

    const N = 2200;
    const pos = new Float32Array(N * 3);
    const sz = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = 40 + Math.random() * 60;
      const t = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(t);
      pos[i * 3 + 2] = -Math.abs(r * Math.cos(ph)) - 10;
      sz[i] = Math.random();
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    sg.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    const starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
      vertexShader: `attribute float aSize; uniform float uTime; uniform float uPR; varying float vA;
        void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv;
          vA = .35+.65*abs(sin(uTime*.8+aSize*40.)); gl_PointSize=(1.+aSize*2.2)*uPR; }`,
      fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); gl_FragColor=vec4(vec3(.85,1.,.94),a*vA*.85); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(sg, starMat);
    scene.add(stars);

    const layout = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const mobile = w < 960;
      const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 10;
      const vw = vh * camera.aspect;
      if (mobile) {
        group.position.set(0, -vh * 0.45, 0);
        group.scale.setScalar(Math.max(vw / 5, vh / 7));
      } else {
        group.position.set(vw * 0.2, -vh * 0.5, 0);
        group.scale.setScalar(vh / 4.4);
      }
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(canvas);

    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;

    const tick = () => {
      raf = 0;
      if (!visible) return;
      const t = clock.getElapsedTime();
      planetMat.uniforms.uTime.value = reduce ? 0 : t;
      starMat.uniforms.uTime.value = reduce ? 0 : t;
      if (!reduce) {
        planet.rotation.y = t * 0.035;
        stars.rotation.y = t * 0.004;
      }
      camera.position.x += (mx * 0.5 - camera.position.x) * 0.03;
      camera.position.y += (-my * 0.3 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    // nie liczymy planety, gdy hero jest poza ekranem
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      planetGeo.dispose();
      atmoGeo.dispose();
      sg.dispose();
      planetMat.dispose();
      atmoMat.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
