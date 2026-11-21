import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowUpRight, ArrowUp, Copy, Check } from '@phosphor-icons/react';
import { MotionProvider, ScrollChoreography, useMotion } from './motion';
import Atmosphere from './components/Atmosphere';
import Hero from './components/PondHero';
import Manifesto from './components/Manifesto';
import DeepCaseStudy from './components/DeepCaseStudy';
import WorkIndex from './components/WorkIndex';
import WorkingWithMe from './components/WorkingWithMe';
import Playground from './components/Playground';
import { Opener, Rise, SplitTitle } from './components/Field';
import { email, type Project } from './data';
import { FlexWord, usePointerFx } from './fx';
import CaseStudyBoundary from './components/CaseStudyBoundary';
const CaseStudy = lazy(() => import('./components/CaseStudy'));

const links = [['Work', '#featured-work'], ['Approach', '#working-with-me'], ['About', '#about'], ['Contact', '#contact']] as const;

function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <header className="site-nav" data-scrolled={scrolled}>
      <a href="#hero" className="nav-brand" aria-label="Rewa Mehta, back to top"><span className="nav-mark monogram" aria-hidden="true">R<em>m</em></span><span className="nav-name">Rewa Mehta</span></a>
      <nav className="nav-links" aria-label="Main navigation">
        {links.map(([label, href]) => <a key={href} href={href}><span>{label}</span><i aria-hidden="true" /></a>)}
      </nav>
    </header>
  );
}

const trajectory = [
  ['Akoode Technologies', 'UI/UX design intern', 'Industry'],
  ['Chitrankitt Ventures', 'UI/UX designer', 'Industry'],
  ['NIFT New Delhi', 'M.Des, UI/UX', 'Education'],
  ['IGU Rewari', 'B.Sc, Science', 'Education'],
];

function About() {
  return (
    <section className="section about" id="about" data-light="low" data-chapter="05" data-chapter-name="About" aria-labelledby="about-title">
      <Opener num="05" id="about-title" note="New Delhi, India">About</Opener>
      <div className="field-row about-copy">
        <p className="headline about-lead" data-reveal>From the laboratory to <em>interface architecture.</em></p>
        <p className="body about-body" data-reveal>
          A science degree taught me to observe without preconceptions and respect evidence. I bring that rigor to research, information architecture and interaction design.
        </p>
      </div>
      <ul className="trajectory" aria-label="Trajectory">
        {trajectory.map(([place, role, kind]) => (
          <li key={place} data-reveal>
            <span className="mono">{kind}</span>
            <strong>{place}</strong>
            <span>{role}</span>
          </li>
        ))}
      </ul>
      <a className="btn btn-ghost about-cta" href={'mailto:' + email + '?subject=Resume%20request%20-%20Rewa%20Mehta'}>
        Request résumé <ArrowUpRight size={15} />
      </a>
    </section>
  );
}

function Contact() {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = async () => {
    try { await navigator.clipboard.writeText(email); setCopyState('copied'); }
    catch { setCopyState('failed'); }
  };
  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 4000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  return (
    <section id="contact" className="section contact" data-light="dawn" data-chapter="06" data-chapter-name="Contact" aria-labelledby="contact-heading">
      <Opener num="06" id="contact-heading" note="Open to product design roles, Q1/Q2">Contact</Opener>
      <div className="contact-stage">
        <p className="contact-title" data-rise><Rise><FlexWord text="Let's" /></Rise> <Rise><em>talk.</em></Rise></p>
        <a className="contact-email" href={'mailto:' + email} data-reveal>{email}<ArrowUpRight size={28} aria-hidden="true" /></a>
        <div className="contact-actions" data-reveal>
          <button className="btn btn-ghost" aria-label="Copy email address" onClick={copy}>
            {copyState === 'copied' ? <Check size={15} /> : <Copy size={15} />}
            Copy address
          </button>
          <div className="socials mono">
            <a href="https://www.linkedin.com/in/revamehta/" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={13} /></a>
            <a href="https://www.behance.net/revamehta1" target="_blank" rel="noreferrer">Behance <ArrowUpRight size={13} /></a>
          </div>
        </div>
        <p className="mono copy-status" role="status">
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed — select the address instead' : ''}
        </p>
      </div>
    </section>
  );
}

// Pointer-driven type and tilt; renders nothing.
function PointerFx() {
  usePointerFx();
  return null;
}

function MotionPreference() {
  const { enabled, toggle } = useMotion();
  return (
    <button aria-label={enabled ? 'Reduce motion' : 'Enable motion'} aria-pressed={enabled} onClick={toggle}>
      Motion: {enabled ? 'On' : 'Off'}
    </button>
  );
}

export default function App() {
  const [project, setProject] = useState<Project | null>(null);

  return (
    <MotionProvider>
      <ScrollChoreography>
        <Atmosphere />
        <PointerFx />
        <div className="site-wrapper">
          <SiteNav />
          <main>
            <Hero />
            <Manifesto />
            <DeepCaseStudy open={setProject} />
            <WorkIndex open={setProject} />
            <WorkingWithMe />
            <Playground open={setProject} />
            <About />
            <Contact />
          </main>
          <footer className="site-footer">
            <div aria-hidden="true"><SplitTitle as="span" className="footer-wordmark" left={<FlexWord text="Rewa" />} right={<em>Mehta</em>} /></div>
            <div className="footer-meta mono">
              <span>© {new Date().getFullYear()} Rewa Mehta · Observe, then design</span>
              <span>New Delhi, India</span>
              <span className="footer-links">
                <MotionPreference />
                <a href="#hero" className="to-top">Top <ArrowUp size={12} /></a>
              </span>
            </div>
          </footer>
        </div>
        {project && (
          <CaseStudyBoundary key={project.id} close={() => setProject(null)}>
            <Suspense fallback={<div className="loading-notice" role="status">Opening case study…</div>}>
              <CaseStudy project={project} close={() => setProject(null)} />
            </Suspense>
          </CaseStudyBoundary>
        )}
      </ScrollChoreography>
    </MotionProvider>
  );
}
