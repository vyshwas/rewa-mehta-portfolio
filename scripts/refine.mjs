import { readFile, writeFile } from 'node:fs/promises';
const replace = async (file, replacements) => {
  let text = await readFile(file, 'utf8');
  for (const [from, to] of replacements) {
    if (!text.includes(from)) throw new Error(`Missing replacement in ${file}: ${from.slice(0, 60)}`);
    text = text.replaceAll(from, to);
  }
  await writeFile(file, text);
};
await replace('src/data.ts', [
  ['card-pelvic.jpg', 'pelvic-care.svg'],
  ['card-crm.jpg', 'property-crm.svg'],
  ['card-upsc.jpg', 'upsc-research.svg'],
  ['card-care.jpg', 'healthcare-infographic.svg'],
  ['card-malegaze.jpg', 'male-gaze.svg'],
]);
await replace('src/components/PhysicsHero.tsx', [
  ['card-pelvic.jpg', 'pelvic-care.svg'],
  ['PelvicAI Health interface study', 'PelvicAI Health concept illustration'],
  ["snap = gsap.to(letters, { x: 0, y: 0, rotation: 0, duration: 0.9, stagger: 0.025, ease: 'power4.inOut' });", "snap = gsap.fromTo(letters, { x: i => glyphs[i].body.position.x - glyphs[i].home.x, y: i => glyphs[i].body.position.y - glyphs[i].home.y, rotation: i => glyphs[i].body.angle * 180 / Math.PI }, { x: 0, y: 0, rotation: 0, duration: 0.9, stagger: 0.025, ease: 'power4.inOut' });"],
]);
await replace('src/components/ProjectIndex.tsx', [
  ['A collection of product, research, and visual studies.', 'Product, research, and visual studies. Covers use concept artwork from the original portfolio.'],
]);
await replace('src/components/CaseStudy.tsx', [
  ['<div className="case-copy">', '<p className="art-caption">Concept artwork from the original portfolio.</p><div className="case-copy">'],
]);
