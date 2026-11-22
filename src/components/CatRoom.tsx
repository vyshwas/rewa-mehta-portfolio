import { useEffect, useRef } from 'react';
import { IsoHouse } from './room/iso';
import { SketchRenderer } from './room/sketch';
import { useMotion } from '../motion';

const STEP = 1 / 60;

// A hand-drawn room with a cat playing by herself, drawn at the end of the page.
// Click the room to toss her ball. It pauses offscreen and stands still when Motion is off.
export default function CatRoom() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { enabled: motionOn } = useMotion();

  useEffect(() => {
    const canvas = canvasRef.current, stage = stageRef.current;
    if (!canvas || !stage) return;
    const room = new IsoHouse();
    let renderer: SketchRenderer;
    try { renderer = new SketchRenderer(canvas, true); } catch { return; }
    let raf = 0, last = 0, acc = 0, visible = false, lastPtr = 0, resizeTimer = 0, lastW = 0, lastH = 0;

    const layout = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4e6 / (r.width * r.height))));
      renderer.resize(r.width, r.height, dpr, room);
      room.setAvoid([]); renderer.setDimBoxes([]);
      lastW = r.width; lastH = r.height;
      if (!motionOn || !visible) renderer.render(room);   // resizing clears the canvas; repaint it when nothing is animating
    };
    const onResize = () => {
      const r = canvas.getBoundingClientRect();
      if (Math.abs(r.width - lastW) < 1 && Math.abs(r.height - lastH) < 1) return;
      window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(layout, 120);
    };
    const drawStill = () => {
      if (room.time < 3) for (let i = 0; i < 182; i++) room.step(STEP);
      renderer.render(room);
    };
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now; acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 4) { room.step(STEP); acc -= STEP; steps++; }
      if (steps === 4) acc = 0;
      renderer.render(room);
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
      const { x, y, inside } = local(e), p = room.pointer;
      const dt = Math.max(1, e.timeStamp - lastPtr) / 1000;
      p.speed += (Math.min(Math.hypot(x - p.x, y - p.y) / dt, 5000) - p.speed) * 0.5;
      lastPtr = e.timeStamp; p.x = x; p.y = y; p.active = inside && e.pointerType !== 'touch';
    };
    const onClick = (e: MouseEvent) => {
      if (!motionOn) return;
      const t = e.target as Element | null;
      if (!t || !stage.contains(t)) return;
      const { x, y, inside } = local(e);
      if (inside) room.toss(x, y);
    };
    const onLeave = () => { room.pointer.active = false; room.pointer.speed = 0; };

    const ro = new ResizeObserver(onResize); ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !lastW) layout(); schedule(); }, { rootMargin: '120px' }); io.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('click', onClick);
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    layout();

    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(resizeTimer); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('click', onClick);
      document.documentElement.removeEventListener('pointerleave', onLeave); window.removeEventListener('blur', onLeave);
    };
  }, [motionOn]);

  return (
    <div ref={stageRef} className="room-stage">
      <canvas ref={canvasRef} className="room-canvas" role="img" aria-label="A hand-drawn room where an orange cat plays with a ball of yarn" />
      <p className="room-caption mono" aria-hidden="true">click the room to toss her the yarn</p>
    </div>
  );
}
