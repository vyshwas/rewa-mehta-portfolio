import { useEffect } from 'react';
import { useMotion } from './motion';

// Big type that reacts to the pointer: each letter is its own span so its weight can swell
// as the cursor comes near (Inter Tight is a variable font, so every weight in between exists).
export function FlexWord({ text }: { text: string }) {
  return <>{[...text].map((char, index) => <span key={index} className="flex-ch">{char}</span>)}</>;
}

const FAR = 500;
const NEAR = 880;
const REACH = 220;

// One loop drives every flexing letter on the page.
// Fine pointers with motion on only; otherwise the letters rest at their CSS weight.
export function usePointerFx() {
  const { enabled } = useMotion();

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const letters = [...document.querySelectorAll<HTMLElement>('.flex-ch')];
    if (!enabled || !fine) return;

    const pointer = { x: -9999, y: -9999 };
    const weights = letters.map(() => FAR);
    let frame = 0;

    const move = (event: PointerEvent) => { pointer.x = event.clientX; pointer.y = event.clientY; };
    const out = () => { pointer.x = -9999; pointer.y = -9999; };

    const tick = () => {
      letters.forEach((letter, index) => {
        const box = letter.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight) return;
        const dx = pointer.x - (box.left + box.width / 2);
        const dy = pointer.y - (box.top + box.height / 2);
        const pull = Math.exp(-(dx * dx + dy * dy) / (2 * REACH * REACH));
        const target = FAR + (NEAR - FAR) * pull;
        weights[index] += (target - weights[index]) * 0.14;
        letter.style.fontWeight = weights[index].toFixed(0);
      });
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', out);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', out);
      letters.forEach(letter => { letter.style.fontWeight = ''; });
    };
  }, [enabled]);
}
