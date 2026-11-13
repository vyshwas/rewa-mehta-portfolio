import { readFile, writeFile, readdir } from 'node:fs/promises';
const edit = async (file, replacements) => {
  let text = await readFile(file, 'utf8');
  for (const [from, to] of replacements) {
    if (!text.includes(from)) throw new Error(`Missing replacement in ${file}: ${from.slice(0, 60)}`);
    text = text.replace(from, to);
  }
  await writeFile(file, text);
};
await edit('src/motion.tsx', [
  ['enabled: false, toggle: () => {}, suspend:', 'enabled: false, toggle: () => {}, settleScroll: () => {}, suspend:'],
  ['value={{ enabled, toggle:', 'value={{ enabled, settleScroll: () => lenis.current?.scrollTo(window.scrollY, { immediate: true, force: true }), toggle:'],
]);
await edit('src/components/PhysicsHero.tsx', [
  ['const { enabled } = useMotion();', 'const { enabled, settleScroll } = useMotion();'],
  ['      const scatter = () => {\n        snap?.kill();', '      const scatter = () => {\n        settleScroll();\n        snap?.kill();'],
]);
for (const name of await readdir('public/assets/projects')) {
  if (!name.endsWith('.svg')) continue;
  const file = `public/assets/projects/${name}`;
  let svg = (await readFile(file, 'utf8')).replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-f]+;)/gi, '&amp;');
  if (name === 'pelvic-care.svg') {
    svg = svg.replace('USER-CENTERED IMPACT', 'DESIGNED AROUND PEOPLE').replace('+82%', 'Daily care').replace('Adherence to daily pelvic floor recovery exercises among women in clinical trials', 'Clear guidance. Considered feedback.').replace('ACCESSIBILITY TESTED', 'ACCESSIBILITY FIRST');
  }
  await writeFile(file, svg);
}
await edit('tests/portfolio.spec.ts', [[
  "  await page.screenshot({ path: '.verification/desktop.png', fullPage: true });",
  `  const images = await page.locator('img').evaluateAll(async elements => {
    return Promise.all(elements.map(async element => {
      element.loading = 'eager';
      try { await element.decode(); return { src: element.getAttribute('src'), valid: element.naturalWidth > 0 }; }
      catch { return { src: element.getAttribute('src'), valid: false }; }
    }));
  });
  expect(images.filter(image => !image.valid)).toEqual([]);
  await page.screenshot({ path: '.verification/desktop.png', fullPage: true });`
]]);
await edit('index.html', [['<meta name="viewport"', '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />\n<meta name="viewport"']]);
