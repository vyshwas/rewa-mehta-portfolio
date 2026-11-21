import { featuredProject, projects, playgroundProjects, type Project } from '../data';
import { Opener } from './Field';

// One card per project, one after another. A large image, then a single line: the name and the year.
// Same card for every project, so there is nothing to decode.
const everything: Project[] = [featuredProject, ...projects, ...playgroundProjects];

// Tall posters and infographics are shown whole; wide images fill the frame.
function fit(event: React.SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  img.dataset.fit = img.naturalWidth / img.naturalHeight < 1.5 ? 'contain' : 'cover';
}

export default function Work({ open }: { open: (project: Project) => void }) {
  return (
    <section id="work" className="section wk" data-light="low" data-chapter="01" data-chapter-name="Work" aria-labelledby="work-title">
      <Opener num="01" id="work-title" note={`${everything.length} projects. Click any to read the case study.`}>Work</Opener>

      <ol className="wk-list">
        {everything.map(project => (
          <li key={project.id} className="wk-item" data-reveal>
            <button type="button" className="wk-card" onClick={() => open(project)} aria-label={`Open ${project.title} case study`}>
              <span className="wk-media">
                {project.image
                  ? <img src={project.image} alt="" loading="lazy" onLoad={fit} data-fit="cover" />
                  : <span className="wk-fallback mono">{project.title}</span>}
              </span>
              <span className="wk-meta">
                <span className="wk-title">{project.title}</span>
                <span className="wk-tag mono">{project.year} · {project.category.split(' / ')[0]}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
