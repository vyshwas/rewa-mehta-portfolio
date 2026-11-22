// The isometric cat room as a hand-drawn sketch: wobbly chalk-ink outlines and soft colour washes on dark paper.
// It reuses the cat's behaviour and the room's floor plan from iso.ts (IsoHouse); only the drawing is new.

import { IsoHouse, type IsoScene } from './iso';
export type { Box } from './iso';
import type { Box } from './iso';

const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const hash = (a: number, b: number, c = 0) => {
  let h = Math.imul(a | 0, 0x165667b1) ^ Math.imul(b | 0, 0x27d4eb2f) ^ Math.imul(c | 0, 0x55fdc781);
  h = Math.imul(h ^ (h >>> 13), 0x4bf19f61);
  return ((h ^ (h >>> 16)) >>> 0) / 0x100000000;
};

const PAPER = '#0f1222';
const rgba = (r: number, g: number, b: number, a: number) => `rgba(${r},${g},${b},${a})`;
const INK = rgba(238, 230, 214, 0.92), INK2 = rgba(238, 230, 214, 0.45);

type Pt = [number, number];
interface Op { p: Path2D; fill?: string; stroke?: string; lw?: number; round?: boolean }
interface Item { x1: number; y1: number; ops: Op[] }

// ------------------------------------------------------------------ geometry

interface Geo { A: number; B: number; cx: number; ty: number; lw: number }

function makeGeo(W: number, H: number): { geo: Geo; wide: boolean } {
  const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 1000px)').matches;   // same breakpoint as the CSS
  const RW = 640, RL = 540;
  let A: number;
  if (wide) A = Math.min(clamp((H * 0.97 - 30) / 880, 0.5, 1.4), (W - 8) / (RW + RL));
  else A = clamp(Math.min(W / 1180, (H * 0.62 - 40) / 866), 0.25, 1);
  const B = A * 0.95, cx = wide ? clamp(W * 0.6, RL * A, W - 8 - RW * A) : W * 0.5;
  const wallTop = 280 * B;
  let ty = wallTop + (wide ? 34 : 64);
  if (!wide) ty += Math.max(0, (H * 0.5 - 64 - (wallTop + 570 * A + 10)) / 2);
  return { geo: { A, B, cx, ty, lw: clamp(1 + A * 1.0, 1.1, 2) }, wide };
}

// ------------------------------------------------------------------ sketch builder

let seedCounter = 1;
class Sk {
  ops: Op[] = [];
  constructor(public g: Geo) {}
  P(x: number, y: number, z: number): Pt { return [this.g.cx + (x - y) * this.g.A, this.g.ty + (x + y) * this.g.A * 0.5 - z * this.g.B]; }

  /** A wobbly hand-drawn segment, appended to a path. */
  static seg(p: Path2D, a: Pt, b: Pt, amt: number) {
    const s = seedCounter++, r = (k: number) => (hash(s, k, 5) - 0.5) * 2 * amt;
    p.moveTo(a[0] + r(1), a[1] + r(2));
    p.quadraticCurveTo((a[0] + b[0]) / 2 + r(3), (a[1] + b[1]) / 2 + r(4), b[0] + r(5), b[1] + r(6));
  }
  /** Fill a polygon with paper (so it hides what is behind it), a slightly misregistered wash, and a double ink outline. */
  face(pts: Pt[], wash: string, opt: { ink?: boolean; amt?: number } = {}) {
    const fp = new Path2D(), wp = new Path2D();
    pts.forEach((q, i) => { if (i) fp.lineTo(q[0], q[1]); else fp.moveTo(q[0], q[1]); }); fp.closePath();
    pts.forEach((q, i) => { const x = q[0] + 0.9, y = q[1] + 0.7; if (i) wp.lineTo(x, y); else wp.moveTo(x, y); }); wp.closePath();
    this.ops.push({ p: fp, fill: PAPER }, { p: wp, fill: wash });
    if (opt.ink !== false) this.outline(pts, opt.amt ?? 1.1);
  }
  outline(pts: Pt[], amt = 1.1, closed = true) {
    const a = new Path2D(), b = new Path2D(), n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) { Sk.seg(a, pts[i], pts[(i + 1) % n], amt); Sk.seg(b, pts[i], pts[(i + 1) % n], amt * 1.6); }
    this.ops.push({ p: a, stroke: INK, lw: this.g.lw }, { p: b, stroke: INK2, lw: this.g.lw * 0.7 });
  }
  line(a: Pt, b: Pt, stroke = INK2, lw = 0.8, amt = 0.8) { const p = new Path2D(); Sk.seg(p, a, b, amt); this.ops.push({ p, stroke, lw: lw * (0.6 + this.g.lw * 0.4) }); }

  box(x0: number, y0: number, z0: number, dx: number, dy: number, dz: number, c: [number, number, number], a = 0.5) {
    a = Math.min(0.95, a * 1.45);
    const x1 = x0 + dx, y1 = y0 + dy, zt = z0 + dz, P = (x: number, y: number, z: number) => this.P(x, y, z);
    this.face([P(x1, y0, zt), P(x1, y1, zt), P(x1, y1, z0), P(x1, y0, z0)], rgba(c[0] * 0.55 | 0, c[1] * 0.55 | 0, c[2] * 0.55 | 0, a));
    this.face([P(x0, y1, zt), P(x1, y1, zt), P(x1, y1, z0), P(x0, y1, z0)], rgba(c[0] * 0.8 | 0, c[1] * 0.8 | 0, c[2] * 0.8 | 0, a));
    this.face([P(x0, y0, zt), P(x1, y0, zt), P(x1, y1, zt), P(x0, y1, zt)], rgba(c[0], c[1], c[2], a + 0.08));
  }
  floorShadow(x0: number, y0: number, dx: number, dy: number, h: number) {
    const s = h * 0.3, P = (x: number, y: number) => this.P(x, y, 0), pts = [P(x0 + 2, y0 + 2), P(x0 + dx + s, y0 + 2), P(x0 + dx + s, y0 + dy + s), P(x0 + 2, y0 + dy + s)];
    const p = new Path2D(); pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath();
    this.ops.push({ p, fill: 'rgba(0,0,0,0.3)' });
  }
  solid(x0: number, y0: number, z0: number, dx: number, dy: number, dz: number, c: [number, number, number], a = 0.5, shadow = true) {
    if (shadow) this.floorShadow(x0, y0, dx, dy, z0 + dz);
    this.box(x0, y0, z0, dx, dy, dz, c, a);
  }
  /** a pot or round pouf */
  cyl(cx: number, cy: number, r: number, z0: number, dz: number, c: [number, number, number], a = 0.6) {
    const [bx, by] = this.P(cx, cy, z0), [tx, ty] = this.P(cx, cy, z0 + dz), rx = r * this.g.A * 1.414, ry = r * this.g.A * 0.707;
    const body = new Path2D(); body.moveTo(tx - rx, ty); body.lineTo(bx - rx, by); body.ellipse(bx, by, rx, ry, 0, Math.PI, 0, true); body.lineTo(tx + rx, ty); body.closePath();
    this.ops.push({ p: body, fill: PAPER }, { p: body, fill: rgba(c[0] * 0.7 | 0, c[1] * 0.7 | 0, c[2] * 0.7 | 0, a) });
    const top = new Path2D(); top.ellipse(tx, ty, rx, ry, 0, 0, TAU);
    this.ops.push({ p: top, fill: PAPER }, { p: top, fill: rgba(c[0], c[1], c[2], a + 0.1) });
    const l = new Path2D(); l.moveTo(tx - rx, ty); l.lineTo(bx - rx, by); l.ellipse(bx, by, rx, ry, 0, Math.PI, 0, true); l.lineTo(tx + rx, ty); l.ellipse(tx, ty, rx, ry, 0, 0, TAU);
    this.ops.push({ p: l, stroke: INK, lw: this.g.lw });
  }
  /** a bunch of leaves fanning up from a floor point */
  foliage(x: number, y: number, z: number, r: number, seed: number, n: number, hang = false) {
    const [sx, sy] = this.P(x, y, z), A = this.g.A, groups: Path2D[] = [new Path2D(), new Path2D(), new Path2D()], ink = new Path2D(), ribs = new Path2D();
    for (let i = 0; i < n; i++) {
      const spread = hang ? 0.9 : 2.5, ang = (hang ? Math.PI / 2 : -Math.PI / 2) + (hash(seed, i, 1) - 0.5) * spread;
      const len = r * A * (hang ? 0.7 : 1.0 + hash(seed, i, 2) * 0.9), w = len * 0.36, tone = Math.floor(hash(seed, i, 4) * 3);
      const cs = Math.cos(ang), sn = Math.sin(ang), tip: Pt = [sx + cs * len, sy + sn * len], nx = -sn * w, ny = cs * w, g = groups[tone];
      const mid: Pt = [sx + cs * len * 0.5, sy + sn * len * 0.5];
      for (const t of [g, ink]) { t.moveTo(sx, sy); t.quadraticCurveTo(mid[0] + nx, mid[1] + ny, tip[0], tip[1]); t.quadraticCurveTo(mid[0] - nx, mid[1] - ny, sx, sy); }
      ribs.moveTo(sx, sy); ribs.lineTo(tip[0] * 0.92 + sx * 0.08, tip[1] * 0.92 + sy * 0.08);
    }
    this.ops.push({ p: groups[0], fill: rgba(34, 88, 52, 0.95) }, { p: groups[1], fill: rgba(60, 128, 70, 0.95) }, { p: groups[2], fill: rgba(112, 170, 88, 0.95) },
      { p: ink, stroke: rgba(238, 230, 214, 0.7), lw: this.g.lw * 0.8 }, { p: ribs, stroke: rgba(20, 50, 30, 0.7), lw: 0.7 });
  }
  plant(x: number, y: number, r: number, seed: number, z = 0, n = 8) {
    this.floorShadow(x - r * 0.5, y - r * 0.5, r, r, 30);
    this.cyl(x, y, r * 0.42, z, r * 0.7, [196, 104, 64]);
    this.foliage(x, y, z + r * 0.7, r, seed, n);
  }
}

// ------------------------------------------------------------------ the room

interface Room { geo: Geo; wide: boolean; items: Item[]; drawBackground: (ctx: CanvasRenderingContext2D) => void; obstacles: [number, number, number, number][] }

const WX = 640, LY = 540, HW = 280;

function buildRoom(W: number, H: number): Room {
  const { geo, wide } = makeGeo(W, H);
  const s0 = new Sk(geo), P = (x: number, y: number, z: number) => s0.P(x, y, z);
  const PR = (a: number, z: number) => P(a, 0, z), PL = (a: number, z: number) => P(0, a, z);
  const items: Item[] = [];
  const item = (x1: number, y1: number, fn: (s: Sk) => void) => { const s = new Sk(geo); fn(s); items.push({ x1, y1, ops: s.ops }); };

  // ---------------- background: paper, floor, walls, window, wall decor, rug
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const poly = (pts: Pt[]) => { const p = new Path2D(); pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); return p; };
    const ink = (pts: Pt[], lw = geo.lw) => {
      for (const [alpha, k] of [[0.9, 1.0], [0.4, 1.7]] as [number, number][]) {
        const pa = new Path2D(); for (let i = 0; i < pts.length; i++) Sk.seg(pa, pts[i], pts[(i + 1) % pts.length], 1.2 * k);
        ctx.strokeStyle = rgba(238, 230, 214, alpha); ctx.lineWidth = lw * (alpha > 0.5 ? 1 : 0.7); ctx.stroke(pa);
      }
    };
    const floor = [P(0, 0, 0), P(WX, 0, 0), P(WX, LY, 0), P(0, LY, 0)];
    const wallR = [PR(0, HW), PR(WX, HW), PR(WX, 0), PR(0, 0)], wallL = [PL(0, HW), PL(LY, HW), PL(LY, 0), PL(0, 0)];
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [pts, wash] of [[floor, rgba(214, 140, 76, 0.42)], [wallL, rgba(232, 184, 128, 0.3)], [wallR, rgba(210, 100, 62, 0.4)]] as [Pt[], string][]) {
      ctx.fillStyle = PAPER; ctx.fill(poly(pts)); ctx.fillStyle = wash; ctx.fill(poly(pts));
    }
    // plank seams
    ctx.strokeStyle = rgba(238, 200, 150, 0.2); ctx.lineWidth = 0.8;
    for (let fx = 26; fx < WX; fx += 26) { const p = new Path2D(); Sk.seg(p, P(fx, 0, 0), P(fx, LY, 0), 0.9); ctx.stroke(p); }
    for (let fx = 0; fx < WX; fx += 26) for (let k = 0; k < 3; k++) { const fy = 40 + hash(fx, k, 3) * (LY - 80), p = new Path2D(); Sk.seg(p, P(fx, fy, 0), P(fx + 26, fy, 0), 0.5); ctx.stroke(p); }
    // brick wall: courses and staggered joints
    ctx.save(); ctx.clip(poly(wallR));
    ctx.strokeStyle = rgba(240, 190, 160, 0.32); ctx.lineWidth = 0.8;
    const bh = 14, bw = 38;
    for (let r = 0, z = HW; z > 0; z -= bh, r++) {
      const p = new Path2D(); Sk.seg(p, PR(0, z), PR(WX, z), 0.8);
      for (let a = (r % 2) * bw / 2; a < WX; a += bw) { p.moveTo(...PR(a, z)); p.lineTo(...PR(a, z - bh)); }
      ctx.stroke(p);
      if (r % 3 === 0) { ctx.fillStyle = rgba(230, 110, 70, 0.1); ctx.fill(poly([PR(0, z), PR(WX, z), PR(WX, z - bh), PR(0, z - bh)])); }
    }
    ctx.restore();
    // plaster: a few loose strokes
    ctx.strokeStyle = rgba(238, 210, 170, 0.14); ctx.lineWidth = 0.8;
    for (let i = 0; i < 26; i++) { const a = 20 + hash(i, 1, 2) * (LY - 40), z = 20 + hash(i, 2, 2) * 230, p = new Path2D(); Sk.seg(p, PL(a, z), PL(a + 20, z + 3), 0.6); ctx.stroke(p); }
    // corner seam, skirting
    for (const [a, b] of [[PR(0, HW), PR(0, 0)], [PR(0, 0), P(WX, 0, 0)], [PR(0, 0), PL(LY, 0)]] as [Pt, Pt][]) { const p = new Path2D(); Sk.seg(p, a, b, 0.8); ctx.strokeStyle = INK2; ctx.lineWidth = geo.lw; ctx.stroke(p); }
    ink(floor); ink(wallR); ink(wallL);
    for (const [pts] of [[[PR(0, 9), PR(WX, 9)]], [[PL(0, 9), PL(LY, 9)]]] as Pt[][][]) { const p = new Path2D(); Sk.seg(p, pts[0], pts[1], 0.8); ctx.strokeStyle = INK2; ctx.lineWidth = 0.8; ctx.stroke(p); }

    // moonlight... sunlight from the window across floor
    const lightPts = [P(0, 36, 0), P(0, 205, 0), P(260, 335, 0), P(260, 146, 0)];
    ctx.save(); ctx.clip(poly(lightPts));
    ctx.fillStyle = rgba(255, 224, 150, 0.2); ctx.fill(poly(lightPts));
    ctx.strokeStyle = rgba(255, 224, 150, 0.2); ctx.lineWidth = 0.8;
    for (let i = -30; i < 40; i++) { const p = new Path2D(); Sk.seg(p, P(0, 36 + i * 9, 0), P(260, 146 + i * 9, 0), 0.5); ctx.stroke(p); }
    ctx.restore();

    // rug
    const rug = [P(140, 130, 0), P(390, 130, 0), P(390, 320, 0), P(140, 320, 0)];
    ctx.fillStyle = rgba(112, 140, 88, 0.7); ctx.fill(poly(rug)); ink(rug);
    const rug2 = [P(150, 140, 0), P(380, 140, 0), P(380, 310, 0), P(150, 310, 0)]; ink(rug2, 0.8);
    ctx.save(); ctx.clip(poly(rug)); ctx.strokeStyle = rgba(190, 210, 150, 0.2); ctx.lineWidth = 0.7;
    for (let fy = 140; fy < 320; fy += 12) { const p = new Path2D(); Sk.seg(p, P(150, fy, 0), P(380, fy, 0), 0.6); ctx.stroke(p); }
    ctx.restore();

    // window on the left wall, with the garden outside
    const wy0 = 40, wy1 = 205, wz0 = 62, wz1 = 232, win = [PL(wy0, wz1), PL(wy1, wz1), PL(wy1, wz0), PL(wy0, wz0)];
    const frame = [PL(wy0 - 6, wz1 + 6), PL(wy1 + 6, wz1 + 6), PL(wy1 + 6, wz0 - 6), PL(wy0 - 6, wz0 - 6)];
    ctx.fillStyle = PAPER; ctx.fill(poly(frame)); ink(frame);
    const g = ctx.createLinearGradient(...PL(wy0, wz1), ...PL(wy1, wz0)); g.addColorStop(0, rgba(255, 228, 150, 0.95)); g.addColorStop(1, rgba(176, 216, 130, 0.75));
    ctx.fillStyle = PAPER; ctx.fill(poly(win)); ctx.fillStyle = g; ctx.fill(poly(win));
    ctx.save(); ctx.clip(poly(win)); ctx.strokeStyle = rgba(60, 120, 60, 0.55); ctx.lineWidth = 1;
    for (let i = 0; i < 46; i++) { const a = wy0 + hash(i, 1, 9) * (wy1 - wy0), z = wz0 + hash(i, 2, 9) * (wz1 - wz0), p = new Path2D(), q = PL(a, z); p.ellipse(q[0], q[1], 4 + hash(i, 3, 9) * 6, 2.5 + hash(i, 4, 9) * 3, hash(i, 5, 9) * 3, 0, TAU); ctx.stroke(p); }
    ctx.restore();
    ink(win, geo.lw);
    for (const [a, b] of [[PL((wy0 + wy1) / 2, wz0), PL((wy0 + wy1) / 2, wz1)], [PL(wy0, (wz0 + wz1) / 2), PL(wy1, (wz0 + wz1) / 2)]] as [Pt, Pt][]) { const p = new Path2D(); Sk.seg(p, a, b, 0.7); ctx.strokeStyle = INK; ctx.lineWidth = geo.lw * 1.4; ctx.stroke(p); }
    // glow around the window
    const gl = ctx.createRadialGradient(...PL((wy0 + wy1) / 2, (wz0 + wz1) / 2), 10, ...PL((wy0 + wy1) / 2, (wz0 + wz1) / 2), 150 * geo.A);
    gl.addColorStop(0, rgba(255, 220, 150, 0.26)); gl.addColorStop(1, rgba(255, 220, 150, 0)); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);

    // hanging shelf on the left wall, plants with trailing vines
    const sk = new Sk(geo);
    sk.box(0, 250, 168, 24, 210, 6, [190, 140, 90], 0.7);
    for (let i = 0; i < 4; i++) {
      const y = 270 + i * 52;
      sk.cyl(12, y, 6, 174, 8, [196, 104, 64]); sk.foliage(12, y, 182, 10, 80 + i, 6);
      for (let k = 1; k <= 5; k++) sk.foliage(8, y + (k % 2 ? 4 : -4), 174 - k * 13, 6, 90 + i * 7 + k, 2, true);
    }
    // picture frames and AC on the brick wall, radiator on the left wall
    const frames: [number, number, number, number, [number, number, number]][] = [
      [250, 34, 46, 130, [88, 130, 90]], [292, 40, 34, 160, [200, 160, 110]], [338, 32, 44, 120, [80, 110, 170]], [372, 42, 34, 170, [210, 120, 90]],
      [418, 36, 52, 120, [120, 160, 110]], [464, 34, 38, 168, [210, 200, 170]], [508, 40, 56, 118, [170, 110, 130]], [556, 32, 44, 150, [100, 140, 190]], [600, 40, 50, 126, [190, 170, 120]],
    ];
    for (const [a, fw, fh, zz, art] of frames) {
      if (a + fw > WX - 6) continue;
      sk.face([PR(a, zz + fh), PR(a + fw, zz + fh), PR(a + fw, zz), PR(a, zz)], rgba(art[0], art[1], art[2], 0.6));
      sk.outline([PR(a + 5, zz + fh - 5), PR(a + fw - 5, zz + fh - 5), PR(a + fw - 5, zz + 5), PR(a + 5, zz + 5)], 0.6);
    }
    sk.face([PR(130, 232), PR(250, 232), PR(250, 196), PR(130, 196)], rgba(236, 234, 228, 0.55));
    for (let k = 0; k < 3; k++) sk.line(PR(140, 210 + k * 5), PR(240, 210 + k * 5), INK2, 0.8);
    sk.face([PL(492, 68), PL(534, 68), PL(534, 10), PL(492, 10)], rgba(236, 234, 228, 0.5));
    for (let a = 496; a < 532; a += 5) sk.line(PL(a, 62), PL(a, 16), INK2, 0.7);
    for (const o of sk.ops) { if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(o.p); } if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw ?? 1; ctx.stroke(o.p); } }
  };

  // ---------------- furniture (drawn per frame, sorted, so the cat can pass behind it)
  const wood: [number, number, number] = [150, 98, 58], woodL: [number, number, number] = [190, 140, 90], cream: [number, number, number] = [226, 206, 180];
  const green: [number, number, number] = [128, 148, 100];

  item(146, 228, (s) => {   // bed
    s.floorShadow(0, 46, 150, 183, 40);
    s.box(0, 46, 0, 146, 182, 26, [110, 70, 44], 0.6);
    s.box(2, 48, 26, 142, 178, 20, [226, 214, 196], 0.5);
    s.box(6, 100, 46, 134, 124, 7, green, 0.6);
    for (let i = 0; i < 6; i++) { const fy = 108 + i * 18; s.line(s.P(14, fy, 53), s.P(130, fy + 8, 53), rgba(40, 60, 30, 0.5), 0.8, 1.6); }
    s.box(10, 54, 46, 58, 40, 14, [224, 206, 186], 0.6);
    s.box(76, 56, 46, 58, 40, 14, [184, 148, 146], 0.6);
    s.box(40, 150, 53, 64, 34, 5, [150, 160, 120], 0.6);
  });
  item(38, 282, (s) => { s.solid(0, 244, 0, 38, 38, 46, wood, 0.6); s.plant(19, 263, 18, 70, 46, 5); });
  item(106, 36, (s) => {   // bookshelf
    s.floorShadow(18, 0, 92, 36, 190);
    s.box(20, 0, 0, 86, 36, 190, [96, 60, 36], 0.7);
    const rows = 5, y1 = 36;
    for (let r = 0; r < rows; r++) {
      const z0 = 6 + r * 36, z1 = z0 + 30;
      s.line(s.P(20, y1, z0 - 2), s.P(106, y1, z0 - 2), INK, 1, 0.6);
      if (r === 0) s.foliage(80, y1, z0 + 2, 11, 88, 6);
      else if (r === 1) { s.face([s.P(30, y1, z1 - 4), s.P(48, y1, z1 - 4), s.P(48, y1, z0 + 2), s.P(30, y1, z0 + 2)], rgba(196, 104, 64, 0.8), { amt: 0.5 }); }
      else for (let b = 0; b < 8; b++) {
        const c = [[220, 80, 60], [70, 100, 170], [236, 216, 186], [100, 140, 90], [200, 160, 100]][Math.floor(hash(r, b, 3) * 5)], x = 26 + b * 9.4;
        s.face([s.P(x, y1, z1 - hash(r, b, 4) * 6), s.P(x + 7.6, y1, z1 - hash(r, b, 4) * 6), s.P(x + 7.6, y1, z0 + 2), s.P(x, y1, z0 + 2)], rgba(c[0], c[1], c[2], 0.75), { amt: 0.4 });
      }
    }
  });
  item(198, 7, (s) => {   // leaning mirror
    s.floorShadow(126, 0, 72, 7, 176);
    s.box(126, 0, 18, 72, 7, 176, wood, 0.7);
    s.face([s.P(132, 7.5, 186), s.P(192, 7.5, 186), s.P(192, 7.5, 26), s.P(132, 7.5, 26)], rgba(226, 206, 170, 0.45), { amt: 0.5 });
    for (let k = 0; k < 4; k++) s.line(s.P(140 + k * 14, 7.5, 170 - k * 6), s.P(160 + k * 14, 7.5, 120 - k * 6), rgba(255, 246, 220, 0.5), 0.8);
  });
  item(298, 248, (s) => {   // coffee table
    s.solid(210, 192, 0, 88, 56, 40, wood, 0.7);
    s.box(220, 200, 40, 26, 18, 3, [236, 232, 224], 0.7); s.box(224, 203, 43, 18, 12, 2, [170, 110, 80], 0.7);
    s.cyl(268, 222, 7, 40, 5, [196, 104, 64]); s.foliage(268, 222, 46, 11, 31, 5);
    s.cyl(238, 234, 5, 40, 2, [236, 232, 224]);
  });
  item(94, 480, (s) => {   // sofa
    s.floorShadow(0, 300, 96, 180, 60);
    s.box(0, 300, 0, 94, 180, 38, [190, 172, 144], 0.55);
    s.box(0, 300, 38, 26, 180, 46, cream, 0.6);
    s.box(26, 300, 38, 68, 24, 24, cream, 0.6); s.box(26, 456, 38, 68, 24, 24, cream, 0.6);
    s.box(28, 326, 38, 64, 62, 14, [232, 216, 190], 0.6); s.box(28, 392, 38, 64, 62, 14, [232, 216, 190], 0.6);
    s.box(30, 388, 52, 56, 46, 5, [198, 170, 132], 0.7);
    for (let i = 0; i < 5; i++) s.line(s.P(34, 392 + i * 8, 57), s.P(82, 394 + i * 8, 57), rgba(120, 90, 60, 0.5), 0.8);
    s.box(16, 330, 52, 22, 30, 16, [206, 184, 150], 0.7);
  });
  item(236, 56, (s) => s.plant(214, 34, 38, 21, 0, 11));
  item(374, 38, (s) => {   // TV stand and TV
    s.solid(250, 0, 0, 124, 38, 48, wood, 0.7);
    s.box(262, 14, 48, 100, 8, 56, [34, 40, 62], 0.9);
    s.face([s.P(268, 22.5, 98), s.P(356, 22.5, 98), s.P(356, 22.5, 54), s.P(268, 22.5, 54)], rgba(90, 120, 170, 0.6), { amt: 0.5 });
  });
  item(414, 62, (s) => s.plant(392, 40, 22, 22, 0, 7));
  item(568, 62, (s) => {   // desk
    s.floorShadow(398, 0, 170, 66, 78);
    s.box(398, 0, 0, 8, 62, 72, [236, 232, 224], 0.6); s.box(560, 0, 0, 8, 62, 72, [236, 232, 224], 0.6);
    s.box(398, 0, 72, 170, 62, 5, [240, 236, 228], 0.7);
    s.box(470, 6, 77, 60, 6, 40, [34, 40, 62], 0.9);
    s.face([s.P(476, 12.5, 112), s.P(524, 12.5, 112), s.P(524, 12.5, 82), s.P(476, 12.5, 82)], rgba(90, 130, 190, 0.65), { amt: 0.5 });
    s.box(412, 24, 77, 44, 30, 2, [196, 194, 192], 0.8);
    s.face([s.P(412, 27, 105), s.P(456, 27, 105), s.P(456, 27, 79), s.P(412, 27, 79)], rgba(110, 160, 220, 0.7), { amt: 0.5 });
    s.box(480, 34, 77, 60, 20, 2, [50, 50, 56], 0.9);
    s.cyl(548, 50, 6, 77, 8, [196, 104, 64]); s.foliage(548, 50, 85, 9, 61, 4);
  });
  item(504, 146, (s) => {   // chair
    s.floorShadow(452, 96, 44, 44, 40);
    s.cyl(474, 118, 20, 0, 40, [236, 232, 226], 0.7); s.box(494, 98, 40, 6, 40, 50, [236, 232, 226], 0.7);
  });
  item(140, 44, (s) => s.plant(118, 22, 22, 11, 0, 8));
  item(104, 336, (s) => s.plant(60, 292, 44, 12, 0, 12));
  item(590, 140, (s) => s.plant(560, 110, 30, 34, 0, 9));
  item(568, 468, (s) => s.plant(540, 440, 34, 41, 0, 13));
  item(492, 512, (s) => s.plant(470, 490, 24, 43, 0, 9));
  item(70, 530, (s) => {   // sneakers
    s.solid(40, 500, 0, 26, 10, 6, [236, 234, 230], 0.7); s.box(46, 501, 6, 14, 8, 3, [150, 148, 164], 0.8);
    s.solid(40, 516, 0, 26, 10, 6, [210, 210, 214], 0.7); s.box(46, 517, 6, 14, 8, 3, [90, 110, 160], 0.8);
  });
  items.sort((a, b) => a.x1 + a.y1 - (b.x1 + b.y1));

  const obstacles: [number, number, number, number][] = [
    [0, 40, 150, 236], [0, 238, 44, 288], [14, 0, 112, 42], [122, 0, 202, 12], [204, 186, 304, 254], [0, 296, 98, 484], [194, 10, 236, 56], [246, 0, 378, 44],
    [394, 0, 572, 68], [446, 92, 504, 146], [98, 4, 140, 44], [536, 90, 586, 134], [34, 494, 70, 530], [512, 412, 568, 468], [450, 470, 492, 512],
  ];
  return { geo, wide, items, drawBackground, obstacles };
}

// ------------------------------------------------------------------ renderer

function softRect(ctx: CanvasRenderingContext2D, b: Box, pad: number, alpha: number) {
  const col = (a: number) => `rgba(6,7,11,${a})`;
  const { left: l, top: t, right: r, bottom: bt } = b;
  ctx.fillStyle = col(alpha); ctx.fillRect(l, t, r - l, bt - t);
  const edge = (x0: number, y0: number, x1: number, y1: number, gx: number, gy: number, hx: number, hy: number) => {
    const g = ctx.createLinearGradient(gx, gy, hx, hy); g.addColorStop(0, col(alpha)); g.addColorStop(1, col(0)); ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  };
  edge(l, t - pad, r, t, l, t, l, t - pad); edge(l, bt, r, bt + pad, l, bt, l, bt + pad); edge(l - pad, t, l, bt, l, t, l - pad, t); edge(r, t, r + pad, bt, r, t, r + pad, t);
  for (const [cx, cy, sx, sy] of [[l, t, -1, -1], [r, t, 1, -1], [l, bt, -1, 1], [r, bt, 1, 1]] as [number, number, number, number][]) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, pad); g.addColorStop(0, col(alpha)); g.addColorStop(1, col(0)); ctx.fillStyle = g;
    ctx.fillRect(sx < 0 ? cx - pad : cx, sy < 0 ? cy - pad : cy, pad, pad);
  }
}

export class SketchRenderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1; private W = 0; private H = 0;
  private room: Room | null = null;
  private bg: HTMLCanvasElement | null = null; private dimLayer: HTMLCanvasElement | null = null;
  private dimSig = '';

  constructor(canvas: HTMLCanvasElement) { const c = canvas.getContext('2d'); if (!c) throw new Error('2D canvas unavailable'); this.ctx = c; }

  resize(w: number, h: number, dpr: number, house: IsoHouse) {
    this.dpr = dpr; this.W = w; this.H = h;
    this.ctx.canvas.width = Math.round(w * dpr); this.ctx.canvas.height = Math.round(h * dpr);
    seedCounter = 1;
    this.room = buildRoom(w, h);
    const { geo, wide, obstacles } = this.room;
    // The cat's simulation only needs the floor plan and the projection; give it the same fields the pixel version did.
    const scene = {
      cols: 0, rows: 0, cw: geo.A < 0.5 ? 3.2 : 4.2, ch: 8, A: geo.A, B: geo.B, cx: geo.cx, ty: geo.ty,
      rgb: new Float32Array(0), glyph: new Uint16Array(0), gcol: new Uint32Array(0), galpha: new Float32Array(0), light: new Float32Array(0),
      depth: new Int16Array(0), bx1: [], by1: [], obstacles, floor: { x1: WX, y1: LY }, spawn: { x: 330, y: 290 }, nap: { x: 170, y: 300 },
    } as IsoScene;
    void wide;
    house.attach(scene, w, h);
    this.bg = document.createElement('canvas'); this.bg.width = this.ctx.canvas.width; this.bg.height = this.ctx.canvas.height;
    const bctx = this.bg.getContext('2d');
    if (bctx) { bctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.room.drawBackground(bctx); }
    this.dimSig = '\u0000';
  }

  /** A soft dark panel behind the text so it stays readable over the drawing. */
  setDimBoxes(boxes: Box[]) {
    const sig = boxes.map((b) => [b.left, b.top, b.right, b.bottom].map(Math.round).join(',')).join('|');
    if (sig === this.dimSig) return;
    this.dimSig = sig;
    this.dimLayer = document.createElement('canvas'); this.dimLayer.width = this.ctx.canvas.width; this.dimLayer.height = this.ctx.canvas.height;
    const c = this.dimLayer.getContext('2d'); if (!c) return;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    for (const b of boxes) softRect(c, b, 70, 0.8);
  }

  render(h: IsoHouse) {
    const ctx = this.ctx, room = this.room; if (!room || !this.bg) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const { items, geo } = room;
    const wx = h.wx, wy = h.wy, front = (it: Item) => wx < it.x1 && wy < it.y1;     // an item is in front of her only if she is behind it on both axes
    const draw = (it: Item) => { for (const o of it.ops) { if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(o.p); } if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw ?? 1; ctx.stroke(o.p); } } };
    const ballFirst = h.ball.x + h.ball.y <= wx + wy;
    for (const it of items) if (!front(it)) draw(it);
    if (ballFirst) this.ball(h, geo); this.cat(h, geo); if (!ballFirst) this.ball(h, geo);
    for (const it of items) if (front(it)) draw(it);
    if (this.dimLayer) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.dimLayer, 0, 0); }
  }

  private ball(h: IsoHouse, g: Geo) {
    const ctx = this.ctx, b = h.ball;
    const sx = g.cx + (b.x - b.y) * g.A, sy0 = g.ty + (b.x + b.y) * g.A * 0.5, sy = sy0 - b.z * g.B, rr = Math.max(b.r * g.A * 1.2, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(sx, sy0, rr * 1.1, rr * 0.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(96,120,245,0.95)'; ctx.fill();
    ctx.strokeStyle = 'rgba(200,212,255,0.9)'; ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(sx, sy, rr * (0.8 - k * 0.08), b.spin + k * 1.1, b.spin + k * 1.1 + 1.9); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = geo1(g); ctx.beginPath(); ctx.arc(sx, sy, rr, 0, TAU); ctx.stroke();
  }

  private cat(h: IsoHouse, g: Geo) {
    const ctx = this.ctx, prims = h.prims; if (!prims.length) return;
    const S = h.S, fur = '#ee7a38', furD = '#b2521f', creamC = '#f6e4cc', pink = '#f0929a', ink = 'rgba(70,30,12,0.8)';
    // shadow on the floor
    const fx = g.cx + (h.wx - h.wy) * g.A, fy = g.ty + (h.wx + h.wy) * g.A * 0.5;
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(fx, fy + 2, S * 2.6, S * 0.7, 0, 0, TAU); ctx.fill();
    const hidden = (p: (typeof prims)[number]) => p.part === 'eye' || p.part === 'shine' || p.part === 'nose';
    const path = (p: (typeof prims)[number]) => {
      ctx.beginPath();
      if (p.kind === 'ell') ctx.ellipse(p.a, p.b, p.c, p.d, Math.atan2(p.sin, p.cos), 0, TAU);
      else if (p.kind === 'tri') { ctx.moveTo(p.a, p.b); ctx.lineTo(p.c, p.d); ctx.lineTo(p.e, p.f); ctx.closePath(); }
      else if (p.kind === 'dot') ctx.arc(p.a, p.b, p.c, 0, TAU);
    };
    // 1) a cream outline around the whole silhouette: every part drawn a little fatter
    ctx.fillStyle = creamC; ctx.strokeStyle = creamC; const ow = Math.max(2.2, S * 0.12);
    for (const p of prims) {
      if (hidden(p)) continue;
      if (p.kind === 'cap') { ctx.lineWidth = p.e + p.f + ow; ctx.beginPath(); ctx.moveTo(p.a, p.b); ctx.lineTo(p.c, p.d); ctx.stroke(); }
      else { path(p); ctx.lineWidth = ow; ctx.fill(); ctx.stroke(); }
    }
    // 2) the colours
    for (const p of prims) {
      if (hidden(p)) continue;
      const far = p.far, dark = (c: string) => c;
      let col = fur;
      if (p.part === 'chest') col = '#f3b27c'; else if (p.part === 'legL' || p.part === 'paw') col = creamC; else if (p.part === 'earIn') col = pink;
      else if (p.part === 'tail') col = p.idx >= 5 || p.idx % 3 === 1 ? furD : fur; else if (p.part === 'legU') col = fur;
      ctx.fillStyle = ctx.strokeStyle = far ? '#8d4a22' : dark(col);
      if (p.kind === 'cap') { ctx.lineWidth = p.e + p.f; ctx.beginPath(); ctx.moveTo(p.a, p.b); ctx.lineTo(p.c, p.d); ctx.stroke(); } else { path(p); ctx.fill(); }
    }
    // 3) a few ink lines: stripes, the head, the haunch, ear edges
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, S * 0.07);
    for (const p of prims) {
      if (p.kind === 'ell' && (p.part === 'head' || p.part === 'haunch' || p.part === 'chest')) { path(p); ctx.globalAlpha = p.part === 'head' ? 0.5 : 0.22; ctx.stroke(); ctx.globalAlpha = 1; }
      if (p.kind === 'tri' && p.part === 'ear') { path(p); ctx.stroke(); }
      if (p.kind === 'ell' && p.part === 'body') {
        ctx.strokeStyle = 'rgba(120,44,16,0.85)'; ctx.lineWidth = Math.max(1.4, S * 0.1);
        for (const k of [-0.62, -0.28, 0.06, 0.4, 0.7]) {
          ctx.beginPath();
          for (const [lx, ly] of [[k * p.c, -p.d * 0.98], [k * p.c + p.c * 0.02, -p.d * 0.3]]) { const x = p.a + p.cos * lx - p.sin * ly, y = p.b + p.sin * lx + p.cos * ly; ctx.lineTo(x, y); }
          ctx.stroke();
        }
        ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, S * 0.07);
      }
    }
    // 4) the face: muzzle, eye, nose, whiskers
    const head = prims.find((p) => p.part === 'head' && p.kind === 'ell'), nose = prims.find((p) => p.part === 'nose'), eye = prims.find((p) => p.part === 'eye'), shine = prims.find((p) => p.part === 'shine');
    if (head && nose) {
      const dir = Math.sign(nose.a - head.a) || 1, mx = head.a + (nose.a - head.a) * 0.78, my = head.b + (nose.b - head.b) * 0.72;
      ctx.fillStyle = creamC; ctx.beginPath(); ctx.ellipse(mx, my + S * 0.08, S * 0.42, S * 0.34, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = pink; ctx.beginPath(); ctx.arc(nose.a, nose.b, S * 0.14, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(250,240,225,0.9)'; ctx.lineWidth = 1;
      for (const k of [-0.3, 0, 0.3]) { ctx.beginPath(); ctx.moveTo(nose.a - dir * S * 0.1, nose.b + S * 0.05 + k * S * 0.1); ctx.lineTo(nose.a + dir * S * 0.95, nose.b + S * 0.05 + k * S * 0.5); ctx.stroke(); }
    }
    if (eye) {
      if (eye.kind === 'cap') { ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.4, S * 0.09); ctx.beginPath(); ctx.moveTo(eye.a, eye.b); ctx.lineTo(eye.c, eye.d); ctx.stroke(); }
      else { ctx.fillStyle = '#17110c'; ctx.beginPath(); ctx.arc(eye.a, eye.b, eye.c, 0, TAU); ctx.fill(); if (shine) { ctx.fillStyle = '#fff3d0'; ctx.beginPath(); ctx.arc(shine.a, shine.b, Math.max(1, shine.c), 0, TAU); ctx.fill(); } }
    }
  }
}
function geo1(g: Geo) { return g.lw; }
