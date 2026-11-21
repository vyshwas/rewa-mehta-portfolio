import { ArrowUpRight } from '@phosphor-icons/react';
import { featuredProject, asset, type Project } from '../data';
import { Opener, SplitTitle } from './Field';

export default function DeepCaseStudy({ open }: { open: (project: Project) => void }) {
  const project = featuredProject;

  return (
    <section className="section feature" id="featured-work" data-light="beam" data-chapter="01" data-chapter-name="Featured" aria-labelledby="feature-heading">
      <Opener num="01" id="feature-heading" note="Clinical UX · solo · Figma">
        Featured <em>case</em>
      </Opener>

      <SplitTitle as="h3" className="feature-title" left="Neonatal" right={<em>Care</em>} />
      <p className="feature-deck" data-reveal>{project.intro}</p>

      <div className="feature-stage">
        <figure className="feature-frame">
          <img
            className="feature-img"
            src={asset("assets/projects/behance/neonatal-macbook.webp")}
            alt="The neonatalcare doctor dashboard on a laptop: infant cards with vitals, a daily summary and an alert panel"
            loading="eager"
          />
        </figure>
      </div>

      <div className="field-row feature-body">
        <div className="feature-col" data-reveal>
          <p className="mono label-accent">The problem</p>
          <p className="title">Doctors watch many infants at once, from vitals logged by hand and scattered across machines.</p>
        </div>
        <div className="feature-col" data-reveal>
          <p className="mono label-accent">The response</p>
          <p className="title">One live dashboard, fed by a caregiver app, that sorts every infant by <em>urgency.</em></p>
        </div>
      </div>

      <div className="feature-action">
        <button className="btn btn-primary" onClick={() => open(project)} aria-label={`Open ${project.title} case study`}>
          Read the case study <ArrowUpRight size={15} weight="bold" />
        </button>
      </div>
    </section>
  );
}
