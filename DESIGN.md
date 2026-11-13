---
name: Rewa Mehta · Aperture
description: From test tubes to Figma — a dark stage lit by one light source, composed on an invisible four-column field.
colors:
  stage: "#06070b"
  stage-1: "#0c0e15"
  stage-2: "#141722"
  paper: "#f2f1ec"
  cobalt: "#3553ff"
  cobalt-deep: "#2238d6"
  cobalt-soft: "#8e9dff"
  ember: "#ff5b24"
  ember-soft: "#ff9b72"
typography:
  name:
    fontFamily: "'Inter Tight Variable', sans-serif"
    fontSize: "clamp(64px, 13.4vw, 250px)"
    fontWeight: 500
    lineHeight: 0.86
    letterSpacing: "-0.06em"
  wordmark:
    fontFamily: "'Inter Tight Variable', sans-serif"
    fontSize: "clamp(56px, 12.6vw, 236px)"
    fontWeight: 500
  display:
    fontFamily: "'Inter Tight Variable', sans-serif"
    fontSize: "clamp(52px, 8.4vw, 150px)"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "-0.055em"
  index:
    fontFamily: "'Inter Tight Variable', sans-serif"
    fontSize: "clamp(40px, 6vw, 104px)"
    fontWeight: 500
  headline:
    fontFamily: "'Inter Tight Variable', sans-serif"
    fontSize: "clamp(32px, 4.4vw, 72px)"
    fontWeight: 500
    lineHeight: 1.02
  title:
    fontFamily: "'Inter Tight Variable', sans-serif"
    fontSize: "clamp(24px, 2.2vw, 34px)"
    fontWeight: 500
  deck:
    fontFamily: "'Inter Tight Variable', sans-serif"
    fontSize: "clamp(22px, 2vw, 32px)"
    fontWeight: 400
  plate:
    fontFamily: "'Inter Tight Variable', sans-serif"
    fontSize: "clamp(28px, 3.4vw, 56px)"
  subtitle:
    fontSize: "clamp(19px, 1.6vw, 24px)"
  lead:
    fontFamily: "'Inter Variable', sans-serif"
    fontSize: "clamp(17px, 1.3vw, 20px)"
  brand:
    fontSize: "17px"
  body:
    fontFamily: "'Inter Variable', sans-serif"
    fontSize: "16px"
  note:
    fontSize: "15px"
  small:
    fontSize: "14px"
  mono:
    fontFamily: "'IBM Plex Mono', monospace"
    fontSize: "12px"
    textTransform: uppercase
  caption:
    fontSize: "12px"
  label:
    fontSize: "11px"
  accent:
    fontFamily: "'Instrument Serif', serif"
    fontStyle: italic
rounded:
  pill: "999px"
  sm: "8px"
  md: "16px"
  lg: "28px"
---

# Rewa Mehta · Aperture

## Thesis
A scientist's portfolio lit like an instrument. One light source on a near-black stage; the page is composed on a four-column field that stays invisible (the drawn grid lines and "+" marks were removed 2026-10-01 at the user's request). References: the *hedge* and *Heather* Framer templates (glow ring, split headline joined by a rule, exposed grid, mono lists), Swiss-style exposed grids.

## Signatures
- **Chapter opener** — every section starts the same way: a full-width rule drawn left to right, a large Instrument Serif italic numeral (01–06) in col 1, the section name at display size in cols 2–4, one short mono note. This is the only section-break cue; don't add a second one.
- **Positioning statement** — hero, cols 2–4: "Research-led product designer for healthcare and AI-assisted products. I turn complex, high-stakes workflows into interfaces people *trust.*"
- **Restraint** — one short line per item; no fact rows, captions or duplicate buttons. The hero holds only: mono line + availability, statement, one button, the name.
- **Split title** — "Word ——— Word": halves pushed to the edges, joined by a drawn hairline. Used for the hero name, the featured case, the footer wordmark.
- **One italic serif word** — Instrument Serif italic as the accent voice inside Inter Tight titles.
- **Mono labels** — IBM Plex Mono uppercase for every chapter head, index number and caption.
- **Hand-drawn marks** — the only warm colour left on the page: an ember loop around *people*, an underline under *calm*, and four line drawings for the principles; each is drawn in on scroll (the human counterweight to the grid).

## Light (src/light.ts, src/components/Light.tsx)
A WebGL fragment shader at half resolution (0.35 on phones): a soft cobalt ring (the aperture) and/or a streak of cobalt light, fbm-distorted, filmic tone-mapped, vignetted. Sections choose a scene with `data-light`:
aperture (hero, manifesto) · beam (featured) · streak (index) · sweep (approach, from lower-left) · dim · low · dawn (contact, ring returns).
Rule: **the light is blue only.** The red-orange ember beam was retired on 2026-10-18 at the user's request ("make that blue only"); don't bring a warm streak back. Ember survives only in the small hand-drawn scribbles and glyphs. Fallback without WebGL: CSS radial ring.

## Motion (src/motion.tsx)
Intro: light fades up, grid lines ruled, rule drawn from centre, name rises from masks, mono list typed in. Hero pin: the aperture closes into a slit while the name's rule rises to the centre and dissolves into it. Manifesto pin: word-by-word light-up with the scribbles drawn in time. Featured frame opens from a window. Headings rise from masks; split rules draw outward. Index: floating preview follows the cursor (hover devices only; inline thumbnails on touch). Reduced motion / Motion: Off removes all of it and redraws the light only on scene change.

## Flexing letters (src/fx.tsx) — added 2026-10-18
The sans words of the hero name, "Let's" and the footer "Rewa" are split into letters whose weight swells from 500 to ~880 as the pointer nears (Inter Tight is variable). Never on the Instrument Serif words: it has no weight axis and would fake-bold. Off for touch and for reduced motion / Motion: Off.

**Rejected by the user (2026-10-18, "i don't like these effects") — don't reintroduce:** headings that skew with scroll speed; cards or the featured screen tilting toward the pointer, and the glint on it; outlined (hollow) text on non-hovered index rows; a preview that swings with cursor speed; giant outlined numerals.

## Space
The user found the page congested (2026-10-18). Section padding is `clamp(180px, 32vh, 360px)`, openers have ~18vh beneath them, work rows ~8vh of padding. Case-study content uses hairlines and space, not boxed cards. Keep it this open; add space before adding containers.

## Rules honoured
No sideways-scrolling type (marquee and film strip removed). Body text left-aligned. Radius scale pill/sm/md/lg only. Gradients appear only as the light and as legibility scrims, never as surface decoration.
