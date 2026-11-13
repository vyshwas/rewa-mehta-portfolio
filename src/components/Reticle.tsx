import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useMotion } from '../motion';

// A small instrument reticle that replaces the arrow on fine pointers. It grows over links and
// shows a word over anything marked data-cursor ("Open", "Hold"), so browsing feels like examining.
export default function Reticle() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLElement>(null);
  const { enabled } = useMotion();

  useEffect(() => {
    const element = ring.current;
    if (!enabled || !element || !window.matchMedia('(pointer: fine)').matches) return;
    document.documentElement.classList.add('has-reticle');
    const x = gsap.quickTo(element, 'x', { duration: 0.35, ease: 'power3.out' });
    const y = gsap.quickTo(element, 'y', { duration: 0.35, ease: 'power3.out' });
    const move = (event: PointerEvent) => { x(event.clientX); y(event.clientY); element.dataset.hidden = 'false'; };
    const over = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest<HTMLElement>('a, button');
      const word = link ? link.dataset.cursor : target.closest<HTMLElement>('[data-cursor]')?.dataset.cursor;
      element.dataset.mode = word ? 'label' : link ? 'link' : 'idle';
      if (label.current) label.current.textContent = word || '';
    };
    const leave = () => { element.dataset.hidden = 'true'; };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      document.documentElement.classList.remove('has-reticle');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div className="reticle" ref={ring} data-mode="idle" data-hidden="true" aria-hidden="true"><span /><i /><b ref={label} /></div>;
}
