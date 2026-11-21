import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { light } from './light';
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

// One smooth-scroll instance for the page; the case-study dialog pauses it through `suspend`.
let lenis: Lenis | null = null;
// The title sequence plays once per visit, not every time motion is re-enabled.
let introPlayed = false;
// Everything the choreography writes inline styles to. Cleared on teardown so a motion-off page
// (or React's dev double-mount) never inherits a half-played state such as dimmed manifesto words.
const ANIMATED = '.hero-title, .hero-title .mask, .hero-word, .hero-rule, [data-intro], .hero-row, .hero-copy, .site-nav, .mf-word, .scribble path, .feature-frame, .feature-img, .rise, .split-rule, .opener-rule, .glyph path, [data-parallax], [data-reveal], .scroll-progress';

const MotionContext = createContext({ enabled: false, toggle: () => {}, settleScroll: () => {}, suspend: (_value: boolean) => {} });
export const useMotion = () => useContext(MotionContext);

export function MotionProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setEnabled(!query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useLayoutEffect(() => { document.documentElement.dataset.motion = enabled ? 'on' : 'off'; }, [enabled]);
  const toggle = useCallback(() => setEnabled(value => !value), []);
  const suspend = useCallback((value: boolean) => { if (value) lenis?.stop(); else lenis?.start(); }, []);
  return <MotionContext.Provider value={{ enabled, toggle, suspend, settleScroll: () => {} }}>{children}</MotionContext.Provider>;
}

function playIntro() {
  if (introPlayed) return;
  // Marked played only on completion, so a teardown mid-sequence lets it play again next mount.
  // Light comes up, the line is drawn, the name is set, then the small type is typed in.
  gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => { introPlayed = true; } })
    .fromTo(light, { fade: 1 }, { fade: 0, duration: 3, ease: 'power2.inOut' }, 0)
    .from('.site-nav', { opacity: 0, y: -14, duration: 1.2 }, 1.5);
}

function scenes(wide: boolean) {
  // The short version: the manifesto lights up word by word; each hand-drawn mark is drawn as its word arrives.
  const words = gsap.utils.toArray<HTMLElement>('.mf-word');
  const statement = gsap.timeline({
    scrollTrigger: wide
      ? { trigger: '.manifesto', start: 'top top', end: '+=150%', pin: true, scrub: 0.6 }
      : { trigger: '.manifesto-text', start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
  }).fromTo(words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: 'none', duration: 0.1 }, 0);
  words.forEach((word, index) => {
    const path = word.querySelector('.scribble path');
    if (path) statement.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'power1.inOut', duration: 0.5 }, index * 0.1 + 0.05);
  });

  // The featured frame opens from a window to the full field.
  gsap.timeline({ scrollTrigger: { trigger: '.feature-frame', start: 'top 92%', end: 'top 18%', scrub: 0.8 } })
    .fromTo('.feature-frame', { clipPath: 'inset(10% 18% 10% 18% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', ease: 'none' }, 0)
    .fromTo('.feature-img', { scale: 1.3 }, { scale: 1, ease: 'none' }, 0);
}

export function ScrollChoreography({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const { enabled } = useMotion();
  useLayoutEffect(() => {
    const element = root.current;
    if (!enabled || !element) return;
    document.documentElement.dataset.motion = 'on';

    const instance = new Lenis({ lerp: 0.085, anchors: true, autoRaf: false });
    lenis = instance;
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const mm = gsap.matchMedia(element);
    mm.add({ wide: '(min-width: 901px)', narrow: '(max-width: 900px)' }, context => {
      const { wide } = context.conditions as { wide: boolean };
      playIntro();
      scenes(wide);

      // Headings rise out of their masks; split rules draw outward from the middle.
      gsap.utils.toArray<HTMLElement>('[data-rise]').forEach(heading => {
        const trigger = { trigger: heading, start: 'top 88%', once: true };
        gsap.from(heading.querySelectorAll('.rise'), { yPercent: 115, duration: 1.4, stagger: 0.09, ease: 'expo.out', scrollTrigger: trigger });
        const splitRule = heading.querySelector('.split-rule');
        if (splitRule) gsap.from(splitRule, { scaleX: 0, duration: 1.6, ease: 'expo.inOut', scrollTrigger: trigger });
        // A chapter's opening rule is drawn left to right.
        const openerRule = heading.querySelector('.opener-rule');
        if (openerRule) {
          gsap.from(openerRule, { scaleX: 0, transformOrigin: 'left center', duration: 1.4, ease: 'expo.inOut', scrollTrigger: trigger });
        }
      });
      // Each principle's line drawing is drawn in as its column arrives.
      gsap.utils.toArray<HTMLElement>('.method-col').forEach(column => {
        gsap.fromTo(column.querySelectorAll('.glyph path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, stagger: 0.12, ease: 'power2.inOut', scrollTrigger: { trigger: column, start: 'top 85%', once: true } });
      });
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach(layer => {
        gsap.fromTo(layer, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: layer.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(item => {
        gsap.from(item, { y: 40, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: item, start: 'top 90%', once: true } });
      });
      gsap.fromTo('.scroll-progress', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: 0.3 } });
    });

    // Keyboard focus always brings its element on screen; smooth scroll would otherwise pull the page back.
    const focus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!target?.getBoundingClientRect || target.closest('dialog')) return;
      const box = target.getBoundingClientRect();
      // The browser may already have scrolled the element into view; settle Lenis there so an
      // unfinished smooth scroll doesn't drag the page back off the focused element.
      const top = box.top >= 80 && box.bottom <= window.innerHeight - 20 ? window.scrollY : window.scrollY + box.top - window.innerHeight * 0.35;
      instance.scrollTo(top, { immediate: true });
    };
    document.addEventListener('focusin', focus);

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    let live = true;
    const refresh = () => { if (live) ScrollTrigger.refresh(); };
    document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => {
      live = false;
      document.removeEventListener('focusin', focus);
      window.removeEventListener('load', refresh);
      mm.revert();
      gsap.set(document.querySelectorAll(ANIMATED), { clearProps: 'all' });
      light.close = 0; light.fade = 0;
      window.dispatchEvent(new Event('lightchange'));
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, [enabled]);
  return <div className="page-shell" ref={root}>{children}</div>;
}
