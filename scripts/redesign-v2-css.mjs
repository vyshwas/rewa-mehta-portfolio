import { readFile, writeFile } from 'node:fs/promises';

const css = `

/* Visual direction v2: research notebook meets kinetic interface. */
body { background: var(--paper); }
body::before { content: ''; position: fixed; inset: 0; z-index: var(--z-overlay); background-image: url('/assets/noise.svg'); opacity: .055; pointer-events: none; mix-blend-mode: screen; }
.page-shell { min-height: 100dvh; transition: background-color .5s var(--ease-out), color .5s var(--ease-out); }
.site-header { position: relative; z-index: var(--z-local); border-bottom-color: var(--line); }
.wordmark { letter-spacing: -.075em; }
.wordmark-dot { color: var(--accent); }
.site-header nav a { position: relative; color: var(--muted); }
.site-header nav a::after { content: ''; position: absolute; right: 0; bottom: 6px; left: 0; height: 1px; background: var(--accent); transform: scaleX(0); transform-origin: right; transition: transform .3s var(--ease-out); }
.site-header nav a:hover { color: var(--ink); }
.site-header nav a:hover::after { transform: scaleX(1); transform-origin: left; }
.motion-button { color: var(--muted); }
.motion-button svg { color: var(--accent); }
.skip-link { background: var(--accent); color: var(--paper); }

.hero { position: relative; min-height: calc(100dvh - 92px); isolation: isolate; }
.hero::before { content: ''; position: absolute; z-index: -1; top: 0; right: var(--gutter); bottom: 0; left: var(--gutter); background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: clamp(70px, 10vw, 150px) clamp(70px, 10vw, 150px); opacity: .16; mask-image: linear-gradient(to bottom, transparent 0, black 18%, black 72%, transparent 100%); }
.hero-topline { color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }
.hero-name { font-weight: 500; text-shadow: 0 0 1px currentColor; }
.name-mehta .glyph { color: transparent; -webkit-text-stroke: 1.35px var(--ink); }
.name-mehta .glyph:hover { -webkit-text-stroke-color: var(--accent); }
.hero-rule { border-top-color: var(--accent); }
.hero-caption { color: var(--ink); }
.type-replay { color: var(--accent); }
.hero-manifesto h2 { font-family: var(--sans); font-weight: 500; letter-spacing: -.06em; }
.hero-manifesto h2 em { font-family: var(--serif); font-weight: 500; color: var(--accent); }
.hero-note { border-left: 1px solid var(--line); padding-left: 22px; }
.hero-note .small-label, .note-qualification { color: var(--muted); }
.text-link { border-bottom-color: var(--line); }
.text-link:hover { color: var(--accent); border-color: var(--accent); }
.paper-back { background: var(--accent-paper); }
.paper-front { background: var(--white); border-color: var(--accent); box-shadow: 16px 20px 0 rgb(0 0 0 / 18%); }
.preview-link { color: var(--accent); text-transform: uppercase; letter-spacing: .08em; }

.section-pad { border-top-color: var(--line); }
.section-heading { display: grid; grid-template-columns: minmax(0, 1.3fr) .7fr; align-items: end; gap: 8%; }
.section-heading h2 { font-size: clamp(60px, 7.1vw, 116px); line-height: .9; }
.section-heading h2 em { display: inline-block; color: var(--accent); line-height: 1.08; }
.section-heading p { margin: 0 0 8px; max-width: 34ch; line-height: 1.8; }
.work-toolbar { border-bottom: 1px solid var(--line); }
.work-filters button { color: var(--muted); }
.work-filters button[aria-pressed='true'] { color: var(--paper); border-color: var(--accent); background: var(--accent); }
.work-filters button:hover { color: var(--accent); }
.work-filters button[aria-pressed='true']:hover { color: var(--paper); }
.view-switch button[aria-pressed='true'] { background: var(--accent); color: var(--paper); }
.project-media { border: 1px solid var(--line); background: var(--media-bg); }
.project-media::after { content: ''; position: absolute; inset: 0; border: 1px solid transparent; transition: border-color .3s var(--ease-out); pointer-events: none; }
.project-media:hover::after { border-color: var(--accent); }
.project-open-cue, .inspect-toggle { background: var(--accent); color: var(--paper); }
.structure-lens { background: var(--accent-paper); color: var(--white); border-color: var(--accent); }
.structure-title em, .structure-nodes small { color: var(--accent); }
.structure-nodes span { border-color: rgb(255 255 255 / 38%); }
.project-caption h3 { font-family: var(--sans); font-weight: 500; letter-spacing: -.055em; }
.project-caption:hover h3, .margin-note em { color: var(--accent); }
.project-number { color: var(--accent); }
.project-category { text-transform: uppercase; letter-spacing: .08em; }
.margin-note { padding-left: 22px; border-left: 1px solid var(--accent); }

.practice { display: grid; grid-template-columns: .75fr 1.25fr; column-gap: 8%; align-items: start; }
.practice-heading { position: sticky; top: 50px; }
.practice-heading h2 { font: 500 clamp(54px, 6.2vw, 98px)/.95 var(--serif); letter-spacing: -.055em; margin-top: 28px; }
.practice-heading h2 em { color: var(--accent); line-height: 1.08; }
.practice-heading > p { max-width: 39ch; color: var(--muted); font-size: 12px; line-height: 1.85; margin-top: 28px; }
.practice-workbench { display: grid; grid-template-columns: minmax(150px, .42fr) 1fr; min-height: 610px; border: 1px solid var(--line); background: var(--media-bg); }
.practice-tabs { border-right: 1px solid var(--line); }
.practice-tabs button { width: 100%; min-height: 92px; display: grid; grid-template-columns: 30px 1fr auto; gap: 12px; align-items: center; padding: 20px; color: var(--muted); text-align: left; border-bottom: 1px solid var(--line); transition: color .25s, background-color .25s; }
.practice-tabs button span { font-family: var(--serif); font-size: 15px; }
.practice-tabs button strong { font-size: 11px; font-weight: 500; }
.practice-tabs button[aria-selected='true'] { color: var(--paper); background: var(--accent); }
.practice-tabs button:not([aria-selected='true']):hover { color: var(--accent); }
.practice-tabs button:active { transform: translateY(1px); }
.practice-canvas { display: flex; min-width: 0; flex-direction: column; padding: clamp(28px, 4vw, 60px); background-color: var(--accent-paper); background-image: radial-gradient(rgb(255 255 255 / 24%) 1px, transparent 1px); background-size: 22px 22px; color: var(--white); overflow: hidden; }
.practice-canvas-top { display: flex; align-items: center; justify-content: space-between; color: var(--accent); font-size: 10px; text-transform: uppercase; letter-spacing: .12em; }
.practice-canvas h3 { max-width: 12ch; margin-top: 56px; font: 500 clamp(38px, 4.4vw, 70px)/.95 var(--sans); letter-spacing: -.065em; text-wrap: balance; }
.practice-canvas > p { max-width: 56ch; margin-top: 24px; color: rgb(255 255 255 / 78%); line-height: 1.85; font-size: 12px; }
.practice-map { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 54px; }
.practice-node { position: relative; min-width: 0; border-top: 1px solid rgb(255 255 255 / 38%); padding: 16px 10px 0 0; }
.practice-node::before { content: ''; position: absolute; top: -5px; left: 0; width: 9px; height: 9px; border: 1px solid var(--accent); background: var(--accent-paper); border-radius: var(--radius-pill); }
.practice-node span { display: block; color: var(--accent); font-size: 9px; }
.practice-node strong { display: block; margin-top: 9px; padding-right: 18px; font-size: 10px; font-weight: 500; line-height: 1.5; }
.practice-proof { display: flex; justify-content: space-between; gap: 24px; margin-top: auto; padding-top: 36px; border-top: 1px solid rgb(255 255 255 / 22%); font-size: 10px; }
.practice-proof span { color: rgb(255 255 255 / 60%); }
.practice-proof strong { color: var(--accent); font-weight: 500; text-align: right; }

.about-statement em, .contact-headline h2 em { color: var(--accent); }
.about-content .about-lead { color: var(--ink); }
.experience > div { transition: color .2s, padding-left .2s; }
.experience > div:hover { color: var(--accent); padding-left: 9px; }
.contact { position: relative; }
.contact::before { content: 'AVAILABLE'; position: absolute; right: 0; bottom: 20%; color: transparent; -webkit-text-stroke: 1px var(--line); font: 700 clamp(80px, 15vw, 240px)/1 var(--sans); letter-spacing: -.08em; opacity: .5; pointer-events: none; }
.contact-headline, .contact-links { position: relative; z-index: 1; }
.contact-headline > svg { color: var(--accent); }
.copy-button { border-color: var(--line); }
.copy-button:hover { color: var(--paper); background: var(--accent); border-color: var(--accent); }
.copy-status { color: var(--accent); }

.case-dialog { color: var(--ink); background: var(--paper); }
.case-top { background: var(--paper); }
.flow-node { background: var(--paper); border-color: var(--ink); }
.flow-node[aria-pressed='true'] { background: var(--accent); color: var(--paper); border-color: var(--accent); }
.flow-node:not(:last-child)::after { background: var(--ink); }
.button-dark { color: var(--paper); background: var(--accent); }
.lookbook-back { background: var(--accent-paper); }
.lookbook-back em { color: var(--accent); }
.lookbook-front { color: #11162a; background: var(--white); border-color: var(--accent); }

@media (max-width: 1100px) {
  .practice { column-gap: 5%; }
  .practice-workbench { grid-template-columns: 150px 1fr; }
  .practice-tabs button { grid-template-columns: 25px 1fr; }
  .practice-tabs button svg { display: none; }
}
@media (max-width: 767px) {
  body::before { opacity: .035; }
  .site-header nav { gap: 17px; }
  .site-header nav a:nth-child(2) { display: none; }
  .hero { min-height: auto; }
  .hero::before { right: var(--gutter); left: var(--gutter); opacity: .1; }
  .name-mehta .glyph { -webkit-text-stroke-width: .75px; }
  .hero-note { padding-left: 15px; }
  .paper-front { box-shadow: 8px 10px 0 rgb(0 0 0 / 18%); }
  .section-heading { display: block; }
  .section-heading h2 { font-size: 58px; }
  .section-heading p { margin-top: 18px; }
  .practice { display: block; }
  .practice-heading { position: static; }
  .practice-heading h2 { font-size: 56px; }
  .practice-workbench { display: block; min-height: auto; margin-top: 34px; }
  .practice-tabs { display: grid; grid-template-columns: repeat(3, 1fr); border-right: 0; border-bottom: 1px solid var(--line); }
  .practice-tabs button { min-height: 70px; display: flex; justify-content: center; padding: 12px 8px; border-right: 1px solid var(--line); border-bottom: 0; }
  .practice-tabs button span, .practice-tabs button svg { display: none; }
  .practice-canvas { min-height: 550px; padding: 28px 22px; }
  .practice-canvas h3 { font-size: 44px; margin-top: 44px; }
  .practice-map { grid-template-columns: 1fr 1fr; gap: 24px 0; }
  .practice-proof { align-items: flex-start; flex-direction: column; gap: 8px; }
  .practice-proof strong { text-align: left; }
  .contact::before { bottom: 30%; }
}
`;

const path = 'src/styles.css';
let source = await readFile(path, 'utf8');
const marker = '/* Visual direction v2:';
if (source.includes(marker)) source = source.slice(0, source.indexOf(marker)).trimEnd();
await writeFile(path, source + css);

let html = await readFile('index.html', 'utf8');
html = html.replace('<meta name="theme-color" content="#f3f1e9" />', '<meta name="theme-color" content="#0d1429" />');
await writeFile('index.html', html);
