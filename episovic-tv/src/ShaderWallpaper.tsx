// ShaderWallpaper.tsx
// Fondo WebGL interactivo — carbón neutro premium. Sin dependencias.
// Reacciona a la posición del cursor (atrae/distorsiona), a la velocidad
// (más rápido = más energía) y al clic (lanza una onda + cambia de paleta).
// Va detrás de tu UI: el canvas tiene pointer-events:none, así que no
// intercepta clics; la interacción se escucha a nivel de ventana.
//
// Uso mínimo (fondo global):
//   import ShaderWallpaper from "./ShaderWallpaper";
//   <ShaderWallpaper variant="interferencia" />   // primer hijo de tu layout
//
// El componente ya se posiciona como `position:fixed; inset:0; z-index:-1`.

import { useEffect, useRef } from "react";

export type ShaderVariant =
  | "liquido"
  | "corriente"
  | "interferencia"
  | "aurora"
  | "cristal";

export interface ShaderWallpaperProps {
  /** Cuál de los 5 shaders mostrar. */
  variant?: ShaderVariant;
  /** Movimiento en reposo: 0 = casi quieto, 1 = muy vivo. Default 0.1 (sutil). */
  restMotion?: number;
  /** Si reacciona al cursor / clic. Default true. */
  interactive?: boolean;
  /** El clic cicla entre 3 sub-tonos. Default true. */
  cycleOnClick?: boolean;
  /** Brillo del shader: 0 = casi negro, 1 = pleno. Default 0.34 (textura de fondo). */
  brightness?: number;
  /** Opacidad global del fondo. Default 1. */
  opacity?: number;
  /** z-index del canvas. Default -1 (detrás de todo). */
  zIndex?: number;
  className?: string;
  style?: React.CSSProperties;
}

const ORDER: ShaderVariant[] = [
  "liquido",
  "corriente",
  "interferencia",
  "aurora",
  "cristal",
];

const VERT =
  "attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }";

// --- Paleta: carbón neutro premium (sin color de marca) ---
const PRE = `precision highp float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;
uniform float u_mvel; uniform float u_motion; uniform float u_mood;
uniform float u_dim;
uniform vec3 u_rip[8];
#define A1 vec3(0.255,0.262,0.285)
#define A2 vec3(0.165,0.170,0.188)
#define A3 vec3(0.105,0.108,0.122)
#define HI vec3(0.760,0.770,0.800)
#define MID vec3(0.360,0.378,0.420)
#define CARBON vec3(0.035,0.035,0.040)
vec3 pick3(vec3 a, vec3 b, vec3 c){ return u_mood < 0.5 ? a : (u_mood < 1.5 ? b : c); }
float hash21(vec2 p){ p = fract(p*vec2(123.34,345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }
vec2 hash22(vec2 p){ float n = sin(dot(p, vec2(41.0,289.0))); return fract(vec2(262144.0,32768.0)*n); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  float a = hash21(i), b = hash21(i+vec2(1.0,0.0)), c = hash21(i+vec2(0.0,1.0)), d = hash21(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.0; a *= 0.5; } return v; }
`;

const POST = `void main(){
  vec2 R = u_res; vec2 uv = (gl_FragCoord.xy*2.0-R)/R.y;
  vec2 m = (u_mouse*R*2.0-R)/R.y;
  vec2 disp = vec2(0.0); float glow = 0.0;
  for(int i = 0; i < 8; i++){ float age = u_rip[i].z; if(age < 0.0) continue;
    vec2 rp = u_rip[i].xy; float d = length(uv-rp);
    float ring = d - age*1.5;
    float env = exp(-age*1.3)*exp(-ring*ring*20.0);
    disp += normalize(uv-rp+vec2(1e-4))*env*0.13; glow += env; }
  vec3 col = scene(uv+disp, m, u_mvel, u_time);
  col += glow*0.3*accent();
  float vig = smoothstep(1.75, 0.25, length(uv)); col *= mix(0.74, 1.0, vig);
  col *= u_dim;
  col = pow(clamp(col, 0.0, 1.0), vec3(0.92));
  gl_FragColor = vec4(col, 1.0);
}`;

const BODIES: Record<ShaderVariant, string> = {
  liquido: `vec3 accent(){ return pick3(A1, A3, mix(A1,HI,0.4)); }
vec3 scene(vec2 uv, vec2 m, float mv, float t){
  float spd = 0.2 + u_motion*0.45 + mv*1.3;
  float f = 0.0;
  for(int i = 0; i < 6; i++){ float fi = float(i);
    vec2 c = vec2(sin(t*spd*0.6+fi*1.7)*1.15, cos(t*spd*0.5+fi*2.3)*0.72);
    float r = 0.34 + 0.12*sin(t*0.4+fi); f += r*r/dot(uv-c,uv-c); }
  float mr = 0.42 + mv*0.5; f += mr*mr/(dot(uv-m,uv-m)+0.02);
  float field = smoothstep(0.85, 2.1, f);
  vec3 a = accent();
  vec3 hot = mix(a, HI, smoothstep(2.6,5.5,f)*0.55);
  vec3 col = mix(CARBON*0.8, hot, field);
  col += a*0.18*smoothstep(0.55,0.9,field)*(1.0-field);
  return col;
}`,
  corriente: `vec3 accent(){ return pick3(MID, mix(MID,A1,0.5), HI); }
vec3 scene(vec2 uv, vec2 m, float mv, float t){
  float spd = 0.05 + u_motion*0.12 + mv*0.4;
  vec2 p = uv*1.3;
  float n1 = fbm(p+vec2(0.0,t*spd));
  float n2 = fbm(p*1.5+vec2(n1*1.5)+vec2(t*spd*0.7,0.0));
  float md = length(uv-m); float pull = exp(-md*1.2)*(0.5+mv);
  float streak = fbm(p*2.0+vec2(n2*2.0)+vec2(pull*2.0));
  float lines = abs(fract(streak*5.0+t*spd*2.0)-0.5);
  float g = smoothstep(0.42, 0.0, lines);
  vec3 a = accent();
  vec3 col = CARBON + a*g*(0.5+n2*0.85);
  col += a*pull*0.45;
  col += A1*0.05*smoothstep(0.55,1.0,n1);
  return col;
}`,
  interferencia: `vec3 accent(){ return pick3(A1, HI, MID); }
vec3 scene(vec2 uv, vec2 m, float mv, float t){
  float spd = 0.3 + u_motion*0.6 + mv*2.0;
  vec2 c1 = vec2(sin(t*0.2)*0.8, cos(t*0.17)*0.6);
  vec2 c2 = vec2(-0.9,0.5) + 0.2*vec2(sin(t*0.23), cos(t*0.19));
  float w = 0.0;
  w += sin(length(uv-c1)*22.0 - t*spd);
  w += sin(length(uv-c2)*26.0 + t*spd*0.8);
  w += sin(length(uv-m)*(28.0+mv*45.0) - t*spd*1.3);
  w /= 3.0;
  float band = smoothstep(0.15, 0.9, abs(w));
  vec3 a = accent();
  vec3 col = mix(CARBON, a, band*0.85);
  col = mix(col, HI, smoothstep(0.86,1.0,abs(w))*0.35);
  return col;
}`,
  aurora: `vec3 accent(){ return pick3(MID, A1, mix(MID,A1,0.5)); }
vec3 scene(vec2 uv, vec2 m, float mv, float t){
  float spd = 0.08 + u_motion*0.18 + mv*0.5;
  vec3 col = CARBON;
  float dxm = uv.x-m.x;
  float warp = dxm*exp(-dxm*dxm*2.25)*(0.8+mv*1.2);
  for(int i = 0; i < 5; i++){ float fi = float(i);
    float x = uv.x*2.4 + fi*1.07 + warp*2.0;
    float n = fbm(vec2(x*0.5, t*spd*0.8+fi*1.3));
    float ribbon = sin(x*1.6 + n*4.0 + t*spd);
    ribbon = pow(max(ribbon,0.0), 6.0);
    float base = 0.1 + 0.4*sin(t*spd*0.5+fi*1.9);
    float vgrad = smoothstep(-1.1, base, uv.y)*smoothstep(1.1, base, uv.y);
    vgrad = pow(vgrad, 1.5);
    vec3 c = fi < 1.0 ? MID : (fi < 2.0 ? A1 : (fi < 3.0 ? mix(MID,HI,0.4) : (fi < 4.0 ? mix(A1,MID,0.5) : HI)));
    col += c*ribbon*vgrad*(0.6+0.6*mv); }
  col += accent()*exp(-dxm*dxm*6.76)*(0.15+mv*0.5);
  return col;
}`,
  cristal: `vec3 accent(){ return pick3(A1, HI, MID); }
vec3 scene(vec2 uv, vec2 m, float mv, float t){
  float spd = 0.1 + u_motion*0.25 + mv*0.6;
  vec2 g = uv*2.2; vec2 gi = floor(g), gf = fract(g);
  float d1 = 8.0, d2 = 8.0; vec2 cell = vec2(0.0);
  for(int y = -1; y <= 1; y++){ for(int x = -1; x <= 1; x++){
    vec2 o = vec2(float(x), float(y)); vec2 r = hash22(gi+o);
    vec2 pt = o+0.5+0.4*sin(t*spd+6.2831*r);
    float d = length(gf-pt);
    if(d < d1){ d2 = d1; d1 = d; cell = gi+o; } else if(d < d2){ d2 = d; } } }
  float edge = smoothstep(0.0, 0.05, d2-d1);
  float cv = hash21(cell);
  vec3 base = mix(CARBON, HI*0.45, cv*0.4);
  float md = length(uv-m); base += HI*exp(-md*2.0)*0.3;
  vec3 a = accent();
  vec3 col = mix(a, base, edge);
  col += a*(1.0-edge)*0.45;
  return col;
}`,
};

export default function ShaderWallpaper({
  variant = "interferencia",
  restMotion = 0.1,
  interactive = true,
  cycleOnClick = true,
  brightness = 0.34,
  opacity = 1,
  zIndex = -1,
  className,
  style,
}: ShaderWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // refs vivos para que el render loop lea props sin reiniciarse
  const cfg = useRef({ variant, restMotion, interactive, cycleOnClick, brightness });
  cfg.current = { variant, restMotion, interactive, cycleOnClick, brightness };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
    });
    if (!gl) {
      console.error("ShaderWallpaper: WebGL no disponible");
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(s), src);
      return s;
    };

    type Prog = {
      p: WebGLProgram;
      loc: Record<string, WebGLUniformLocation | null>;
    };
    const progs: Partial<Record<ShaderVariant, Prog>> = {};
    const getProgram = (name: ShaderVariant): Prog => {
      const cached = progs[name];
      if (cached) return cached;
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, PRE + BODIES[name] + "\n" + POST));
      gl.bindAttribLocation(p, 0, "a_pos");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        console.error(gl.getProgramInfoLog(p));
      const u = (n: string) => gl.getUniformLocation(p, n);
      const prog: Prog = {
        p,
        loc: {
          res: u("u_res"),
          time: u("u_time"),
          mouse: u("u_mouse"),
          mvel: u("u_mvel"),
          motion: u("u_motion"),
          mood: u("u_mood"),
          dim: u("u_dim"),
          rip: u("u_rip"),
        },
      };
      progs[name] = prog;
      return prog;
    };

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tm = { x: 0.5, y: 0.5 };
    const sm = { x: 0.5, y: 0.5 };
    let vel = 0;
    let instVel = 0;
    let last = 0;
    let mood = 0;
    const ripples: { nx: number; ny: number; start: number }[] = [];
    const t0 = performance.now() / 1000;

    const onMove = (e: PointerEvent) => {
      if (!cfg.current.interactive) return;
      const nx = e.clientX / window.innerWidth;
      const ny = 1 - e.clientY / window.innerHeight;
      const now = performance.now();
      if (last) {
        const dt = Math.max(16, now - last);
        const dx = nx - tm.x;
        const dy = ny - tm.y;
        instVel = Math.min(1, (Math.sqrt(dx * dx + dy * dy) / (dt / 1000)) * 0.4);
      }
      tm.x = nx;
      tm.y = ny;
      last = now;
    };
    const onDown = (e: PointerEvent) => {
      if (!cfg.current.interactive) return;
      ripples.push({
        nx: e.clientX / window.innerWidth,
        ny: 1 - e.clientY / window.innerHeight,
        start: performance.now() / 1000,
      });
      if (ripples.length > 8) ripples.shift();
      if (cfg.current.cycleOnClick) mood = (mood + 1) % 3;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    let raf = 0;
    const ripBuf = new Float32Array(24);
    const loop = () => {
      resize();
      const { p, loc } = getProgram(cfg.current.variant);
      gl.useProgram(p);
      sm.x += (tm.x - sm.x) * 0.1;
      sm.y += (tm.y - sm.y) * 0.1;
      vel += (instVel - vel) * 0.12;
      vel *= 0.95;
      instVel *= 0.9;
      const t = performance.now() / 1000 - t0;
      gl.uniform2f(loc.res, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(loc.time, t);
      gl.uniform2f(loc.mouse, sm.x, sm.y);
      gl.uniform1f(loc.mvel, vel);
      gl.uniform1f(loc.motion, cfg.current.restMotion);
      gl.uniform1f(loc.mood, mood);
      gl.uniform1f(loc.dim, cfg.current.brightness);
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const now = performance.now() / 1000;
      for (let k = 0; k < 8; k++) ripBuf[k * 3 + 2] = -1;
      let w = 0;
      for (const rp of ripples) if (now - rp.start < 4) ripples[w++] = rp;
      ripples.length = w;
      ripples.slice(-8).forEach((rp, k) => {
        ripBuf[k * 3] = (2 * rp.nx - 1) * aspect;
        ripBuf[k * 3 + 1] = 2 * rp.ny - 1;
        ripBuf[k * 3 + 2] = now - rp.start;
      });
      gl.uniform3fv(loc.rip, ripBuf);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
        zIndex,
        opacity,
        background: "#0a0a0a",
        ...style,
      }}
    />
  );
}
