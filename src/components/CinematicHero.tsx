import { ArrowDown, ArrowUpRight } from '@phosphor-icons/react';
import WheatField from './WheatField';

function Seal() {
  return (
    <div className="seal">
      <svg viewBox="0 0 120 120">
        <defs><path id="seal-path" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" /></defs>
        {/* Size is in SVG units, so the ring of text scales with the seal. */}
        <text fontSize="9.2"><textPath href="#seal-path" textLength="292" lengthAdjust="spacing">Observe · then design · Rewa Mehta ·</textPath></text>
      </svg>
      <span className="monogram">R<em>m</em></span>
    </div>
  );
}

export default function CinematicHero() {
  return (
    <section id="hero" className="hero" data-sky="haze" data-chapter="00" data-chapter-name="Intro" aria-labelledby="hero-title">
      <div className="hero-haze" aria-hidden="true" />
      <div className="hero-field" aria-hidden="true"><div className="field-zoom"><WheatField layer="back" /></div></div>
      <div className="hero-front" aria-hidden="true"><WheatField layer="front" /></div>

      <div className="hero-inner">
        <div className="poster-row hero-top">
          <span data-intro>Portfolio 2025</span>
          <span data-intro>Experience &amp; digital product design</span>
          <span data-intro>New Delhi, India</span>
        </div>

        <div className="hero-center">
          <h1 id="hero-title" className="lockup" aria-label="Rewa Mehta">
            <span className="lk-row lk-row-1">
              <span className="lk-mask"><span className="lk-word">Rewa</span></span>
              <span className="lk-aside">From test<br />tubes to Figma</span>
            </span>
            <span className="lk-row lk-row-2">
              <span className="lk-aside lk-aside-before">Research-led<br />product designer</span>
              <span className="lk-mask"><em className="lk-word">Mehta</em></span>
            </span>
          </h1>
          <div className="hero-copy">
            <p className="hero-sub" data-intro>
              Science graduate turned UX researcher and product designer. I bring hypothesis, evidence and deep empathy to healthcare and enterprise systems.
            </p>
            <div className="hero-actions" data-intro>
              <a href="#featured-work" className="btn btn-primary">See the work <ArrowDown size={15} weight="bold" /></a>
              <a href="#contact" className="btn btn-secondary">Say hello <ArrowUpRight size={15} /></a>
            </div>
          </div>
        </div>

        <div className="poster-row hero-foot">
          <span data-intro>Observe, then design.</span>
          <span className="scroll-cue" data-intro><i aria-hidden="true" />Scroll</span>
          <span data-intro>Healthtech · SaaS · Research</span>
        </div>
      </div>

      <div className="seal-wrap" aria-hidden="true"><Seal /></div>
    </section>
  );
}
