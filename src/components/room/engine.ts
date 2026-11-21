// A night-time room, seen from the corner by someone hiding by the wall,
// and a cat that plays by herself. Drawn entirely in monospace characters,
// like the rest of the site. Original implementation.

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
const scale = (a: RGB, k: number): RGB => [Math.min(255, a[0] * k), Math.min(255, a[1] * k), Math.min(255, a[2] * k)];

export interface Box { left: number; top: number; right: number; bottom: number }

const C = {
  fur: [233, 118, 54] as RGB,       // orange tabby
  stripe: [160, 66, 28] as RGB,
  cream: [246, 228, 206] as RGB,
  ear: [238, 150, 140] as RGB,
  eye: [18, 14, 12] as RGB,
  eyeShine: [255, 236, 190] as RGB,
  nose: [240, 130, 130] as RGB,
  yarn: [92, 118, 255] as RGB,
  yarnHi: [170, 186, 255] as RGB,
  wall: [16, 19, 38] as RGB,
  wallDot: [86, 98, 170] as RGB,
  floor: [24, 21, 32] as RGB,
  floorLine: [96, 86, 120] as RGB,
  base: [130, 140, 205] as RGB,
  moon: [236, 232, 214] as RGB,
  night: [26, 38, 92] as RGB,
  light: [90, 104, 190] as RGB,
  wood: [120, 70, 48] as RGB,
  rug: [52, 64, 140] as RGB,
  leaf: [9, 18, 40] as RGB,
  leafEdge: [44, 66, 134] as RGB,
  shadow: [0, 0, 0] as RGB,
};

// ------------------------------------------------------------------ the cat's body

// Pose vectors, in "cat units" (1 unit = S pixels). x is forward, y is down, 0 is the floor.
// [bodyX, bodyY, tilt, bodyRx, bodyRy, headX, headY, frontFootX, frontFootY, hindFootX, hindFootY, frontHipX, frontHipY, hindHipX, hindHipY, tailAngle, tailSwing]
const POSES: Record<string, number[]> = {
  stand:  [0, -2.7, 0, 2.3, 1.0, 2.9, -3.4, 1.7, 0, -1.7, 0, 1.6, -2.2, -1.6, -2.2, 0.55, 0.3],
  sit:    [-0.7, -1.9, 1.05, 2.1, 1.1, 0.9, -4.4, 1.2, 0, 0.1, 0, 0.8, -2.6, -1.2, -0.9, -0.1, 0.12],
  crouch: [0.2, -1.55, -0.06, 2.3, 0.95, 3.1, -1.95, 2.5, 0, -1.5, 0, 1.8, -1.2, -1.7, -1.9, 0.02, 0.5],
  loaf:   [0, -0.95, 0, 2.2, 0.95, 2.3, -1.05, 1.5, 0, -0.9, 0, 1.2, -0.9, -1.0, -0.8, -0.05, 0.04],
  leap:   [0, -2.4, -0.25, 2.3, 0.95, 3.2, -2.7, 3.2, -1.2, -2.6, -0.6, 1.8, -2.0, -1.8, -2.0, 0.4, 0.1],
};
const POSE_NAMES = Object.keys(POSES);
const NP = POSES.stand.length;

type State = 'watch' | 'stalk' | 'pounce' | 'bat' | 'chase' | 'groom' | 'sleep';

interface Ball { x: number; y: number; vx: number; vy: number; r: number; spin: number }

interface Prim {
  kind: 'ell' | 'cap' | 'tri' | 'dot';
  part: 'body' | 'chest' | 'haunch' | 'head' | 'ear' | 'earIn' | 'legU' | 'legL' | 'paw' | 'tail' | 'eye' | 'shine' | 'nose';
  far: boolean;
  a: number; b: number; c: number; d: number;          // meaning depends on kind
  e: number; f: number; g: number; h: number;
  cos: number; sin: number;
  idx: number;
}

export class Room {
  width = 0; height = 0; time = 0;
  floorY = 0; S = 36;
  avoid: Box[] = [];
  pointer = { x: 0, y: 0, speed: 0, active: false };

  // cat
  x = 0; lift = 0; liftV = 0; f = 1;
  state: State = 'watch'; stateT = 0; stateDur = 2;
  speed = 0; gait = 0; pawT = -1; bats = 0; kicked = false; sleepCool = 8;
  w: Record<string, number> = { stand: 0, sit: 1, crouch: 0, loaf: 0, leap: 0 };
  pose = new Float32Array(NP);
  headTilt = 0;
  ball: Ball = { x: 0, y: 0, vx: 0, vy: 0, r: 12, spin: 0 };
  prims: Prim[] = [];
  /** Tail nodes in world px, used by the renderer. */
  tail = new Float32Array(16);

  setLayout(w: number, h: number, floorY: number) {
    const first = this.width === 0;
    this.width = w; this.height = h;
    this.floorY = floorY;
    this.S = clamp(Math.min(w * 0.034, (floorY - 90) / 6.2), 20, 44);
    this.ball.r = this.S * 0.46;
    if (first) {
      this.x = w * 0.42; this.f = 1;
      this.ball.x = w * 0.7; this.ball.y = floorY - this.ball.r;
    } else {
      this.x = clamp(this.x, Math.max(this.S * 5, w * 0.1), w - Math.max(this.S * 5, w * 0.1));
      this.ball.x = clamp(this.ball.x, 30, w - 30);
      this.ball.y = Math.min(this.ball.y, floorY - this.ball.r);
    }
  }

  /** Throw the ball in from where the visitor clicked. */
  toss(x: number, y: number) {
    const b = this.ball;
    b.x = clamp(x, this.width * 0.12, this.width * 0.88); b.y = clamp(y, 100, this.floorY - b.r);
    b.vx = rand(-140, 140); b.vy = rand(-60, 20);
    if (this.state === 'sleep' || this.state === 'groom' || this.state === 'watch') this.go('watch', 0.35);
  }

  private go(s: State, dur = 0) {
    this.state = s; this.stateT = 0; this.stateDur = dur;
    if (s === 'bat') { this.pawT = 0; this.kicked = false; }
    if (s === 'pounce') {
      const dx = this.ball.x - this.x;
      this.f = Math.sign(dx) || this.f;
      this.liftV = 560;                                   // px/s upward
      this.speed = clamp(Math.abs(dx) / 0.55, 140, 640);  // carries her to the ball
    }
  }

  step(dt: number) {
    this.time += dt;
    this.pointer.speed *= Math.exp(-8 * dt);
    this.stepBall(dt);
    this.stepCat(dt);
    this.buildPrims();
  }

  private stepBall(dt: number) {
    const b = this.ball, floor = this.floorY, m = Math.max(48, this.width * 0.09);
    b.vy += 1800 * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y + b.r >= floor) {
      b.y = floor - b.r;
      if (Math.abs(b.vy) > 140) b.vy = -b.vy * 0.5; else b.vy = 0;
      b.vx *= Math.exp(-1.6 * dt);
    }
    if (b.x < m) { b.x = m; b.vx = Math.abs(b.vx) * 0.7; }
    if (b.x > this.width - m) { b.x = this.width - m; b.vx = -Math.abs(b.vx) * 0.7; }
    if (b.y < 60) { b.y = 60; b.vy = Math.abs(b.vy) * 0.5; }
    b.spin += (b.vx / b.r) * dt;
    if (Math.abs(b.vx) < 4) b.vx = 0;
  }

  private stepCat(dt: number) {
    const S = this.S, b = this.ball;
    this.stateT += dt; this.sleepCool -= dt;
    const dx = b.x - this.x, dist = Math.abs(dx) / S;
    const ballMoving = Math.abs(b.vx) > 30 || Math.abs(b.vy) > 60;
    let target: string = 'sit', moveSpeed = 0;

    switch (this.state) {
      case 'watch': {
        target = 'sit';
        // Notices the visitor: looks over, then loses interest.
        if (this.pointer.active && this.pointer.speed > 250 && Math.abs(this.pointer.x - this.x) > S * 2) this.f = Math.sign(this.pointer.x - this.x) || this.f;
        else if (Math.abs(dx) > S * 1.5) this.f = Math.sign(dx);
        if (this.stateT > this.stateDur) {
          const r = Math.random();
          if (ballMoving || r < 0.6) this.go(dist > 5.5 ? 'stalk' : 'pounce', dist > 5.5 ? 3.5 : 0);
          else if (r < 0.82) this.go('groom', rand(3, 4.2));
          else if (this.sleepCool < 0) { this.go('sleep', rand(5, 7)); this.sleepCool = 20; }
          else this.go('stalk', 3.5);
        }
        break;
      }
      case 'stalk': {
        target = 'crouch'; moveSpeed = 0.9 * S;
        if (Math.abs(dx) > S * 0.5) this.f = Math.sign(dx);
        if (dist < 4.4 || this.stateT > this.stateDur) this.go('pounce');
        break;
      }
      case 'pounce': {
        target = 'leap';
        moveSpeed = this.speed;
        if (this.lift <= 0 && this.liftV <= 0 && this.stateT > 0.1) { this.lift = 0; this.liftV = 0; this.go('bat'); }
        break;
      }
      case 'bat': {
        target = 'stand';
        if (Math.abs(dx) > S * 0.6) this.f = Math.sign(dx);
        this.pawT += dt / 0.38;
        if (!this.kicked && this.pawT > 0.4) {
          this.kicked = true;
          if (Math.abs(b.x - (this.x + this.f * S * 2.2)) < S * 3.2 && b.y > this.floorY - S * 3.2) {
            b.vx = this.f * rand(300, 560); b.vy = -rand(260, 560);
            if (Math.random() < 0.18) b.vx *= -0.5;
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
        target = 'stand'; moveSpeed = 8.5 * S;
        if (Math.abs(dx) > S * 0.4) this.f = Math.sign(dx);
        if (dist < 2.4 && b.y > this.floorY - S * 3.2) { moveSpeed = 0; this.go('bat'); }
        else if (this.stateT > this.stateDur) this.go('watch', rand(1.5, 2.5));
        break;
      }
      case 'groom': {
        target = 'sit';
        if (this.stateT > this.stateDur) this.go('watch', rand(1.4, 2.6));
        break;
      }
      case 'sleep': {
        target = 'loaf';
        if (this.stateT > this.stateDur) this.go('watch', rand(1.2, 2));
        break;
      }
    }

    // Blend toward the target pose.
    let tot = 0;
    for (const n of POSE_NAMES) { this.w[n] += ((n === target ? 1 : 0) - this.w[n]) * Math.min(1, dt * 7); tot += this.w[n]; }
    for (let i = 0; i < NP; i++) {
      let v = 0;
      for (const n of POSE_NAMES) v += this.w[n] * POSES[n][i];
      this.pose[i] = v / (tot || 1);
    }

    // Movement along the floor.
    const wantV = this.f * moveSpeed;
    this.speed = this.state === 'pounce' ? this.speed : this.speed + (Math.abs(wantV) - this.speed) * Math.min(1, dt * 6);
    if (this.state !== 'pounce' && moveSpeed === 0) this.speed *= Math.exp(-8 * dt);
    const edge = Math.max(S * 5, this.width * 0.1);
    this.x = clamp(this.x + this.f * this.speed * dt, edge, this.width - edge);
    this.gait += dt * (this.speed / S) * 1.5;

    // Leap physics.
    if (this.lift > 0 || this.liftV > 0) {
      this.liftV -= 1800 * dt; this.lift += this.liftV * dt;
      if (this.lift <= 0) { this.lift = 0; if (this.state !== 'pounce') this.liftV = 0; }
    }

    // Head: looks down at the ball, ducks when grooming, rests when asleep.
    let ht = 0;
    if (this.state === 'groom') ht = -0.85 + Math.sin(this.time * 7) * 0.12;
    else if (this.state === 'sleep') ht = -0.5;
    else if (b.y < this.floorY - S * 2) ht = 0.15; else ht = -0.2;
    this.headTilt += (ht - this.headTilt) * Math.min(1, dt * 6);
  }

  // --------------------------------------------------------------- skeleton -> shapes

  private wx(lx: number) { return this.x + this.f * lx * this.S; }
  private wy(ly: number) { return this.floorY + ly * this.S - this.lift; }

  private ell(part: Prim['part'], cx: number, cy: number, rx: number, ry: number, ang: number, far = false, idx = 0) {
    this.prims.push({ kind: 'ell', part, far, a: cx, b: cy, c: rx, d: ry, e: 0, f: 0, g: 0, h: 0, cos: Math.cos(ang), sin: Math.sin(ang), idx });
  }
  private cap(part: Prim['part'], ax: number, ay: number, bx: number, by: number, r0: number, r1: number, far = false, idx = 0) {
    this.prims.push({ kind: 'cap', part, far, a: ax, b: ay, c: bx, d: by, e: r0, f: r1, g: 0, h: 0, cos: 1, sin: 0, idx });
  }
  private tri(part: Prim['part'], ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
    this.prims.push({ kind: 'tri', part, far: false, a: ax, b: ay, c: bx, d: by, e: cx, f: cy, g: 0, h: 0, cos: 1, sin: 0, idx: 0 });
  }
  private dot(part: Prim['part'], cx: number, cy: number, r: number) {
    this.prims.push({ kind: 'dot', part, far: false, a: cx, b: cy, c: r, d: 0, e: 0, f: 0, g: 0, h: 0, cos: 1, sin: 0, idx: 0 });
  }

  /** Two-bone leg from hip to foot; the knee bends forward (hind) or back (front). */
  private leg(hx: number, hy: number, fx: number, fy: number, kneeForward: boolean, far: boolean, idx: number) {
    const S = this.S, l1 = 1.25 * S, l2 = 1.25 * S;
    const ax = this.wx(hx), ay = this.wy(hy), bx = this.wx(fx), by = this.wy(fy);
    let dx = bx - ax, dy = by - ay;
    let d = Math.hypot(dx, dy) || 1;
    const maxD = l1 + l2 - 1;
    if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const ux = dx / d, uy = dy / d;
    let px = -uy, py = ux;
    const want = (kneeForward ? 1 : -1) * this.f;
    if (px * want < 0) { px = -px; py = -py; }
    const kx = ax + ux * a + px * h, ky = ay + uy * a + py * h;
    const ex = ax + dx, ey = ay + dy;
    this.cap('legU', ax, ay, kx, ky, S * 0.42, S * 0.3, far, idx);
    this.cap('legL', kx, ky, ex, ey, S * 0.3, S * 0.24, far, idx);
    this.dot('paw', ex + this.f * S * 0.16, ey - S * 0.04, S * 0.36);
    this.prims[this.prims.length - 1].far = far;
  }

  private buildPrims() {
    const S = this.S, P = this.pose, t = this.time;
    this.prims.length = 0;
    const bx = P[0], by = P[1], tilt = P[2], rx = P[3], ry = P[4];
    const hx = P[5], hy = P[6];
    const cx = this.wx(bx), cy = this.wy(by);
    const bodyAng = Math.atan2(-Math.sin(tilt), this.f * Math.cos(tilt)); // world angle of the body's long axis

    // --- gait: feet swing while moving, plant when still
    const stride = clamp(this.speed / (7 * S), 0, 1) * 1.15 * (1 - this.w.leap);
    const lift = (ph: number) => Math.max(0, Math.cos(ph)) * 0.7 * clamp(this.speed / (4 * S), 0, 1);
    const g = this.gait * TAU;
    let ffx = P[7], ffy = P[8], hfx = P[9], hfy = P[10];
    const nf = [ffx + stride * Math.sin(g), ffy - lift(g)];
    const nh = [hfx + stride * Math.sin(g + Math.PI), hfy - lift(g + Math.PI)];
    const ff = [ffx - 0.5 + stride * Math.sin(g + Math.PI), ffy - lift(g + Math.PI)];
    const hf = [hfx + 0.5 + stride * Math.sin(g), hfy - lift(g)];
    // A swipe with the near front paw.
    if (this.pawT >= 0 && this.pawT <= 1) {
      const k = Math.sin(this.pawT * Math.PI);
      nf[0] = ffx + 1.4 * k; nf[1] = ffy - 1.6 * k;
    }

    // --- tail (behind the body)
    const tailBaseX = bx - Math.cos(tilt) * rx * 0.85, tailBaseY = by + Math.sin(tilt) * rx * 0.85 - 0.15;
    const NT = 7, seg = 0.5;
    let tx = tailBaseX, ty = tailBaseY;
    for (let k = 0; k < NT; k++) {
      const u = k / (NT - 1);
      const ang = P[15] + 0.1 * k * (P[15] > 0.3 ? 1 : 0) + P[16] * Math.sin(t * 2.3 - k * 0.55) * (0.3 + u);
      const nx = tx - Math.cos(ang) * seg, ny = ty - Math.sin(ang) * seg;
      this.cap('tail', this.wx(tx), this.wy(ty), this.wx(nx), this.wy(ny), S * (0.3 - 0.07 * u), S * (0.3 - 0.07 * (u + 1 / (NT - 1))), false, k);
      tx = nx; ty = ny;
    }

    // --- far legs, then body, then near legs
    this.leg(P[13] + 0.4, P[14], hf[0], hf[1], true, true, 0);
    this.leg(P[11] - 0.3, P[12], ff[0], ff[1], false, true, 1);
    this.ell('body', cx, cy, rx * S, ry * S, bodyAng, false, 0);
    this.ell('haunch', this.wx(P[13] + 0.3), this.wy(P[14] + 0.2), 1.15 * S, 1.05 * S, 0, false, 0);
    this.ell('chest', this.wx(P[11]), this.wy(P[12] - 0.1), 1.0 * S, 1.0 * S, 0, false, 0);
    this.leg(P[13], P[14], nh[0], nh[1], true, false, 2);
    this.leg(P[11], P[12], nf[0], nf[1], false, false, 3);

    // --- head, ears, face
    const hcx = this.wx(hx), hcy = this.wy(hy);
    const ht = this.headTilt;
    const hc = Math.cos(ht), hs = Math.sin(ht);
    const toW = (lx: number, ly: number) => {
      // head-local (forward, down) in units, rotated by the head tilt (nose up positive)
      const rxp = lx * hc + ly * hs, ryp = -lx * hs + ly * hc;
      return [hcx + this.f * rxp * S, hcy + ryp * S];
    };
    // neck
    this.cap('head', this.wx((bx + P[11]) / 2 + 0.6), this.wy(by - 0.3), hcx, hcy, 0.85 * S, 0.8 * S);
    this.ell('head', hcx, hcy, 1.12 * S, 0.95 * S, 0);
    const [e1ax, e1ay] = toW(-0.55, -0.55), [e1bx, e1by] = toW(-0.7, -1.75), [e1cx, e1cy] = toW(0.1, -0.7);
    const [e2ax, e2ay] = toW(0.0, -0.7), [e2bx, e2by] = toW(0.05, -1.8), [e2cx, e2cy] = toW(0.7, -0.5);
    this.tri('ear', e1ax, e1ay, e1bx, e1by, e1cx, e1cy);
    this.tri('ear', e2ax, e2ay, e2bx, e2by, e2cx, e2cy);
    const [i1ax, i1ay] = toW(-0.5, -0.7), [i1bx, i1by] = toW(-0.62, -1.45), [i1cx, i1cy] = toW(-0.05, -0.75);
    this.tri('earIn', i1ax, i1ay, i1bx, i1by, i1cx, i1cy);
    const [i2ax, i2ay] = toW(0.05, -0.75), [i2bx, i2by] = toW(0.08, -1.5), [i2cx, i2cy] = toW(0.58, -0.6);
    this.tri('earIn', i2ax, i2ay, i2bx, i2by, i2cx, i2cy);
    const sleeping = this.w.loaf > 0.6;
    const [ex, ey] = toW(0.5, -0.1);
    if (sleeping) this.cap('eye', ex - S * 0.2, ey, ex + S * 0.2, ey, S * 0.07, S * 0.07);
    else { this.dot('eye', ex, ey, S * 0.2); this.dot('shine', ex + this.f * S * 0.06, ey - S * 0.07, S * 0.07); }
    const [nx2, ny2] = toW(1.08, 0.12);
    this.dot('nose', nx2, ny2, S * 0.13);
  }

  // --------------------------------------------------------------- sampling

  /** Topmost cat shape at a point, or null. Writes the lighting into `out`. */
  hitCat(px: number, py: number, out: { prim: Prim; u: number; v: number } | null): Prim | null {
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
        const dd = Math.hypot(px - p.a - ex * t, py - p.b - ey * t), r = p.e + (p.f - p.e) * t;
        inside = dd <= r; u = t; v = (ex * (py - p.b) - ey * (px - p.a)) / (Math.sqrt(l2) * (r || 1));
      } else if (p.kind === 'tri') {
        const d1 = (px - p.c) * (p.b - p.d) - (p.a - p.c) * (py - p.d);
        const d2 = (px - p.e) * (p.d - p.f) - (p.c - p.e) * (py - p.f);
        const d3 = (px - p.a) * (p.f - p.b) - (p.e - p.a) * (py - p.b);
        inside = !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
      } else {
        inside = Math.hypot(px - p.a, py - p.b) <= p.c;
        v = (py - p.b) / (p.c || 1);
      }
      if (inside) { if (out) { out.prim = p; out.u = u; out.v = v; } return p; }
    }
    return null;
  }

  furColor(p: Prim, px: number, py: number, u: number, v: number, time: number): RGB {
    void time;
    switch (p.part) {
      case 'eye': return C.eye;
      case 'shine': return C.eyeShine;
      case 'nose': return C.nose;
      case 'earIn': return C.ear;
      case 'paw': return C.cream;
      case 'legL': return mix(C.fur, C.cream, 0.75);
      case 'chest': return v > -0.1 && u > 0.1 ? C.cream : C.fur;
      case 'head': {
        // cream muzzle on the front of the face
        const rel = (px - p.a) * this.f / (p.c || 1);
        return rel > 0.45 && py > p.b - 2 ? C.cream : (Math.sin(px * 0.19 + py * 0.11) > 0.9 ? C.stripe : C.fur);
      }
      case 'ear': return C.fur;
      case 'tail': return p.idx >= 6 || Math.sin(p.idx * 2.6 + 0.4) > 0.6 ? C.stripe : C.fur;
      case 'body': case 'haunch': {
        if (v > 0.55) return C.cream;                          // belly
        if (Math.sin(u * 7.5 + p.idx) > 0.55 && v < 0.35) return C.stripe; // back stripes
        return C.fur;
      }
      default: return C.fur;
    }
  }
}

// ------------------------------------------------------------------ renderer

const RAMP = '.:+oO0@';

export class RoomRenderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1; cw = 8; ch = 10; cols = 0; rows = 0;
  // cat + ball layer (rebuilt each frame)
  private glyph = new Uint16Array(0); private color = new Uint32Array(0); private alpha = new Float32Array(0);
  private tile = new Uint32Array(0); private tileA = new Float32Array(0); private shadow = new Uint8Array(0);
  // static scenery, rebuilt on resize
  private bgGlyph = new Uint16Array(0); private bgColor = new Uint32Array(0); private bgAlpha = new Float32Array(0);
  private bgTile = new Uint32Array(0); private bgTileA = new Float32Array(0);
  private fgGlyph = new Uint16Array(0); private fgColor = new Uint32Array(0); private fgAlpha = new Float32Array(0);
  private fgTile = new Uint32Array(0); private fgTileA = new Float32Array(0);
  private dim = new Float32Array(0);
  private vig = new Float32Array(0);
  private styles = new Map<number, string>();
  private fontFamily = '"IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace';
  private hitOut = { prim: null as unknown as Prim, u: 0, v: 0 };
  // The room never changes between frames, so it is drawn once into these and just copied each frame.
  private bgCache: HTMLCanvasElement | null = null; private fgCache: HTMLCanvasElement | null = null;
  private dimSig = '';

  constructor(canvas: HTMLCanvasElement) {
    const c = canvas.getContext('2d');
    if (!c) throw new Error('2D canvas unavailable');
    this.ctx = c;
  }

  private pack = (c: RGB) => ((c[0] | 0) << 16) | ((c[1] | 0) << 8) | (c[2] | 0);
  private css(rgb: number) { let s = this.styles.get(rgb); if (!s) { s = `rgb(${rgb >>> 16},${(rgb >>> 8) & 255},${rgb & 255})`; this.styles.set(rgb, s); } return s; }

  resize(w: number, h: number, dpr: number, room: Room) {
    this.dpr = dpr;
    this.cw = clamp(Math.round(w / 190), 7, 10);
    this.ch = this.cw + 2;
    this.cols = Math.ceil(w / this.cw); this.rows = Math.ceil(h / this.ch);
    this.ctx.canvas.width = Math.round(w * dpr); this.ctx.canvas.height = Math.round(h * dpr);
    const n = this.cols * this.rows;
    this.glyph = new Uint16Array(n); this.color = new Uint32Array(n); this.alpha = new Float32Array(n);
    this.tile = new Uint32Array(n); this.tileA = new Float32Array(n); this.shadow = new Uint8Array(n);
    this.bgGlyph = new Uint16Array(n); this.bgColor = new Uint32Array(n); this.bgAlpha = new Float32Array(n);
    this.bgTile = new Uint32Array(n); this.bgTileA = new Float32Array(n);
    this.fgGlyph = new Uint16Array(n); this.fgColor = new Uint32Array(n); this.fgAlpha = new Float32Array(n);
    this.fgTile = new Uint32Array(n); this.fgTileA = new Float32Array(n);
    this.dim = new Float32Array(n).fill(1); this.vig = new Float32Array(n).fill(1);
    this.buildScenery(room);
    this.dimSig = '';
    this.bake();
  }

  private newLayer(): HTMLCanvasElement {
    const el = document.createElement('canvas');
    el.width = this.ctx.canvas.width; el.height = this.ctx.canvas.height;
    return el;
  }
  private prepare(ctx: CanvasRenderingContext2D) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = `500 ${Math.round(0.72 * this.ch)}px ${this.fontFamily}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  }
  /** Draw the room and the foreground plant once. Called again only if the text moves. */
  private bake() {
    if (!this.cols) return;
    this.bgCache = this.bgCache && this.bgCache.width === this.ctx.canvas.width && this.bgCache.height === this.ctx.canvas.height ? this.bgCache : this.newLayer();
    this.fgCache = this.fgCache && this.fgCache.width === this.ctx.canvas.width && this.fgCache.height === this.ctx.canvas.height ? this.fgCache : this.newLayer();
    const bg = this.bgCache.getContext('2d'), fg = this.fgCache.getContext('2d');
    if (!bg || !fg) return;
    this.prepare(bg); this.prepare(fg);
    this.drawLayer(bg, this.bgTile, this.bgTileA, this.bgGlyph, this.bgColor, this.bgAlpha, true);
    this.drawLayer(fg, this.fgTile, this.fgTileA, this.fgGlyph, this.fgColor, this.fgAlpha, false);
  }

  /** Fade the room near text so words stay readable. */
  setDimBoxes(boxes: Box[]) {
    const sig = boxes.map((b) => [b.left, b.top, b.right, b.bottom].map(Math.round).join(',')).join('|');
    if (sig === this.dimSig) return;
    this.dimSig = sig;
    const { cols, rows, cw, ch, dim } = this;
    dim.fill(1);
    const pad = 6 * cw;
    for (const b of boxes) {
      const c0 = Math.max(0, Math.floor((b.left - pad) / cw)), c1 = Math.min(cols - 1, Math.floor((b.right + pad) / cw));
      const r0 = Math.max(0, Math.floor((b.top - pad) / ch)), r1 = Math.min(rows - 1, Math.floor((b.bottom + pad) / ch));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const x = c * cw + cw / 2, y = r * ch + ch / 2;
        const d = Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));
        const i = r * cols + c;
        dim[i] = Math.min(dim[i], 0.3 + 0.7 * smooth(0, pad, d));
      }
    }
    this.bake();
  }

  private px(i: number, ch: string, rgb: RGB, a: number, layer: 'bg' | 'fg') {
    if (layer === 'bg') { this.bgGlyph[i] = ch.charCodeAt(0); this.bgColor[i] = this.pack(rgb); this.bgAlpha[i] = a; }
    else { this.fgGlyph[i] = ch.charCodeAt(0); this.fgColor[i] = this.pack(rgb); this.fgAlpha[i] = a; }
  }
  private tileAt(i: number, rgb: RGB, a: number, layer: 'bg' | 'fg') {
    if (layer === 'bg') { this.bgTile[i] = this.pack(rgb); this.bgTileA[i] = a; } else { this.fgTile[i] = this.pack(rgb); this.fgTileA[i] = a; }
  }

  // ------------------------------------------------------------- the room itself
  private buildScenery(room: Room) {
    const { cols, rows, cw, ch } = this;
    const W = room.width, H = room.height, floorY = room.floorY;
    this.bgGlyph.fill(0); this.bgTileA.fill(0); this.fgGlyph.fill(0); this.fgTileA.fill(0);
    const floorRow = Math.round(floorY / ch);
    const X = (c: number) => c * cw + cw / 2, Y = (r: number) => r * ch + ch / 2;

    // vignette: the corners fall away into shadow
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = X(c), y = Y(r);
      this.vig[r * cols + c] = smooth(0, W * 0.1, x) * smooth(0, W * 0.1, W - x) * (0.4 + 0.6 * smooth(40, 120, y));
    }

    // wall + floor
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (r < floorRow) {
        this.tileAt(i, C.wall, 0.62, 'bg');
        if (hash(c, r, 5) < 0.045) this.px(i, '.', C.wallDot, 0.28, 'bg');
      } else {
        this.tileAt(i, C.floor, 0.55, 'bg');
        if ((r - floorRow) % 3 === 1) this.px(i, '-', C.floorLine, 0.14, 'bg');
      }
    }
    // baseboard
    for (let c = 0; c < cols; c++) { const i = (floorRow - 1) * cols + c; if (floorRow - 1 >= 0) { this.px(i, '=', C.base, 0.5, 'bg'); this.tileAt(i, C.base, 0.12, 'bg'); } }

    // window with a moon and a shaft of moonlight
    const winW = clamp(W * 0.13, 110, 230), winH = clamp(floorY * 0.5, 120, 260);
    const winX = (W < 700 ? 0.68 : 0.66) * W - winW / 2, winY = Math.max(70, floorY * 0.2);
    const wc0 = Math.floor(winX / cw), wc1 = Math.floor((winX + winW) / cw), wr0 = Math.floor(winY / ch), wr1 = Math.floor((winY + winH) / ch);
    for (let r = wr0; r <= wr1; r++) for (let c = wc0; c <= wc1; c++) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      const i = r * cols + c, edge = r === wr0 || r === wr1 || c === wc0 || c === wc1;
      const mid = c === Math.floor((wc0 + wc1) / 2) || r === Math.floor((wr0 + wr1) / 2);
      if (edge) { this.px(i, '#', C.base, 0.6, 'bg'); this.tileAt(i, C.base, 0.2, 'bg'); }
      else if (mid) { this.px(i, '+', C.base, 0.35, 'bg'); this.tileAt(i, C.night, 0.8, 'bg'); }
      else this.tileAt(i, C.night, 0.85, 'bg');
    }
    // the moon
    const mcx = winX + winW * 0.34, mcy = winY + winH * 0.3, mr = Math.min(winW, winH) * 0.24;
    for (let r = wr0; r <= wr1; r++) for (let c = wc0; c <= wc1; c++) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      const d = Math.hypot(X(c) - mcx, Y(r) - mcy);
      if (d <= mr) { const i = r * cols + c; this.px(i, d < mr * 0.6 ? 'O' : 'o', C.moon, 0.95, 'bg'); this.tileAt(i, C.moon, 0.5, 'bg'); }
    }
    // moonlight on the floor, falling away from the window
    const lx0 = winX - W * 0.02, lw = winW * 1.25;
    for (let r = floorRow; r < Math.min(rows, floorRow + Math.round(H * 0.4 / ch)); r++) {
      const k = (r - floorRow) / Math.max(1, (H - floorY) / ch);
      const shift = k * W * 0.12, wdt = lw * (1 - 0.3 * Math.min(1, k * 2));
      for (let c = Math.floor((lx0 - shift) / cw); c <= Math.floor((lx0 - shift + wdt) / cw); c++) {
        if (c < 0 || c >= cols) continue;
        const i = r * cols + c, fade = 1 - Math.min(1, k * 1.6);
        if (fade < 0.05) continue;
        this.tileAt(i, mix(C.floor, C.light, 0.5), 0.16 * fade + 0.5 * (1 - fade) * 0, 'bg');
        if (hash(c, r, 9) < 0.3) this.px(i, '.', C.light, 0.3 * fade, 'bg');
      }
    }

    // a shelf with books and a small plant
    const shX = W * 0.2, shW = clamp(W * 0.16, 100, 260), shY = Math.max(110, floorY * 0.46);
    const shRow = Math.round(shY / ch);
    for (let c = Math.floor(shX / cw); c <= Math.floor((shX + shW) / cw); c++) { if (c >= 0 && c < cols) { const i = shRow * cols + c; this.px(i, '=', C.wood, 0.85, 'bg'); this.tileAt(i, C.wood, 0.4, 'bg'); } }
    let bx = shX + cw;
    for (let k = 0; bx < shX + shW * 0.62; k++) {
      const bw = Math.max(1, Math.round(rand01(k, 1) * 1.4 + 1)), bh = Math.round(3 + rand01(k, 2) * 3);
      const col: RGB = k % 3 === 0 ? C.fur : k % 3 === 1 ? C.rug : C.cream;
      for (let c = 0; c < bw; c++) for (let r = 0; r < bh; r++) {
        const cc = Math.floor(bx / cw) + c, rr = shRow - 1 - r;
        if (cc < 0 || cc >= cols || rr < 0) continue;
        const i = rr * cols + cc; this.tileAt(i, col, 0.5, 'bg'); this.px(i, c === 0 ? '|' : ' ', scale(col, 1.3), 0.7, 'bg');
      }
      bx += (bw + 0.2) * cw;
    }
    // tiny plant on the shelf
    const ppx = Math.floor((shX + shW * 0.8) / cw);
    for (let k = 0; k < 4; k++) { const rr = shRow - 1 - k; if (rr >= 0 && ppx < cols) { this.px(rr * cols + ppx, k === 3 ? 'Y' : '|', C.leafEdge, 0.7, 'bg'); } }
    if (shRow - 1 >= 0) { const i = (shRow - 1) * cols + ppx; this.tileAt(i, C.wood, 0.55, 'bg'); }

    // a framed picture (skipped on narrow screens, where it would crowd the window)
    if (W >= 700) {
    const fx = W * 0.44, fy = Math.max(100, floorY * 0.22), fw = clamp(W * 0.06, 50, 100), fh = fw * 0.8;
    for (let r = Math.floor(fy / ch); r <= Math.floor((fy + fh) / ch); r++) for (let c = Math.floor(fx / cw); c <= Math.floor((fx + fw) / cw); c++) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      const i = r * cols + c, edge = r === Math.floor(fy / ch) || r === Math.floor((fy + fh) / ch) || c === Math.floor(fx / cw) || c === Math.floor((fx + fw) / cw);
      if (edge) { this.px(i, '#', C.wood, 0.8, 'bg'); this.tileAt(i, C.wood, 0.4, 'bg'); }
      else { this.tileAt(i, C.night, 0.55, 'bg'); if (hash(c, r, 3) < 0.25) this.px(i, '~', C.wallDot, 0.5, 'bg'); }
    }
    }

    // a rug under the play area
    const rugCx = W * 0.5, rugRx = W * 0.26, rugCy = floorY + Math.min(H - floorY, 120) * 0.38, rugRy = Math.min(H - floorY, 120) * 0.34;
    for (let r = Math.floor((rugCy - rugRy) / ch); r <= Math.floor((rugCy + rugRy) / ch); r++) for (let c = Math.floor((rugCx - rugRx) / cw); c <= Math.floor((rugCx + rugRx) / cw); c++) {
      if (r < floorRow || r >= rows || c < 0 || c >= cols) continue;
      const q = ((X(c) - rugCx) / rugRx) ** 2 + ((Y(r) - rugCy) / rugRy) ** 2;
      if (q <= 1) { const i = r * cols + c; this.tileAt(i, C.rug, 0.3, 'bg'); if (q > 0.78) this.px(i, ':', C.rug, 0.55, 'bg'); else if (hash(c, r, 12) < 0.12) this.px(i, '+', C.rug, 0.3, 'bg'); }
    }

    // foreground: leaves of a big plant, as if we are hiding behind it at the edge of the room
    const leaf = (bx0: number, by0: number, len: number, ang: number, wdt: number) => {
      for (let t = 0; t <= 1; t += 0.02) {
        const cx = bx0 + Math.cos(ang) * len * t, cy = by0 - Math.sin(ang) * len * t - Math.sin(t * Math.PI) * len * 0.12;
        const w2 = wdt * Math.sin(Math.PI * Math.min(1, t * 1.05)) + 1;
        for (let dy = -w2; dy <= w2; dy += ch * 0.7) for (let dx = -w2; dx <= w2; dx += cw * 0.7) {
          if (Math.hypot(dx, dy) > w2) continue;
          const c = Math.floor((cx + dx) / cw), r = Math.floor((cy + dy) / ch);
          if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
          const i = r * cols + c;
          this.tileAt(i, C.leaf, 0.92, 'fg');
          const rim = Math.hypot(dx, dy) > w2 * 0.72;
          this.px(i, rim ? (Math.abs(dx) > Math.abs(dy) ? '|' : '-') : (hash(c, r, 21) < 0.2 ? '.' : ' '), C.leafEdge, rim ? 0.45 : 0.22, 'fg');
        }
      }
    };
    const pw = Math.min(W * 0.17, 230);
    const baseY = floorY + 36;
    leaf(-pw * 0.1, baseY, pw * 1.7, 1.12, pw * 0.15);
    leaf(-pw * 0.05, baseY, pw * 2.0, 0.72, pw * 0.14);
    leaf(pw * 0.1, baseY + 4, pw * 1.5, 1.32, pw * 0.12);
  }

  // ------------------------------------------------------------- drawing

  render(room: Room) {
    const { ctx, cols } = this;
    if (!cols) return;
    this.glyph.fill(0); this.tileA.fill(0); this.shadow.fill(0);
    this.rasterBall(room);
    this.rasterCat(room);

    this.prepare(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.bgCache) ctx.drawImage(this.bgCache, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // shadow under the cat and the ball
    ctx.fillStyle = '#000';
    for (let i = 0; i < this.shadow.length; i++) if (this.shadow[i] && !this.glyph[i]) { ctx.globalAlpha = 0.28 * this.dim[i] * this.vig[i]; ctx.fillRect((i % cols) * this.cw, ((i / cols) | 0) * this.ch, this.cw, this.ch); }
    this.drawLayer(ctx, this.tile, this.tileA, this.glyph, this.color, this.alpha, true);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    if (this.fgCache) ctx.drawImage(this.fgCache, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
  }

  private drawLayer(ctx: CanvasRenderingContext2D, tile: Uint32Array, tileA: Float32Array, glyph: Uint16Array, color: Uint32Array, alpha: Float32Array, shade: boolean) {
    const { cw, ch, cols } = this;
    for (let i = 0; i < glyph.length; i++) {
      const ta = tileA[i], g = glyph[i];
      if (!ta && !g) continue;
      const k = shade ? this.dim[i] * this.vig[i] : 1;
      const x = (i % cols) * cw, y = ((i / cols) | 0) * ch;
      if (ta > 0) { ctx.globalAlpha = ta * k; ctx.fillStyle = this.css(tile[i]); ctx.fillRect(x, y, cw, ch); }
      if (g && g !== 32) { ctx.globalAlpha = alpha[i] * k; ctx.fillStyle = this.css(color[i]); ctx.fillText(String.fromCharCode(g), x + cw / 2, y + ch / 2 + 1); }
    }
  }

  private rasterBall(room: Room) {
    const b = room.ball, { cw, ch, cols, rows } = this;
    const r0 = Math.floor((b.y - b.r) / ch), r1 = Math.floor((b.y + b.r) / ch), c0 = Math.floor((b.x - b.r) / cw), c1 = Math.floor((b.x + b.r) / cw);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      const dx = c * cw + cw / 2 - b.x, dy = r * ch + ch / 2 - b.y, d = Math.hypot(dx, dy);
      if (d > b.r) continue;
      const i = r * cols + c;
      // yarn: wound bands that roll with the ball
      const band = Math.sin((dx * Math.cos(b.spin) + dy * Math.sin(b.spin)) * 0.5 + b.spin * 3) > 0.2;
      const lit = clamp(0.55 + (-dy / b.r) * 0.3 - (dx / b.r) * 0.1, 0.3, 1);
      const col = scale(band ? C.yarn : C.yarnHi, lit);
      this.glyph[i] = (d > b.r * 0.7 ? '+' : band ? '@' : 'o').charCodeAt(0);
      this.color[i] = this.pack(scale(C.cream, 0.95)); this.alpha[i] = 0.95;
      this.tile[i] = this.pack(col); this.tileA[i] = 0.85;
      this.shadow[Math.min(this.shadow.length - 1, (Math.floor((b.y + b.r + 4) / ch)) * cols + c)] = 1;
    }
  }

  private rasterCat(room: Room) {
    const { cw, ch, cols, rows } = this;
    const prims = room.prims;
    if (!prims.length) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of prims) {
      const m = p.kind === 'ell' ? Math.max(p.c, p.d) : p.kind === 'dot' ? p.c : p.kind === 'cap' ? Math.max(p.e, p.f) : 0;
      const xs = p.kind === 'cap' ? [p.a, p.c] : p.kind === 'tri' ? [p.a, p.c, p.e] : [p.a];
      const ys = p.kind === 'cap' ? [p.b, p.d] : p.kind === 'tri' ? [p.b, p.d, p.f] : [p.b];
      for (const x of xs) { minX = Math.min(minX, x - m); maxX = Math.max(maxX, x + m); }
      for (const y of ys) { minY = Math.min(minY, y - m); maxY = Math.max(maxY, y + m); }
    }
    const c0 = Math.max(0, Math.floor(minX / cw)), c1 = Math.min(cols - 1, Math.floor(maxX / cw));
    const r0 = Math.max(0, Math.floor(minY / ch)), r1 = Math.min(rows - 1, Math.floor(maxY / ch));
    const ox = 0.42 * cw, oy = 0.42 * ch;
    const out = this.hitOut;

    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = c * cw + cw / 2, py = r * ch + ch / 2;
      const centre = room.hitCat(px, py, out);
      let inside = 0, nx = 0, ny = 0;
      for (let q = 0; q < 4; q++) {
        const sx = q & 1 ? 1 : -1, sy = q & 2 ? 1 : -1;
        if (room.hitCat(px + sx * ox, py + sy * oy, null)) inside++; else { nx += sx; ny += sy; }
      }
      if (!centre && inside < 3) continue;
      const i = r * cols + c;
      let prim = centre, u = out.u, v = out.v;
      if (!centre) { prim = room.hitCat(px + ox * Math.sign(-nx || 1), py + oy * Math.sign(-ny || 1), out); u = out.u; v = out.v; }
      if (!prim) continue;
      const edge = !centre || inside < 4;
      const col = room.furColor(prim, px, py, u, v, room.time);
      const lit = clamp(0.78 + 0.28 * (-(py - prim.b) / (Math.max(prim.c, prim.d, prim.e) || 30)) , 0.55, 1.1);
      const shaded = scale(col, prim.far ? lit * 0.62 : lit);
      if (prim.part === 'eye' || prim.part === 'shine' || prim.part === 'nose') {
        this.glyph[i] = (prim.part === 'eye' ? 'O' : prim.part === 'shine' ? '.' : '.').charCodeAt(0);
        this.color[i] = this.pack(prim.part === 'eye' ? C.eyeShine : col); this.alpha[i] = 1;
        this.tile[i] = this.pack(col); this.tileA[i] = 0.95; continue;
      }
      if (edge) {
        // an outline that follows the silhouette
        const tx = -ny, ty = nx;
        const g = Math.abs(ty) < Math.abs(tx) * 0.4 ? '-' : Math.abs(tx) < Math.abs(ty) * 0.4 ? '|' : (tx * ty > 0 ? '\\' : '/');
        this.glyph[i] = (nx === 0 && ny === 0 ? '.' : g).charCodeAt(0);
        this.color[i] = this.pack(prim.far ? scale(C.cream, 0.6) : scale(mix(col, C.cream, 0.55), 1.05)); this.alpha[i] = 0.95;
        this.tile[i] = this.pack(scaled(shaded, 0.55)); this.tileA[i] = prim.far ? 0.7 : 0.85;
      } else {
        const t = clamp(lit * 0.8 + ((hash(c, r, 33) * 3) | 0) * 0.04, 0, 0.99);
        this.glyph[i] = RAMP[clamp(Math.round(t * (RAMP.length - 1)), 0, RAMP.length - 1)].charCodeAt(0);
        this.color[i] = this.pack(scale(mix(col, C.cream, 0.18), prim.far ? 0.7 : 1));
        this.alpha[i] = prim.far ? 0.8 : 0.95;
        this.tile[i] = this.pack(shaded); this.tileA[i] = prim.far ? 0.8 : 0.92;
      }
      // a soft shadow on the floor under the cat
      if (!prim.far && py > room.floorY - 6) { /* feet touch the floor */ }
    }
    // floor shadow under the cat (a flat strip)
    const sy = Math.floor((room.floorY + 4) / ch);
    for (let c = c0; c <= c1; c++) { if (sy >= 0 && sy < rows) this.shadow[sy * cols + c] = 1; }
  }
}

function rand01(a: number, b: number) { return hash(a, b, 77); }
function scaled(c: RGB, k: number): RGB { return [c[0] * k, c[1] * k, c[2] * k]; }
