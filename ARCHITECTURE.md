# Minimal cobalt portfolio

## Direction

The latest user request is a minimal cobalt hero. Oversized Manrope is split into two offset lines, above a short product-designer introduction and a selected-work link. The supporting sections keep their existing cool surfaces and blue typography.

The opening comment in `index.html` records the direction, seed `rewa-cobalt-type`, and three researched references.

## Runtime

React and TypeScript run through Vite. Native CSS provides layouts and shared tokens. Fonts are locally bundled Fontsource Bricolage Grotesque and Manrope. Phosphor supplies the icon family. GSAP/ScrollTrigger provides modest heading movement; scrolling remains native.

`MotionProvider` tracks the explicit motion preference and temporary suspension while a case study is open. OS reduced-motion changes are observed. Continuous animation values are kept outside React state.

The hero is semantic HTML and CSS, with one brief transform animation. OS reduced motion disables it. The explicit motion control sits in the footer; no continuous animation or WebGL is used in the hero. Desktop type is capped on short screens so the selected-work link stays visible. Mobile keeps the offset title and stacks the lower introduction and action.

The previous GardenHero implementation and related source are backed up in `.verification/before-minimal-hero/`. Its full-screen image preloads have been removed from `index.html`.

## Components and behavior

| Area | Behavior |
| --- | --- |
| Header | Fixed navigation changes color after the hero. Mobile disclosure menu supports Escape and closes after selection. |
| Work | Six projects; All/Product/Research/Visual filters; grid/list choices; expandable journey preview. Category metadata sits below titles and descriptions. |
| Case studies | Lazy-loaded native dialogs contain project question, response, concept illustration, and four-step journey. Escape, close button, and backdrop dismiss. Focus returns to the opener. |
| Journey | Pointer drag, arrow-key pan, explicit directional/reset controls, and selectable steps. |
| Approach | Three tabs support arrows, Home, End, and roving focus. |
| Contact | Existing mailto destinations and social links. Clipboard success and failure are announced. |

## Content boundaries

Project copy and background facts come from the incumbent portfolio. Existing SVG artwork is explicitly described as concept illustration. The unrelated pre-existing hardware photographs remain legacy assets and are not used in the redesigned page. No new client outcomes or impact metrics were added.

The garden artwork appears only in the biography and social preview. The biography image has descriptive alternative text. The original designer portrait was not available; no invented portrait is presented.

## Assets

- `public/assets/garden/cobalt-garden.png`: original landscape.
- `public/assets/garden/cobalt-garden-mobile.png`: retained portrait artwork from the previous version.
- `public/assets/garden/cloud.png`: retained cloud artwork from the previous version.
- Matching `.prompt.txt` files preserve exact generation instructions.
- PNG metadata also carries these prompts. Retained JPEG metadata records its pre-existing, unknown origin.

## Development

The local server uses port 5186 to avoid the occupied 5173/5174 ports. The production output is `dist/`. Browser tests run against the same local port. Source files for the retired physics hero and old root-level static assets are historical remnants, not part of the rendered application.

The current design system is documented in `DESIGN.md`; current browser evidence lives in `.impeccable/review/minimal/`.
