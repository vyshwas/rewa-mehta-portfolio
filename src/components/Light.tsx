import { useEffect, useRef } from 'react';
import { useMotion } from '../motion';
import { light } from '../light';

const vertex = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const fragment = `
precision mediump float;
uniform vec2 res; uniform float t; uniform vec2 m;
uniform float ring, rad, rx, ry, rs, rw, squash;
uniform float beam, bx, by, ba, bw, warm, expo, fade;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / res;
  float asp = res.x / res.y;
  vec2 p = vec2((uv.x - 0.5) * asp, uv.y - 0.5);
  float n = fbm(p * 1.7 + vec2(t * 0.035, -t * 0.022));

  // The aperture: a soft ring, wider than tall, with a dark centre. Closing it squashes it into a slit.
  vec2 q = p - vec2((rx - 0.5) * asp, ry - 0.5) - m * 0.035;
  q.x /= mix(rs, rs * 1.25, squash);
  q.y *= 1.0 + squash * 16.0;
  float d = length(q) + (n - 0.5) * 0.13;
  float r = rad * (1.0 + 0.025 * sin(t * 0.45)) * (1.0 - squash * 0.35);
  float band = rw * (1.0 + squash * 1.5);
  float ringV = exp(-pow((d - r) / band, 2.0)) + 0.16 * exp(-pow((d - r) / (band * 2.6), 2.0));
  ringV *= 1.0 - squash * 0.45;

  // The beam: a streak from an origin, widening and fading as it travels, with a hot core.
  vec2 dir = vec2(cos(ba), sin(ba));
  vec2 rel = p - vec2((bx - 0.5) * asp, by - 0.5) - m * 0.02;
  float along = dot(rel, dir);
  float across = dot(rel, vec2(-dir.y, dir.x));
  across += (fbm(vec2(along * 1.8 - t * 0.07, across * 2.6)) - 0.5) * 0.2;
  float w = bw * (0.5 + max(along, 0.0) * 1.1);
  float reach = smoothstep(-0.2, 0.25, along) * exp(-max(along, 0.0) * 0.62);
  float beamV = exp(-pow(across / w, 2.0)) * reach;
  float core = exp(-pow(across / (w * 0.26), 2.0)) * reach * 0.55;

  vec3 cobalt = vec3(0.10, 0.20, 1.0);
  vec3 ember = vec3(1.0, 0.24, 0.05);
  vec3 emberCore = vec3(1.0, 0.62, 0.42);
  vec3 cobaltCore = vec3(0.48, 0.58, 1.0);
  vec3 beamCol = mix(cobalt, ember, warm);
  vec3 coreCol = mix(cobaltCore, emberCore, warm);

  vec3 col = cobalt * ringV * ring + (beamCol * beamV + coreCol * core) * beam;
  col = 1.0 - exp(-col * expo);
  // Corners fall away to the stage, like a lens vignette.
  vec2 e = vec2(p.x / (asp * 0.5), p.y / 0.5);
  col *= 1.0 - 0.6 * smoothstep(0.85, 1.55, length(e));
  col = col * (1.0 - fade) + vec3(0.012, 0.013, 0.02);
  col += (hash(gl_FragCoord.xy + fract(t) * 91.0) - 0.5) / 128.0;
  gl_FragColor = vec4(col, 1.0);
}`;

const uniformNames = ['res', 't', 'm', 'ring', 'rad', 'rx', 'ry', 'rs', 'rw', 'squash', 'beam', 'bx', 'by', 'ba', 'bw', 'warm', 'expo', 'fade'] as const;

export default function Light() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { enabled } = useMotion();

  useEffect(() => {
    const element = canvas.current;
    const gl = element?.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: true });
    if (!element || !gl) { element?.setAttribute('data-fallback', 'true'); return; }

    const shader = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { element.setAttribute('data-fallback', 'true'); return; }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const u = Object.fromEntries(uniformNames.map(name => [name, gl.getUniformLocation(program, name)])) as Record<(typeof uniformNames)[number], WebGLUniformLocation | null>;

    // The light is soft by nature, so it renders at a fraction of screen resolution.
    let width = 0, height = 0, portrait = false;
    const resize = () => {
      const scale = window.innerWidth < 700 ? 0.35 : 0.5;
      width = Math.max(1, Math.round(window.innerWidth * scale));
      height = Math.max(1, Math.round(window.innerHeight * scale));
      portrait = window.innerHeight > window.innerWidth;
      element.width = width;
      element.height = height;
      gl.viewport(0, 0, width, height);
      draw(performance.now());
    };

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const pointer = (event: PointerEvent) => {
      mouse.tx = event.clientX / window.innerWidth * 2 - 1;
      mouse.ty = 1 - event.clientY / window.innerHeight * 2;
    };

    let frame = 0, running = false;
    const draw = (time: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform2f(u.res, width, height);
      gl.uniform1f(u.t, enabled ? time / 1000 : 12);
      gl.uniform2f(u.m, mouse.x, mouse.y);
      gl.uniform1f(u.ring, light.ring);
      gl.uniform1f(u.rad, portrait ? light.rad * 0.9 : light.rad);
      gl.uniform1f(u.rx, light.rx);
      gl.uniform1f(u.ry, light.ry);
      gl.uniform1f(u.rs, portrait ? 0.95 : light.rs);
      gl.uniform1f(u.rw, light.rw);
      gl.uniform1f(u.squash, light.close * light.aperture);
      gl.uniform1f(u.beam, light.beam);
      gl.uniform1f(u.bx, light.bx);
      gl.uniform1f(u.by, light.by);
      gl.uniform1f(u.ba, light.ba);
      gl.uniform1f(u.bw, portrait ? light.bw * 1.6 : light.bw);
      gl.uniform1f(u.warm, light.warm);
      gl.uniform1f(u.expo, light.expo);
      gl.uniform1f(u.fade, light.fade);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (time: number) => { draw(time); if (running) frame = requestAnimationFrame(loop); };
    const start = () => { if (running || !enabled || document.hidden) return; running = true; frame = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(frame); };
    // With motion off there is no loop: the stage is redrawn only when a scene changes.
    const still = () => { if (!enabled) draw(0); };
    const visibility = () => { if (document.hidden) stop(); else start(); };

    let resizeTimer = 0;
    const onResize = () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(resize, 120); };
    resize();
    start();
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', pointer, { passive: true });
    window.addEventListener('lightchange', still);
    document.addEventListener('visibilitychange', visibility);
    element.dataset.ready = 'true';
    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', pointer);
      window.removeEventListener('lightchange', still);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [enabled]);

  return <canvas className="light" ref={canvas} aria-hidden="true" />;
}
