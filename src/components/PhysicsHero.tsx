'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ArrowsClockwise } from '@phosphor-icons/react';
import type Matter from 'matter-js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMotion } from '../motion';
import { asset } from '../data';

type Glyph = { el: HTMLElement; body: Matter.Body; home: Matter.Vector; anchor: Matter.Constraint; width: number; height: number };

export default function PhysicsHero() {
  const stage = useRef<HTMLDivElement>(null);
  const replay = useRef<() => void>(() => {});
  const { enabled, settleScroll } = useMotion();
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const el = stage.current;
    if (!el || !enabled || !window.matchMedia('(pointer: fine)').matches) return;
    let disposed = false;
    let teardown = () => {};
    Promise.all([document.fonts.ready, import('matter-js')]).then(([, module]) => {
      if (disposed) return;
      const Matter = module.default;
      const { Engine, Bodies, Body, Composite, Constraint } = Matter;
      const engine = Engine.create({ enableSleeping: true, gravity: { x: 0, y: 0.18, scale: 0.001 } });
      let glyphs: Glyph[] = [];
      let running = true;
      let visible = true;
      let grabbed: Glyph | undefined;
      let pointerId: number | undefined;
      let drag: Matter.Constraint | null = null;
      let snap: gsap.core.Tween | null = null;
      let previousWidth = 0;
      const letters = Array.from(el.querySelectorAll<HTMLElement>('[data-glyph]'));
      const release = () => {
        if (drag) Composite.remove(engine.world, drag);
        if (grabbed) grabbed.anchor.stiffness = 0.012;
        if (pointerId !== undefined && el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
        drag = null; grabbed = undefined; pointerId = undefined;
        el.classList.remove('is-dragging');
      };
      const measure = () => {
        release(); snap?.kill();
        gsap.set(letters, { clearProps: 'transform' });
        Composite.clear(engine.world, false);
        const bounds = el.getBoundingClientRect();
        previousWidth = bounds.width;
        glyphs = letters.map((letter, index) => {
          const rect = letter.getBoundingClientRect();
          const home = { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 };
          const body = Bodies.rectangle(home.x, home.y, rect.width * 0.82, rect.height * 0.66, {
            frictionAir: 0.065, restitution: 0.55, density: 0.001, label: `letter-${index}`,
          });
          const anchor = Constraint.create({ pointA: home, bodyB: body, length: 0, stiffness: 0.012, damping: 0.12 });
          Composite.add(engine.world, [body, anchor]);
          if (running) {
            Body.setAngle(body, Math.sin(index * 4) * 0.10);
            Body.setVelocity(body, { x: Math.sin(index * 7) * 3, y: -2 - index % 3 });
          }
          return { el: letter, body, home, anchor, width: rect.width, height: rect.height };
        });
        const w = bounds.width, h = bounds.height;
        Composite.add(engine.world, [
          Bodies.rectangle(w / 2, h + 40, w + 160, 80, { isStatic: true }),
          Bodies.rectangle(w / 2, -40, w + 160, 80, { isStatic: true }),
          Bodies.rectangle(-40, h / 2, 80, h + 160, { isStatic: true }),
          Bodies.rectangle(w + 40, h / 2, 80, h + 160, { isStatic: true }),
        ]);
      };
      const lock = () => {
        if (!running) return;
        running = false; release(); setLocked(true);
        snap = gsap.fromTo(letters, { x: i => glyphs[i].body.position.x - glyphs[i].home.x, y: i => glyphs[i].body.position.y - glyphs[i].home.y, rotation: i => glyphs[i].body.angle * 180 / Math.PI }, { x: 0, y: 0, rotation: 0, duration: 0.9, stagger: 0.025, ease: 'power4.inOut' });
      };
      const scatter = () => {
        settleScroll();
        snap?.kill(); running = true; setLocked(false);
        glyphs.forEach((g, i) => {
          Body.setPosition(g.body, g.home);
          Body.setVelocity(g.body, { x: Math.sin(i * 2.1) * 12, y: -6 - (i % 3) * 3 });
          Body.setAngularVelocity(g.body, (i % 2 ? 1 : -1) * 0.11);
          Matter.Sleeping.set(g.body, false);
        });
      };
      replay.current = scatter;
      const point = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
      };
      const down = (event: PointerEvent) => {
        if (event.button !== 0 || !running || pointerId !== undefined) return;
        const target = (event.target as HTMLElement).closest('[data-glyph]');
        const glyph = glyphs.find(g => g.el === target);
        if (!glyph) return;
        event.preventDefault(); grabbed = glyph; pointerId = event.pointerId;
        glyph.anchor.stiffness = 0;
        Matter.Sleeping.set(glyph.body, false);
        drag = Constraint.create({ pointA: point(event), bodyB: glyph.body, length: 0, stiffness: 0.15, damping: 0.08 });
        Composite.add(engine.world, drag);
        el.setPointerCapture(event.pointerId); el.classList.add('is-dragging');
      };
      const move = (event: PointerEvent) => { if (drag && pointerId === event.pointerId) drag.pointA = point(event); };
      const up = (event: PointerEvent) => { if (event.pointerId === pointerId) release(); };
      const tick = (_time: number, delta: number) => {
        if (!running || !visible || document.hidden) return;
        Engine.update(engine, Math.min(delta, 1000 / 60));
        glyphs.forEach(g => {
          g.el.style.transform = `translate3d(${g.body.position.x - g.home.x}px,${g.body.position.y - g.home.y}px,0) rotate(${g.body.angle}rad)`;
        });
      };
      measure();
      const trigger = ScrollTrigger.create({ trigger: '#hero', start: 0, end: 24, onUpdate: self => { if (self.progress > 0.02 && self.direction > 0) lock(); } });
      if (window.scrollY > 24) lock();
      const observer = new ResizeObserver(() => { if (Math.abs(el.getBoundingClientRect().width - previousWidth) > 1) measure(); });
      observer.observe(el);
      const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; });
      visibility.observe(el);
      el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
      gsap.ticker.add(tick);
      teardown = () => {
        release(); trigger.kill(); observer.disconnect(); visibility.disconnect(); gsap.ticker.remove(tick);
        snap?.kill(); Composite.clear(engine.world, false); Engine.clear(engine);
        el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('lostpointercapture', up);
        gsap.set(letters, { clearProps: 'transform' }); replay.current = () => {};
      };
    }).catch(error => { if (!disposed) { console.error('Typography physics could not load', error); el.dataset.physics = 'unavailable'; } });
    return () => { disposed = true; teardown(); };
  }, [enabled]);

  return <section id="hero" className="hero" aria-labelledby="hero-heading">
    <div className="hero-halftone-bg" aria-hidden="true">
      <div className="hero-gradient-layer"></div>
      <div className="hero-grid-layer"></div>
      <div className="hero-vignette"></div>
    </div>
    <div className="hero-topline"><span>Product designer / researcher / visual thinker</span><span>Currently in New Delhi, India</span></div>
    <div className="type-stage" ref={stage} data-locked={locked}>
      <h1 id="hero-heading" className="hero-name" aria-label="Rewa Mehta">
        {['Rewa', 'Mehta'].map(word => <span className={`name-word name-${word.toLowerCase()}`} aria-hidden="true" key={word}>
          {[...word].map((letter, i) => <span className="glyph" data-glyph key={i}>{letter}</span>)}
        </span>)}
      </h1>
    </div>
    <div className="hero-rule"><span className="hero-caption">Complicated systems. Clearer human decisions.</span>
      {enabled && <button className="type-replay" onClick={() => replay.current()}><ArrowsClockwise size={15} />{locked ? 'Scatter the type' : 'Grab a letter. Make a little mess.'}</button>}
    </div>
    <div className="hero-bottom">
      <div className="hero-manifesto"><h2>I make complicated<br />things feel <em>obvious.</em></h2><a className="text-link" href="#work">See the work <ArrowDownRight size={22} /></a></div>
      <div className="hero-note"><span className="small-label">The short version</span><p>I’m Rewa. I combine field research, systems thinking, and visual precision to design products people can understand under pressure.</p><span className="note-qualification">M.Des · NIFT New Delhi</span></div>
      <a href="#work" className="hero-preview" aria-label="Explore PelvicAI Health and selected projects">
        <div className="preview-paper paper-back"></div><div className="preview-paper paper-front"><img src={asset("assets/projects/pelvic-care.svg")} alt="PelvicAI Health concept illustration" width="400" height="300" fetchPriority="high" /></div>
        <span className="preview-link">Featured: PelvicAI Health <ArrowUpRight size={16} /></span>
      </a>
    </div>
  </section>;
}
