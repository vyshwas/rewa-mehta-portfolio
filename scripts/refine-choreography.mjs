import { readFile, writeFile } from 'node:fs/promises';
const edit = async (file, replacements) => {
  let text = await readFile(file, 'utf8');
  for (const [from, to] of replacements) {
    if (!text.includes(from)) throw new Error(`Missing replacement in ${file}: ${from.slice(0, 60)}`);
    text = text.replace(from, to);
  }
  await writeFile(file, text);
};
await edit('src/motion.tsx', [[`        gsap.utils.toArray<HTMLElement>('.project-art').forEach(el => {
          gsap.fromTo(el, { y: 35, rotateX: 6, scale: 0.97 }, {
            y: -20, rotateX: -2, scale: 1.02, ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
          });
        });
`, '']]);
await edit('src/components/ProjectIndex.tsx', [
  ["import { useRef, useState, type PointerEvent }", "import { useEffect, useRef, useState, type PointerEvent }"],
  ["import { projects, type Project } from '../data';", "import { projects, type Project } from '../data';\nimport { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\nimport { useMotion } from '../motion';"],
  ["  const visible = projects.filter", `  const root = useRef<HTMLElement>(null);
  const { enabled } = useMotion();
  useEffect(() => {
    const media = gsap.matchMedia();
    if (enabled && view === 'grid') {
      media.add('(min-width: 768px)', () => {
        gsap.utils.toArray<HTMLElement>('.project-art', root.current!).forEach(el => {
          gsap.fromTo(el, { y: 35, rotateX: 6, scale: 0.97 }, {
            y: -20, rotateX: -2, scale: 1.02, ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
          });
        });
      });
    }
    ScrollTrigger.refresh();
    return () => media.revert();
  }, [filter, view, enabled]);
  const visible = projects.filter`],
  ['<section className="work section-pad"', '<section ref={root} className="work section-pad"'],
]);
await edit('src/components/CaseStudy.tsx', [
  ["import { useMotion } from '../motion';", "import { useMotion } from '../motion';\nimport { gsap } from 'gsap';"],
  ['const { suspend } = useMotion();', 'const { suspend, enabled } = useMotion();'],
  ['  return <dialog className="case-dialog"', `  useEffect(() => {
    if (!enabled || !dialog.current) return;
    const context = gsap.context(() => {
      gsap.fromTo('.case-image', { rotateX: 8, scale: 0.96 }, {
        rotateX: -4, scale: 1, ease: 'none',
        scrollTrigger: { scroller: dialog.current, trigger: '.case-art-stage', start: 'top 70%', end: 'bottom top', scrub: 0.7 },
      });
      if (project.discipline === 'Visual') {
        gsap.fromTo('.lookbook-front', { y: 80, rotate: 9, rotateY: -14 }, {
          y: -60, rotate: -4, rotateY: 4, ease: 'none',
          scrollTrigger: { scroller: dialog.current, trigger: '.lookbook', start: 'top bottom', end: 'bottom top', scrub: 0.45 },
        });
        gsap.fromTo('.lookbook-back', { y: -15, rotate: -8 }, {
          y: 40, rotate: 4, ease: 'none',
          scrollTrigger: { scroller: dialog.current, trigger: '.lookbook', start: 'top bottom', end: 'bottom top', scrub: 0.8 },
        });
      }
    }, dialog);
    return () => context.revert();
  }, [enabled, project]);
  return <dialog className="case-dialog"`],
  ['<img className="case-image"', '<div className="case-art-stage"><img className="case-image"'],
  ['width="1200" height="896" />', 'width="1200" height="896" /></div>'],
  ['      <FlowMap project={project} />', `      {project.discipline === 'Visual' && <section className="lookbook" aria-label="Visual study editorial spread"><div className="lookbook-back"><span>Male Gaze & Gender Norms</span><p>Looking.<br />Being seen.<br /><em>Being judged.</em></p><span>A visual reading of Malèna</span></div><div className="lookbook-front"><img src={project.image} alt="Detail of the visual communication concept" loading="lazy" /><span>Visual communication / Semiotics</span></div></section>}
      <FlowMap project={project} />`],
]);
await edit('src/styles.css', [['.case-image {', '.case-art-stage { perspective: 1200px; overflow: hidden; }\n.case-image {']]);
const css = `
.lookbook { position: relative; min-height: 540px; margin-top: 70px; perspective: 1200px; overflow: clip; }
.lookbook-back { position: absolute; inset: 30px 35% 40px 20px; padding: 30px; background: var(--accent-paper); display: flex; flex-direction: column; justify-content: space-between; }
.lookbook-back > span { font-size: 10px; }
.lookbook-back p { font: 400 65px/0.95 var(--serif); letter-spacing: -0.04em; }
.lookbook-back em { color: var(--accent); line-height: 1.1; }
.lookbook-front { position: absolute; inset: 90px 10px 0 43%; padding: 12px; background: var(--white); border: 1px solid var(--line); align-self: start; }
.lookbook-front img { height: 80%; object-fit: cover; }
.lookbook-front span { font-size: 10px; display: block; margin-top: 16px; }
@media (max-width: 767px) { .lookbook { min-height: 380px; } .lookbook-back { padding: 16px; inset: 15px 20% 40px 0; } .lookbook-back p { font-size: 44px; } .lookbook-front { inset: 130px 0 0 40%; padding: 7px; } .lookbook-front span { font-size: 8px; } }
`;
await writeFile('src/styles.css', (await readFile('src/styles.css', 'utf8')) + css);
