import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from '@phosphor-icons/react';
import { Pond, PondRenderer, type Box } from './pond/engine';
import { email } from '../data';
import { useMotion } from '../motion';

const QUOTE = ['observe first,', 'then design'];
const STEP = 1 / 60;

// Types the quote once, then leaves a blinking cursor. Static under reduced motion.
function Quote() {
  const full = QUOTE.join('\n');
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(full.length); return; }
    let i = 0;
    const id = window.setInterval(() => { i += 1; setN(i); if (i >= full.length) window.clearInterval(id); }, 55);
    return () => window.clearInterval(id);
  }, [full]);
  const shown = full.slice(0, n).split('\n');
  return (
    <blockquote className="pond-quote mono" data-koi-avoid aria-label={QUOTE.join(' ')}>
      <span aria-hidden="true">
        {shown.map((line, i) => <span key={i}>{line}{i < shown.length - 1 && <br />}</span>)}
        <i className="pond-cursor" />
      </span>
    </blockquote>
  );
}

export default function PondHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // Honours the site's Motion switch as well as the system setting (the provider merges both).
  const { enabled: motionOn } = useMotion();

  useEffect(() => {
    const canvas = canvasRef.current, section = sectionRef.current;
    if (!canvas || !section) return;
    const pond = new Pond();
    let renderer: PondRenderer;
    try { renderer = new PondRenderer(canvas); } catch { return; }
    let raf = 0, last = 0, acc = 0, frames = 0, visible = true, lastPtr = 0;

    const measure = () => {
      const r = canvas.getBoundingClientRect();
      const boxes: Box[] = [];
      section.querySelectorAll<HTMLElement>('[data-koi-avoid]').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width > 0 && b.height > 0) boxes.push({ left: b.left - r.left, top: b.top - r.top, right: b.right - r.left, bottom: b.bottom - r.top });
      });
      // Merge boxes that nearly touch so fish don't thread the gaps between lines.
      const merged: Box[] = [];
      for (const b of boxes.sort((a, c) => a.top - c.top)) {
        const m = merged.find((e) => b.top - e.bottom < 160 && b.left - e.right < 160 && e.left - b.right < 160);
        if (m) { m.left = Math.min(m.left, b.left); m.right = Math.max(m.right, b.right); m.bottom = Math.max(m.bottom, b.bottom); }
        else merged.push({ ...b });
      }
      renderer.setDimBoxes(merged); pond.avoid = merged;
    };
    const drawStill = () => {
      if (pond.time < 4) for (let i = 0; i < 242; i++) pond.step(STEP);
      measure(); renderer.render(pond, STEP);
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      // Cap total canvas pixels (~4MP) as well as DPR so 4K screens stay smooth.
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4e6 / (r.width * r.height))));
      renderer.resize(r.width, r.height, dpr);
      pond.resize(r.width, r.height);
      measure();
      if (!motionOn) drawStill();
    };
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now; acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 4) { pond.step(STEP); acc -= STEP; steps++; }
      if (steps === 4) acc = 0;
      if (++frames % 30 === 0) measure();
      renderer.render(pond, dt);
      raf = requestAnimationFrame(frame);
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      if (!visible) return;
      if (!motionOn) { drawStill(); return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    };
    const local = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= r.width && y <= r.height };
    };
    const onMove = (e: PointerEvent) => {
      const { x, y, inside } = local(e), p = pond.pointer;
      const dt = Math.max(1, e.timeStamp - lastPtr) / 1000;
      p.speed += (Math.min(Math.hypot(x - p.x, y - p.y) / dt, 5000) - p.speed) * 0.5;
      lastPtr = e.timeStamp; p.x = x; p.y = y; p.active = inside && e.pointerType !== 'touch';
    };
    const onClick = (e: MouseEvent) => {
      if (!motionOn) return;
      const t = e.target as Element | null;
      // Only clicks on the pond itself feed it: not the nav, links, or anything outside this section.
      if (!t || !section.contains(t)) return;
      if (t.closest('a, button, input, textarea, select, label, header, nav, [role="button"], [data-koi-ignore]')) return;
      if (window.getSelection()?.toString()) return;
      const { x, y, inside } = local(e);
      if (inside) pond.feed(x, y);
    };
    const onLeave = () => { pond.pointer.active = false; pond.pointer.speed = 0; };

    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; schedule(); }); io.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('click', onClick);
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    // The webfont changes text metrics; re-measure once it is ready.
    document.fonts?.ready.then(measure).catch(() => undefined);
    resize(); schedule();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('click', onClick);
      document.documentElement.removeEventListener('pointerleave', onLeave); window.removeEventListener('blur', onLeave);
    };
  }, [motionOn]);

  return (
    <section ref={sectionRef} id="hero" className="pond-hero" data-light="low" data-chapter="00" data-chapter-name="Intro" aria-labelledby="hero-title">
      <canvas ref={canvasRef} className="pond-canvas" aria-hidden="true" />

      <div className="pond-inner">
        <Quote />
        <div className="pond-copy mono" data-koi-avoid>
          <h1 id="hero-title">Hi, I&rsquo;m Rewa Mehta.</h1>
          <p>Research-led product designer for healthcare and AI-assisted products. I turn complex, high-stakes workflows into interfaces people trust.</p>
          <p>UI/UX design at <a href="#about">Akoode Technologies</a> (intern) and <a href="#about">Chitrankitt Ventures</a>. M.Des, UI/UX, <a href="#about">NIFT New Delhi</a>.</p>
          <p>Open to Q1/Q2 roles.</p>
          <p className="pond-links">
            <a href="#work">work <ArrowDown size={12} aria-hidden="true" /></a>
            <span aria-hidden="true"> / </span>
            <a href="#about">about</a>
            <span aria-hidden="true"> / </span>
            <a href={'mailto:' + email}>email</a>
          </p>
        </div>
      </div>
    </section>
  );
}
