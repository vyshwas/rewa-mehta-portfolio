import { ArrowUpRight } from '@phosphor-icons/react';
import { playgroundProjects, type Project } from '../data';
import { ProjectImage } from './ProjectIndex';
import { Opener } from './Field';
import SerifTitle from './SerifTitle';

export default function Playground({ open }: { open: (project: Project) => void }) {
  return (
    <section className="section playground" id="playground" data-light="dim" data-chapter="04" data-chapter-name="Playground" aria-labelledby="playground-title">
      <Opener num="04" id="playground-title" note="Illustration and information design">Playground &amp; <em>inquiry</em></Opener>

      <div className="inquiry-grid">
        {playgroundProjects.map((project, index) => (
          <article key={project.id} className="inquiry-card">
            <div className="inquiry-art" data-parallax>
              {project.poster ? <img src={project.poster} alt="" loading="lazy" /> : <ProjectImage project={project} />}
            </div>
            <div className="inquiry-meta mono">
              <span>Experiment {String(index + 1).padStart(2, '0')}</span>
              <span>{project.discipline}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </div>
            <div className="inquiry-copy">
              <h3 className="title">
                <button className="stretched" onClick={() => open(project)} aria-label={`Open ${project.title} case study`}>
                  <SerifTitle text={project.title} />
                </button>
              </h3>
              <p>{project.intro}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
