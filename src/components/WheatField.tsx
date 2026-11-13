import { useEffect, useRef } from 'react';
import { useMotion } from '../motion';

type Stalk = { x: number; depth: number; height: number; phase: number; speed: number; ear: boolean; lean: number };

// Sun-bleached wheat, far (hazy) to near (golden). Channels are mixed per stalk by depth.
const FAR = [236, 226, 200];
const NEAR = [176, 131, 62];
const mix = (t: number) => FAR.map((c, i) => Math.round(c + (NEAR[i] - c) * t)).join(',');

function makeStalks(layer: 'back' | 'front', width: number, height: number): Stalk[] {
  if (layer === 'front') {
    // A few tall, out-of-focus stalks framing the left and right edges, like the poster's foreground.
    return Array.from({ length: width < 700 ? 8 : 16 }, (_, i) => {
      const left = i % 2 === 0;
      const edge = Math.random() * width * 0.12;
      return {
        x: left ? edge : width - edge,
        depth: 1,
        height: height * (0.3 + Math.random() * 0.28),
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.4,
        ear: true,
        lean: (left ? 1 : -1) * (0.08 + Math.random() * 0.14),
      };
    });
  }
  const count = Math.min(560, Math.round(width / 2.4));
  return Array.from({ length: count }, () => {
    const depth = Math.random() ** 1.5;
    return {
      x: -20 + Math.random() * (width + 40),
      depth,
      // Capped just under the canvas height so no stalk is ever sliced flat by the top edge.
      height: height * (0.36 + depth * 0.52) * (0.9 + Math.random() * 0.14),
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.8,
      ear: Math.random() > 0.22,
      lean: (Math.random() - 0.5) * 0.12,
    };
  }).sort((a, b) => a.depth - b.depth);
}

export default function WheatField({ layer }: { layer: 'back' | 'front' }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { enabled } = useMotion();

  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext('2d');
    if (!element || !ctx) return;
    let width = 0, height = 0, frame = 0, visible = true;
    let stalks: Stalk[] = [];

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, layer === 'front' ? 1 : 1.5);
      width = element.clientWidth;
      height = element.clientHeight;
      element.width = Math.round(width * dpr);
      element.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stalks = makeStalks(layer, width, height);
    };

    const draw = (time: number) => {
      const t = enabled ? time / 1000 : 0;
      ctx.clearRect(0, 0, width, height);
      if (layer === 'back') {
        // Ground tone behind the stalks so the field reads as a continuous surface.
        const ground = ctx.createLinearGradient(0, height * 0.3, 0, height);
        ground.addColorStop(0, `rgba(${mix(0.1)},0)`);
        ground.addColorStop(0.45, `rgba(${mix(0.35)},0.75)`);
        ground.addColorStop(1, `rgba(${mix(0.8)},1)`);
        ctx.fillStyle = ground;
        ctx.fillRect(0, height * 0.3, width, height * 0.7);
      }
      for (const stalk of stalks) {
        // A gust rolls across the field from left to right; each stalk also sways on its own.
        const gust = Math.sin(t * 0.7 - stalk.x * 0.0045) * 0.07;
        const sway = Math.sin(t * stalk.speed + stalk.phase) * 0.025;
        const angle = stalk.lean + (gust + sway) * (0.45 + stalk.depth);
        const baseY = height + 6;
        const tipX = stalk.x + Math.sin(angle) * stalk.height;
        const tipY = baseY - Math.cos(angle) * stalk.height;
        const color = layer === 'front' ? '190,146,74' : mix(stalk.depth);
        const alpha = layer === 'front' ? 0.92 : 0.55 + stalk.depth * 0.45;
        const stem = layer === 'front' ? 5 : 0.5 + stalk.depth * 1.6;

        ctx.strokeStyle = `rgba(${color},${alpha.toFixed(3)})`;
        ctx.lineWidth = stem;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(stalk.x, baseY);
        ctx.quadraticCurveTo(stalk.x + Math.sin(angle) * stalk.height * 0.3, baseY - stalk.height * 0.55, tipX, tipY);
        ctx.stroke();

        if (stalk.ear && (layer === 'front' || stalk.depth > 0.18)) {
          // Seed head: paired kernels along the last stretch of the stalk.
          const kernel = layer === 'front' ? 9 : 1.1 + stalk.depth * 2.9;
          const length = stalk.height * 0.16;
          ctx.fillStyle = `rgba(${color},${alpha.toFixed(3)})`;
          for (let k = 0; k < 7; k++) {
            const along = stalk.height - length + (k / 6) * length;
            const px = stalk.x + Math.sin(angle) * along;
            const py = baseY - Math.cos(angle) * along;
            const side = k % 2 === 0 ? 1 : -1;
            ctx.beginPath();
            ctx.ellipse(px + Math.cos(angle) * kernel * 0.55 * side, py + Math.sin(angle) * kernel * 0.55 * side, kernel * 0.5, kernel, angle + side * 0.35, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      if (enabled && visible) frame = requestAnimationFrame(draw);
    };

    const start = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); };
    let resizeTimer = 0;
    const resize = () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { build(); start(); }, 150); };
    // Stop drawing while the hero is off-screen or the tab is hidden.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      if (visible) start(); else cancelAnimationFrame(frame);
    });
    const visibility = () => { visible = !document.hidden; if (visible) start(); else cancelAnimationFrame(frame); };
    build();
    start();
    observer.observe(element);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [enabled, layer]);

  return <canvas className="wheat" ref={canvas} />;
}
