import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { projects, type Project } from '../data';
import { Opener } from './Field';
import SerifTitle from './SerifTitle';
import { useMotion } from '../motion';

function Plate({ project }: { project: Project }) {
  return project.image ? <img src={project.image} alt="" loading="lazy" /> : <div className="choice-art"><span>More choice.</span><span>Less clarity.</span></div>;
}

// An index, not a gallery: numbered rows set large. On a pointer, the work floats beside the cursor.
export default function WorkIndex({ open }: { open: (project: Project) => void }) {
  const [active, setActive] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const { enabled } = useMotion();

  useEffect(() => {
    const element = preview.current;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!element || !fine) return;
    const pos = { x: window.innerWidth * 0.62, y: window.innerHeight / 2, tx: window.innerWidth * 0.62, ty: window.innerHeight / 2 };
    let frame = 0;
    const move = (event: PointerEvent) => { pos.tx = event.clientX; pos.ty = event.clientY; };
    const tick = () => {
      const ease = enabled ? 0.12 : 1;
      pos.x += (pos.tx - pos.x) * ease;
      pos.y += (pos.ty - pos.y) * ease;
      element.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', move, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(frame); };
  }, [enabled]);

  return (
    <section id="work" className="section works" data-light="streak" data-chapter="02" data-chapter-name="Selected work" aria-labelledby="work-title">
      <Opener num="02" id="work-title" note={String(projects.length).padStart(2, '0') + ' case studies · AI, mobile, systems research'}>Selected <em>work</em></Opener>

      <ol className="work-list" data-active={active !== null} onPointerLeave={() => setActive(null)}>
        {projects.map((project, index) => (
          <li key={project.id} className="work-row" data-on={active === index} onPointerEnter={() => setActive(index)} onFocus={() => setActive(index)} onBlur={() => setActive(null)}>
            <span className="work-num mono">{String(index + 1).padStart(2, '0')}</span>
            <h3 className="work-title">
              <button className="stretched" onClick={() => open(project)} aria-label={`Open ${project.title} case study`}>
                <SerifTitle text={project.title} />
              </button>
            </h3>
            <span className="work-meta mono">{project.category.split(' / ')[0]}<br />{project.team.split(' (')[0]}</span>
            <ArrowUpRight className="work-arrow" size={28} aria-hidden="true" />
            <div className="work-thumb" aria-hidden="true"><Plate project={project} /></div>
          </li>
        ))}
      </ol>

      <div className="work-preview" ref={preview} aria-hidden="true" data-on={active !== null}>
        <div className="wp-frame">
          {projects.map((project, index) => (
            <div key={project.id} className="wp-slide" data-on={active === index}><Plate project={project} /></div>
          ))}
        </div>
      </div>
    </section>
  );
}
