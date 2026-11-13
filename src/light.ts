import { gsap } from 'gsap';

// One light source for the whole page. Sections name a scene with data-light; the stage re-lights
// when a section crosses the middle of the screen. The hero scrub also closes the aperture (`close`).
export const light = {
  ring: 1, rad: 0.36, rx: 0.5, ry: 0.52, rs: 1.55, rw: 0.17,
  beam: 0, bx: 1.02, by: 1.05, ba: -2.36, bw: 0.07, warm: 0,
  aperture: 1, close: 0, expo: 1.25, fade: 0,
};
type LightState = Partial<typeof light>;

// Positions are 0..1 across the screen (y = 1 is the top). Beam angle is in radians.
export const scenes: Record<string, LightState> = {
  aperture: { ring: 1, rad: 0.35, rx: 0.5, ry: 0.52, rw: 0.13, beam: 0, aperture: 1, expo: 1.05 },
  beam:     { ring: 0, beam: 1, bx: 1.04, by: 1.08, ba: -2.42, bw: 0.07, warm: 0, aperture: 0, expo: 1.15 },
  // The whole stage is lit in cobalt; the warm ember beam was retired (2026-10-18, user: "make that blue only").
  streak:   { ring: 0, beam: 1, bx: 0.66, by: 1.12, ba: -2.02, bw: 0.06, warm: 0, aperture: 0, expo: 1.2 },
  sweep:    { ring: 0, beam: 0.9, bx: -0.04, by: -0.1, ba: 0.78, bw: 0.07, warm: 0, aperture: 0, expo: 1.1 },
  dim:      { ring: 0.4, rad: 0.5, rx: 1.02, ry: 0.86, rw: 0.2, beam: 0, aperture: 0, expo: 1 },
  low:      { ring: 0.3, rad: 0.42, rx: -0.02, ry: 0.12, rw: 0.2, beam: 0, aperture: 0, expo: 1 },
  dawn:     { ring: 1, rad: 0.38, rx: 0.5, ry: 0.5, rw: 0.14, beam: 0, aperture: 0, expo: 1.05 },
};

export function setScene(name: string, animate: boolean) {
  const target = scenes[name];
  if (!target) return;
  gsap.killTweensOf(light, Object.keys(target).join(','));
  if (!animate) Object.assign(light, target);
  else if (target.warm !== undefined && target.warm !== light.warm && light.beam > 0.05) {
    // Cobalt and ember never blend (that would read as violet): the beam goes dark, changes colour, relights.
    const { beam = 0, warm, ...rest } = target;
    gsap.timeline()
      .to(light, { beam: 0, duration: 0.8, ease: 'power2.in' })
      .set(light, { warm })
      .to(light, { ...rest, beam, duration: 1.6, ease: 'power2.out' });
  } else gsap.to(light, { ...target, duration: 2.2, ease: 'power2.inOut' });
  window.dispatchEvent(new Event('lightchange'));
}
