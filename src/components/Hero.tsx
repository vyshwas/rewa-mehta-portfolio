import { ArrowDown } from '@phosphor-icons/react';
import { FlexWord } from '../fx';

// Four things only: who, availability, the positioning statement, the name.
export default function Hero() {
  return (
    <section id="hero" className="hero" data-light="aperture" data-chapter="00" data-chapter-name="Intro" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-row">
          <p className="hero-index mono" data-intro>Product designer · New Delhi</p>
          <p className="hero-status mono" data-intro><span className="status-pulse" aria-hidden="true" />Open to Q1/Q2 roles</p>
        </div>

        <div className="hero-copy">
          <p className="hero-statement" data-intro>
            Research-led product designer for healthcare and AI-assisted products. I turn complex, high-stakes workflows into interfaces people <em>trust.</em>
          </p>
          <div className="hero-actions" data-intro>
            <a href="#featured-work" className="btn btn-primary">See the work <ArrowDown size={15} weight="bold" /></a>
          </div>
        </div>

        <h1 id="hero-title" className="hero-title split" aria-label="Rewa Mehta">
          <span className="mask"><span className="hero-word"><FlexWord text="Rewa" /></span></span>
          <i className="split-rule hero-rule" aria-hidden="true" />
          <span className="mask"><span className="hero-word"><FlexWord text="Mehta" /></span></span>
        </h1>
      </div>
    </section>
  );
}
