import { useEffect, useRef } from 'react';
import { Pond, PondRenderer } from './pond/engine';
import { useMotion } from '../motion';

const STEP = 1 / 60;

// The pond continues under the rest of the page: the same glyph water, with no fish.
// It ripples where the cursor moves, where you click, and (a little) when you scroll.
export default function PondWater() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { enabled } = useMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !enabled) return;
    const pond = new Pond(false);
    let renderer: PondRenderer;
    try { renderer = new PondRenderer(canvas); } catch { return; }
    let raf = 0, last = 0, acc = 0, lastPtr = 0, lastY = window.scrollY, lastRain = 0;

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3e6 / (w * h))));
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      renderer.resize(w, h, dpr); pond.resize(w, h);
    };
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now; acc += dt;
      let n = 0;
      while (acc >= STEP && n < 4) { pond.step(STEP); acc -= STEP; n++; }
      if (n === 4) acc = 0;
      renderer.render(pond, dt);
      raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      const p = pond.pointer;
      p.x = e.clientX; p.y = e.clientY; p.active = e.pointerType !== 'touch';
      lastPtr = e.timeStamp;
    };
    const onLeave = () => { pond.pointer.active = false; };
    const onClick = (e: MouseEvent) => { pond.splash(e.clientX, e.clientY, 0.35); };
    // Scrolling drops a little rain along the edges so the water never feels static.
    const onScroll = () => {
      const now = performance.now(), dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      if (dy < 30 || now - lastRain < 140) return;
      lastRain = now;
      pond.splash(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 0.18 + Math.min(0.25, dy / 600));
    };

    resize();
    last = performance.now(); raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('click', onClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove);
      window.removeEventListener('click', onClick); window.removeEventListener('scroll', onScroll);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      void lastPtr;
    };
  }, [enabled]);

  return <canvas ref={ref} className="pond-water" aria-hidden="true" />;
}
