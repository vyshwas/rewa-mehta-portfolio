// A cosy studio seen from high above, from a corner, with a cat playing on the floor.
// Drawn in monospace characters like the rest of the site. Original implementation,
// composed after a reference photo of a top-down room (angle, scale, furniture, warm light).

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
  wall: [214, 184, 146] as RGB, wallShade: [184, 150, 114] as RGB, base: [232, 224, 210] as RGB,
  oakA: [190, 136, 78] as RGB, oakB: [176, 122, 68] as RGB, oakC: [200, 148, 88] as RGB,
  rug: [96, 108, 70] as RGB, rugEdge: [80, 92, 58] as RGB,
  duvet: [142, 152, 114] as RGB, duvetDark: [112, 122, 88] as RGB, pillow: [222, 204, 184] as RGB, pillowMauve: [180, 144, 142] as RGB, mattress: [226, 214, 196] as RGB,
  sofa: [220, 204, 178] as RGB, sofaDark: [188, 170, 142] as RGB, throw: [196, 168, 130] as RGB,
  woodD: [104, 64, 40] as RGB, woodM: [152, 100, 60] as RGB, woodL: [188, 138, 88] as RGB,
  white: [238, 234, 226] as RGB, grey: [196, 194, 192] as RGB, dark: [30, 30, 34] as RGB,
  leafD: [40, 92, 44] as RGB, leafM: [66, 124, 54] as RGB, leafL: [112, 164, 78] as RGB,
  pot: [190, 102, 62] as RGB, potD: [150, 78, 48] as RGB,
  brickA: [150, 88, 64] as RGB, brickB: [128, 72, 54] as RGB, mortar: [200, 176, 154] as RGB,
  glow: [255, 224, 150] as RGB, sky: [150, 190, 120] as RGB,
  screen: [96, 128, 178] as RGB,
  fur: [236, 120, 56] as RGB, stripe: [158, 66, 28] as RGB, cream: [248, 230, 208] as RGB,
  earIn: [240, 156, 146] as RGB, eye: [24, 18, 14] as RGB, nose: [236, 130, 130] as RGB, outline: [78, 36, 16] as RGB,
  yarn: [74, 100, 235] as RGB, yarnHi: [170, 186, 255] as RGB,
};

// ------------------------------------------------------------------ the painted room

interface Paint {
  c: RGB | ((u: number, v: number, x: number, y: number) => RGB);
  a?: number;                      // opacity
  g?: (u: number, v: number, x: number, y: number) => string | null; // texture glyph
  gc?: RGB; ga?: number;           // glyph colour / opacity
  block?: boolean;                 // furniture the cat cannot walk through
  shade?: number;                  // edge shading strength (default 0.6)
  sh?: [number, number, number];   // drop shadow: dx, dy (design px), opacity
}

export interface SceneData {
  cols: number; rows: number; cw: number; ch: number; k: number; Wd: number; Hd: number;
  rgb: Float32Array; glyph: Uint16Array; gcol: Uint32Array; galpha: Float32Array;
  light: Float32Array; blocked: Uint8Array;
  spawn: { x: number; y: number }; nap: { x: number; y: number };
  floor: { x0: number; y0: number; x1: number; y1: number };
}

class Painter {
  cols: number; rows: number; k: number; Wd: number; Hd: number; tall: boolean;
  rgb: Float32Array; glyph: Uint16Array; gcol: Uint32Array; galpha: Float32Array; block: Uint8Array;
  constructor(public W: number, public H: number, public cw: number, public ch: number) {
    this.cols = Math.ceil(W / cw); this.rows = Math.ceil(H / ch);
    this.tall = W / H < 1.05;
    this.k = this.tall ? W / 736 : H / 900;
    this.Wd = W / this.k; this.Hd = H / this.k;
    const n = this.cols * this.rows;
    this.rgb = new Float32Array(n * 3); this.glyph = new Uint16Array(n); this.gcol = new Uint32Array(n); this.galpha = new Float32Array(n); this.block = new Uint8Array(n);
  }

  private core(x0: number, y0: number, x1: number, y1: number, test: (x: number, y: number) => boolean, p: Paint) {
    const { cw, ch, cols, rows } = this;
    const c0 = Math.max(0, Math.floor(x0 / cw)), c1 = Math.min(cols - 1, Math.floor(x1 / cw));
    const r0 = Math.max(0, Math.floor(y0 / ch)), r1 = Math.min(rows - 1, Math.floor(y1 / ch));
    const a = p.a ?? 1, sh = p.shade ?? 0.6;
    const dx = Math.max(1e-6, x1 - x0), dy = Math.max(1e-6, y1 - y0);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = c * cw + cw / 2, py = r * ch + ch / 2;
      if (!test(px, py)) continue;
      const u = (px - x0) / dx, v = (py - y0) / dy;
      let col = typeof p.c === 'function' ? p.c(u, v, px, py) : p.c;
      if (sh > 0) {
        let f = 1;
        if (!test(px, py + ch)) f *= 1 - 0.22 * sh;
        if (!test(px + cw, py)) f *= 1 - 0.12 * sh;
        if (!test(px, py - ch)) f *= 1 + 0.12 * sh;
        if (!test(px - cw, py)) f *= 1 + 0.06 * sh;
        if (f !== 1) col = mul(col, f);
      }
      const i = r * cols + c, o = i * 3;
      this.rgb[o] = this.rgb[o] * (1 - a) + col[0] * a;
      this.rgb[o + 1] = this.rgb[o + 1] * (1 - a) + col[1] * a;
      this.rgb[o + 2] = this.rgb[o + 2] * (1 - a) + col[2] * a;
      const g = p.g ? p.g(u, v, px, py) : null;
      if (g) { this.glyph[i] = g.charCodeAt(0); this.gcol[i] = pack(p.gc ?? mul(col, 1.35)); this.galpha[i] = p.ga ?? 0.55; }
      else if (a >= 0.9) this.glyph[i] = 0;
      if (p.block) this.block[i] = 1;
    }
  }

  private run(x0: number, y0: number, x1: number, y1: number, test: (x: number, y: number) => boolean, p: Paint) {
    if (p.sh) {
      const [sx, sy, sa] = p.sh, k = this.k;
      this.core(x0 + sx * k, y0 + sy * k, x1 + sx * k, y1 + sy * k, (x, y) => test(x - sx * k, y - sy * k), { c: [0, 0, 0], a: sa, shade: 0 });
    }
    this.core(x0, y0, x1, y1, test, p);
  }

  rect(x: number, y: number, w: number, h: number, p: Paint) {
    const k = this.k; x *= k; y *= k; w *= k; h *= k;
    this.run(x, y, x + w, y + h, (px, py) => px >= x && px <= x + w && py >= y && py <= y + h, p);
  }
  rrect(x: number, y: number, w: number, h: number, r: number, p: Paint) {
    const k = this.k; x *= k; y *= k; w *= k; h *= k; r *= k;
    this.run(x, y, x + w, y + h, (px, py) => {
      if (px < x || px > x + w || py < y || py > y + h) return false;
      const cx = clamp(px, x + r, x + w - r), cy = clamp(py, y + r, y + h - r);
      return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    }, p);
  }
  ell(cx: number, cy: number, rx: number, ry: number, ang: number, p: Paint) {
    const k = this.k; cx *= k; cy *= k; rx *= k; ry *= k;
    const cs = Math.cos(ang), sn = Math.sin(ang), m = Math.max(rx, ry);
    this.run(cx - m, cy - m, cx + m, cy + m, (px, py) => {
      const dx = px - cx, dy = py - cy;
      const u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry;
      return u * u + v * v <= 1;
    }, p);
  }
  cap(x0: number, y0: number, x1: number, y1: number, r: number, p: Paint) {
    const k = this.k; x0 *= k; y0 *= k; x1 *= k; y1 *= k; r *= k;
    this.run(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, (px, py) => {
      const ex = x1 - x0, ey = y1 - y0, l2 = ex * ex + ey * ey || 1;
      const t = clamp(((px - x0) * ex + (py - y0) * ey) / l2, 0, 1);
      return Math.hypot(px - x0 - ex * t, py - y0 - ey * t) <= r;
    }, p);
  }
  poly(pts: number[][], p: Paint) {
    const k = this.k, q = pts.map(([x, y]) => [x * k, y * k]);
    const xs = q.map((a) => a[0]), ys = q.map((a) => a[1]);
    this.run(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), (px, py) => {
      let inside = false;
      for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
        if ((q[i][1] > py) !== (q[j][1] > py) && px < ((q[j][0] - q[i][0]) * (py - q[i][1])) / (q[j][1] - q[i][1]) + q[i][0]) inside = !inside;
      }
      return inside;
    }, p);
  }
}

// small reusable pieces -------------------------------------------------------
function pot(s: Painter, x: number, y: number, r: number, seed: number) {
  s.ell(x, y, r, r, 0, { c: (u, v) => mix(K.pot, K.potD, v * 0.8), sh: [3, 5, 0.28], block: true });
  s.ell(x, y, r * 0.78, r * 0.78, 0, { c: [60, 40, 28], shade: 0.3 });
  void seed;
}
function foliage(s: Painter, cx: number, cy: number, r: number, seed: number, n = 9, big = false) {
  for (let i = 0; i < n; i++) {
    const a = hash(seed, i, 1) * TAU, d = r * (0.25 + 0.6 * hash(seed, i, 2)), lr = r * (big ? 0.62 : 0.5) * (0.75 + 0.45 * hash(seed, i, 3));
    const tone = hash(seed, i, 4);
    const base = tone < 0.4 ? K.leafD : tone < 0.75 ? K.leafM : K.leafL;
    s.ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d, lr * 1.25, lr * 0.78, a, {
      c: (u, v) => mix(base, mul(base, 1.35), v), sh: [3, 5, 0.22], shade: 0.7, block: true,
      g: (u, v, x, y) => (hash(x | 0, y | 0, seed) < 0.22 ? '%' : null), gc: mul(base, 1.5), ga: 0.5,
    });
    if (big) s.cap(cx + Math.cos(a) * d - Math.cos(a) * lr, cy + Math.sin(a) * d - Math.sin(a) * lr, cx + Math.cos(a) * d + Math.cos(a) * lr * 0.9, cy + Math.sin(a) * d + Math.sin(a) * lr * 0.9, 1.6, { c: mul(base, 1.5), a: 0.7, shade: 0 });
  }
}
function plant(s: Painter, x: number, y: number, r: number, seed: number, big = false) {
  pot(s, x, y, r * 0.62, seed);
  foliage(s, x, y, r, seed, big ? 8 : 6, big);
}
function fern(s: Painter, cx: number, cy: number, r: number, seed: number) {
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + hash(seed, i) * 0.3;
    s.cap(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5, { c: (u, v) => mix(K.leafD, K.leafL, u), a: 0.95, shade: 0.4, sh: [2, 4, 0.15], block: i < 3 });
  }
  s.ell(cx, cy, r * 0.3, r * 0.3, 0, { c: K.leafD, block: true });
}

function buildScene(W: number, H: number, cw: number, ch: number): SceneData {
  const s = new Painter(W, H, cw, ch);
  const { Wd, Hd, tall } = s;
  const T = tall ? 200 : 150, Lw = 92, Rw = tall ? 112 : 100;
  const FR = Wd - Rw;

  // ---- floor: oak planks running toward us
  const plankW = 30;
  s.rect(Lw, T, FR - Lw, Hd - T, {
    c: (u, v, x) => {
      const idx = Math.floor((x / s.k - Lw) / plankW), t = hash(idx, 3, 7);
      return mix(mix(K.oakA, K.oakB, t), K.oakC, 0.25 * hash(idx, 11, 2));
    },
    g: (u, v, x, y) => {
      const lx = (x / s.k - Lw) % plankW;
      if (lx < 6) return '|';
      return hash(x | 0, y | 0, 5) < 0.015 ? '-' : null;
    }, gc: [120, 74, 40], ga: 0.4, shade: 0,
  });

  // ---- back wall, left wall (window), right wall (brick)
  s.rect(0, 0, Wd, T, { c: (u, v) => mix(K.wall, K.wallShade, v * 0.55), shade: 0 });
  s.rect(0, 0, Lw, Hd, { c: (u, v) => mix(K.wallShade, K.wall, 0.4 + 0.3 * u), shade: 0 });
  s.rect(FR, 0, Rw, Hd, {
    c: (u, v, x, y) => { const row = Math.floor(y / s.ch / 2), off = row % 2 ? 0.5 : 0; const bx = Math.floor(x / s.cw / 5 + off); return mix(K.brickA, K.brickB, hash(bx, row, 9)); },
    g: (u, v, x, y) => { const row = Math.floor(y / s.ch / 2); if ((Math.floor(y / s.ch) % 2) === 1) return '-'; return ((Math.floor(x / s.cw) + (row % 2 ? 2 : 0)) % 5 === 0) ? '|' : null; },
    gc: K.mortar, ga: 0.55, shade: 0,
  });
  const frames: [number, number, number, number, RGB][] = [
    [8, 70, 44, 74, [88, 110, 80]], [52, 150, 42, 44, [190, 150, 110]], [10, 210, 38, 58, [70, 90, 130]], [50, 280, 44, 52, [196, 120, 90]],
    [8, 352, 40, 70, [120, 140, 100]], [52, 440, 40, 42, [200, 190, 170]], [10, 500, 46, 64, [150, 100, 110]], [54, 570, 38, 54, [90, 120, 150]],
    [10, 650, 44, 66, [180, 160, 120]], [56, 730, 36, 48, [110, 130, 90]],
  ];
  for (const [fx, fy, fw, fh, art] of frames) {
    if (fy + fh > Hd - 20) continue;
    s.rect(FR + fx, fy, fw, fh, { c: K.woodD, sh: [3, 4, 0.3], shade: 0.5 });
    s.rect(FR + fx + 4, fy + 4, fw - 8, fh - 8, { c: K.cream, shade: 0.2 });
    s.rect(FR + fx + 8, fy + 8, fw - 16, fh - 16, { c: (u, v) => mix(art, mul(art, 0.6), v), shade: 0.3 });
  }
  s.ell(FR + 24, 54, 16, 42, 0, { c: [58, 56, 64], sh: [3, 4, 0.3] });                // a coat on its hook
  s.rect(Lw, T - 6, FR - Lw, 6, { c: K.base, shade: 0.4 });                       // skirting
  s.rect(Lw - 4, 0, 4, T, { c: mul(K.wallShade, 0.8), shade: 0 });                 // corner seam
  s.rect(FR, 0, 4, Hd, { c: mul(K.brickB, 0.7), shade: 0 });

  // ---- window with the garden outside
  s.rect(8, 22, Lw - 18, 310, { c: K.base, shade: 0.5 });
  for (let i = 0; i < 3; i++) {
    const y0 = 30 + i * 100;
    s.rect(14, y0, Lw - 30, 88, {
      c: (u, v, x, y) => mix(K.glow, K.sky, hash((x / s.cw) | 0, (y / s.ch) | 0, 2) * 0.55 + 0.1 * v),
      g: (u, v, x, y) => (hash((x / s.cw) | 0, (y / s.ch) | 0, 8) < 0.25 ? '&' : null), gc: [96, 140, 70], ga: 0.5, shade: 0.3,
    });
  }
  s.rect(6, 332, Lw - 12, 10, { c: K.white, sh: [0, 3, 0.25] });                      // sill
  // a picture on the left wall below the window
  s.rect(6, 380, 30, 120, { c: K.woodM, shade: 0.5 }); s.rect(11, 386, 20, 108, { c: [168, 160, 138], shade: 0.3 });
  // radiator
  s.rect(6, Hd - 200, Lw - 28, 130, { c: K.white, g: (u, v, x) => (Math.floor(x / s.cw) % 2 ? '|' : null), gc: K.grey, ga: 0.7, shade: 0.5 });

  // ---- hanging shelf with trailing plants
  const shX0 = Lw + 30, shX1 = Lw + (tall ? 300 : 410), shY = T * 0.3;
  s.rect(shX0, shY, shX1 - shX0, 8, { c: K.woodL, sh: [0, 6, 0.3] });
  for (let i = 0; i < 5; i++) {
    const px = shX0 + 22 + i * ((shX1 - shX0 - 44) / 4);
    plant(s, px, shY - 12, 22, 40 + i);
    // vines
    for (let v = 0; v < 2; v++) {
      const vx = px + (v ? 10 : -8), len = 50 + hash(i, v, 5) * 70;
      for (let k2 = 0; k2 < len / 6; k2++) {
        const vy = shY + 8 + k2 * 6, wob = Math.sin(k2 * 0.7 + i) * 6;
        s.ell(vx + wob, vy, 5 + (k2 % 2) * 2, 4, k2, { c: k2 % 3 ? K.leafM : K.leafL, shade: 0.5, sh: [2, 3, 0.15] });
      }
    }
  }

  // ---- bed against the back-left corner
  const bedW = tall ? Wd * 0.44 : 350, bedX = Lw + 10, bedY = T + 22, bedH = 172;
  s.rect(bedX - 4, bedY - 4, bedW + 8, bedH + 8, { c: K.woodD, sh: [4, 6, 0.3], block: true });
  s.rect(bedX, bedY, bedW, bedH, { c: K.mattress, shade: 0.3, block: true });
  s.rrect(bedX + 50, bedY + 4, bedW - 56, bedH - 8, 14, {
    c: (u, v, x, y) => { const w = Math.sin(u * 14 + Math.sin(v * 5) * 2) * Math.sin(v * 9 + u * 3); return mul(mix(K.duvet, K.duvetDark, 0.5 + 0.5 * w), 0.95 + 0.1 * (1 - v)); },
    g: (u, v, x, y) => (hash((x / s.cw) | 0, (y / s.ch) | 0, 4) < 0.1 ? '~' : null), gc: K.duvetDark, ga: 0.5, shade: 0.8, block: true,
  });
  s.rrect(bedX + 6, bedY + 8, 52, 64, 8, { c: K.pillow, shade: 0.8, sh: [2, 3, 0.2] });
  s.rrect(bedX + 8, bedY + 84, 52, 70, 8, { c: K.pillowMauve, shade: 0.8, sh: [2, 3, 0.2] });
  s.rrect(bedX + 70, bedY + 20, 70, 40, 18, { c: K.duvet, shade: 1, sh: [2, 3, 0.2] });
  // bedside table with a plant
  s.rect(Lw + 4, bedY + bedH + 14, 50, 44, { c: K.woodM, sh: [3, 4, 0.25], block: true });
  plant(s, Lw + 28, bedY + bedH + 36, 14, 70);

  // ---- tall shelf unit, mirror
  const bsX = bedX + bedW + 18, bsW = 118, bsTop = T * 0.35, bsBot = T + 188;
  s.rect(bsX, bsTop, bsW, bsBot - bsTop, { c: K.woodD, sh: [4, 6, 0.3], shade: 0.5, block: true });
  const rows = 5, rh = (bsBot - bsTop) / rows;
  for (let r = 0; r < rows; r++) {
    const ry = bsTop + r * rh + 4;
    s.rect(bsX + 5, ry, bsW - 10, rh - 8, { c: [74, 46, 30], shade: 0.4 });
    if (r === 0) { s.ell(bsX + 30, ry + rh / 2 - 4, 13, 13, 0, { c: K.pot }); foliage(s, bsX + 82, ry + rh / 2 - 6, 20, 88, 5); }
    else if (r === 1) { s.ell(bsX + 28, ry + rh / 2 - 4, 11, 14, 0, { c: [176, 96, 70] }); s.ell(bsX + 62, ry + rh / 2 - 4, 8, 8, 0, { c: K.white }); s.ell(bsX + 86, ry + rh / 2 - 4, 8, 8, 0, { c: K.cream }); }
    else {
      for (let b = 0; b < 9; b++) {
        const col = ([[200, 70, 50], [60, 90, 150], [230, 210, 180], [90, 120, 80], [180, 150, 90]] as RGB[])[Math.floor(hash(r, b, 3) * 5)];
        s.rect(bsX + 8 + b * 11, ry + 4, 9, rh - 16, { c: col, shade: 0.8 });
      }
    }
  }
  // AC unit above the shelf and mirror
  const acW = tall ? 150 : 200;
  s.rrect(bsX - 6, 8, acW, 34, 6, { c: [232, 230, 226], sh: [2, 4, 0.2] });
  s.rect(bsX + 4, 32, acW - 20, 4, { c: [190, 188, 184], shade: 0 });
  s.ell(bsX + acW - 24, 18, 2.5, 2.5, 0, { c: [120, 220, 150], shade: 0 });
  const mirX = bsX + bsW + 30, mirW = 92;
  if (mirX + mirW < FR - 20) {
    s.rect(mirX - 5, T * 0.4, mirW + 10, T + 165 - T * 0.4, { c: K.woodM, sh: [4, 6, 0.3], block: true });
    s.rect(mirX, T * 0.4 + 5, mirW, T + 155 - T * 0.4, { c: (u, v) => mix([226, 206, 170], [168, 150, 120], v), g: (u, v, x, y) => ((Math.floor(x / s.cw) + Math.floor(y / s.ch)) % 9 === 0 ? '/' : null), gc: [255, 246, 220], ga: 0.55, shade: 0.4 });
    s.ell(mirX + mirW * 0.5, T + 100, 18, 26, 0, { c: [70, 110, 70], a: 0.6, shade: 0 });
  }

  // ---- rug and sofa
  const sofaX = Lw + 6, sofaW = 156, sofaY = bedY + bedH + 74, sofaH = 230;
  const rugX0 = sofaX + sofaW + 34, rugX1 = Math.max(rugX0 + 210, Math.min(FR - (tall ? 150 : 330), rugX0 + 760)), rugY0 = T + 190, rugH = tall ? 210 : 190;
  s.rrect(rugX0, rugY0, rugX1 - rugX0, rugH, 4, {
    c: (u, v, x, y) => { const edge = Math.min(u, 1 - u, v * 0.7, (1 - v) * 0.7) < 0.04; return edge ? K.rugEdge : mix(K.rug, mul(K.rug, 1.12), hash((x / s.cw) | 0, (y / s.ch) | 0, 3) * 0.6); },
    g: (u, v, x, y) => (hash((x / s.cw) | 0, (y / s.ch) | 0, 13) < 0.12 ? '.' : null), gc: [150, 160, 110], ga: 0.4, shade: 0.5, sh: [0, 3, 0.15],
  });
  // sofa (vertical along the left wall): back, arms, cushions, throw and pillows
  s.rrect(sofaX, sofaY, sofaW, sofaH, 14, { c: K.sofaDark, sh: [5, 7, 0.3], block: true });
  s.rrect(sofaX, sofaY, 44, sofaH, 14, { c: K.sofa, shade: 0.8 });
  s.rrect(sofaX + 40, sofaY, sofaW - 40, 34, 12, { c: K.sofa, shade: 0.8 });
  s.rrect(sofaX + 40, sofaY + sofaH - 34, sofaW - 40, 34, 12, { c: K.sofa, shade: 0.8 });
  s.rrect(sofaX + 46, sofaY + 36, sofaW - 52, (sofaH - 72) / 2 - 2, 10, { c: mul(K.sofa, 1.04), shade: 0.9 });
  s.rrect(sofaX + 46, sofaY + 38 + (sofaH - 72) / 2, sofaW - 52, (sofaH - 72) / 2 - 2, 10, { c: mul(K.sofa, 1.04), shade: 0.9 });
  s.rrect(sofaX + 10, sofaY + sofaH * 0.55, 134, 78, 8, {
    c: K.throw, g: (u, v, x, y) => (((Math.floor(y / s.ch) + Math.floor(x / s.cw)) % 3 === 0) ? '~' : null), gc: [150, 124, 92], ga: 0.6, shade: 0.8, sh: [2, 3, 0.2],
  });
  s.rrect(sofaX + 56, sofaY + 18, 44, 44, 8, { c: [206, 184, 150], shade: 0.9, sh: [2, 3, 0.2] });
  s.rrect(sofaX + 66, sofaY + sofaH - 70, 44, 44, 8, { c: [222, 204, 178], shade: 0.9, sh: [2, 3, 0.2] });

  // ---- coffee table
  const ctW = tall ? 100 : 132, ctH = tall ? 58 : 66, ctX = (rugX0 + rugX1) / 2 - ctW / 2, ctY = rugY0 + rugH * 0.46;
  s.rect(ctX, ctY, ctW, ctH, { c: (u, v) => mix(K.woodM, K.woodD, v * 0.4), sh: [5, 7, 0.3], block: true });
  s.rect(ctX + 10, ctY + 8, 40, 26, { c: K.white, shade: 0.8 }); s.rect(ctX + 14, ctY + 12, 32, 6, { c: [160, 110, 80], shade: 0.5 });
  s.ell(ctX + ctW - 26, ctY + 24, 10, 10, 0, { c: K.pot }); foliage(s, ctX + ctW - 26, ctY + 24, 12, 31, 5);
  s.ell(ctX + 28, ctY + ctH - 22, 8, 8, 0, { c: K.white, sh: [2, 3, 0.2] });
  s.rect(ctX + ctW - 60, ctY + ctH - 20, 34, 10, { c: [60, 50, 50], shade: 0.5 });

  // ---- on wide screens, the floor freed to the right of the rug gets a pouf and a plant
  const spareX0 = rugX1 + 40, spareX1 = FR - (tall ? 150 : 330);
  if (!tall && spareX1 - spareX0 > 120) {
    const mx = (spareX0 + spareX1) / 2;
    s.ell(mx, rugY0 + 120, 36, 32, 0, { c: [186, 150, 120], sh: [4, 6, 0.3], shade: 0.9, block: true, g: (u, v, x, y) => (((Math.floor(x / s.cw) + Math.floor(y / s.ch)) % 3) === 0 ? '~' : null), gc: [140, 108, 84], ga: 0.5 });
    plant(s, mx + 30, rugY0 - 10, 30, 51, true);
  }

  // ---- TV stand + TV, fiddle-leaf fig, side plants
  const tvY = tall ? T + 200 : T + 104, tvH = 226;
  s.rect(FR - 88, tvY, 84, tvH, { c: K.woodM, sh: [-3, 6, 0.3], block: true });
  s.rect(FR - 56, tvY + 14, 20, tvH - 28, { c: K.dark, shade: 0.6 });
  s.rect(FR - 52, tvY + 20, 4, tvH - 44, { c: [70, 80, 110], shade: 0 });
  plant(s, FR - 150, tvY + 40, 44, 21, true);
  plant(s, FR - 40, tvY + tvH + 36, 26, 22);

  // ---- desk with monitor, laptop, keyboard (vertical along the right wall)
  const dkW = 166, dkX = FR - 172, dkH0 = tall ? 380 : 320;
  const dkY = Math.max(tvY + tvH + 80, Hd - dkH0 - 20);
  const dkH = Math.max(120, Math.min(dkH0, Hd - dkY - 10));
  s.rect(dkX, dkY, dkW, dkH, { c: K.white, sh: [-4, 6, 0.3], block: true });
  s.rect(dkX + dkW - 52, dkY + 36, 22, 150, { c: K.dark, shade: 0.6 });            // monitor
  s.rect(dkX + dkW - 48, dkY + 42, 6, 138, { c: K.screen, shade: 0 });
  s.rect(dkX + dkW - 104, dkY + 40, 40, 62, { c: K.grey, shade: 0.6 });             // laptop
  s.rect(dkX + dkW - 100, dkY + 44, 6, 54, { c: K.screen, shade: 0 });
  s.rect(dkX + dkW - 108, dkY + 120, 38, 66, { c: [44, 44, 48], g: (u, v, x, y) => ((Math.floor(x / s.cw) + Math.floor(y / s.ch)) % 2 ? '.' : null), gc: [120, 120, 124], ga: 0.6, shade: 0.5 });
  s.ell(dkX + dkW - 150, dkY + 70, 9, 9, 0, { c: [210, 160, 90], sh: [1, 2, 0.2] });
  plant(s, dkX + dkW - 22, dkY + dkH - 40, 18, 61);
  plant(s, dkX + dkW - 22, dkY + dkH - 90, 12, 62);
  // chair
  s.ell(dkX - 62, dkY + 150, 38, 40, 0, { c: [236, 232, 226], sh: [3, 5, 0.3], shade: 0.8, block: true });
  s.ell(dkX - 74, dkY + 150, 18, 36, 0, { c: [176, 170, 164], shade: 0.8 });

  // ---- bottom-left: big monstera plants, sneakers
  plant(s, 70, Hd - 250, 108, 11, true);
  plant(s, 96, Hd - 110, 84, 12, true);
  s.ell(222, Hd - 128, 20, 9, 0.3, { c: [226, 224, 220], sh: [2, 3, 0.25] }); s.ell(222, Hd - 100, 20, 9, 0.1, { c: [196, 196, 200], sh: [2, 3, 0.25] });
  fern(s, FR - 340, Hd - 60, 58, 33);
  plant(s, FR - 232, Hd - 56, 44, 34, true);

  // ---- finish: blocked margin, light and shape of the room --------------------
  const n = s.cols * s.rows;
  // walls and anything outside the floor are not walkable
  const x0 = Lw * s.k, x1 = FR * s.k, y0 = T * s.k;
  for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) {
    const px = c * s.cw + s.cw / 2, py = r * s.ch + s.ch / 2;
    if (px < x0 || px > x1 || py < y0 + 6) s.block[r * s.cols + c] = 1;
  }

  // warm light from the window, falling across bed, sofa and floor; a lamp glow near the desk
  const light = new Float32Array(n);
  const polyL = [[Lw, 40], [Lw, 330], [Lw + (tall ? 260 : 380), 560], [Lw + (tall ? 260 : 380), 250]];
  const k = s.k;
  for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) {
    const px = (c * s.cw + s.cw / 2) / k, py = (r * s.ch + s.ch / 2) / k;
    let L = 0;
    // inside the slanted shaft
    const t = (px - Lw) / (polyL[2][0] - Lw);
    if (t >= 0 && t <= 1) {
      const top = 40 + t * 210, bot = 330 + t * 230;
      if (py >= top && py <= bot) L = 0.5 * (1 - t) ** 0.8 * smooth(0, 14, py - top) * smooth(0, 14, bot - py);
    }
    // glow of the lamp by the desk
    const d = Math.hypot(px - (Wd - 30), py - (Hd - 80));
    L += 0.35 * Math.max(0, 1 - d / 280) ** 2;
    // soft sunlight along the whole left side
    L += 0.12 * Math.max(0, 1 - (px - Lw) / 260);
    light[r * s.cols + c] = L;
  }

  const rugCx = (rugX0 + rugX1) / 2 * k, rugCy = (rugY0 + rugH * 0.5) * k;
  return {
    cols: s.cols, rows: s.rows, cw, ch, k, Wd, Hd,
    rgb: s.rgb, glyph: s.glyph, gcol: s.gcol, galpha: s.galpha, light, blocked: s.block,
    spawn: { x: (rugX0 + 80) * k, y: rugCy },
    nap: { x: (rugX0 + 46) * k, y: rugCy + rugH * 0.28 * k },
    floor: { x0, y0, x1, y1: H },
  };
}

// ------------------------------------------------------------------ the cat (seen from above)

type State = 'watch' | 'stalk' | 'pounce' | 'bat' | 'chase' | 'groom' | 'sleep';
// [bodyRx, bodyRy, headDist, headR, tailCurl, legSpread, earsFlat, headSide]  (units of c)
const POSES: Record<string, number[]> = {
  trot:  [2.0, 0.95, 2.6, 0.85, 0, 1.0, 0, 0],
  stalk: [2.25, 0.82, 2.85, 0.8, 0, 0.6, 1, 0],
  leap:  [2.5, 0.78, 3.0, 0.8, 0, 1.5, 0.5, 0],
  sit:   [1.2, 1.0, 1.6, 0.85, 1, 0.2, 0, 0],
  groom: [1.2, 1.0, 1.5, 0.85, 1, 0.2, 0, 0.9],
  sleep: [1.55, 1.4, 1.15, 0.8, 1, 0, 1, 1.0],
};
const PN = Object.keys(POSES);

interface Prim {
  kind: 'ell' | 'cap' | 'tri' | 'dot';
  part: 'body' | 'head' | 'ear' | 'earIn' | 'leg' | 'tail' | 'eye' | 'nose';
  a: number; b: number; c: number; d: number; e: number; f: number; cos: number; sin: number; idx: number;
}

export class House {
  width = 0; height = 0; time = 0;
  scene: SceneData | null = null;
  c = 16;                                          // cat unit in px
  x = 0; y = 0; heading = 0; speed = 0; gait = 0;
  state: State = 'watch'; stateT = 0; stateDur = 2; pawT = -1; kicked = false; bats = 0; sleepCool = 10; napWalk = false; lungeT = 0;
  w: Record<string, number> = { trot: 0, stalk: 0, leap: 0, sit: 1, groom: 0, sleep: 0 };
  pose = new Float32Array(8);
  ball = { x: 0, y: 0, vx: 0, vy: 0, r: 8, spin: 0 };
  walk: Uint8Array = new Uint8Array(0);           // 1 = the cat may stand here
  avoid: Box[] = [];
  pointer = { x: 0, y: 0, speed: 0, active: false };
  prims: Prim[] = [];
  private stuckT = 0;
  private aSig = '';

  napPt = { x: 0, y: 0 };
  private placed = false;

  attach(scene: SceneData, w: number, h: number) {
    this.scene = scene; this.width = w; this.height = h;
    this.c = clamp(Math.min(w, h * 1.2) * 0.027, 14, 36);
    this.ball.r = this.c * 0.5;
    // The walkable area is rebuilt by the next setAvoid() call, once the text boxes are known.
    this.walk = new Uint8Array(0);
    this.aSig = '\u0000';
  }

  setAvoid(boxes: Box[]) {
    const sig = boxes.map((b) => [b.left, b.top, b.right, b.bottom].map(Math.round).join(',')).join('|');
    if (sig === this.aSig) return;
    this.aSig = sig; this.avoid = boxes;
    this.rebuildWalk();
  }

  /** The largest connected patch of floor the cat can use, trying tighter clearances first. */
  private rebuildWalk() {
    const s = this.scene; if (!s) return;
    const n = s.cols * s.rows, need = Math.max(500, n * 0.04);
    const ladder: [number, number][] = [[1.7, 6], [1.4, 4], [1.1, 3], [0.8, 2], [0.5, 1], [0.3, 0], [0.5, -1]];
    let best: Uint8Array | null = null, bestCount = 0;
    for (const [clearance, padCells] of ladder) {
      const r = this.walkFor(clearance, padCells);
      if (r.count > bestCount) { best = r.walk; bestCount = r.count; }
      if (r.count >= need) break;
    }
    this.walk = best ?? new Uint8Array(n);
    // spawn and nap spots: the walkable cells nearest the middle of the rug
    const sp = this.nearestFree(s.spawn.x, s.spawn.y), np = this.nearestFree(this.napPt.x, this.napPt.y);
    this.napPt = np;
    if (!this.placed) { this.x = sp.x; this.y = sp.y; this.heading = 0; this.setBall(sp.x + this.c * 10, sp.y); this.placed = true; return; }
    // a resize or a text change may have left her (or the ball) somewhere she cannot stand: move them
    if (!this.free(this.x, this.y)) { const q = this.nearestFree(this.x, this.y); this.x = q.x; this.y = q.y; }
    if (!this.free(this.ball.x, this.ball.y)) { this.setBall(this.x + this.c * 8, this.y); this.ball.vx = 0; this.ball.vy = 0; }
  }

  private walkFor(clearance: number, padCells: number) {
    const s = this.scene as SceneData;
    const { cols, rows, cw, ch } = s, n = cols * rows;
    const blocked = new Uint8Array(n);
    blocked.set(s.blocked);
    const pad = Math.max(0, padCells) * cw;
    if (padCells >= 0) for (const b of this.avoid) {
      const c0 = Math.max(0, Math.floor((b.left - pad) / cw)), c1 = Math.min(cols - 1, Math.floor((b.right + pad) / cw));
      const r0 = Math.max(0, Math.floor((b.top - pad) / ch)), r1 = Math.min(rows - 1, Math.floor((b.bottom + pad) / ch));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) blocked[r * cols + c] = 1;
    }
    const rad = Math.max(1, Math.round(this.c * clearance / cw)), rv = Math.max(1, Math.round(this.c * clearance / ch));
    const inflated = new Uint8Array(n);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!blocked[r * cols + c]) continue;
      for (let dr = -rv; dr <= rv; dr++) for (let dc = -rad; dc <= rad; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && (dr * dr) / (rv * rv) + (dc * dc) / (rad * rad) <= 1.2) inflated[rr * cols + cc] = 1;
      }
    }
    // label the connected patches and keep the biggest
    const label = new Int32Array(n);
    let bestId = 0, bestSize = 0, id = 0;
    for (let i0 = 0; i0 < n; i0++) {
      if (inflated[i0] || label[i0]) continue;
      id++;
      let size = 0;
      const stack = [i0];
      while (stack.length) {
        const i = stack.pop() as number;
        if (label[i] || inflated[i]) continue;
        label[i] = id; size++;
        const c = i % cols, r = (i / cols) | 0;
        if (c > 0) stack.push(i - 1); if (c < cols - 1) stack.push(i + 1); if (r > 0) stack.push(i - cols); if (r < rows - 1) stack.push(i + cols);
      }
      if (size > bestSize) { bestSize = size; bestId = id; }
    }
    const walk = new Uint8Array(n);
    if (bestId) for (let i = 0; i < n; i++) if (label[i] === bestId) walk[i] = 1;
    return { walk, count: bestSize };
  }

  free(x: number, y: number) {
    const s = this.scene; if (!s) return false;
    const c = Math.floor(x / s.cw), r = Math.floor(y / s.ch);
    return c >= 0 && r >= 0 && c < s.cols && r < s.rows && this.walk[r * s.cols + c] === 1;
  }
  private nearestFree(x: number, y: number) {
    if (this.free(x, y)) return { x, y };
    const s = this.scene as SceneData;
    for (let rad = 1; rad < 90; rad++) {
      for (let a = 0; a < 16; a++) {
        const px = x + Math.cos((a / 16) * TAU) * rad * s.cw, py = y + Math.sin((a / 16) * TAU) * rad * s.ch;
        if (this.free(px, py)) return { x: px, y: py };
      }
    }
    return { x: s.spawn.x, y: s.spawn.y };
  }
  private setBall(x: number, y: number) { const p = this.nearestFree(x, y); this.ball.x = p.x; this.ball.y = p.y; }

  toss(x: number, y: number) {
    this.setBall(x, y);
    const a = rand(0, TAU), v = rand(120, 220);
    this.ball.vx = Math.cos(a) * v; this.ball.vy = Math.sin(a) * v;
    this.napWalk = false;
    if (this.state === 'sleep' || this.state === 'groom' || this.state === 'watch') this.go('watch', 0.3);
  }

  private go(st: State, dur = 0) {
    this.state = st; this.stateT = 0; this.stateDur = dur; this.stuckT = 0;
    if (st === 'bat') { this.pawT = 0; this.kicked = false; }
    if (st === 'pounce') { this.lungeT = 0.3; this.speed = this.c * 26; }
    if (st === 'sleep') this.napWalk = true;
  }

  step(dt: number) {
    if (!this.scene) return;
    this.time += dt;
    this.pointer.speed *= Math.exp(-8 * dt);
    this.stepBall(dt); this.stepCat(dt); this.build();
  }

  private stepBall(dt: number) {
    const b = this.ball;
    const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    if (this.free(nx, b.y)) b.x = nx; else b.vx = -b.vx * 0.6;
    if (this.free(b.x, ny)) b.y = ny; else b.vy = -b.vy * 0.6;
    const f = Math.exp(-1.25 * dt);
    b.vx *= f; b.vy *= f;
    if (Math.hypot(b.vx, b.vy) < 6) { b.vx = 0; b.vy = 0; }
    b.spin += (Math.hypot(b.vx, b.vy) / b.r) * dt;
    if (!this.free(b.x, b.y)) this.setBall(b.x, b.y);
  }

  /** She is stuck behind something: put the ball back on open floor just in front of her. */
  private rescueBall() {
    const p = this.nearestFree(this.x + Math.cos(this.heading) * this.c * 6, this.y + Math.sin(this.heading) * this.c * 6);
    this.ball.x = p.x; this.ball.y = p.y; this.ball.vx = 0; this.ball.vy = 0;
  }

  private steer(desired: number, dt: number, v: number) {
    // look ahead and turn away from furniture
    let dx = Math.cos(desired), dy = Math.sin(desired);
    const look = this.c * 2.6;
    for (const a of [-1.1, -0.55, 0, 0.55, 1.1]) {
      const ang = this.heading + a;
      if (!this.free(this.x + Math.cos(ang) * look, this.y + Math.sin(ang) * look)) {
        const w = 1.5 * (1 - Math.abs(a) * 0.35);
        dx -= Math.cos(ang) * w; dy -= Math.sin(ang) * w;
        if (a === 0) { dx += -Math.sin(this.heading) * 0.8; dy += Math.cos(this.heading) * 0.8; }
      }
    }
    const want = Math.atan2(dy, dx);
    let d = want - this.heading; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    this.heading += clamp(d, -8 * dt, 8 * dt);
    const px = this.x, py = this.y;
    const nx = px + Math.cos(this.heading) * v * dt, ny = py + Math.sin(this.heading) * v * dt;
    if (this.free(nx, ny)) { this.x = nx; this.y = ny; }
    else if (this.free(nx, py)) this.x = nx;
    else if (this.free(px, ny)) this.y = ny;
    else this.speed *= 0.4;
    this.stuckT = Math.hypot(this.x - px, this.y - py) < v * dt * 0.2 ? this.stuckT + dt : 0;
  }

  private face(tx: number, ty: number, dt: number) {
    const want = Math.atan2(ty - this.y, tx - this.x);
    let d = want - this.heading; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    this.heading += clamp(d, -6 * dt, 6 * dt);
  }

  private stepCat(dt: number) {
    const c = this.c, b = this.ball;
    this.stateT += dt; this.sleepCool -= dt;
    const dist = Math.hypot(b.x - this.x, b.y - this.y) / c;
    const ballMoving = Math.hypot(b.vx, b.vy) > 20;
    const toBall = Math.atan2(b.y - this.y, b.x - this.x);
    let target = 'sit', v = 0;

    switch (this.state) {
      case 'watch': {
        target = 'sit';
        if (this.pointer.active && this.pointer.speed > 250) this.face(this.pointer.x, this.pointer.y, dt);
        else this.face(b.x, b.y, dt);
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
        target = 'stalk'; v = 2.6 * c;
        this.steer(toBall, dt, v);
        if (dist < 5 || this.stateT > this.stateDur) this.go('pounce');
        if (this.stuckT > 0.8) { this.rescueBall(); this.go('watch', 0.8); }
        break;
      }
      case 'pounce': {
        target = 'leap';
        this.lungeT -= dt;
        this.face(b.x, b.y, dt * 2);
        const nx = this.x + Math.cos(this.heading) * this.speed * dt, ny = this.y + Math.sin(this.heading) * this.speed * dt;
        if (this.free(nx, ny)) { this.x = nx; this.y = ny; }
        if (this.lungeT <= 0 || dist < 1.8) { this.speed = 0; this.go('bat'); }
        break;
      }
      case 'bat': {
        target = 'trot';
        this.face(b.x, b.y, dt * 2);
        this.pawT += dt / 0.4;
        if (!this.kicked && this.pawT > 0.4) {
          this.kicked = true;
          if (Math.hypot(b.x - this.x, b.y - this.y) < c * 3.6) {
            const a = this.heading + rand(-0.6, 0.6), sp = rand(420, 760);
            b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
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
        target = 'trot'; v = 15 * c;
        this.steer(toBall, dt, v);
        if (dist < 3.2) this.go('bat');
        else if (this.stuckT > 0.8) { this.rescueBall(); this.go('watch', 0.8); }
        else if (this.stateT > this.stateDur) this.go('watch', rand(1.4, 2.4));
        break;
      }
      case 'groom': {
        target = 'groom';
        if (this.stateT > this.stateDur) this.go('watch', rand(1.4, 2.4));
        break;
      }
      case 'sleep': {
        if (this.napWalk) {
          target = 'trot'; v = 7 * c;
          const d = Math.hypot(this.napPt.x - this.x, this.napPt.y - this.y);
          this.steer(Math.atan2(this.napPt.y - this.y, this.napPt.x - this.x), dt, v);
          if (d < c * 1.2 || this.stuckT > 1.2) { this.napWalk = false; this.stateT = 0; }
        } else {
          target = 'sleep';
          if (this.stateT > this.stateDur) this.go('watch', rand(1.2, 2));
        }
        break;
      }
    }

    let tot = 0;
    for (const n of PN) { this.w[n] += ((n === target ? 1 : 0) - this.w[n]) * Math.min(1, dt * 8); tot += this.w[n]; }
    for (let i = 0; i < 8; i++) { let a = 0; for (const n of PN) a += this.w[n] * POSES[n][i]; this.pose[i] = a / (tot || 1); }
    if (this.state !== 'pounce') this.speed += (v - this.speed) * Math.min(1, dt * 6);
    this.gait += dt * (v / c) * 0.55;
  }

  // --------------------------------------------------------------- shapes
  private ell(part: Prim['part'], cx: number, cy: number, rx: number, ry: number, ang: number, idx = 0) {
    this.prims.push({ kind: 'ell', part, a: cx, b: cy, c: rx, d: ry, e: 0, f: 0, cos: Math.cos(ang), sin: Math.sin(ang), idx });
  }
  private cap(part: Prim['part'], ax: number, ay: number, bx: number, by: number, r0: number, r1: number, idx = 0) {
    this.prims.push({ kind: 'cap', part, a: ax, b: ay, c: bx, d: by, e: r0, f: r1, cos: 1, sin: 0, idx });
  }
  private tri(part: Prim['part'], ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
    this.prims.push({ kind: 'tri', part, a: ax, b: ay, c: bx, d: by, e: cx, f: cy, cos: 1, sin: 0, idx: 0 });
  }
  private dot(part: Prim['part'], cx: number, cy: number, r: number) {
    this.prims.push({ kind: 'dot', part, a: cx, b: cy, c: r, d: 0, e: 0, f: 0, cos: 1, sin: 0, idx: 0 });
  }

  private build() {
    const c = this.c, P = this.pose, t = this.time, th = this.heading;
    const cs = Math.cos(th), sn = Math.sin(th);
    const W = (lx: number, ly: number): [number, number] => [this.x + (lx * cs - ly * sn) * c, this.y + (lx * sn + ly * cs) * c];
    this.prims.length = 0;
    const rx = P[0], ry = P[1], hd = P[2], hr = P[3], curl = P[4], spread = P[5], flat = P[6], side = P[7];

    // tail: trails behind when moving, wraps around the body when sitting or asleep
    const NT = 7, seg = 0.5;
    let tx = -rx * 0.85, ty = 0;
    let [pwx, pwy] = W(tx, ty);
    for (let k = 0; k < NT; k++) {
      const u = k / (NT - 1);
      const trailX = -rx * 0.85 - (k + 1) * seg, trailY = Math.sin(t * 3.2 - k * 0.7) * 0.45 * u * (1 - 0.6 * curl);
      const phi = Math.PI * 0.9 + (k + 1) * 0.48, R = rx * 0.9 + 0.2;
      const curlX = Math.cos(phi) * R, curlY = Math.sin(phi) * R * (ry / rx + 0.2);
      const nx = trailX + (curlX - trailX) * curl, ny = trailY + (curlY - trailY) * curl;
      const [wx, wy] = W(nx, ny);
      this.cap('tail', pwx, pwy, wx, wy, c * (0.38 - 0.09 * u), c * (0.38 - 0.09 * (u + 1 / (NT - 1))), k);
      pwx = wx; pwy = wy; tx = nx; ty = ny;
    }
    void tx; void ty;

    // legs
    const stride = clamp(this.speed / (10 * c), 0, 1) * 0.6, g = this.gait * TAU;
    const legs: [number, number, number][] = [[1.15, -0.78, 0], [1.15, 0.78, Math.PI], [-1.1, -0.78, Math.PI], [-1.1, 0.78, 0]];
    for (const [lx, ly, ph] of legs) {
      const swing = stride * Math.sin(g + ph) * spread + (spread > 1.2 ? (lx > 0 ? 0.5 : -0.5) : 0);
      let fx = lx * (0.5 + 0.5 * Math.min(1, rx / 2)) + swing, fy = ly * ry * 1.0;
      // a swipe with the near front paw
      if (this.pawT >= 0 && this.pawT <= 1 && lx > 0 && ly > 0) { const kk = Math.sin(this.pawT * Math.PI); fx += 1.6 * kk; fy -= 0.5 * kk; }
      const [wx, wy] = W(fx, fy);
      this.ell('leg', wx, wy, c * 0.4, c * 0.34, th, 0);
    }
    // body, head
    const [bx, by] = W(0, 0);
    this.ell('body', bx, by, rx * c, ry * c, th, 0);
    const hy = side * ry * 0.85;
    const [hx, hyw] = W(hd * (1 - 0.18 * side), hy);
    this.ell('head', hx, hyw, hr * c * 1.2, hr * c * 1.1, th + side * 0.5, 0);
    // ears
    const ea = th + side * 0.5, ec = Math.cos(ea), es = Math.sin(ea);
    const E = (lx: number, ly: number): [number, number] => [hx + (lx * ec - ly * es) * c, hyw + (lx * es + ly * ec) * c];
    for (const sgn of [-1, 1]) {
      // pointed ears, fur-coloured, standing up and out from the back of the head
      const [a1, a2] = E(0.15, sgn * 1.0), [b1, b2] = E(-1.0 + 0.45 * flat, sgn * (0.95 - 0.2 * flat)), [c1, c2] = E(-0.3, sgn * 0.2);
      this.tri('ear', a1, a2, b1, b2, c1, c2);
      const [i1, i2] = E(0.0, sgn * 0.72), [j1, j2] = E(-0.72 + 0.3 * flat, sgn * 0.72), [k1, k2] = E(-0.25, sgn * 0.3);
      this.tri('earIn', i1, i2, j1, j2, k1, k2);
      const [ex, ey] = E(0.6, sgn * 0.42);
      this.dot('eye', ex, ey, c * 0.15);
    }
    const [nx2, ny2] = E(1.0, 0);
    this.dot('nose', nx2, ny2, c * 0.14);
  }

  // --------------------------------------------------------------- sampling
  hit(px: number, py: number, out: { u: number; v: number } | null): Prim | null {
    const ps = this.prims;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      let inside = false, u = 0, v = 0;
      if (p.kind === 'ell') {
        const dx = px - p.a, dy = py - p.b;
        u = (dx * p.cos + dy * p.sin) / p.c; v = (-dx * p.sin + dy * p.cos) / p.d;
        inside = u * u + v * v <= 1;
      } else if (p.kind === 'cap') {
        const ex = p.c - p.a, ey = p.d - p.b, l2 = ex * ex + ey * ey || 1;
        const t = clamp(((px - p.a) * ex + (py - p.b) * ey) / l2, 0, 1);
        const r = p.e + (p.f - p.e) * t;
        inside = Math.hypot(px - p.a - ex * t, py - p.b - ey * t) <= r; u = t;
      } else if (p.kind === 'tri') {
        const d1 = (px - p.c) * (p.b - p.d) - (p.a - p.c) * (py - p.d);
        const d2 = (px - p.e) * (p.d - p.f) - (p.c - p.e) * (py - p.f);
        const d3 = (px - p.a) * (p.f - p.b) - (p.e - p.a) * (py - p.b);
        inside = !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
      } else inside = Math.hypot(px - p.a, py - p.b) <= p.c;
      if (inside) { if (out) { out.u = u; out.v = v; } return p; }
    }
    return null;
  }

  color(p: Prim, px: number, py: number, u: number, v: number): RGB {
    switch (p.part) {
      case 'eye': return K.eye;
      case 'nose': return K.nose;
      case 'earIn': return K.earIn;
      case 'leg': return K.cream;
      case 'tail': return p.idx >= 6 || Math.sin(p.idx * 2.6 + 0.4) > 0.6 ? K.stripe : K.fur;
      case 'head': return Math.hypot(px - p.a, py - p.b) < 0 ? K.fur : (u > 0.35 ? K.cream : (Math.sin(py * 0.3 + px * 0.2) > 0.85 ? K.stripe : K.fur));
      case 'body': return Math.sin(u * 7 + 1) > 0.5 && Math.abs(v) < 0.95 ? K.stripe : K.fur;
      default: return K.fur;
    }
  }
}

// ------------------------------------------------------------------ renderer

const RAMP = '.:+oO0@';
const grp = (part: string) => (part === 'ear' || part === 'earIn' ? 'ear' : part === 'head' || part === 'eye' || part === 'nose' ? 'head' : part);

export class HouseRenderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1; cw = 8; ch = 10; cols = 0; rows = 0;
  private dim = new Float32Array(0); private vig = new Float32Array(0);
  private glyph = new Uint16Array(0); private color = new Uint32Array(0); private alpha = new Float32Array(0);
  private tile = new Uint32Array(0); private tileA = new Float32Array(0); private shadow = new Uint8Array(0);
  private scene: SceneData | null = null;
  private cache: HTMLCanvasElement | null = null;
  private dimSig = '';
  private styles = new Map<number, string>();
  private fontFamily = '"IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace';
  private out = { u: 0, v: 0 };

  constructor(canvas: HTMLCanvasElement) {
    const c = canvas.getContext('2d');
    if (!c) throw new Error('2D canvas unavailable');
    this.ctx = c;
  }
  private css(rgb: number) { let s = this.styles.get(rgb); if (!s) { s = `rgb(${rgb >>> 16},${(rgb >>> 8) & 255},${rgb & 255})`; this.styles.set(rgb, s); } return s; }

  resize(w: number, h: number, dpr: number, house: House) {
    this.dpr = dpr;
    this.cw = clamp(Math.round(w / 250), 5, 8); this.ch = this.cw + 2;
    this.cols = Math.ceil(w / this.cw); this.rows = Math.ceil(h / this.ch);
    this.ctx.canvas.width = Math.round(w * dpr); this.ctx.canvas.height = Math.round(h * dpr);
    const n = this.cols * this.rows;
    this.glyph = new Uint16Array(n); this.color = new Uint32Array(n); this.alpha = new Float32Array(n);
    this.tile = new Uint32Array(n); this.tileA = new Float32Array(n); this.shadow = new Uint8Array(n);
    this.dim = new Float32Array(n).fill(1); this.vig = new Float32Array(n).fill(1);
    this.scene = buildScene(w, h, this.cw, this.ch);
    house.attach(this.scene, w, h);
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const x = c * this.cw, y = r * this.ch;
      this.vig[r * this.cols + c] = smooth(0, w * 0.012, x) * smooth(0, w * 0.012, w - x) * (0.55 + 0.45 * smooth(0, 70, y)) * (0.7 + 0.3 * smooth(0, 90, h - y));
    }
    this.cache = document.createElement('canvas'); this.cache.width = this.ctx.canvas.width; this.cache.height = this.ctx.canvas.height;
    this.dimSig = '\u0000';   // setDimBoxes() runs right after and paints the room once
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
        const i = r * cols + c;
        dim[i] = Math.min(dim[i], 0.42 + 0.58 * smooth(0, pad, d));
      }
    }
    this.bake();
  }

  private prepare(ctx: CanvasRenderingContext2D) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = `500 ${Math.round(0.72 * this.ch)}px ${this.fontFamily}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  }

  /** Paint the whole room (with warm light, vignette and text dimming) once into a cache. */
  private bake() {
    const s = this.scene, cache = this.cache; if (!s || !cache) return;
    const ctx = cache.getContext('2d'); if (!ctx) return;
    this.prepare(ctx);
    const { cols, rows, cw, ch } = this;
    for (let i = 0; i < cols * rows; i++) {
      const o = i * 3, L = 0.72 + s.light[i], k = this.dim[i] * this.vig[i];
      const r = Math.min(255, s.rgb[o] * L * 1.05 * k), g = Math.min(255, s.rgb[o + 1] * L * 0.97 * k), b = Math.min(255, s.rgb[o + 2] * L * 0.86 * k);
      if (r + g + b < 1) continue;
      const x = (i % cols) * cw, y = ((i / cols) | 0) * ch;
      ctx.globalAlpha = 1; ctx.fillStyle = this.css(((r | 0) << 16) | ((g | 0) << 8) | (b | 0));
      ctx.fillRect(x, y, cw + 0.5, ch + 0.5);
      const gl = s.glyph[i];
      if (gl) { ctx.globalAlpha = s.galpha[i] * k; ctx.fillStyle = this.css(s.gcol[i]); ctx.fillText(String.fromCharCode(gl), x + cw / 2, y + ch / 2 + 1); }
    }
    ctx.globalAlpha = 1;
  }

  render(house: House) {
    const { ctx, cols } = this;
    if (!cols || !this.cache) return;
    this.glyph.fill(0); this.tileA.fill(0); this.shadow.fill(0);
    this.rasterBall(house); this.rasterCat(house);
    this.prepare(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.cache, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#000';
    for (let i = 0; i < this.shadow.length; i++) if (this.shadow[i] && !this.glyph[i]) { ctx.globalAlpha = 0.3 * this.dim[i]; ctx.fillRect((i % cols) * this.cw, ((i / cols) | 0) * this.ch, this.cw, this.ch); }
    for (let i = 0; i < this.glyph.length; i++) {
      const g = this.glyph[i], ta = this.tileA[i];
      if (!g && !ta) continue;
      const k = this.dim[i], x = (i % cols) * this.cw, y = ((i / cols) | 0) * this.ch;
      if (ta > 0) { ctx.globalAlpha = ta * k; ctx.fillStyle = this.css(this.tile[i]); ctx.fillRect(x, y, this.cw, this.ch); }
      if (g && g !== 32) { ctx.globalAlpha = this.alpha[i] * k; ctx.fillStyle = this.css(this.color[i]); ctx.fillText(String.fromCharCode(g), x + this.cw / 2, y + this.ch / 2 + 1); }
    }
    ctx.globalAlpha = 1;
  }

  private rasterBall(h: House) {
    const b = h.ball, { cw, ch, cols, rows } = this;
    for (let r = Math.floor((b.y - b.r) / ch); r <= Math.floor((b.y + b.r) / ch); r++) for (let c = Math.floor((b.x - b.r) / cw); c <= Math.floor((b.x + b.r) / cw); c++) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      const dx = c * cw + cw / 2 - b.x, dy = r * ch + ch / 2 - b.y, d = Math.hypot(dx, dy);
      if (d > b.r) continue;
      const i = r * cols + c, band = Math.sin((dx * Math.cos(b.spin) + dy * Math.sin(b.spin)) * 0.6 + b.spin * 2) > 0.15;
      const lit = clamp(0.62 + (-dy / b.r) * 0.25, 0.4, 1);
      this.glyph[i] = (d > b.r * 0.7 ? '+' : band ? '@' : 'o').charCodeAt(0);
      this.color[i] = pack(K.cream); this.alpha[i] = 0.95;
      this.tile[i] = pack(mul(band ? K.yarn : K.yarnHi, lit)); this.tileA[i] = 0.95;
      if (r + 1 < rows) this.shadow[(r + 1) * cols + Math.min(cols - 1, c + 1)] = 1;
    }
  }

  private rasterCat(h: House) {
    const { cw, ch, cols, rows } = this, prims = h.prims;
    if (!prims.length) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of prims) {
      const m = p.kind === 'ell' ? Math.max(p.c, p.d) : p.kind === 'dot' ? p.c : p.kind === 'cap' ? Math.max(p.e, p.f) : 0;
      const xs = p.kind === 'cap' ? [p.a, p.c] : p.kind === 'tri' ? [p.a, p.c, p.e] : [p.a];
      const ys = p.kind === 'cap' ? [p.b, p.d] : p.kind === 'tri' ? [p.b, p.d, p.f] : [p.b];
      for (const x of xs) { minX = Math.min(minX, x - m); maxX = Math.max(maxX, x + m); }
      for (const y of ys) { minY = Math.min(minY, y - m); maxY = Math.max(maxY, y + m); }
    }
    const c0 = Math.max(0, Math.floor(minX / cw) - 1), c1 = Math.min(cols - 1, Math.floor(maxX / cw) + 1);
    const r0 = Math.max(0, Math.floor(minY / ch) - 1), r1 = Math.min(rows - 1, Math.floor(maxY / ch) + 1);
    const ox = 0.42 * cw, oy = 0.42 * ch, out = this.out;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = c * cw + cw / 2, py = r * ch + ch / 2, i = r * cols + c;
      const centre = h.hit(px, py, out);
      if (!centre) { if (h.hit(px - 0.35 * h.c, py - 0.5 * h.c, null)) this.shadow[i] = 1; }
      let inside = 0, nx = 0, ny = 0, seam = 0;
      const cg = centre ? grp(centre.part) : '';
      for (let q = 0; q < 4; q++) {
        const sx = q & 1 ? 1 : -1, sy = q & 2 ? 1 : -1;
        const o = h.hit(px + sx * ox, py + sy * oy, null);
        if (o) {
          inside++;
          if (centre && centre.part !== 'eye' && centre.part !== 'nose' && o.part !== 'eye' && o.part !== 'nose' && grp(o.part) !== cg) { nx += sx; ny += sy; seam++; }
        } else { nx += sx; ny += sy; }
      }
      if (!centre && inside < 3) continue;
      let prim = centre, u = out.u, v = out.v;
      if (!centre) { prim = h.hit(px + ox * Math.sign(-nx || 1), py + oy * Math.sign(-ny || 1), out); u = out.u; v = out.v; }
      if (!prim) continue;
      const edge = !centre || inside < 4 || seam > 0, col = h.color(prim, px, py, u, v);
      if (prim.part === 'eye' || prim.part === 'nose') { this.glyph[i] = (prim.part === 'eye' ? 'o' : '.').charCodeAt(0); this.color[i] = pack(K.cream); this.alpha[i] = 1; this.tile[i] = pack(col); this.tileA[i] = 1; continue; }
      if (edge) {
        const tx = -ny, ty = nx;
        const g = Math.abs(ty) < Math.abs(tx) * 0.4 ? '-' : Math.abs(tx) < Math.abs(ty) * 0.4 ? '|' : (tx * ty > 0 ? '\\' : '/');
        this.glyph[i] = g.charCodeAt(0); this.color[i] = pack(mix(K.outline, K.fur, 0.25)); this.alpha[i] = 0.95;
        this.tile[i] = pack(mul(col, 0.7)); this.tileA[i] = 1;
      } else {
        const lit = clamp(0.8 + 0.2 * Math.sin(px * 0.05) + ((hash(c, r, 33) * 3) | 0) * 0.03, 0, 0.99);
        this.glyph[i] = RAMP[clamp(Math.round(lit * (RAMP.length - 1)), 0, RAMP.length - 1)].charCodeAt(0);
        this.color[i] = pack(mul(mix(col, K.cream, 0.15), 1.1)); this.alpha[i] = 0.9;
        this.tile[i] = pack(col); this.tileA[i] = 1;
      }
    }
  }
}
