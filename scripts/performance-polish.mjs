import { readFile, writeFile } from 'node:fs/promises';
let hero = await readFile('src/components/PhysicsHero.tsx', 'utf8');
hero = hero.replace("import Matter from 'matter-js';", "import type Matter from 'matter-js';")
  .replace('const { Engine, Bodies, Body, Composite, Constraint } = Matter;\n', '')
  .replace('document.fonts.ready.then(() => {', "Promise.all([document.fonts.ready, import('matter-js')]).then(([, module]) => {")
  .replace('      const engine = Engine.create', '      const Matter = module.default;\n      const { Engine, Bodies, Body, Composite, Constraint } = Matter;\n      const engine = Engine.create');
// Physics is optional; a chunk failure leaves a readable, working portfolio.
hero = hero.replace('    });\n    return () => { disposed = true; teardown(); };', "    }).catch(error => { if (!disposed) { console.error('Typography physics could not load', error); el.dataset.physics = 'unavailable'; } });\n    return () => { disposed = true; teardown(); };");
await writeFile('src/components/PhysicsHero.tsx', hero);
let app = await readFile('src/App.tsx', 'utf8');
app = app.replace("<span>Motion {enabled ? 'on' : 'off'}</span>", "<span>{enabled ? 'Pause motion' : 'Enable motion'}</span>");
await writeFile('src/App.tsx', app);
let html = await readFile('index.html', 'utf8');
html = html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />
<link rel="preload" href="/node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-italic.woff2" as="font" type="font/woff2" crossorigin />`);
await writeFile('index.html', html);
let tests = await readFile('tests/portfolio.spec.ts', 'utf8');
tests = tests.replace("  const box = (await glyph.boundingBox())!;", "  await expect(glyph).not.toHaveCSS('transform', 'none');\n  const box = (await glyph.boundingBox())!;");
await writeFile('tests/portfolio.spec.ts', tests);
