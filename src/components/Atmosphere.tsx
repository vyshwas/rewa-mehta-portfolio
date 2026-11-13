import { useEffect, useState } from 'react';
import Light from './Light';
import { setScene } from '../light';
import { useMotion } from '../motion';

type Chapter = { number: string; name: string };

// The stage behind every section: one light source with grain on top.
export default function Atmosphere() {
  const [chapter, setChapter] = useState<Chapter>({ number: '00', name: 'Intro' });
  const { enabled } = useMotion();

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[data-light]');
    // A line across the middle of the screen decides which chapter is lit.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const section = entry.target as HTMLElement;
        document.documentElement.dataset.scene = section.dataset.light;
        setScene(section.dataset.light || 'aperture', enabled);
        setChapter({ number: section.dataset.chapter || '00', name: section.dataset.chapterName || '' });
      }
    }, { rootMargin: '-49% 0px -50% 0px' });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [enabled]);

  return (
    <>
      <Light />
      <div className="grain" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true" />
      <div className="chapter-hud" aria-hidden="true" data-hidden={chapter.number === '00'}>
        <span>({chapter.number})</span><i /><span className="hud-name" key={chapter.name}>{chapter.name}</span>
      </div>
    </>
  );
}
