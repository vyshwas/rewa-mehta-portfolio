import { useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { featuredProject, projects, playgroundProjects, type Project } from '../data';
import { Opener } from './Field';

// One layout for all the work: a plain index on the left, one large preview on the right.
// Each project gets a single line (name + year). Everything else waits in the preview and the case study.
const caseStudies: Project[] = [featuredProject, ...projects];
const everything: Project[] = [...caseStudies, ...playgroundProjects];

function Row({ project, index, active, onActive, open }: { project: Project; index: number; active: boolean; onActive: () => void; open: (p: Project) => void }) {
  return (
    <li>
      <button
        type="button"
        className="work2-row"
        data-on={active}
        onPointerEnter={onActive}
        onFocus={onActive}
        onClick={() => open(project)}
        aria-label={`Open ${project.title} case study`}
      >
        <span className="work2-num mono" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className="work2-title">{project.title}</span>
        <span className="work2-year mono">{project.year}</span>
        {project.image && <img className="work2-thumb" src={project.image} alt="" loading="lazy" />}
      </button>
    </li>
  );
}

export default function Work({ open }: { open: (project: Project) => void }) {
  const [activeId, setActiveId] = useState(everything[0].id);
  const active = everything.find(p => p.id === activeId) ?? everything[0];

  return (
    <section id="work" className="section work2" data-light="low" data-chapter="01" data-chapter-name="Work" aria-labelledby="work-title">
      <Opener num="01" id="work-title" note={`${everything.length} projects. Click any to read the case study.`}>Work</Opener>

      <div className="work2-grid">
        <div className="work2-lists">
          <h3 className="work2-group mono">Case studies <span>{caseStudies.length}</span></h3>
          <ol className="work2-list">
            {caseStudies.map((p, i) => (
              <Row key={p.id} project={p} index={i} active={p.id === activeId} onActive={() => setActiveId(p.id)} open={open} />
            ))}
          </ol>

          <h3 className="work2-group mono">Visual work <span>{playgroundProjects.length}</span></h3>
          <ol className="work2-list" start={caseStudies.length + 1}>
            {playgroundProjects.map((p, i) => (
              <Row key={p.id} project={p} index={caseStudies.length + i} active={p.id === activeId} onActive={() => setActiveId(p.id)} open={open} />
            ))}
          </ol>
        </div>

        <aside className="work2-preview" aria-live="polite">
          <div className="work2-frame">
            {everything.map(p => (
              <div key={p.id} className="work2-slide" data-on={p.id === activeId} aria-hidden={p.id !== activeId}>
                {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="work2-fallback mono">{p.title}</span>}
              </div>
            ))}
          </div>
          <p className="work2-cat mono">{active.category} · {active.year}</p>
          <p className="work2-intro">{active.intro}</p>
          <button type="button" className="work2-open" onClick={() => open(active)}>Read the case study <ArrowUpRight size={14} aria-hidden="true" /></button>
        </aside>
      </div>
    </section>
  );
}
