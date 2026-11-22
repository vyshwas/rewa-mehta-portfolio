// A cosy studio seen as an isometric corner: two walls and a wood floor, furniture as little 3D blocks,
// and a cat (drawn from the side, so she reads as a cat) playing with a ball of yarn.
// Everything is monospace character cells, like the rest of the site. Original implementation,
// composed after a reference photo (window light, hanging plants, bed, bookshelf, brick wall with frames, rug, desk).

const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hash = (a: number, b: number, c = 0) => {
  let h = Math.imul(a | 0, 0x165667b1) ^ Math.imul(b | 0, 0x27d4eb2f) ^ Math.imul(c | 0, 0x55fdc781);
  h = Math.imul(h ^ (h >>> 13), 0x4bf19f61);
  return ((h ^ (h >>> 16)) >>> 0) / 0x100000000;
};
type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a: RGB, k: number): RGB => [Math.min(255, a[0] * k), Math.min(255, a[1] * k), Math.min(255, a[2] * k)];
const pack = (c: RGB) => ((c[0] | 0) << 16) | ((c[1] | 0) << 8) | (c[2] | 0);

export interface Box { left: number; top: number; right: number; bottom: number }

const K = {
  wall: [212, 182, 146] as RGB, wallShade: [176, 144, 110] as RGB, base: [236, 228, 214] as RGB,
  oakA: [190, 136, 78] as RGB, oakB: [174, 120, 66] as RGB, oakC: [202, 150, 90] as RGB,
  rug: [98, 110, 72] as RGB, rugEdge: [78, 90, 56] as RGB,
  duvet: [142, 152, 114] as RGB, duvetDark: [110, 120, 86] as RGB, pillow: [224, 206, 186] as RGB, pillowMauve: [184, 148, 146] as RGB, mattress: [228, 216, 198] as RGB,
  sofa: [222, 206, 180] as RGB, sofaDark: [190, 172, 144] as RGB, throw: [198, 170, 132] as RGB,
  woodD: [100, 62, 38] as RGB, woodM: [150, 98, 58] as RGB, woodL: [190, 140, 90] as RGB,
  white: [240, 236, 228] as RGB, grey: [196, 194, 192] as RGB, dark: [32, 32, 38] as RGB,
  leafD: [40, 92, 44] as RGB, leafM: [66, 124, 54] as RGB, leafL: [112, 164, 78] as RGB,
  pot: [192, 104, 64] as RGB, potD: [150, 78, 48] as RGB,
  brickA: [152, 90, 66] as RGB, brickB: [128, 72, 54] as RGB, mortar: [204, 180, 158] as RGB,
  glow: [255, 226, 154] as RGB, sky: [150, 190, 120] as RGB, screen: [96, 128, 178] as RGB,
  fur: [238, 122, 56] as RGB, stripe: [160, 66, 28] as RGB, cream: [248, 230, 208] as RGB,
  earIn: [240, 156, 146] as RGB, eye: [24, 18, 14] as RGB, eyeShine: [255, 236, 190] as RGB, nose: [236, 130, 130] as RGB, outline: [70, 32, 14] as RGB,
  yarn: [74, 100, 235] as RGB, yarnHi: [170, 186, 255] as RGB,
};

// ------------------------------------------------------------------ painter (isometric)

interface Paint {
  c: RGB | ((u: number, v: number, x: number, y: number) => RGB);
  a?: number;
  g?: (u: number, v: number, x: number, y: number) => string | null;
  gc?: RGB; ga?: number;
  edge?: number;         // darkening on the outline of the face (0 = none)
  bid?: number;          // id of the solid this cell belongs to (the cat is hidden behind it)
}

export interface IsoScene {
  cols: number; rows: number; cw: number; ch: number;
  A: number; B: number; cx: number; ty: number;
  rgb: Float32Array; glyph: Uint16Array; gcol: Uint32Array; galpha: Float32Array; light: Float32Array; depth: Int16Array; bx1: number[]; by1: number[];
  obstacles: [number, number, number, number][];
  floor: { x1: number; y1: number };
  spawn: { x: number; y: number }; nap: { x: number; y: number };
}

class Iso {
  cols: number; rows: number; A: number; B: number; cx: number; ty: number;
  rgb: Float32Array; glyph: Uint16Array; gcol: Uint32Array; galpha: Float32Array; depth: Int16Array; bx1: number[] = []; by1: number[] = [];
  reg(x1: number, y1: number) { this.bx1.push(x1); this.by1.push(y1); return this.bx1.length - 1; }
  constructor(public W: number, public H: number, public cw: number, public ch: number) {
    this.cols = Math.ceil(W / cw); this.rows = Math.ceil(H / ch);
    // Fit the whole corner in the frame. On wide screens the text sits in a left column, so the room moves right.
    const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 1000px)').matches;   // same breakpoint as the CSS
    const RW = 640, RL = 540;
    let A: number;
    if (wide) A = Math.min(clamp((H * 0.97 - 30) / 880, 0.5, 1.4), (W - 8) / (RW + RL));
    else A = clamp(Math.min(W / 1180, (H * 0.62 - 40) / 866), 0.25, 1);
    this.A = A; this.B = A * 0.95;
    this.cx = wide ? clamp(W * 0.6, RL * A, W - 8 - RW * A) : W * 0.5;
    const wallTop = 280 * this.B;
    this.ty = wallTop + (wide ? 34 : 64);
    if (!wide) this.ty += Math.max(0, (H * 0.5 - 64 - (wallTop + 570 * A + 10)) / 2);   // centre it in the space above the text
    const n = this.cols * this.rows;
    this.rgb = new Float32Array(n * 3); this.glyph = new Uint16Array(n); this.gcol = new Uint32Array(n); this.galpha = new Float32Array(n); this.depth = new Int16Array(n).fill(-1);
  }
  P(x: number, y: number, z: number): [number, number] { return [this.cx + (x - y) * this.A, this.ty + (x + y) * this.A * 0.5 - z * this.B]; }
  /** world floor coordinates under a screen point */
  inv(sx: number, sy: number): [number, number] {
    const u = (sx - this.cx) / this.A, v = (sy - this.ty) / (this.A * 0.5);
    return [(u + v) / 2, (v - u) / 2];
  }

  /** A parallelogram O + u*e1 + v*e2 in screen space. */
  para(O: [number, number], e1: [number, number], e2: [number, number], p: Paint) {
    const { cw, ch, cols, rows } = this;
    const xs = [O[0], O[0] + e1[0], O[0] + e2[0], O[0] + e1[0] + e2[0]], ys = [O[1], O[1] + e1[1], O[1] + e2[1], O[1] + e1[1] + e2[1]];
    const c0 = Math.max(0, Math.floor(Math.min(...xs) / cw)), c1 = Math.min(cols - 1, Math.floor(Math.max(...xs) / cw));
    const r0 = Math.max(0, Math.floor(Math.min(...ys) / ch)), r1 = Math.min(rows - 1, Math.floor(Math.max(...ys) / ch));
    const det = e1[0] * e2[1] - e1[1] * e2[0];
    if (Math.abs(det) < 1e-6) return;
    const a = p.a ?? 1, edge = p.edge ?? 0.14;
    const eu = (cw * 1.15) / Math.hypot(e1[0], e1[1]), ev = (ch * 1.15) / Math.hypot(e2[0], e2[1]);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = c * cw + cw / 2, py = r * ch + ch / 2, dx = px - O[0], dy = py - O[1];
      const u = (dx * e2[1] - dy * e2[0]) / det, v = (e1[0] * dy - e1[1] * dx) / det;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      let col = typeof p.c === 'function' ? p.c(u, v, px, py) : p.c;
      if (edge > 0 && (u < eu || u > 1 - eu || v < ev || v > 1 - ev)) col = mul(col, 1 - edge);
      this.put(r * cols + c, col, a, p, u, v, px, py);
    }
  }

  /** Any screen-space shape (ellipses, billboards). */
  region(x0: number, y0: number, x1: number, y1: number, test: (x: number, y: number) => boolean, p: Paint) {
    const { cw, ch, cols, rows } = this;
    const c0 = Math.max(0, Math.floor(x0 / cw)), c1 = Math.min(cols - 1, Math.floor(x1 / cw));
    const r0 = Math.max(0, Math.floor(y0 / ch)), r1 = Math.min(rows - 1, Math.floor(y1 / ch));
    const a = p.a ?? 1, edge = p.edge ?? 0.12, dx = Math.max(1e-6, x1 - x0), dy = Math.max(1e-6, y1 - y0);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = c * cw + cw / 2, py = r * ch + ch / 2;
      if (!test(px, py)) continue;
      const u = (px - x0) / dx, v = (py - y0) / dy;
      let col = typeof p.c === 'function' ? p.c(u, v, px, py) : p.c;
      if (edge > 0 && (!test(px, py + ch) || !test(px + cw, py))) col = mul(col, 1 - edge);
      else if (edge > 0 && (!test(px, py - ch) || !test(px - cw, py))) col = mul(col, 1 + edge * 0.5);
      this.put(r * cols + c, col, a, p, u, v, px, py);
    }
  }

  private put(i: number, col: RGB, a: number, p: Paint, u: number, v: number, px: number, py: number) {
    const o = i * 3;
    this.rgb[o] = this.rgb[o] * (1 - a) + col[0] * a; this.rgb[o + 1] = this.rgb[o + 1] * (1 - a) + col[1] * a; this.rgb[o + 2] = this.rgb[o + 2] * (1 - a) + col[2] * a;
    const g = p.g ? p.g(u, v, px, py) : null;
    if (g) { this.glyph[i] = g.charCodeAt(0); this.gcol[i] = pack(p.gc ?? mul(col, 1.35)); this.galpha[i] = p.ga ?? 0.55; }
    else if (a >= 0.9) this.glyph[i] = 0;
    if (p.bid !== undefined) this.depth[i] = p.bid;
  }

  // ---- 3D helpers (world cm -> screen)
  floor(x0: number, y0: number, dx: number, dy: number, p: Paint, z = 0) {
    const O = this.P(x0, y0, z), a = this.P(x0 + dx, y0, z), b = this.P(x0, y0 + dy, z);
    this.para(O, [a[0] - O[0], a[1] - O[1]], [b[0] - O[0], b[1] - O[1]], p);
  }
  /** wall 'R' is the plane y=0 (runs along x), wall 'L' is the plane x=0 (runs along y) */
  wall(plane: 'R' | 'L', a0: number, a1: number, z0: number, z1: number, p: Paint) {
    const pt = (a: number, z: number) => (plane === 'R' ? this.P(a, 0, z) : this.P(0, a, z));
    const O = pt(a0, z1), e = pt(a1, z1), d = pt(a0, z0);
    this.para(O, [e[0] - O[0], e[1] - O[1]], [d[0] - O[0], d[1] - O[1]], p);
  }
  /** an axis-aligned block: its three visible faces get their own paint */
  box(x0: number, y0: number, z0: number, dx: number, dy: number, dz: number, top: Paint, left: Paint, right: Paint, reg: boolean | number = true) {
    const x1 = x0 + dx, y1 = y0 + dy, zt = z0 + dz, bid = reg ? this.reg(x1, y1) : undefined;
    // +y face (faces down-left on screen)
    let O = this.P(x0, y1, zt), e = this.P(x1, y1, zt), d = this.P(x0, y1, z0);
    this.para(O, [e[0] - O[0], e[1] - O[1]], [d[0] - O[0], d[1] - O[1]], { ...left, bid });
    // +x face (faces down-right)
    O = this.P(x1, y0, zt); e = this.P(x1, y1, zt); d = this.P(x1, y0, z0);
    this.para(O, [e[0] - O[0], e[1] - O[1]], [d[0] - O[0], d[1] - O[1]], { ...right, bid });
    // top
    O = this.P(x0, y0, zt); e = this.P(x1, y0, zt); d = this.P(x0, y1, zt);
    this.para(O, [e[0] - O[0], e[1] - O[1]], [d[0] - O[0], d[1] - O[1]], { ...top, bid });
  }
  /** soft shadow on the floor, thrown away from the window */
  shadow(x0: number, y0: number, dx: number, dy: number, h: number) {
    const s = h * 0.32;
    this.floor(x0 + 2, y0 + 2, dx + s, dy + s, { c: [0, 0, 0], a: 0.2, edge: 0 });
  }
  solid(x0: number, y0: number, z0: number, dx: number, dy: number, dz: number, col: RGB, opt: { tex?: Paint['g']; gc?: RGB; shadow?: boolean; key?: number } = {}) {
    if (opt.shadow !== false) this.shadow(x0, y0, dx, dy, dz + z0);
    const mk = (f: number): Paint => ({ c: (u, v) => mul(col, f * (0.96 + 0.08 * (1 - v))), g: opt.tex, gc: opt.gc, ga: 0.5 });
    this.box(x0, y0, z0, dx, dy, dz, mk(1.12), mk(0.88), mk(0.7), true);
  }
  /** a round pot or pouf: ellipse top, rounded side */
  cyl(cx: number, cy: number, r: number, z0: number, dz: number, col: RGB, topCol?: RGB) {
    const [bx, by] = this.P(cx, cy, z0), [tx, ty2] = this.P(cx, cy, z0 + dz);
    const rx = r * this.A * 1.414, ry = r * this.A * 0.707, bid = this.reg(cx + r, cy + r);
    this.region(bx - rx, ty2 - ry, bx + rx, by + ry, (px, py) => {
      const inTop = ((px - tx) / rx) ** 2 + ((py - ty2) / ry) ** 2 <= 1;
      const inBot = ((px - bx) / rx) ** 2 + ((py - by) / ry) ** 2 <= 1;
      return inTop || inBot || (Math.abs(px - bx) <= rx && py >= ty2 && py <= by);
    }, { c: (u, v, x, y) => (((x - tx) / rx) ** 2 + ((y - ty2) / ry) ** 2 <= 1 ? (topCol ?? mul(col, 1.15)) : mul(col, 0.8 + 0.25 * Math.cos((x - bx) / rx * 1.3))), bid, edge: 0.1 });
  }
  /** a leafy plant as a billboard of overlapping leaves standing at a floor point */
  foliage(x: number, y: number, z: number, r: number, seed: number, n = 8, reg = true) {
    const [sx, sy] = this.P(x, y, z), bid = reg ? this.reg(x + 6, y + 6) : undefined;
    for (let i = 0; i < n; i++) {
      const a = hash(seed, i, 1) * TAU, d = r * this.A * (0.15 + 0.7 * hash(seed, i, 2)), lr = r * this.A * (0.38 + 0.3 * hash(seed, i, 3));
      const cxx = sx + Math.cos(a) * d * 0.9, cyy = sy - Math.abs(Math.sin(a)) * d * 0.9 - r * this.A * 0.2;
      const tone = hash(seed, i, 4), base = tone < 0.4 ? K.leafD : tone < 0.75 ? K.leafM : K.leafL;
      const cs = Math.cos(a * 0.5), sn = Math.sin(a * 0.5);
      this.region(cxx - lr * 1.3, cyy - lr * 1.3, cxx + lr * 1.3, cyy + lr * 1.3, (px, py) => {
        const dx = px - cxx, dy = py - cyy; return ((dx * cs + dy * sn) / (lr * 1.25)) ** 2 + ((-dx * sn + dy * cs) / (lr * 0.75)) ** 2 <= 1;
      }, { c: (u, v) => mix(base, mul(base, 1.35), 1 - v), g: (u, v, px, py) => (hash(px | 0, py | 0, seed) < 0.2 ? '%' : null), gc: mul(base, 1.5), ga: 0.5, bid, edge: 0.18 });
    }
  }
  plant(x: number, y: number, r: number, seed: number, z = 0, height = 22, n = 8) {
    this.shadow(x - r * 0.5, y - r * 0.5, r, r, height);
    this.cyl(x, y, r * 0.42, z, r * 0.7, K.pot, [64, 44, 30]);
    this.foliage(x, y, z + r * 0.7, r, seed, n);
    void height;
  }
}

// ------------------------------------------------------------------ the room

function buildIso(W: number, H: number, cw: number, ch: number): IsoScene {
  const s = new Iso(W, H, cw, ch);
  const { A } = s;
  const Wx = 640, Ly = 540, Hw = 280;
  const obstacles: [number, number, number, number][] = [];
  const block = (x0: number, y0: number, x1: number, y1: number) => obstacles.push([x0, y0, x1, y1]);

  // ---- floor (planks running along the left wall) and the two walls
  s.floor(0, 0, Wx, Ly, {
    c: (u, v, px, py) => { const [fx] = s.inv(px, py); const i = Math.floor(fx / 26); return mix(mix(K.oakA, K.oakB, hash(i, 3, 7)), K.oakC, 0.25 * hash(i, 11, 2)); },
    g: (u, v, px, py) => { const [fx, fy] = s.inv(px, py); const m = ((fx % 26) + 26) % 26; if (m < 2.6) return '/'; return hash(Math.floor(fx / 26), Math.floor(fy / 40), 5) < 0.04 ? '-' : null; },
    gc: [124, 76, 42], ga: 0.4, edge: 0,
  });
  // right wall: brick
  s.wall('R', 0, Wx, 0, Hw, {
    c: (u, v, px, py) => {
      const row = Math.floor((1 - v) * Hw / 7.6), off = row % 2 ? 0.5 : 0, bx = Math.floor(u * Wx / 22 + off);
      return mix(K.brickA, K.brickB, hash(bx, row, 9));
    },
    g: (u, v) => { const rowF = (1 - v) * Hw / 7.6, rr = rowF - Math.floor(rowF); if (rr < 0.12) return '-'; const row = Math.floor(rowF), off = row % 2 ? 0.5 : 0, bf = u * Wx / 22 + off; return bf - Math.floor(bf) < 0.06 ? '|' : null; },
    gc: K.mortar, ga: 0.5, edge: 0,
  });
  // left wall: warm plaster
  s.wall('L', 0, Ly, 0, Hw, { c: (u, v) => mix(K.wall, K.wallShade, 0.18 + 0.4 * (1 - v)), g: (u, v, px, py) => (hash(px | 0, py | 0, 6) < 0.03 ? '.' : null), gc: [150, 120, 90], ga: 0.4, edge: 0 });
  s.wall('R', 0, Wx, 0, 9, { c: K.base, edge: 0 });
  s.wall('L', 0, Ly, 0, 9, { c: mul(K.base, 0.9), edge: 0 });

  // ---- window on the left wall, with the garden outside
  const wy0 = 40, wy1 = 205, wz0 = 62, wz1 = 232;
  s.wall('L', wy0 - 6, wy1 + 6, wz0 - 6, wz1 + 6, { c: K.base, edge: 0.2 });
  s.wall('L', wy0, wy1, wz0, wz1, {
    c: (u, v, px, py) => mix(K.glow, K.sky, clamp(hash((px / cw) | 0, (py / ch) | 0, 2) * 0.5 + 0.12 * (1 - v), 0, 1)),
    g: (u, v, px, py) => (hash((px / cw) | 0, (py / ch) | 0, 8) < 0.22 ? '&' : null), gc: [96, 140, 70], ga: 0.5, edge: 0,
  });
  s.wall('L', (wy0 + wy1) / 2 - 2.5, (wy0 + wy1) / 2 + 2.5, wz0, wz1, { c: K.base, edge: 0 });
  s.wall('L', wy0, wy1, (wz0 + wz1) / 2 - 2.5, (wz0 + wz1) / 2 + 2.5, { c: K.base, edge: 0 });
  s.box(0, wy0 - 8, wz0 - 8, 16, wy1 - wy0 + 16, 6, { c: K.white }, { c: mul(K.white, 0.85) }, { c: mul(K.white, 0.7) }, 5);

  // ---- picture frames and an AC unit on the brick wall; a hanging shelf on the left wall (kept off the cropped corner)
  const frames: [number, number, number, number, number, RGB][] = [
    [250, 74, 34, 46, 130, [88, 110, 80]], [292, 52, 40, 34, 160, [190, 150, 110]], [338, 100, 32, 44, 120, [70, 90, 130]], [372, 66, 42, 34, 170, [196, 120, 90]],
    [418, 112, 36, 52, 120, [120, 140, 100]], [464, 58, 34, 38, 168, [200, 190, 170]], [508, 100, 40, 56, 118, [150, 100, 110]], [556, 70, 32, 44, 150, [90, 120, 150]],
    [600, 96, 40, 50, 126, [180, 160, 120]],
  ];
  for (const [a, , fw, fh, zz, art] of frames) {
    if (a + fw > Wx - 6) continue;
    s.wall('R', a, a + fw, zz, zz + fh, { c: K.woodD, edge: 0.15 });
    s.wall('R', a + 3, a + fw - 3, zz + 3, zz + fh - 3, { c: K.cream, edge: 0 });
    s.wall('R', a + 6, a + fw - 6, zz + 6, zz + fh - 6, { c: (u, v) => mix(art, mul(art, 0.6), v), edge: 0 });
  }
  s.wall('R', 130, 250, 196, 232, { c: [232, 230, 226], edge: 0.18 });
  s.wall('R', 138, 242, 200, 204, { c: [190, 188, 184], edge: 0 });
  for (let k = 0; k < 3; k++) s.wall('R', 140, 240, 210 + k * 5, 211 + k * 5, { c: [176, 174, 170], edge: 0 });   // vent slats
  s.wall('R', 222, 232, 218, 226, { c: [120, 220, 150], edge: 0 });                                              // status light
  // radiator under the window end of the left wall
  s.wall('L', 492, 534, 10, 68, { c: K.white, g: (u, v, px) => ((Math.floor(px / cw) % 2) ? '|' : null), gc: K.grey, ga: 0.9, edge: 0.2 });
  const shY0 = 250, shY1 = 460;
  s.box(0, shY0, 168, 24, shY1 - shY0, 6, { c: K.woodL }, { c: K.woodM }, { c: K.woodD }, 30);

  // ---- furniture, drawn back to front
  const items: { key: number; draw: () => void }[] = [];
  const add = (key: number, draw: () => void) => items.push({ key, draw });

  // rug first (on the floor)
  s.floor(140, 130, 250, 190, {
    c: (u, v, px, py) => (Math.min(u, 1 - u, v, 1 - v) < 0.035 ? K.rugEdge : mix(K.rug, mul(K.rug, 1.12), hash((px / cw) | 0, (py / ch) | 0, 3) * 0.6)),
    g: (u, v, px, py) => (hash((px / cw) | 0, (py / ch) | 0, 13) < 0.12 ? '.' : null), gc: [150, 160, 110], ga: 0.4, edge: 0,
  });

  // bed against the left wall, headboard toward the corner
  add(360, () => {
    s.shadow(0, 46, 150, 183, 40);
    s.solid(0, 46, 0, 146, 182, 26, K.woodD, { shadow: false });
    s.solid(2, 48, 26, 142, 178, 20, K.mattress, { shadow: false });
    s.box(6, 100, 46, 134, 124, 7,
      { c: (u, v) => mul(mix(K.duvet, K.duvetDark, 0.5 + 0.5 * Math.sin(u * 13 + Math.sin(v * 6) * 2) * Math.sin(v * 9 + u * 3)), 1.04), g: (u, v, px, py) => (hash((px / cw) | 0, (py / ch) | 0, 4) < 0.1 ? '~' : null), gc: K.duvetDark, ga: 0.5, edge: 0.1 },
      { c: mul(K.duvet, 0.85), edge: 0.1 }, { c: mul(K.duvet, 0.68), edge: 0.1 }, 360);
    s.solid(10, 54, 46, 58, 40, 14, K.pillow, { shadow: false, key: 360 });
    s.solid(76, 56, 46, 58, 40, 14, K.pillowMauve, { shadow: false, key: 360 });
    s.solid(40, 150, 53, 64, 34, 5, K.duvet, { shadow: false, key: 360 });
  });
  block(0, 40, 150, 236);
  // bedside table and a small plant
  add(318, () => { s.solid(0, 244, 0, 38, 38, 46, K.woodM); s.plant(19, 263, 18, 70, 46, 16, 5); });
  block(0, 238, 44, 288);

  // tall shelf unit against the brick wall
  add(150, () => {
    s.shadow(18, 0, 92, 36, 190);
    const shelf: Paint = {
      c: (u, v) => {
        const rows = 5, r = Math.min(rows - 1, Math.floor(v * rows)), fy = v * rows - r;
        if (fy < 0.08 || u < 0.05 || u > 0.95) return K.woodD;
        if (r === 0) return u > 0.55 ? (fy > 0.4 ? K.leafM : [74, 46, 30]) : [74, 46, 30];
        if (r === 1) return u < 0.35 ? (fy > 0.3 ? K.pot : [74, 46, 30]) : u < 0.7 ? (fy > 0.5 ? K.white : [74, 46, 30]) : [74, 46, 30];
        const col = ([[200, 70, 50], [60, 90, 150], [230, 210, 180], [90, 120, 80], [180, 150, 90]] as RGB[])[Math.floor(hash(Math.floor(u * 11), r, 3) * 5)];
        return fy > 0.2 ? col : [74, 46, 30];
      },
      edge: 0.1,
    };
    s.box(20, 0, 0, 86, 36, 190, { c: K.woodL, edge: 0.1 }, shelf, { c: mul(K.woodD, 0.9), edge: 0.1 }, 150);
  });
  block(14, 0, 112, 42);
  // leaning mirror
  add(130, () => {
    s.solid(126, 0, 18, 72, 7, 176, K.woodM, { shadow: true });
    s.wall('R', 132, 192, 26, 186, { c: (u, v) => mix([226, 206, 170], [168, 150, 120], v), g: (u, v, px, py) => (((px / cw | 0) + (py / ch | 0)) % 8 === 0 ? '/' : null), gc: [255, 246, 220], ga: 0.55, edge: 0 });
  });
  block(122, 0, 202, 12);

  // coffee table on the rug
  add(255, () => {
    s.solid(210, 192, 0, 88, 56, 40, K.woodM);
    s.solid(220, 200, 40, 26, 18, 3, K.white, { shadow: false }); s.solid(224, 203, 43, 18, 12, 2, [160, 110, 80], { shadow: false });
    s.cyl(268, 222, 7, 40, 5, K.pot, [64, 44, 30]); s.foliage(268, 222, 46, 11, 31, 4);
    s.cyl(238, 234, 5, 40, 2, K.white);
  });
  block(204, 186, 304, 254);

  // sofa against the left wall
  add(560, () => {
    s.shadow(0, 300, 96, 180, 60);
    s.solid(0, 300, 0, 94, 180, 38, K.sofaDark, { shadow: false });
    s.solid(0, 300, 38, 26, 180, 46, K.sofa, { shadow: false });
    s.solid(26, 300, 38, 68, 24, 24, K.sofa, { shadow: false }); s.solid(26, 456, 38, 68, 24, 24, K.sofa, { shadow: false });
    s.solid(28, 326, 38, 64, 62, 14, mul(K.sofa, 1.04), { shadow: false }); s.solid(28, 392, 38, 64, 62, 14, mul(K.sofa, 1.04), { shadow: false });
    s.solid(30, 388, 52, 56, 46, 5, K.throw, { tex: (u, v, px, py) => ((((px / cw) | 0) + ((py / ch) | 0)) % 3 === 0 ? '~' : null), gc: [150, 124, 92], shadow: false });
    s.solid(16, 330, 52, 22, 30, 16, [206, 184, 150], { shadow: false });
  });
  block(0, 296, 98, 484);

  // fiddle-leaf fig and the TV on its stand
  add(60, () => { s.plant(214, 34, 38, 21, 0, 60, 9); });
  block(194, 10, 236, 56);
  add(300, () => {
    s.solid(250, 0, 0, 124, 38, 48, K.woodM);
    s.box(262, 14, 48, 100, 8, 56, { c: K.dark }, { c: (u, v) => mix([30, 36, 56], [70, 96, 140], 0.4 + 0.3 * (1 - v)), edge: 0.2 }, { c: mul(K.dark, 0.7) }, 300);
  });
  block(246, 0, 378, 44);
  add(325, () => { s.plant(392, 40, 22, 22, 0, 30, 6); });

  // desk with monitor, laptop and keyboard, and a chair
  add(560, () => {
    s.shadow(398, 0, 170, 66, 78);
    s.solid(398, 0, 0, 8, 62, 72, K.white, { shadow: false }); s.solid(560, 0, 0, 8, 62, 72, K.white, { shadow: false });
    s.solid(398, 0, 72, 170, 62, 5, K.white, { shadow: false });
    s.box(470, 6, 77, 60, 6, 40, { c: K.dark }, { c: (u, v) => mix([26, 30, 44], [86, 120, 170], 0.5 + 0.3 * (1 - v)), edge: 0.2 }, { c: mul(K.dark, 0.7) }, 560);
    s.solid(412, 24, 77, 44, 30, 2, K.grey, { shadow: false });
    s.box(412, 24, 79, 44, 3, 26, { c: K.grey }, { c: (u, v) => mix([70, 110, 170], [150, 190, 235], 1 - v), edge: 0.15 }, { c: mul(K.grey, 0.7) });
    s.solid(480, 34, 77, 60, 20, 2, [44, 44, 48], { tex: (u, v, px, py) => ((((px / cw) | 0) + ((py / ch) | 0)) % 2 ? '.' : null), gc: [130, 130, 134], shadow: false });
    s.cyl(548, 50, 6, 77, 8, K.pot, [64, 44, 30]); s.foliage(548, 50, 85, 9, 61, 4);
  });
  block(394, 0, 572, 68);
  add(640, () => { s.shadow(452, 96, 44, 44, 40); s.cyl(474, 118, 20, 0, 40, [236, 232, 226], [248, 246, 240]); s.solid(494, 98, 40, 6, 40, 50, [236, 232, 226], { shadow: false }); });
  block(446, 92, 504, 146);

  // plants and shoes
  add(70, () => { s.plant(118, 22, 22, 11, 0, 40, 8); });
  block(98, 4, 140, 44);
  add(330, () => { s.plant(60, 292, 44, 12, 0, 70, 9); });
  add(130, () => { s.plant(560, 110, 30, 34, 0, 40, 7); });
  block(536, 90, 586, 134);
  // sneakers by the door
  add(480, () => {
    s.solid(40, 500, 0, 26, 10, 6, [226, 224, 220]); s.solid(46, 501, 6, 14, 8, 3, [150, 148, 164], { shadow: false });
    s.solid(40, 516, 0, 26, 10, 6, [196, 196, 200]); s.solid(46, 517, 6, 14, 8, 3, [90, 110, 150], { shadow: false });
  });
  block(34, 494, 70, 530);
  // plants on the hanging shelf, with vines trailing down the wall
  add(30, () => {
    for (let i = 0; i < 4; i++) {
      const y = 270 + i * 52;
      s.cyl(12, y, 6, 174, 8, K.pot, [64, 44, 30]); s.foliage(12, y, 182, 10, 80 + i, 5, false);
      for (let k = 1; k <= 5; k++) s.foliage(8, y + (k % 2 ? 4 : -4), 174 - k * 13, 5, 90 + i * 7 + k, 2, false);
    }
  });
  // ferns in the foreground
  add(520, () => { s.plant(540, 440, 34, 41, 0, 40, 12); });
  block(512, 412, 568, 468);
  add(470, () => { s.plant(470, 490, 24, 43, 0, 30, 8); });
  block(450, 470, 492, 512);
  void A;

  items.sort((p, q) => p.key - q.key);
  for (const it of items) it.draw();

  // ---- warm light from the window across the floor and the bed
  const n = s.cols * s.rows, light = new Float32Array(n);
  for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) {
    const [fx, fy] = s.inv(c * cw + cw / 2, r * ch + ch / 2);
    let L = 0;
    if (fx >= 0 && fx <= 260) {
      const t = fx / 260, top = 36 + t * 110, bot = 205 + t * 130;
      if (fy >= top && fy <= bot) L = 0.5 * (1 - t) ** 0.8 * smooth(0, 16, fy - top) * smooth(0, 16, bot - fy);
    }
    L += 0.1 * Math.max(0, 1 - fx / 300);
    const [lx, ly] = s.inv(c * cw + cw / 2, r * ch + ch / 2);
    const d = Math.hypot(lx - 640, ly - 120);
    L += 0.3 * Math.max(0, 1 - d / 240) ** 2;
    light[r * s.cols + c] = L;
  }
  return {
    cols: s.cols, rows: s.rows, cw, ch, A: s.A, B: s.B, cx: s.cx, ty: s.ty,
    rgb: s.rgb, glyph: s.glyph, gcol: s.gcol, galpha: s.galpha, light, depth: s.depth, bx1: s.bx1, by1: s.by1,
    obstacles, floor: { x1: Wx, y1: Ly }, spawn: { x: 330, y: 290 }, nap: { x: 170, y: 300 },
  };
}

// ------------------------------------------------------------------ the cat (side view, so she reads as a cat)

// [bodyX, bodyY, tilt, bodyRx, bodyRy, headX, headY, frontFootX, frontFootY, hindFootX, hindFootY, frontHipX, frontHipY, hindHipX, hindHipY, tailAngle, tailSwing]
const POSES: Record<string, number[]> = {
  stand:  [0, -2.7, 0, 2.3, 1.0, 2.9, -3.4, 1.7, 0, -1.7, 0, 1.6, -2.2, -1.6, -2.2, 1.0, 0.3],
  sit:    [-0.7, -1.9, 1.05, 2.1, 1.1, 0.9, -4.4, 1.2, 0, 0.1, 0, 0.8, -2.6, -1.2, -0.9, -0.1, 0.12],
  crouch: [0.2, -1.55, -0.06, 2.3, 0.95, 3.1, -1.95, 2.5, 0, -1.5, 0, 1.8, -1.2, -1.7, -1.9, 0.02, 0.5],
  loaf:   [0, -0.95, 0, 2.2, 0.95, 2.3, -1.05, 1.5, 0, -0.9, 0, 1.2, -0.9, -1.0, -0.8, -0.05, 0.04],
  leap:   [0, -2.4, -0.25, 2.3, 0.95, 3.2, -2.7, 3.2, -1.2, -2.6, -0.6, 1.8, -2.0, -1.8, -2.0, 0.4, 0.1],
};
const PNAMES = Object.keys(POSES);
const NP = POSES.stand.length;

interface Prim {
  kind: 'ell' | 'cap' | 'tri' | 'dot';
  part: 'body' | 'chest' | 'haunch' | 'head' | 'ear' | 'earIn' | 'legU' | 'legL' | 'paw' | 'tail' | 'eye' | 'shine' | 'nose';
  far: boolean; a: number; b: number; c: number; d: number; e: number; f: number; cos: number; sin: number; idx: number;
}

type State = 'watch' | 'stalk' | 'pounce' | 'bat' | 'chase' | 'groom' | 'sleep';

export class IsoHouse {
  width = 0; height = 0; time = 0;
  scene: IsoScene | null = null;
  // cat, in world floor coordinates (cm)
  wx = 0; wy = 0; heading = 0; speed = 0; f = 1; lift = 0; liftV = 0; gait = 0; headTilt = 0;
  state: State = 'watch'; stateT = 0; stateDur = 2; pawT = -1; kicked = false; bats = 0; sleepCool = 10; napWalk = false; stuckT = 0;
  w: Record<string, number> = { stand: 0, sit: 1, crouch: 0, loaf: 0, leap: 0 };
  pose = new Float32Array(NP);
  ball = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: 7, spin: 0 };
  c = 11;                                   // one cat unit, in world cm
  S = 20;                                   // one cat unit, in screen px
  prims: Prim[] = [];
  avoid: Box[] = [];
  pointer = { x: 0, y: 0, speed: 0, active: false };
  walk: Uint8Array = new Uint8Array(0); gw = 0; gh = 0; g = 8;
  napPt = { x: 0, y: 0 };
  private placed = false; private aSig = '';

  // ---------------------------------------------------------------- setup
  attach(scene: IsoScene, w: number, h: number) {
    this.scene = scene; this.width = w; this.height = h;
    this.S = clamp(scene.cw * (scene.A < 0.5 ? 3.1 : 4.2), 7, 30);                 // sized by character cells, so she always has enough of them to read
    this.c = Math.min(this.S / scene.A / 1.25, 26);        // world scale for movement and reach
    this.ball.r = clamp(this.c * 0.5, 7, 13);
    this.gw = Math.ceil(scene.floor.x1 / this.g); this.gh = Math.ceil(scene.floor.y1 / this.g);
    this.walk = new Uint8Array(0); this.aSig = '\u0000';
  }
  private proj(x: number, y: number, z = 0): [number, number] { const s = this.scene as IsoScene; return [s.cx + (x - y) * s.A, s.ty + (x + y) * s.A * 0.5 - z * s.B]; }

  setAvoid(boxes: Box[]) {
    const sig = boxes.map((b) => [b.left, b.top, b.right, b.bottom].map(Math.round).join(',')).join('|');
    if (sig === this.aSig) return;
    this.aSig = sig; this.avoid = boxes; this.rebuildWalk();
  }

  private walkFor(clearance: number, pad: number) {
    const s = this.scene as IsoScene, { gw, gh, g } = this, n = gw * gh;
    const blocked = new Uint8Array(n), m = clearance;
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
      const x = gx * g + g / 2, y = gy * g + g / 2, i = gy * gw + gx;
      if (x < 22 + m * 0.4 || y < 22 + m * 0.4 || x > s.floor.x1 - 8 || y > s.floor.y1 - 8) { blocked[i] = 1; continue; }
      for (const [x0, y0, x1, y1] of s.obstacles) if (x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m) { blocked[i] = 1; break; }
      if (blocked[i]) continue;
      const [sx, sy] = this.proj(x, y);
      if (sx < 30 || sx > this.width - 30 || sy < 60 || sy > this.height - 4) { blocked[i] = 1; continue; }
      if (pad >= 0) for (const b of this.avoid) if (sx > b.left - pad && sx < b.right + pad && sy > b.top - pad && sy < b.bottom + pad) { blocked[i] = 1; break; }
    }
    const label = new Int32Array(n);
    let bestId = 0, bestSize = 0, id = 0;
    for (let i0 = 0; i0 < n; i0++) {
      if (blocked[i0] || label[i0]) continue;
      id++; let size = 0; const stack = [i0];
      while (stack.length) {
        const i = stack.pop() as number;
        if (label[i] || blocked[i]) continue;
        label[i] = id; size++;
        const gx = i % gw, gy = (i / gw) | 0;
        if (gx > 0) stack.push(i - 1); if (gx < gw - 1) stack.push(i + 1); if (gy > 0) stack.push(i - gw); if (gy < gh - 1) stack.push(i + gw);
      }
      if (size > bestSize) { bestSize = size; bestId = id; }
    }
    const walk = new Uint8Array(n);
    if (bestId) for (let i = 0; i < n; i++) if (label[i] === bestId) walk[i] = 1;
    return { walk, count: bestSize };
  }

  /** The largest connected patch of floor she may use, trying tighter clearances if the first is too small. */
  private rebuildWalk() {
    const s = this.scene; if (!s) return;
    const r = Math.min(this.c * 1.4, 34);
    const ladder: [number, number][] = [[r, 40], [r * 0.8, 28], [r * 0.6, 18], [r * 0.4, 8], [r * 0.3, 0], [r * 0.4, -1]];
    let best: Uint8Array | null = null, bestCount = 0;
    for (const [cl, pad] of ladder) {
      const res = this.walkFor(cl, pad);
      if (res.count > bestCount) { best = res.walk; bestCount = res.count; }
      if (res.count >= 160) break;
    }
    this.walk = best ?? new Uint8Array(this.gw * this.gh);
    const sp = this.nearestFree(s.spawn.x, s.spawn.y);
    this.napPt = this.nearestFree(s.nap.x, s.nap.y);
    if (!this.placed) { this.wx = sp.x; this.wy = sp.y; this.heading = Math.PI / 4; this.setBall(sp.x + 50, sp.y + 10); this.placed = true; return; }
    if (!this.free(this.wx, this.wy)) { const q = this.nearestFree(this.wx, this.wy); this.wx = q.x; this.wy = q.y; }
    if (!this.free(this.ball.x, this.ball.y)) { this.setBall(this.wx + 40, this.wy); this.ball.vx = this.ball.vy = this.ball.vz = 0; }
  }

  free(x: number, y: number) {
    const gx = Math.floor(x / this.g), gy = Math.floor(y / this.g);
    return gx >= 0 && gy >= 0 && gx < this.gw && gy < this.gh && this.walk[gy * this.gw + gx] === 1;
  }
  private nearestFree(x: number, y: number) {
    if (this.free(x, y)) return { x, y };
    for (let rad = 1; rad < 90; rad++) for (let a = 0; a < 16; a++) {
      const px = x + Math.cos((a / 16) * TAU) * rad * this.g, py = y + Math.sin((a / 16) * TAU) * rad * this.g;
      if (this.free(px, py)) return { x: px, y: py };
    }
    const s = this.scene as IsoScene; return { x: s.spawn.x, y: s.spawn.y };
  }
  private setBall(x: number, y: number) { const p = this.nearestFree(x, y); this.ball.x = p.x; this.ball.y = p.y; this.ball.z = this.ball.r; }

  /** A click in the hero drops the yarn at that spot on the floor. */
  toss(sx: number, sy: number) {
    const s = this.scene; if (!s) return;
    const [fx, fy] = [((sx - s.cx) / s.A + (sy - s.ty) / (s.A * 0.5)) / 2, ((sy - s.ty) / (s.A * 0.5) - (sx - s.cx) / s.A) / 2];
    this.setBall(fx, fy);
    this.ball.z = 90; this.ball.vx = rand(-40, 40); this.ball.vy = rand(-40, 40); this.ball.vz = 0;
    this.napWalk = false;
    if (this.state === 'sleep' || this.state === 'groom' || this.state === 'watch') this.go('watch', 0.3);
  }

  private go(st: State, dur = 0) {
    this.state = st; this.stateT = 0; this.stateDur = dur; this.stuckT = 0;
    if (st === 'bat') { this.pawT = 0; this.kicked = false; }
    if (st === 'pounce') { this.liftV = 520 * Math.sqrt(this.S / 20); this.speed = this.c * 24; this.face(this.ball.x, this.ball.y, 10); }
    if (st === 'sleep') this.napWalk = true;
  }

  // ---------------------------------------------------------------- simulation
  step(dt: number) {
    if (!this.scene) return;
    this.time += dt;
    this.pointer.speed *= Math.exp(-8 * dt);
    this.stepBall(dt); this.stepCat(dt); this.build();
  }

  private stepBall(dt: number) {
    const b = this.ball;
    b.vz -= 900 * dt;
    const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    if (this.free(nx, b.y)) b.x = nx; else b.vx = -b.vx * 0.6;
    if (this.free(b.x, ny)) b.y = ny; else b.vy = -b.vy * 0.6;
    b.z += b.vz * dt;
    if (b.z <= b.r) {
      b.z = b.r;
      if (Math.abs(b.vz) > 70) b.vz = -b.vz * 0.55; else b.vz = 0;
      const f = Math.exp(-1.4 * dt); b.vx *= f; b.vy *= f;
    }
    if (Math.hypot(b.vx, b.vy) < 4) { b.vx = 0; b.vy = 0; }
    b.spin += (Math.hypot(b.vx, b.vy) / b.r) * dt;
    if (!this.free(b.x, b.y)) this.setBall(b.x, b.y);
  }

  private face(tx: number, ty: number, k: number) {
    void k;
    const want = Math.atan2(ty - this.wy, tx - this.wx);
    let d = want - this.heading; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    this.heading += clamp(d, -10 * 0.016, 10 * 0.016);
    this.updateFacing();
  }
  private updateFacing() { const sdx = Math.cos(this.heading) - Math.sin(this.heading); if (Math.abs(sdx) > 0.25) this.f = Math.sign(sdx); }

  private steer(desired: number, dt: number, v: number) {
    let dx = Math.cos(desired), dy = Math.sin(desired);
    const look = this.c * 3;
    for (const a of [-1.1, -0.55, 0, 0.55, 1.1]) {
      const ang = this.heading + a;
      if (!this.free(this.wx + Math.cos(ang) * look, this.wy + Math.sin(ang) * look)) {
        const w = 1.5 * (1 - Math.abs(a) * 0.35);
        dx -= Math.cos(ang) * w; dy -= Math.sin(ang) * w;
        if (a === 0) { dx += -Math.sin(this.heading) * 0.8; dy += Math.cos(this.heading) * 0.8; }
      }
    }
    const want = Math.atan2(dy, dx);
    let d = want - this.heading; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    this.heading += clamp(d, -8 * dt, 8 * dt);
    const px = this.wx, py = this.wy;
    const nx = px + Math.cos(this.heading) * v * dt, ny = py + Math.sin(this.heading) * v * dt;
    if (this.free(nx, ny)) { this.wx = nx; this.wy = ny; } else if (this.free(nx, py)) this.wx = nx; else if (this.free(px, ny)) this.wy = ny; else this.speed *= 0.4;
    this.stuckT = Math.hypot(this.wx - px, this.wy - py) < v * dt * 0.2 ? this.stuckT + dt : 0;
    this.updateFacing();
  }

  private rescueBall() {
    const p = this.nearestFree(this.wx + Math.cos(this.heading) * this.c * 6, this.wy + Math.sin(this.heading) * this.c * 6);
    this.ball.x = p.x; this.ball.y = p.y; this.ball.vx = this.ball.vy = this.ball.vz = 0; this.ball.z = this.ball.r;
  }

  private stepCat(dt: number) {
    const c = this.c, b = this.ball;
    this.stateT += dt; this.sleepCool -= dt;
    const dist = Math.hypot(b.x - this.wx, b.y - this.wy) / c;
    const ballMoving = Math.hypot(b.vx, b.vy) > 14 || Math.abs(b.vz) > 40;
    const toBall = Math.atan2(b.y - this.wy, b.x - this.wx);
    let target = 'sit', v = 0;
    switch (this.state) {
      case 'watch': {
        target = 'sit';
        if (this.pointer.active && this.pointer.speed > 250) { const s = this.scene as IsoScene; const sdx = this.pointer.x - (this.proj(this.wx, this.wy)[0]); void s; this.f = Math.sign(sdx) || this.f; }
        else this.face(b.x, b.y, 1);
        if (this.stateT > this.stateDur) {
          const r = Math.random();
          if (ballMoving || r < 0.62) this.go(dist > 6 ? 'stalk' : 'pounce', 4.5);
          else if (r < 0.82) this.go('groom', rand(3, 4.2));
          else if (this.sleepCool < 0) { this.go('sleep', rand(6, 8)); this.sleepCool = 22; }
          else this.go('stalk', 4.5);
        }
        break;
      }
      case 'stalk': {
        target = 'crouch'; v = 2.4 * c;
        this.steer(toBall, dt, v);
        if (dist < 5 || this.stateT > this.stateDur) this.go('pounce');
        if (this.stuckT > 0.8) { this.rescueBall(); this.go('watch', 0.8); }
        break;
      }
      case 'pounce': {
        target = 'leap';
        const nx = this.wx + Math.cos(this.heading) * this.speed * dt, ny = this.wy + Math.sin(this.heading) * this.speed * dt;
        if (this.free(nx, ny)) { this.wx = nx; this.wy = ny; }
        if (this.lift <= 0 && this.liftV <= 0 && this.stateT > 0.1) { this.speed = 0; this.go('bat'); }
        break;
      }
      case 'bat': {
        target = 'stand';
        this.face(b.x, b.y, 1);
        this.pawT += dt / 0.4;
        if (!this.kicked && this.pawT > 0.4) {
          this.kicked = true;
          if (Math.hypot(b.x - this.wx, b.y - this.wy) < c * 4.2) {
            const a = this.heading + rand(-0.7, 0.7), sp = rand(150, 300);
            b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.vz = rand(140, 300);
          }
          this.bats++;
        }
        if (this.pawT >= 1) {
          this.pawT = -1;
          if (this.bats >= 4) { this.bats = 0; this.go(Math.random() < 0.5 ? 'groom' : 'watch', Math.random() < 0.5 ? rand(3, 4) : rand(1.6, 2.6)); }
          else this.go('chase', 5);
        }
        break;
      }
      case 'chase': {
        target = 'stand'; v = 14 * c;
        this.steer(toBall, dt, v);
        if (dist < 3.4) this.go('bat');
        else if (this.stuckT > 0.8) { this.rescueBall(); this.go('watch', 0.8); }
        else if (this.stateT > this.stateDur) this.go('watch', rand(1.4, 2.4));
        break;
      }
      case 'groom': { target = 'sit'; if (this.stateT > this.stateDur) this.go('watch', rand(1.4, 2.4)); break; }
      case 'sleep': {
        if (this.napWalk) {
          target = 'stand'; v = 7 * c;
          const d = Math.hypot(this.napPt.x - this.wx, this.napPt.y - this.wy);
          this.steer(Math.atan2(this.napPt.y - this.wy, this.napPt.x - this.wx), dt, v);
          if (d < c * 1.4 || this.stuckT > 1.2) { this.napWalk = false; this.stateT = 0; }
        } else { target = 'loaf'; if (this.stateT > this.stateDur) this.go('watch', rand(1.2, 2)); }
        break;
      }
    }
    let tot = 0;
    for (const nme of PNAMES) { this.w[nme] += ((nme === target ? 1 : 0) - this.w[nme]) * Math.min(1, dt * 7); tot += this.w[nme]; }
    for (let i = 0; i < NP; i++) { let a = 0; for (const nme of PNAMES) a += this.w[nme] * POSES[nme][i]; this.pose[i] = a / (tot || 1); }
    if (this.state !== 'pounce') this.speed += (v - this.speed) * Math.min(1, dt * 6);
    this.gait += dt * (v / c) * 0.45;
    if (this.lift > 0 || this.liftV > 0) { this.liftV -= 1800 * dt; this.lift += this.liftV * dt; if (this.lift <= 0) { this.lift = 0; if (this.state !== 'pounce') this.liftV = 0; } }
    let ht = 0;
    if (this.state === 'groom') ht = -0.85 + Math.sin(this.time * 7) * 0.12; else if (this.state === 'sleep' && !this.napWalk) ht = -0.5; else ht = ball3(b.z, this.c) ? 0.15 : -0.2;
    this.headTilt += (ht - this.headTilt) * Math.min(1, dt * 6);
  }

  // ---------------------------------------------------------------- the cat's shapes (screen space)
  private sx = 0; private sy = 0;
  private X(lx: number) { return this.sx + this.f * lx * this.S; }
  private Y(ly: number) { return this.sy + ly * this.S - this.lift; }
  private ell(part: Prim['part'], cx: number, cy: number, rx: number, ry: number, ang: number, far = false, idx = 0) { this.prims.push({ kind: 'ell', part, far, a: cx, b: cy, c: rx, d: ry, e: 0, f: 0, cos: Math.cos(ang), sin: Math.sin(ang), idx }); }
  private cap(part: Prim['part'], ax: number, ay: number, bx: number, by: number, r0: number, r1: number, far = false, idx = 0) { this.prims.push({ kind: 'cap', part, far, a: ax, b: ay, c: bx, d: by, e: r0, f: r1, cos: 1, sin: 0, idx }); }
  private tri(part: Prim['part'], ax: number, ay: number, bx: number, by: number, cx: number, cy: number) { this.prims.push({ kind: 'tri', part, far: false, a: ax, b: ay, c: bx, d: by, e: cx, f: cy, cos: 1, sin: 0, idx: 0 }); }
  private dot(part: Prim['part'], cx: number, cy: number, r: number) { this.prims.push({ kind: 'dot', part, far: false, a: cx, b: cy, c: r, d: 0, e: 0, f: 0, cos: 1, sin: 0, idx: 0 }); }

  private leg(hx: number, hy: number, fx: number, fy: number, kneeForward: boolean, far: boolean, idx: number) {
    const S = this.S, l1 = 1.25 * S, l2 = 1.25 * S;
    const ax = this.X(hx), ay = this.Y(hy), bx = this.X(fx), by = this.Y(fy);
    let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1;
    const maxD = l1 + l2 - 1; if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const ux = dx / d, uy = dy / d;
    let px = -uy, py = ux; const want = (kneeForward ? 1 : -1) * this.f; if (px * want < 0) { px = -px; py = -py; }
    const kx = ax + ux * a + px * h, ky = ay + uy * a + py * h, ex = ax + dx, ey = ay + dy;
    this.cap('legU', ax, ay, kx, ky, S * 0.42, S * 0.3, far, idx);
    this.cap('legL', kx, ky, ex, ey, S * 0.3, S * 0.24, far, idx);
    this.dot('paw', ex + this.f * S * 0.16, ey - S * 0.04, S * 0.36); this.prims[this.prims.length - 1].far = far;
  }

  private build() {
    const sc = this.scene as IsoScene, S = this.S, P = this.pose, t = this.time;
    [this.sx, this.sy] = this.proj(this.wx, this.wy);
    this.prims.length = 0;
    const bx = P[0], by = P[1], tilt = P[2], rx = P[3], ry = P[4], hx = P[5], hy = P[6];
    const cx = this.X(bx), cy = this.Y(by), bodyAng = Math.atan2(-Math.sin(tilt), this.f * Math.cos(tilt));
    const stride = clamp(this.speed / (7 * this.c), 0, 1) * 1.15 * (1 - this.w.leap);
    const lift = (ph: number) => Math.max(0, Math.cos(ph)) * 0.7 * clamp(this.speed / (4 * this.c), 0, 1);
    const g = this.gait * TAU;
    const ffx = P[7], ffy = P[8], hfx = P[9], hfy = P[10];
    const nf = [ffx + stride * Math.sin(g), ffy - lift(g)], nh = [hfx + stride * Math.sin(g + Math.PI), hfy - lift(g + Math.PI)];
    const ff = [ffx - 0.5 + stride * Math.sin(g + Math.PI), ffy - lift(g + Math.PI)], hf = [hfx + 0.5 + stride * Math.sin(g), hfy - lift(g)];
    if (this.pawT >= 0 && this.pawT <= 1) { const k = Math.sin(this.pawT * Math.PI); nf[0] = ffx + 1.4 * k; nf[1] = ffy - 1.6 * k; }
    // tail
    const tbx = bx - Math.cos(tilt) * rx * 0.85, tby = by + Math.sin(tilt) * rx * 0.85 - 0.15, NT = 7, seg = 0.5;
    let tx = tbx, ty = tby;
    for (let k = 0; k < NT; k++) {
      const u = k / (NT - 1), ang = P[15] + 0.1 * k * (P[15] > 0.3 ? 1 : 0) + P[16] * Math.sin(t * 2.3 - k * 0.55) * (0.3 + u);
      const nx = tx - Math.cos(ang) * seg, ny = ty - Math.sin(ang) * seg;
      this.cap('tail', this.X(tx), this.Y(ty), this.X(nx), this.Y(ny), S * (0.34 - 0.08 * u), S * (0.34 - 0.08 * (u + 1 / (NT - 1))), false, k);
      tx = nx; ty = ny;
    }
    this.leg(P[13] + 0.4, P[14], hf[0], hf[1], true, true, 0);
    this.leg(P[11] - 0.3, P[12], ff[0], ff[1], false, true, 1);
    this.ell('body', cx, cy, rx * S, ry * S, bodyAng, false, 0);
    this.ell('haunch', this.X(P[13] + 0.3), this.Y(P[14] + 0.2), 1.15 * S, 1.05 * S, 0);
    this.ell('chest', this.X(P[11]), this.Y(P[12] - 0.1), 1.0 * S, 1.0 * S, 0);
    this.leg(P[13], P[14], nh[0], nh[1], true, false, 2);
    this.leg(P[11], P[12], nf[0], nf[1], false, false, 3);
    // head, ears, face
    const hcx = this.X(hx), hcy = this.Y(hy), ht = this.headTilt, hc = Math.cos(ht), hs = Math.sin(ht);
    const toW = (lx: number, ly: number): [number, number] => { const rxp = lx * hc + ly * hs, ryp = -lx * hs + ly * hc; return [hcx + this.f * rxp * S, hcy + ryp * S]; };
    this.cap('head', this.X((bx + P[11]) / 2 + 0.6), this.Y(by - 0.3), hcx, hcy, 0.85 * S, 0.8 * S);
    this.ell('head', hcx, hcy, 1.15 * S, 1.0 * S, 0);
    const [e1ax, e1ay] = toW(-0.7, -0.5), [e1bx, e1by] = toW(-0.8, -2.3), [e1cx, e1cy] = toW(0.1, -0.7);
    const [e2ax, e2ay] = toW(0.0, -0.7), [e2bx, e2by] = toW(0.12, -2.35), [e2cx, e2cy] = toW(0.88, -0.45);
    this.tri('ear', e1ax, e1ay, e1bx, e1by, e1cx, e1cy); this.tri('ear', e2ax, e2ay, e2bx, e2by, e2cx, e2cy);
    const [i1ax, i1ay] = toW(-0.55, -0.7), [i1bx, i1by] = toW(-0.7, -1.9), [i1cx, i1cy] = toW(-0.05, -0.75);
    this.tri('earIn', i1ax, i1ay, i1bx, i1by, i1cx, i1cy);
    const [i2ax, i2ay] = toW(0.05, -0.75), [i2bx, i2by] = toW(0.12, -1.95), [i2cx, i2cy] = toW(0.65, -0.6);
    this.tri('earIn', i2ax, i2ay, i2bx, i2by, i2cx, i2cy);
    const sleeping = this.w.loaf > 0.6, [ex, ey] = toW(0.5, -0.1);
    if (sleeping) this.cap('eye', ex - S * 0.2, ey, ex + S * 0.2, ey, S * 0.07, S * 0.07);
    else { this.dot('eye', ex, ey, S * 0.2); this.dot('shine', ex + this.f * S * 0.06, ey - S * 0.07, S * 0.07); }
    const [nx2, ny2] = toW(1.08, 0.12); this.dot('nose', nx2, ny2, S * 0.13);
    void sc;
  }

  hit(px: number, py: number, out: { u: number; v: number } | null): Prim | null {
    const ps = this.prims;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; let inside = false, u = 0, v = 0;
      if (p.kind === 'ell') { const dx = px - p.a, dy = py - p.b; u = (dx * p.cos + dy * p.sin) / p.c; v = (-dx * p.sin + dy * p.cos) / p.d; inside = u * u + v * v <= 1; }
      else if (p.kind === 'cap') {
        const ex = p.c - p.a, ey = p.d - p.b, l2 = ex * ex + ey * ey || 1, t = clamp(((px - p.a) * ex + (py - p.b) * ey) / l2, 0, 1), r = p.e + (p.f - p.e) * t;
        inside = Math.hypot(px - p.a - ex * t, py - p.b - ey * t) <= r; u = t; v = (ex * (py - p.b) - ey * (px - p.a)) / (Math.sqrt(l2) * (r || 1));
      } else if (p.kind === 'tri') {
        const d1 = (px - p.c) * (p.b - p.d) - (p.a - p.c) * (py - p.d), d2 = (px - p.e) * (p.d - p.f) - (p.c - p.e) * (py - p.f), d3 = (px - p.a) * (p.f - p.b) - (p.e - p.a) * (py - p.b);
        inside = !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
      } else { inside = Math.hypot(px - p.a, py - p.b) <= p.c; v = (py - p.b) / (p.c || 1); }
      if (inside) { if (out) { out.u = u; out.v = v; } return p; }
    }
    return null;
  }

  color(p: Prim, px: number, py: number, u: number, v: number): RGB {
    switch (p.part) {
      case 'eye': return K.eye; case 'shine': return K.eyeShine; case 'nose': return K.nose; case 'earIn': return K.earIn;
      case 'paw': return K.cream; case 'legL': return mix(K.fur, K.cream, 0.75);
      case 'chest': return v > -0.1 && u > 0.1 ? K.cream : K.fur;
      case 'head': { const rel = (px - p.a) * this.f / (p.c || 1); return rel > 0.45 && py > p.b - 2 ? K.cream : (Math.sin(px * 0.19 + py * 0.11) > 0.9 ? K.stripe : K.fur); }
      case 'tail': return p.idx >= 6 || Math.sin(p.idx * 2.6 + 0.4) > 0.6 ? K.stripe : K.fur;
      case 'body': case 'haunch': { if (v > 0.55) return K.cream; if (Math.sin(u * 7.5 + p.idx) > 0.55 && v < 0.35) return K.stripe; return K.fur; }
      default: return K.fur;
    }
  }
}
function ball3(z: number, c: number) { return z > c * 2; }

// ------------------------------------------------------------------ renderer

const RAMP = '.:+oO0@';

export class IsoRenderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1; cw = 8; ch = 10; cols = 0; rows = 0;
  private dim = new Float32Array(0); private vig = new Float32Array(0);
  private glyph = new Uint16Array(0); private color = new Uint32Array(0); private alpha = new Float32Array(0);
  private tile = new Uint32Array(0); private tileA = new Float32Array(0); private shadow = new Uint8Array(0);
  private scene: IsoScene | null = null; private cache: HTMLCanvasElement | null = null; private dimSig = '';
  private styles = new Map<number, string>();
  private fontFamily = '"IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace';
  private out = { u: 0, v: 0 };

  constructor(canvas: HTMLCanvasElement) { const c = canvas.getContext('2d'); if (!c) throw new Error('2D canvas unavailable'); this.ctx = c; }
  private css(rgb: number) { let s = this.styles.get(rgb); if (!s) { s = `rgb(${rgb >>> 16},${(rgb >>> 8) & 255},${rgb & 255})`; this.styles.set(rgb, s); } return s; }

  resize(w: number, h: number, dpr: number, house: IsoHouse) {
    this.dpr = dpr;
    this.cw = clamp(Math.round(w / 250), 5, 8); this.ch = this.cw + 2;
    this.cols = Math.ceil(w / this.cw); this.rows = Math.ceil(h / this.ch);
    this.ctx.canvas.width = Math.round(w * dpr); this.ctx.canvas.height = Math.round(h * dpr);
    const n = this.cols * this.rows;
    this.glyph = new Uint16Array(n); this.color = new Uint32Array(n); this.alpha = new Float32Array(n);
    this.tile = new Uint32Array(n); this.tileA = new Float32Array(n); this.shadow = new Uint8Array(n);
    this.dim = new Float32Array(n).fill(1); this.vig = new Float32Array(n).fill(1);
    this.scene = buildIso(w, h, this.cw, this.ch);
    house.attach(this.scene, w, h);
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const x = c * this.cw, y = r * this.ch;
      this.vig[r * this.cols + c] = smooth(0, w * 0.012, x) * smooth(0, w * 0.012, w - x) * (0.6 + 0.4 * smooth(0, 60, y)) * (0.75 + 0.25 * smooth(0, 80, h - y));
    }
    this.cache = document.createElement('canvas'); this.cache.width = this.ctx.canvas.width; this.cache.height = this.ctx.canvas.height;
    this.dimSig = '\u0000';
  }

  setDimBoxes(boxes: Box[]) {
    const sig = boxes.map((b) => [b.left, b.top, b.right, b.bottom].map(Math.round).join(',')).join('|');
    if (sig === this.dimSig) return;
    this.dimSig = sig;
    const { cols, rows, cw, ch, dim } = this;
    dim.fill(1);
    const pad = 8 * cw;
    for (const b of boxes) {
      const c0 = Math.max(0, Math.floor((b.left - pad) / cw)), c1 = Math.min(cols - 1, Math.floor((b.right + pad) / cw));
      const r0 = Math.max(0, Math.floor((b.top - pad) / ch)), r1 = Math.min(rows - 1, Math.floor((b.bottom + pad) / ch));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const x = c * cw + cw / 2, y = r * ch + ch / 2;
        const d = Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));
        const i = r * cols + c; dim[i] = Math.min(dim[i], 0.42 + 0.58 * smooth(0, pad, d));
      }
    }
    this.bake();
  }

  private prepare(ctx: CanvasRenderingContext2D) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = `500 ${Math.round(0.72 * this.ch)}px ${this.fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  }

  private bake() {
    const s = this.scene, cache = this.cache; if (!s || !cache) return;
    const ctx = cache.getContext('2d'); if (!ctx) return;
    this.prepare(ctx);
    const { cols, rows, cw, ch } = this;
    for (let i = 0; i < cols * rows; i++) {
      const o = i * 3, L = 0.74 + s.light[i], k = this.dim[i] * this.vig[i];
      const r = Math.min(255, s.rgb[o] * L * 1.05 * k), g = Math.min(255, s.rgb[o + 1] * L * 0.97 * k), b = Math.min(255, s.rgb[o + 2] * L * 0.86 * k);
      if (r + g + b < 1) continue;
      const x = (i % cols) * cw, y = ((i / cols) | 0) * ch;
      ctx.globalAlpha = 1; ctx.fillStyle = this.css(((r | 0) << 16) | ((g | 0) << 8) | (b | 0)); ctx.fillRect(x, y, cw + 0.5, ch + 0.5);
      const gl = s.glyph[i]; if (gl) { ctx.globalAlpha = s.galpha[i] * k; ctx.fillStyle = this.css(s.gcol[i]); ctx.fillText(String.fromCharCode(gl), x + cw / 2, y + ch / 2 + 1); }
    }
    ctx.globalAlpha = 1;
  }

  render(h: IsoHouse) {
    const { ctx, cols } = this;
    if (!cols || !this.cache || !this.scene) return;
    this.glyph.fill(0); this.tileA.fill(0); this.shadow.fill(0);
    if (h.ball.x + h.ball.y > h.wx + h.wy) { this.rasterCat(h); this.rasterBall(h); } else { this.rasterBall(h); this.rasterCat(h); }
    this.prepare(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.cache, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#000';
    for (let i = 0; i < this.shadow.length; i++) if (this.shadow[i] && !this.glyph[i]) { ctx.globalAlpha = 0.28 * this.dim[i]; ctx.fillRect((i % cols) * this.cw, ((i / cols) | 0) * this.ch, this.cw, this.ch); }
    for (let i = 0; i < this.glyph.length; i++) {
      const g = this.glyph[i], ta = this.tileA[i]; if (!g && !ta) continue;
      const k = this.dim[i], x = (i % cols) * this.cw, y = ((i / cols) | 0) * this.ch;
      if (ta > 0) { ctx.globalAlpha = ta * k; ctx.fillStyle = this.css(this.tile[i]); ctx.fillRect(x, y, this.cw, this.ch); }
      if (g && g !== 32) { ctx.globalAlpha = this.alpha[i] * k; ctx.fillStyle = this.css(this.color[i]); ctx.fillText(String.fromCharCode(g), x + this.cw / 2, y + this.ch / 2 + 1); }
    }
    ctx.globalAlpha = 1;
  }

  /** The cat or ball is hidden where something nearer than it has been drawn. */
  private visible(i: number, wx: number, wy: number) { const sc = this.scene as IsoScene, id = sc.depth[i]; return id < 0 || !(wx < sc.bx1[id] && wy < sc.by1[id]); }

  private rasterBall(h: IsoHouse) {
    const s = this.scene as IsoScene, b = h.ball, { cw, ch, cols, rows } = this;
    const sx = s.cx + (b.x - b.y) * s.A, sy = s.ty + (b.x + b.y) * s.A * 0.5 - b.z * s.B, rr = Math.max(b.r * s.A * 1.2, 4.5);
    // shadow on the floor
    const fy = s.ty + (b.x + b.y) * s.A * 0.5 - 1;
    const sr = Math.floor(fy / ch), sc = Math.floor(sx / cw);
    if (sr >= 0 && sr < rows && sc >= 0 && sc < cols && this.visible(sr * cols + sc, b.x, b.y)) this.shadow[sr * cols + sc] = 1;
    for (let r = Math.floor((sy - rr) / ch); r <= Math.floor((sy + rr) / ch); r++) for (let c = Math.floor((sx - rr) / cw); c <= Math.floor((sx + rr) / cw); c++) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      const dx = c * cw + cw / 2 - sx, dy = r * ch + ch / 2 - sy, d = Math.hypot(dx, dy); if (d > rr) continue;
      const i = r * cols + c; if (!this.visible(i, b.x, b.y)) continue;
      const band = Math.sin((dx * Math.cos(b.spin) + dy * Math.sin(b.spin)) * 0.6 + b.spin * 2) > 0.15, lit = clamp(0.62 + (-dy / rr) * 0.25, 0.4, 1);
      this.glyph[i] = (d > rr * 0.7 ? '+' : band ? '@' : 'o').charCodeAt(0); this.color[i] = pack(K.cream); this.alpha[i] = 0.95;
      this.tile[i] = pack(mul(band ? K.yarn : K.yarnHi, lit)); this.tileA[i] = 0.95;
    }
  }

  private rasterCat(h: IsoHouse) {
    const { cw, ch, cols, rows } = this, prims = h.prims; if (!prims.length) return;
    const s = this.scene as IsoScene;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of prims) {
      const m = p.kind === 'ell' ? Math.max(p.c, p.d) : p.kind === 'dot' ? p.c : p.kind === 'cap' ? Math.max(p.e, p.f) : 0;
      const xs = p.kind === 'cap' ? [p.a, p.c] : p.kind === 'tri' ? [p.a, p.c, p.e] : [p.a], ys = p.kind === 'cap' ? [p.b, p.d] : p.kind === 'tri' ? [p.b, p.d, p.f] : [p.b];
      for (const x of xs) { minX = Math.min(minX, x - m); maxX = Math.max(maxX, x + m); } for (const y of ys) { minY = Math.min(minY, y - m); maxY = Math.max(maxY, y + m); }
    }
    const c0 = Math.max(0, Math.floor(minX / cw)), c1 = Math.min(cols - 1, Math.floor(maxX / cw)), r0 = Math.max(0, Math.floor(minY / ch)), r1 = Math.min(rows - 1, Math.floor(maxY / ch));
    const ox = 0.42 * cw, oy = 0.42 * ch, out = this.out;
    // shadow on the floor under her
    const [fsx, fsy] = [s.cx + (h.wx - h.wy) * s.A, s.ty + (h.wx + h.wy) * s.A * 0.5];
    for (let c = Math.floor((fsx - h.S * 3) / cw); c <= Math.floor((fsx + h.S * 3) / cw); c++) { const r = Math.floor((fsy + 3) / ch); if (r >= 0 && r < rows && c >= 0 && c < cols && this.visible(r * cols + c, h.wx, h.wy)) this.shadow[r * cols + c] = 1; }
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = c * cw + cw / 2, py = r * ch + ch / 2, i = r * cols + c;
      if (!this.visible(i, h.wx, h.wy)) continue;
      const centre = h.hit(px, py, out);
      let inside = 0, nx = 0, ny = 0;
      for (let q = 0; q < 4; q++) { const sx = q & 1 ? 1 : -1, sy = q & 2 ? 1 : -1; if (h.hit(px + sx * ox, py + sy * oy, null)) inside++; else { nx += sx; ny += sy; } }
      if (!centre && inside < 3) continue;
      let prim = centre, u = out.u, v = out.v;
      if (!centre) { prim = h.hit(px + ox * Math.sign(-nx || 1), py + oy * Math.sign(-ny || 1), out); u = out.u; v = out.v; }
      if (!prim) continue;
      const edge = !centre || inside < 4, col = h.color(prim, px, py, u, v);
      const light = 0.85 + 0.4 * s.light[i], tint = (cc: RGB): RGB => mul(cc, light);
      if (prim.part === 'eye' || prim.part === 'shine' || prim.part === 'nose') {
        this.glyph[i] = (prim.part === 'eye' ? 'O' : '.').charCodeAt(0); this.color[i] = pack(prim.part === 'eye' ? K.eyeShine : col); this.alpha[i] = 1; this.tile[i] = pack(col); this.tileA[i] = 0.95; continue;
      }
      const lit = clamp(0.78 + 0.28 * (-(py - prim.b) / (Math.max(prim.c, prim.d, prim.e) || 30)), 0.55, 1.1), shaded = mul(col, prim.far ? lit * 0.62 : lit);
      if (edge) {
        const tx = -ny, ty = nx, g = Math.abs(ty) < Math.abs(tx) * 0.4 ? '-' : Math.abs(tx) < Math.abs(ty) * 0.4 ? '|' : (tx * ty > 0 ? '\\' : '/');
        this.glyph[i] = (nx === 0 && ny === 0 ? '.' : g).charCodeAt(0); this.color[i] = pack(mix(K.outline, K.fur, 0.3)); this.alpha[i] = 0.95;
        this.tile[i] = pack(tint(mul(shaded, 0.72))); this.tileA[i] = 1;
      } else {
        const t = clamp(lit * 0.8 + ((hash(c, r, 33) * 3) | 0) * 0.04, 0, 0.99);
        this.glyph[i] = RAMP[clamp(Math.round(t * (RAMP.length - 1)), 0, RAMP.length - 1)].charCodeAt(0);
        this.color[i] = pack(tint(mul(mix(col, K.cream, 0.18), prim.far ? 0.7 : 1))); this.alpha[i] = prim.far ? 0.8 : 0.92;
        this.tile[i] = pack(tint(shaded)); this.tileA[i] = 1;
      }
    }
  }
}
