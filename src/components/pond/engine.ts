// A small living pond drawn entirely in monospace characters.
// Koi are simulated as a chain of nodes (head leads, body follows), then
// rasterised into a grid of text cells. Original implementation; the idea
// (a glyph-rendered pond that gives way to the page's text) is the reference.

const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const angleDiff = (from: number, to: number) => {
  let d = (to - from) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};
// Deterministic hash so a koi's markings never change between frames.
const hash = (a: number, b: number, c = 0) => {
  let h = Math.imul(a | 0, 0x165667b1) ^ Math.imul(b | 0, 0x27d4eb2f) ^ Math.imul(c | 0, 0x55fdc781);
  h = Math.imul(h ^ (h >>> 13), 0x4bf19f61);
  return ((h ^ (h >>> 16)) >>> 0) / 0x100000000;
};

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const scale = (a: RGB, k: number): RGB => [Math.min(255, a[0] * k), Math.min(255, a[1] * k), Math.min(255, a[2] * k)];

// Rewa's palette: paper body, ember patches, cobalt water.
const PAL = {
  paper: [236, 234, 226] as RGB,
  ember: [255, 91, 36] as RGB,
  emberHi: [255, 160, 110] as RGB,
  cobalt: [78, 104, 255] as RGB,
  water: [142, 157, 255] as RGB,
  fin: [190, 196, 230] as RGB,
  eye: [12, 14, 21] as RGB,
  pellet: [255, 176, 120] as RGB,
  shadow: [0, 0, 0] as RGB,
};

const NODES = 16;
const RAMP = '.:+oO0@';

type Variety = 'kohaku' | 'tancho' | 'asagi';
interface Patch { s: number; v: number; rs: number; rv: number }
interface Koi {
  id: number; variety: Variety; length: number;
  nodes: Float32Array; heading: number; speed: number; phase: number;
  wander: number; curiosity: number; depth: number; depthTarget: number;
  nextDive: number; nextSurface: number; burstUntil: number; nextBurst: number;
  beat: number; rush: number; startle: number; fleeX: number; fleeY: number;
  turn: number; food: Pellet | null; patches: Patch[];
}
interface Pellet { x: number; y: number; vx: number; vy: number; born: number; landAt: number; landed: boolean }
interface Ripple { x: number; y: number; born: number; strength: number }
interface Bite { x: number; y: number; born: number }
export interface Box { left: number; top: number; right: number; bottom: number }

function makePatches(id: number, variety: Variety): Patch[] {
  const r = (n: number) => hash(id, n, 41);
  // Tancho: one round red crown on the head.
  if (variety === 'tancho') return [{ s: 0.14, v: 0, rs: 0.05, rv: 0.55 }];
  const out: Patch[] = [];
  // A rounded head patch that stops short of the snout.
  if (r(0) < 0.85) out.push({ s: 0.16 + 0.03 * r(1), v: (r(2) - 0.5) * 0.2, rs: 0.065 + 0.02 * r(3), rv: 0.82 });
  // Big blocky patches on the back that wrap across the body, with white between them.
  const n = 2 + Math.floor(2 * r(4));
  const span = 0.42 / n;
  for (let i = 0; i < n; i++) {
    out.push({ s: 0.34 + span * (i + 0.5) + (r(10 + i) - 0.5) * span * 0.3, v: (r(20 + i) - 0.5) * 0.3, rs: span * (0.3 + 0.14 * r(30 + i)), rv: 0.95 + 0.25 * r(40 + i) });
  }
  return out;
}

export class Pond {
  width = 0; height = 0; time = 0;
  koi: Koi[] = []; pellets: Pellet[] = []; ripples: Ripple[] = []; bites: Bite[] = [];
  avoid: Box[] = [];
  lastFeed = -Infinity;
  pointer = { x: 0, y: 0, speed: 0, active: false };

  private seededBase = 0; private seededCount = 0;
  /** withKoi=false gives a pond with water only: ripples and a cursor wake, no fish. */
  constructor(private withKoi = true) {}
  /** A single ripple, e.g. rain while scrolling. */
  splash(x: number, y: number, strength = 0.25) { this.ripples.push({ x, y, born: this.time, strength }); }
  private layout(w: number, h: number) {
    return { base: clamp(0.5 * Math.min(w, h), 170, 400), count: clamp(Math.round((w * h) / 330000), 3, 5) };
  }
  resize(w: number, h: number) {
    this.width = w; this.height = h;
    const { base, count } = this.layout(w, h);
    // Seed once, and again if the viewport changes enough that the fish no longer fit it.
    if (!this.seededBase || Math.abs(base / this.seededBase - 1) > 0.25 || count !== this.seededCount) this.seed();
  }

  private seed() {
    if (!this.withKoi) { this.koi = []; this.seededBase = 1; this.seededCount = 0; return; }
    const { width: w, height: h } = this;
    const { base, count } = this.layout(w, h);
    this.seededBase = base; this.seededCount = count;
    this.pellets = []; this.ripples = [];
    const kinds: Variety[] = ['kohaku', 'asagi', 'kohaku', 'tancho', 'asagi', 'kohaku'];
    this.koi = [];
    for (let i = 0; i < count; i++) {
      const length = base * rand(0.74, 1);
      const heading = rand(0, TAU);
      const x = rand(0.15 * w, 0.85 * w), y = rand(0.15 * h, 0.85 * h);
      const nodes = new Float32Array(NODES * 2);
      const step = length / (NODES - 1);
      for (let n = 0; n < NODES; n++) { nodes[2 * n] = x - Math.cos(heading) * step * n; nodes[2 * n + 1] = y - Math.sin(heading) * step * n; }
      const variety = kinds[i % kinds.length];
      this.koi.push({
        id: i + 1, variety, length, nodes, heading, speed: 20, phase: rand(0, TAU), wander: 0,
        curiosity: rand(0.35, 1), depth: rand(0.5, 1), depthTarget: rand(0.5, 1),
        nextDive: rand(6, 18), nextSurface: rand(3, 14), burstUntil: 0, nextBurst: rand(0, 3),
        beat: 0, rush: 0, startle: 0, fleeX: 0, fleeY: 0, turn: 0, food: null, patches: makePatches(i + 1, variety),
      });
    }
  }

  feed(x: number, y: number) {
    this.lastFeed = this.time;
    this.ripples.push({ x, y, born: this.time, strength: 0.35 });
    const room = Math.max(0, 24 - this.pellets.length);
    const n = Math.min(5 + Math.floor(Math.random() * 3), room);
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), d = 34 * Math.sqrt(Math.random()), sp = rand(2, 6);
      this.pellets.push({ x: x + Math.cos(a) * d * 1.3, y: y + Math.sin(a) * d, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, born: this.time, landAt: rand(0.15, 0.45), landed: false });
    }
  }

  step(dt: number) {
    this.time += dt;
    this.pointer.speed *= Math.exp(-8 * dt);
    for (const k of this.koi) this.stepKoi(k, dt);
    const t = this.time;
    this.pellets = this.pellets.filter((p) => t - p.born < 14);
    for (const p of this.pellets) {
      if (!p.landed) {
        if (t - p.born < p.landAt) continue;
        p.landed = true;
        this.ripples.push({ x: p.x, y: p.y, born: t, strength: 0.1 });
        for (const k of this.koi) if (Math.hypot(k.nodes[0] - p.x, k.nodes[1] - p.y) < 650) k.rush = 1;
        continue;
      }
      const drag = Math.exp(-0.2 * dt);
      p.vx *= drag; p.vy *= drag; p.x += p.vx * dt; p.y += p.vy * dt;
    }
    this.ripples = this.ripples.filter((r) => t - r.born < 2.2 + 1.6 * r.strength);
    this.bites = this.bites.filter((b) => t - b.born < 0.45);
  }

  private nearestPellet(x: number, y: number, range: number): Pellet | null {
    let best: Pellet | null = null, d2 = range * range;
    for (const p of this.pellets) {
      if (!p.landed) continue;
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < d2) { d2 = d; best = p; }
    }
    return best;
  }

  private stepKoi(k: Koi, dt: number) {
    const { width: W, height: H, pointer: ptr, time: t } = this;
    const L = k.length, n = k.nodes, hx = n[0], hy = n[1];
    let dx = Math.cos(k.heading), dy = Math.sin(k.heading);

    // Gentle wandering.
    k.wander = clamp(k.wander + (Math.random() - 0.5) * dt * 2.4, -0.9, 0.9);
    dx += 0.6 * Math.cos(k.heading + k.wander);
    dy += 0.6 * Math.sin(k.heading + k.wander);

    // Food: drop a lost target, then look for the nearest landed pellet.
    if (k.food && !this.pellets.includes(k.food)) k.food = null;
    const near = this.nearestPellet(hx, hy, Math.max(1.6 * L + 220, k.rush > 0 ? 650 : 0));
    if (!k.food || (near && Math.hypot(near.x - hx, near.y - hy) < 0.5 * Math.hypot(k.food.x - hx, k.food.y - hy))) k.food = near;
    const food = k.food;
    let closeness = 0;

    // A fast cursor startles fish that are close.
    const pd = Math.hypot(ptr.x - hx, ptr.y - hy);
    if (!food && t - this.lastFeed >= 2 && ptr.active && ptr.speed > 1100 && pd < 0.9 * L) { k.startle = 1; k.fleeX = ptr.x; k.fleeY = ptr.y; }
    k.startle = Math.max(0, k.startle - 0.6 * dt);
    const fleeing = k.startle > 0.3 && !food;
    let chasing = false, curious = false;

    if (fleeing) {
      const fx = hx - k.fleeX, fy = hy - k.fleeY, fd = Math.hypot(fx, fy) || 1;
      dx += (fx / fd) * 4 * k.startle; dy += (fy / fd) * 4 * k.startle;
    } else if (food) {
      const fx = food.x - hx, fy = food.y - hy, fd = Math.hypot(fx, fy) || 1;
      dx += (fx / fd) * 3; dy += (fy / fd) * 3; chasing = true;
      closeness = clamp(1 - fd / (1.2 * L), 0, 1);
    } else if (ptr.active && pd < 300) {
      // Curious: drift toward the cursor, then circle it.
      const pdn = pd || 1, px = ptr.x - hx, py = ptr.y - hy, s = clamp(pd / (0.6 * L), 0, 1), pull = k.curiosity * (1 - pd / 300) * 2.2;
      dx += ((px / pdn) * s - (py / pdn) * (1 - s)) * pull;
      dy += ((py / pdn) * s + (px / pdn) * (1 - s)) * pull;
      curious = true;
    }

    // Personal space between fish.
    for (const o of this.koi) {
      if (o === k) continue;
      if (Math.abs(o.nodes[0] - hx) > 2 * L || Math.abs(o.nodes[1] - hy) > 2 * L) continue;
      for (let i = 0; i < NODES; i += 3) {
        const ox = hx - o.nodes[2 * i], oy = hy - o.nodes[2 * i + 1], od = Math.hypot(ox, oy), reach = (L + o.length) * (food ? 0.12 : 0.28);
        if (od < reach && od > 0.001) { const f = (1 - od / reach) * 2.4; dx += (ox / od) * f; dy += (oy / od) * f; }
      }
    }

    // Give way to text blocks.
    let ax = 0, ay = 0;
    const range = 0.4 * L;
    for (const b of this.avoid) {
      const cx = hx - clamp(hx, b.left, b.right), cy = hy - clamp(hy, b.top, b.bottom), d = Math.hypot(cx, cy);
      if (d > range) continue;
      let ux = cx, uy = cy;
      if (d < 0.001) { // inside the box: push toward the nearest edge
        const gaps = [hx - b.left, b.right - hx, hy - b.top, b.bottom - hy];
        const m = Math.min(...gaps), i = gaps.indexOf(m);
        ux = i === 0 ? -1 : i === 1 ? 1 : 0; uy = i === 2 ? -1 : i === 3 ? 1 : 0;
      }
      const ul = Math.hypot(ux, uy) || 1, w = 1 - d / range;
      ax += (ux / ul) * w; ay += (uy / ul) * w;
    }
    const gain = chasing || curious ? 0.5 : 1.8;
    dx += ax * gain; dy += ay * gain;

    // Turn back from the edges.
    const out = Math.max(-hx, hx - W, -hy, hy - H);
    if (out > -0.25 * L) {
      const f = 3.5 * clamp((out + 0.25 * L) / (0.5 * L), 0, 1), cx = W / 2 - hx, cy = H / 2 - hy, cd = Math.hypot(cx, cy) || 1;
      dx += (cx / cd) * f; dy += (cy / cd) * f;
    }

    // Steer.
    const want = Math.atan2(dy, dx);
    const maxTurn = (1 + 0.6 * k.rush) * Math.min(fleeing ? 3 : chasing ? 1.9 + closeness : curious ? 1.2 : 0.7, (k.speed / L) * 4) * dt;
    const turn = clamp(angleDiff(k.heading, want), -maxTurn, maxTurn);
    k.heading += turn;
    k.turn += (turn / dt - k.turn) * Math.min(1, 3 * dt);

    // Occasional bursts of speed.
    if (t > k.nextBurst && t > k.burstUntil) { k.burstUntil = t + rand(0.7, 1.6); k.nextBurst = k.burstUntil + rand(1.2, 4); }
    const active = fleeing || chasing || t < k.burstUntil;
    k.beat += ((active ? 1 : 0) - k.beat) * Math.min(1, 3 * dt);
    if (k.beat > 0.6 && k.depth > 0.65 && t > k.nextSurface) { this.ripples.push({ x: n[2 * 10], y: n[2 * 10 + 1], born: t, strength: 0.25 + 0.2 * k.depth }); k.nextSurface = t + rand(0.8, 1.6) / k.beat; }
    k.rush = Math.max(0, k.rush - 0.7 * dt);

    const cruise = 12 + 0.05 * L;
    const target = (1 + 0.8 * k.rush) * (fleeing ? 3.2 * cruise : chasing ? cruise * (1.9 + closeness) : active ? cruise * (curious ? 1.6 : 1.35) : 0.45 * cruise);
    k.speed += (target - k.speed) * Math.min(1, dt * (active ? 1.6 + 3 * k.rush : 0.35));
    k.phase += dt * (0.6 + k.beat * (2.2 + k.speed / 11));

    if (t > k.nextDive) { k.depthTarget = rand(0.5, 1); k.nextDive = t + rand(8, 20); }
    k.depth += ((chasing ? 1 : k.depthTarget) - k.depth) * Math.min(1, dt * (chasing ? 0.8 : 0.15));

    // Move the head, then let each node trail the one before it.
    n[0] += Math.cos(k.heading) * k.speed * dt;
    n[1] += Math.sin(k.heading) * k.speed * dt;
    const seg = L / (NODES - 1);
    let a = k.heading + Math.PI;
    for (let i = 1; i < NODES; i++) {
      const px = n[(i - 1) * 2], py = n[(i - 1) * 2 + 1];
      let na = Math.atan2(n[2 * i + 1] - py, n[2 * i] - px);
      // The tail end is stiffer than the body, so it can't curl back on itself.
      const bend = i >= NODES - 4 ? 0.05 : 0.1;
      na = a + clamp(angleDiff(a, na), -bend, bend);
      n[2 * i] = px + Math.cos(na) * seg; n[2 * i + 1] = py + Math.sin(na) * seg;
      a = na;
    }

    // Eat a pellet at the mouth.
    const mouth = 0.08 * L + 6, before = this.pellets.length;
    this.pellets = this.pellets.filter((p) => !p.landed || (p.x - n[0]) ** 2 + (p.y - n[1]) ** 2 > mouth * mouth);
    if (this.pellets.length < before) {
      this.ripples.push({ x: n[0], y: n[1], born: t, strength: 0.6 });
      this.bites.push({ x: n[0], y: n[1], born: t });
    }
  }
}

// ---------------------------------------------------------------- renderer

// Half-width / length at each arc fraction, measured from an overhead photograph of a Kohaku:
// a rounded snout, widest a third of the way back, then an even taper to a thin tail stalk.
const PROFILE: [number, number][] = [
  [0, 0], [0.012, 0.04], [0.04, 0.074], [0.09, 0.094], [0.16, 0.109], [0.26, 0.118], [0.37, 0.121],
  [0.5, 0.117], [0.6, 0.106], [0.7, 0.088], [0.8, 0.057], [0.87, 0.03], [0.93, 0.018],
];
const bodyWidth = (s: number, L: number) => {
  if (s <= 0 || s >= 0.93) return 0;
  let i = 1;
  while (PROFILE[i][0] < s) i++;
  const [s0, w0] = PROFILE[i - 1], [s1, w1] = PROFILE[i];
  return L * (w0 + (w1 - w0) * smooth(0, 1, (s - s0) / (s1 - s0)));
};
// The caudal fin: short and soft, a gentle fan with a shallow notch.
const tailHalf = (u: number, L: number, flare: number) =>
  L * (0.018 + 0.066 * Math.pow(Math.sin(clamp(u, 0, 1) * Math.PI * 0.55), 1.1)) * flare * (1 - 0.25 * smooth(0.8, 1, u));

interface Probe { kind: 0 | 1 | 2 | 3; s: number; v: number; across: number; tx: number; ty: number }

export class PondRenderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1; cw = 8; ch = 12; cols = 0; rows = 0;
  private glyph = new Uint16Array(0); private color = new Uint32Array(0); private alpha = new Float32Array(0);
  private tile = new Uint32Array(0); private tileA = new Float32Array(0); private shadow = new Uint8Array(0);
  private energy = new Float32Array(0); private energyTmp = new Float32Array(0); private dim = new Float32Array(0);
  private spine = new Float32Array(NODES * 2); private arc = new Float32Array(NODES);
  private styles = new Map<number, string>();
  private fontFamily = '"IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace';

  constructor(canvas: HTMLCanvasElement) {
    const c = canvas.getContext('2d');
    if (!c) throw new Error('2D canvas unavailable');
    this.ctx = c;
  }

  resize(w: number, h: number, dpr: number) {
    this.dpr = dpr;
    this.cw = clamp(Math.round(w / 190), 7, 10);
    this.ch = this.cw + 2;
    this.cols = Math.ceil(w / this.cw); this.rows = Math.ceil(h / this.ch);
    this.ctx.canvas.width = Math.round(w * dpr); this.ctx.canvas.height = Math.round(h * dpr);
    const n = this.cols * this.rows;
    this.glyph = new Uint16Array(n); this.color = new Uint32Array(n); this.alpha = new Float32Array(n);
    this.tile = new Uint32Array(n); this.tileA = new Float32Array(n); this.shadow = new Uint8Array(n);
    this.energy = new Float32Array(n); this.energyTmp = new Float32Array(n); this.dim = new Float32Array(n).fill(1);
  }

  /** Fade the pond near text so words stay readable. */
  setDimBoxes(boxes: Box[]) {
    const { cols, rows, cw, ch, dim } = this;
    dim.fill(1);
    const pad = 4 * cw;
    for (const b of boxes) {
      const c0 = Math.max(0, Math.floor((b.left - pad) / cw)), c1 = Math.min(cols - 1, Math.floor((b.right + pad) / cw));
      const r0 = Math.max(0, Math.floor((b.top - pad) / ch)), r1 = Math.min(rows - 1, Math.floor((b.bottom + pad) / ch));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const x = c * cw + cw / 2, y = r * ch + ch / 2;
        const d = Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));
        const i = r * cols + c;
        dim[i] = Math.min(dim[i], 0.12 + 0.88 * smooth(0, pad, d));
      }
    }
  }

  private css(rgb: number) {
    let s = this.styles.get(rgb);
    if (!s) { s = `rgb(${rgb >>> 16},${(rgb >>> 8) & 255},${rgb & 255})`; this.styles.set(rgb, s); }
    return s;
  }
  private pack = (c: RGB) => ((c[0] | 0) << 16) | ((c[1] | 0) << 8) | (c[2] | 0);
  private index(x: number, y: number) {
    const c = Math.floor(x / this.cw), r = Math.floor(y / this.ch);
    return c < 0 || r < 0 || c >= this.cols || r >= this.rows ? -1 : r * this.cols + c;
  }
  private put(i: number, ch: string, rgb: RGB, a: number) {
    const { ctx, cw, ch: chh, cols } = this;
    ctx.globalAlpha = a;
    ctx.fillStyle = this.css(this.pack(rgb));
    ctx.fillText(ch, (i % cols) * cw + cw / 2, ((i / cols) | 0) * chh + chh / 2);
  }

  render(pond: Pond, dt: number) {
    const { ctx, dpr, cols } = this;
    if (!cols) return;
    this.glyph.fill(0); this.tileA.fill(0); this.shadow.fill(0);
    for (const k of [...pond.koi].sort((a, b) => a.depth - b.depth)) this.rasterize(k, pond.time);
    this.depositWake(pond); this.diffuse(dt);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `500 ${Math.round(0.72 * this.ch)}px ${this.fontFamily}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.drawShadows(); this.drawWake(); this.drawRipples(pond); this.drawPellets(pond); this.drawCells(); this.drawBites(pond);
    ctx.globalAlpha = 1;
  }

  private p1: Probe = { kind: 0, s: 0, v: 0, across: 0, tx: 1, ty: 0 };
  private p2: Probe = { kind: 0, s: 0, v: 0, across: 0, tx: 1, ty: 0 };

  /** Which part of the fish (if any) lies at this point. Writes into `out`. */
  private probe(px: number, py: number, L: number, flare: number, time: number, id: number, out: Probe): Probe {
    const { spine, arc } = this;
    const total = arc[NODES - 1] || 1;
    let best = Infinity, s = 0, side = 1, tx = 1, ty = 0;
    for (let i = 0; i < NODES - 1; i++) {
      const ax = spine[2 * i], ay = spine[2 * i + 1], ex = spine[2 * i + 2] - ax, ey = spine[2 * i + 3] - ay;
      const l2 = ex * ex + ey * ey || 1, u = clamp(((px - ax) * ex + (py - ay) * ey) / l2, 0, 1);
      const d2 = (px - ax - ex * u) ** 2 + (py - ay - ey * u) ** 2;
      if (d2 < best) { best = d2; const len = Math.sqrt(l2); s = (arc[i] + u * len) / total; side = ex * (py - ay) - ey * (px - ax) >= 0 ? 1 : -1; tx = ex / len; ty = ey / len; }
    }
    const dist = Math.sqrt(best), body = bodyWidth(s, L);
    out.s = s; out.v = dist * side; out.tx = tx; out.ty = ty; out.kind = 0; out.across = 0;
    if (body > 0 && dist <= body) { out.kind = 1; out.across = dist / body; return out; }
    if (s > 0.86) {
      const u = (s - 0.86) / 0.14, tw = tailHalf(u, L, flare), notch = tw * 0.7 * smooth(0.82, 1, u);
      // Solid fan; the fork is only a small V cut at the very tip, so it never reads as a hollow loop.
      if (dist <= tw && dist >= notch) { out.kind = 2; out.across = dist / (tw || 1); return out; }
    }
    // Pectoral fins: broad rounded paddles just behind the head, held out to the side.
    if (s > 0.3 && s < 0.47) {
      const f = (s - 0.3) / 0.17, reach = L * 0.125 * Math.pow(Math.sin(Math.PI * Math.pow(f, 0.8)), 0.6) * (1 + 0.14 * Math.sin(time * 2.4 + id * 1.7 + side));
      if (dist > body * 0.82 && dist <= body + reach) { out.kind = 3; out.across = (dist - body) / (reach || 1); return out; }
    }
    // Pelvic fins: a smaller pair further back.
    if (s > 0.6 && s < 0.7) {
      const f = (s - 0.6) / 0.1, reach = L * 0.05 * Math.sin(Math.PI * f) * (1 + 0.1 * Math.sin(time * 2.1 + id + side));
      if (dist > body * 0.82 && dist <= body + reach) { out.kind = 3; out.across = (dist - body) / (reach || 1); return out; }
    }
    return out;
  }

  private rasterize(k: Koi, time: number) {
    const { spine, arc, cw, ch, cols, rows } = this;
    const L = k.length, nodes = k.nodes;
    const amp = 0.2 + 1.1 * k.beat;
    // Swim wave: displace each node sideways, more toward the tail.
    for (let i = 0; i < NODES; i++) {
      const u = i / (NODES - 1), a = Math.max(0, i - 1), b = Math.min(NODES - 1, i + 1);
      let tx = nodes[2 * a] - nodes[2 * b], ty = nodes[2 * a + 1] - nodes[2 * b + 1];
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const off = 0.04 * L * (0.05 + 0.95 * Math.pow(u, 2.2)) * amp * Math.sin(k.phase - 4.6 * u);
      spine[2 * i] = nodes[2 * i] - ty * off; spine[2 * i + 1] = nodes[2 * i + 1] + tx * off;
    }
    arc[0] = 0;
    for (let i = 1; i < NODES; i++) arc[i] = arc[i - 1] + Math.hypot(spine[2 * i] - spine[2 * i - 2], spine[2 * i + 1] - spine[2 * i - 1]);
    const flare = 1 - 0.25 * k.beat + 0.18 * (1 - k.beat) * Math.sin(time * 2.4 + k.id);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < NODES; i++) { minX = Math.min(minX, spine[2 * i]); maxX = Math.max(maxX, spine[2 * i]); minY = Math.min(minY, spine[2 * i + 1]); maxY = Math.max(maxY, spine[2 * i + 1]); }
    const pad = 0.2 * L;
    const c0 = Math.max(0, Math.floor((minX - pad) / cw)), c1 = Math.min(cols - 1, Math.floor((maxX + pad) / cw));
    const r0 = Math.max(0, Math.floor((minY - pad) / ch)), r1 = Math.min(rows - 1, Math.floor((maxY + pad) / ch));
    if (c0 > c1 || r0 > r1) return;

    const depthA = 0.5 + 0.5 * k.depth;
    const sx = Math.round(0.07 * L * k.depth / cw) + 1, sy = Math.round(0.05 * L * k.depth / ch) + 1;
    const ox = 0.42 * cw, oy = 0.42 * ch;
    const A = this.p1, B = this.p2;

    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = c * cw + cw / 2, py = r * ch + ch / 2;
      this.probe(px, py, L, flare, time, k.id, A);
      // Four corner samples find the silhouette edge, so the outline follows the real shape.
      let inside = 0, cornerKind = 0;
      for (let q = 0; q < 4; q++) {
        this.probe(px + (q & 1 ? ox : -ox), py + (q & 2 ? oy : -oy), L, flare, time, k.id, B);
        if (B.kind) { inside++; cornerKind = B.kind; }
      }
      const centreIn = A.kind !== 0;
      if (!centreIn && inside < 3) continue;
      const edge = centreIn ? inside < 4 : true;
      const i = r * cols + c;
      const aKind = centreIn ? A.kind : cornerKind || 1;
      // Re-probe the centre for tangent data when the centre is outside the shape.
      const horiz = Math.abs(A.ty) < 0.38, vert = Math.abs(A.tx) < 0.38;
      const line = horiz ? '-' : vert ? '|' : A.tx * A.ty > 0 ? '\\' : '/';

      if (aKind === 1) {
        const across = A.across, lighting = clamp(0.3 + 0.55 * Math.sqrt(Math.max(0, 1 - across * across)) + 0.12 * Math.sign(A.v), 0, 1);
        let col: RGB = PAL.paper;
        const bw = bodyWidth(A.s, L) || 1;
        for (const p of k.patches) {
          const q = ((A.s - p.s) / p.rs) ** 2 + (A.v / bw - p.v) ** 2 / (p.rv * p.rv) + (hash(c, r, k.id) - 0.5) * 0.3;
          if (q < 1) { col = k.variety === 'asagi' && p.s > 0.2 ? PAL.cobalt : PAL.ember; break; }
        }
        if (k.variety === 'asagi' && col === PAL.paper && A.s > 0.18) col = mix(PAL.paper, PAL.cobalt, 0.18 + 0.18 * Math.sin(A.s * 60 + k.id));
        const lit = col === PAL.ember ? mix(PAL.ember, PAL.emberHi, lighting * 0.8) : scale(col, 0.62 + 0.45 * lighting);
        if (edge) {
          this.glyph[i] = line.charCodeAt(0); this.color[i] = this.pack(PAL.paper); this.alpha[i] = depthA;
          this.tile[i] = this.pack(scale(lit, 0.5)); this.tileA[i] = depthA * 0.3;
        } else {
          const eye = A.s > 0.095 && A.s < 0.135 && A.across > 0.7 && A.across < 0.95;
          const dorsal = !eye && A.s > 0.42 && A.s < 0.84 && Math.abs(A.v) < 0.07 * bw;
          const g = eye ? 'O' : RAMP[clamp(Math.round(lighting * (RAMP.length - 1)) + ((hash(c, r, k.id) * 3) | 0) - 1, 0, RAMP.length - 1)];
          this.glyph[i] = (dorsal ? line : g).charCodeAt(0); this.color[i] = this.pack(eye ? PAL.eye : dorsal ? PAL.fin : lit); this.alpha[i] = depthA;
          this.tile[i] = this.pack(eye ? PAL.paper : scale(lit, 0.55)); this.tileA[i] = depthA * (eye ? 0.95 : 0.55);
        }
        const sc = i + sx + sy * cols;
        if (sc < this.shadow.length && c + sx < cols) this.shadow[sc] = 1;
      } else {
        // Tail and pectoral fins: lighter than the body, outlined so the shape still reads.
        const jitter = hash(c + ((time * 1.6) | 0), r, k.id);
        this.glyph[i] = (edge ? line : jitter < 0.5 ? '.' : ':').charCodeAt(0);
        // A soft, evenly filled shape (edge barely brighter than the inside), so a fan never reads as a hollow ring.
        this.color[i] = this.pack(edge ? scale(PAL.fin, 1.05) : PAL.fin);
        this.alpha[i] = depthA * (edge ? 0.6 : 0.62);
        this.tile[i] = this.pack(scale(PAL.fin, 0.8)); this.tileA[i] = depthA * (edge ? 0.26 : 0.3);
      }
    }
  }

  private drawCells() {
    const { ctx, cw, ch, cols, glyph, color, alpha, tile, tileA, dim } = this;
    for (let i = 0; i < glyph.length; i++) {
      const g = glyph[i];
      if (!g) continue;
      const x = (i % cols) * cw, y = ((i / cols) | 0) * ch;
      if (tileA[i] > 0) { ctx.globalAlpha = tileA[i] * dim[i]; ctx.fillStyle = this.css(tile[i]); ctx.fillRect(x + 1, y + 1, cw - 1, ch - 1); }
      ctx.globalAlpha = alpha[i] * dim[i]; ctx.fillStyle = this.css(color[i]);
      ctx.fillText(String.fromCharCode(g), x + cw / 2, y + ch / 2 + 1);
    }
  }
  private depositWake(p: Pond) {
    const e = this.energy;
    for (const k of p.koi) for (let n = 11; n < NODES; n++) {
      const i = this.index(k.nodes[2 * n], k.nodes[2 * n + 1]);
      if (i >= 0) e[i] = Math.min(1.5, e[i] + 0.035 + 0.0012 * k.speed);
    }
    if (p.pointer.active) { const i = this.index(p.pointer.x, p.pointer.y); if (i >= 0) e[i] = Math.min(1.5, e[i] + 0.12); }
  }
  private diffuse(dt: number) {
    const { cols, rows, energy: a, energyTmp: b } = this;
    const decay = Math.exp(-1.1 * dt);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const l = c > 0 ? a[i - 1] : a[i], rt = c < cols - 1 ? a[i + 1] : a[i], u = r > 0 ? a[i - cols] : a[i], d = r < rows - 1 ? a[i + cols] : a[i];
      b[i] = (4 * a[i] + l + rt + u + d) * 0.125 * decay;
    }
    this.energy = b; this.energyTmp = a;
  }
  private drawShadows() {
    const { shadow, glyph, dim } = this;
    for (let i = 0; i < shadow.length; i++) if (shadow[i] && !glyph[i]) this.put(i, ':', PAL.shadow, 0.5 * dim[i]);
  }
  private drawWake() {
    const { energy, glyph, shadow } = this;
    for (let i = 0; i < energy.length; i++) {
      const e = energy[i];
      if (e < 0.22 || glyph[i] || shadow[i]) continue;
      this.put(i, e > 0.5 ? '-' : '.', PAL.water, 0.4 * Math.min(1, (e - 0.22) * 1.4) * this.dim[i]);
    }
  }
  private drawRipples(p: Pond) {
    const { cw, ch, cols, rows, glyph, dim } = this;
    for (const rp of p.ripples) {
      const age = p.time - rp.born, life = 2.2 + 1.6 * rp.strength;
      const fade = Math.pow(1 - age / life, 1.5) * rp.strength;
      for (let ring = 0; ring < 2; ring++) {
        const radius = 52 * Math.max(0, age - 0.45 * ring) * (0.7 + 0.5 * rp.strength);
        if (radius < 2) continue;
        const thick = 0.6 * cw, a = fade * (ring === 0 ? 0.7 : 0.4);
        const c0 = Math.max(0, Math.floor((rp.x - radius - cw) / cw)), c1 = Math.min(cols - 1, Math.floor((rp.x + radius + cw) / cw));
        const r0 = Math.max(0, Math.floor((rp.y - radius - ch) / ch)), r1 = Math.min(rows - 1, Math.floor((rp.y + radius + ch) / ch));
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
          const i = r * cols + c;
          if (glyph[i]) continue;
          const dx = c * cw + cw / 2 - rp.x, dy = r * ch + ch / 2 - rp.y;
          if (Math.abs(Math.hypot(dx, dy) - radius) > thick) continue;
          // Pick the stroke that is tangent to the ring.
          const ang = Math.abs(Math.atan2(dy, dx)) / Math.PI;
          const g = ring === 1 ? '.' : ang < 0.12 || ang > 0.88 ? '|' : ang > 0.38 && ang < 0.62 ? '-' : (dx * dy > 0 ? '\\' : '/');
          this.put(i, g, PAL.water, a * dim[i]);
        }
      }
    }
  }
  private drawPellets(p: Pond) {
    const { glyph, ch } = this;
    for (const pl of p.pellets) {
      const age = p.time - pl.born;
      if (!pl.landed) {
        const f = age / pl.landAt, i = this.index(pl.x, pl.y - (1 - f) * ch * 1.5);
        if (i >= 0 && !glyph[i]) this.put(i, f < 0.5 ? "'" : '.', PAL.pellet, 0.8 * (0.5 + 0.4 * f));
        continue;
      }
      const i = this.index(pl.x, pl.y);
      if (i < 0 || glyph[i]) continue;
      const sink = smooth(9, 14, age);
      this.put(i, sink > 0.55 ? '.' : 'o', PAL.pellet, 0.85 * (0.8 + 0.2 * Math.sin(3 * age + pl.x)) * (1 - 0.85 * sink));
    }
  }
  private drawBites(p: Pond) {
    for (const b of p.bites) {
      const i = this.index(b.x, b.y);
      if (i < 0) continue;
      const f = (p.time - b.born) / 0.45;
      this.put(i, f < 0.35 ? '*' : f < 0.7 ? '+' : '.', PAL.pellet, (1 - f * f));
    }
  }
}
