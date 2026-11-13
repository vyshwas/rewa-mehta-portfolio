import { ArrowRight } from '@phosphor-icons/react';
import { projects, type Project } from '../data';
import SerifTitle from './SerifTitle';

export function ProjectImage({ project, className = '' }: { project: Project; className?: string }) {
  if (project.image) {
    return <img src={project.image} alt={project.title} className={className} loading="lazy" />;
  }
  return (
    <div className={('choice-art ' + className).trim()}>
      <span>More choice.</span>
      <span>Less clarity.</span>
    </div>
  );
}

export default function ProjectIndex({ open }: { open: (project: Project) => void }) {
  return (
    <section id="work" className="works" data-sky="field" data-chapter="02" data-chapter-name="Selected work" aria-labelledby="work-title">
      <div className="works-track">
        <div className="works-intro">
          <span className="label label-accent">(02) Selected work</span>
          <h2 id="work-title" className="display">Selected <em>work</em></h2>
          <span className="label">{String(projects.length).padStart(2, '0')} case studies</span>
          <p className="lead">Translating complex enterprise models and field research into clear interfaces.</p>
          <span className="label works-hint" aria-hidden="true">Keep scrolling <ArrowRight size={13} /></span>
        </div>

        {projects.map((project, index) => (
          <article key={project.id} className="poster-card">
            <div className="poster-row">
              <span>N° {String(index + 2).padStart(2, '0')}</span>
              <span>{project.discipline}</span>
              <span>Case study</span>
            </div>
            <div className="poster-img">
              <ProjectImage project={project} />
            </div>
            <span className="label">{project.category}</span>
            <h3 className="title">
              <button className="stretched" onClick={() => open(project)} aria-label={`Open ${project.title} case study`}>
                <SerifTitle text={project.title} />
              </button>
            </h3>
            <p>{project.intro}</p>
            <span className="label poster-cta" aria-hidden="true">Open case study <ArrowRight size={13} /></span>
          </article>
        ))}
      </div>
      <div className="works-progress" aria-hidden="true"><span className="works-progress-fill" /></div>
    </section>
  );
}
