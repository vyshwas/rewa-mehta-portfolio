import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { ArrowUpRight, X, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowCounterClockwise } from '@phosphor-icons/react';
import type { Project } from '../data';
import { email } from '../data';
import { useMotion } from '../motion';
import { ProjectImage } from './ProjectIndex';

function FlowMap({ project }: { project: Project }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const position = useRef({ x: 0, y: 0 });
  const gesture = useRef<{ id: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const [selected, setSelected] = useState(0);

  const pan = (x: number, y: number) => {
    const maxX = Math.max(0, 850 - (viewport.current?.clientWidth || 500));
    position.current = { x: Math.min(0, Math.max(-maxX, x)), y: Math.max(-20, Math.min(20, y)) };
    if (track.current) track.current.style.transform = 'translate3d(' + position.current.x + 'px,' + position.current.y + 'px,0)';
  };

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button') || event.button !== 0) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: position.current.x, originY: position.current.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (g && g.id === event.pointerId) pan(g.originX + event.clientX - g.x, g.originY + event.clientY - g.y);
  };

  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const delta: Record<string, [number, number]> = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 20], ArrowDown: [0, -20] };
    if (delta[event.key]) {
      event.preventDefault();
      pan(position.current.x + delta[event.key][0], position.current.y + delta[event.key][1]);
    }
  };

  return (
    <div className="flow-map">
      <div className="flow-label">
        <h3>How it was made</h3>
        <span>Drag to explore · Select a step</span>
      </div>
      <div
        className="flow-viewport"
        ref={viewport}
        tabIndex={0}
        role="region"
        aria-label="Interactive journey map. Use arrow keys to pan."
        onKeyDown={key}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => { gesture.current = null; }}
        onPointerCancel={() => { gesture.current = null; }}
      >
        <div className="flow-track" ref={track}>
          {project.flow.map((step, i) => (
            <button className="flow-node" key={step} aria-pressed={selected === i} onClick={() => setSelected(i)}>
              <span>Step {i + 1}</span>
              <strong>{step}</strong>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      </div>
      <div className="flow-controls">
        <span aria-live="polite">Phase {selected + 1} of 4: {project.flow[selected]}</span>
        <div>
          <button aria-label="Pan left" onClick={() => pan(position.current.x + 100, position.current.y)}><ArrowLeft /></button>
          <button aria-label="Pan right" onClick={() => pan(position.current.x - 100, position.current.y)}><ArrowRight /></button>
          <button aria-label="Pan up" onClick={() => pan(position.current.x, position.current.y + 20)}><ArrowUp /></button>
          <button aria-label="Pan down" onClick={() => pan(position.current.x, position.current.y - 20)}><ArrowDown /></button>
          <button aria-label="Reset map" onClick={() => pan(0, 0)}><ArrowCounterClockwise /></button>
        </div>
      </div>
    </div>
  );
}

export default function CaseStudy({ project, close }: { project: Project; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { suspend } = useMotion();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    suspend(true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      suspend(false);
      previous?.focus({ preventScroll: true });
    };
  }, [suspend]);

  const isTeam = project.team.toLowerCase().startsWith('team');

  return (
    <dialog
      className="case-dialog"
      data-lenis-prevent
      ref={dialog}
      aria-labelledby="case-title"
      onCancel={close}
      onClick={event => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="case-sheet">
        <div className="case-top">
          <span>{project.category} · {project.year}</span>
          <button className="close-button" onClick={close} autoFocus>
            <span>Close</span>
            <X size={20} />
          </button>
        </div>

        <h2 id="case-title">{project.title}</h2>
        <p className="case-deck">{project.intro}</p>

        <dl className="case-meta">
          <div><dt className="mono">Team</dt><dd>{project.team}{isTeam && <span className="team-note"> · ask me what I led</span>}</dd></div>
          <div><dt className="mono">Tools</dt><dd>{project.tools.join(', ')}</dd></div>
          <div><dt className="mono">Year</dt><dd>{project.year}</dd></div>
        </dl>

        <div className="case-art-stage">
          <ProjectImage project={project} className="case-image" />
        </div>

        <div className="case-audience">
          <div>
            <h3 className="mono">For hiring teams</h3>
            <p>{project.forHiring}</p>
          </div>
          <div>
            <h3 className="mono">For founders</h3>
            <p>{project.forFounders}</p>
          </div>
        </div>

        <div className="case-copy">
          <div>
            <h3>The problem</h3>
            <p>{project.challenge}</p>
          </div>
          <div>
            <h3>The response</h3>
            <p>{project.response}</p>
          </div>
        </div>

        {project.facts.length > 0 && (
          <div className="case-facts">
            <h3 className="mono">From the case study</h3>
            <ul>
              {project.facts.map(fact => <li key={fact}>{fact}</li>)}
            </ul>
          </div>
        )}

        <FlowMap project={project} />

        {project.sections.length > 0 && (
          <div className="case-sections">
            {project.sections.map((section, index) => (
              <article key={section.title} className="case-section-item">
                <header className="case-section-header">
                  <span className="section-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <h3>{section.title}</h3>
                </header>
                <p className="section-text">{section.text}</p>
                {section.images?.map(image => (
                  <figure key={image.src} className="section-figure">
                    <img src={image.src} alt={image.alt} loading="lazy" />
                    {image.caption && <figcaption className="mono">{image.caption}</figcaption>}
                  </figure>
                ))}
              </article>
            ))}
          </div>
        )}

        <div className="case-footer-actions">
          {project.link ? (
            <a className="button button-dark" href={project.link} target="_blank" rel="noreferrer">
              See the full project on Behance <ArrowUpRight size={19} />
            </a>
          ) : (
            <a className="text-link" href={'mailto:' + email + '?subject=' + encodeURIComponent('Portfolio walkthrough: ' + project.title)}>
              Request a project walkthrough <ArrowUpRight size={19} />
            </a>
          )}
          <a className="btn btn-ghost" href={'mailto:' + email + '?subject=' + encodeURIComponent('About ' + project.title)}>
            Ask me about this project
          </a>
        </div>
      </div>
    </dialog>
  );
}
