import { ArrowDownRight, Compass, Sparkle } from '@phosphor-icons/react';
import { projects } from '../data';

export default function MinimalHero() {
  return (
    <section id="hero" className="hero-dreamscape" aria-labelledby="hero-title">
      <div className="hero-backdrop" />
      <div className="hero-overlay" />
      
      <div className="hero-content">
        <div className="hero-tags-row">
          <div className="pill-tag">
            <span className="status-pulse" />
            <span>Product Designer & Researcher</span>
          </div>
          <div className="pill-tag">
            <Sparkle size={13} weight="fill" color="#38bdf8" />
            <span>New Delhi, IN</span>
          </div>
          <div className="pill-tag">
            <span>NIFT M.Des</span>
          </div>
        </div>

        <h1 id="hero-title" className="luminous-title">
          REWA MEHTA
        </h1>

        <p className="lead-text hero-description">
          Science graduate turned UX researcher. I went from test tubes to Figma — bringing scientific rigor, deep empathy, and clarity to digital products.
        </p>

        <div className="hero-cta-group">
          <a href="#featured-work" className="btn-pill-solid">
            Explore Work <ArrowDownRight size={16} weight="bold" />
          </a>
          <a href="#contact" className="btn-pill-glass">
            Get in Touch
          </a>
        </div>
      </div>

      <div className="hero-footer-bar">
        <div className="mono-muted">
          <span>COORDINATES: 28.6139° N, 77.2090° E · 2024–2025</span>
        </div>
        <a className="hero-work-link mono-label" href="#featured-work">
          <span>FEATURED WORK ({String(projects.length + 1).padStart(2, '0')})</span>
          <ArrowDownRight size={15} />
        </a>
      </div>
    </section>
  );
}
