import { readFile, writeFile } from 'node:fs/promises';

async function replace(path, pairs) {
  let source = await readFile(path, 'utf8');
  for (const [from, to] of pairs) {
    if (!source.includes(from)) throw new Error(`Missing text in ${path}: ${from.slice(0, 80)}`);
    source = source.replace(from, to);
  }
  await writeFile(path, source);
}

await replace('src/App.tsx', [
  ["import Playground from './components/Playground';", "import Practice from './components/Practice';"],
  [`<nav aria-label="Main navigation"><a href="#hero">Home</a><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact <ArrowUpRight size={15} /></a></nav>`, `<nav aria-label="Main navigation"><a href="#work">Work</a><a href="#approach">Approach</a><a href="#about">About</a><a href="#contact">Contact <ArrowUpRight size={15} /></a></nav>`],
  ['The person behind the pixels', 'What I bring'],
  ['Equal parts<br /><em>curiosity</em><br />& conviction.', 'A scientist’s<br /><em>instinct.</em><br />A designer’s eye.'],
  ['With a science background and a master’s in design from NIFT New Delhi, I bring analytical thinking and visual intuition to the same table.', 'A science degree taught me to test assumptions. A master’s in design taught me how to make the answer useful, legible, and felt.'],
  ['For something worth making', 'Open to product design roles'],
  ['Have a product challenge, an open role,<br />or a different way of seeing things?', 'Have a difficult product problem,<br />an open role, or a useful conversation?'],
  ['Let’s make<br /><em>good things.</em>', 'Bring me the<br /><em>messy part.</em>'],
  ['<PhysicsHero /><ProjectIndex open={setProject} /><Playground /><About />', '<PhysicsHero /><ProjectIndex open={setProject} /><Practice /><About />'],
  ['Thoughtfully considered. Always curious.', 'Research deeply. Design clearly.'],
]);

await replace('src/components/PhysicsHero.tsx', [
  ['Independent thought. Intentional design.', 'Product designer / researcher / visual thinker'],
  ['UI/UX & Product Designer', 'Currently in New Delhi, India'],
  ['Human understanding, made tangible.', 'Complicated systems. Clearer human decisions.'],
  ['Good design<br />starts with <em>people.</em>', 'I make complicated<br />things feel <em>obvious.</em>'],
  ['Explore selected work', 'See the work'],
  ['A little context', 'The short version'],
  ['I’m Rewa. I turn complicated systems into thoughtful experiences, with research, a clear point of view, and care for the details.', 'I’m Rewa. I combine field research, systems thinking, and visual precision to design products people can understand under pressure.'],
  ['From complexity to clarity', 'Featured: PelvicAI Health'],
]);

await replace('src/components/ProjectIndex.tsx', [
  ['Selected <em>work.</em>', 'Six questions I<br /><em>couldn’t leave alone.</em>'],
  ['Different contexts. The same curiosity about people.', 'Health, work, culture, and the systems hiding underneath them.'],
  ['Systems with structure.<br /><em>Experiences with soul.</em>', 'Observe the behaviour.<br /><em>Then draw the interface.</em>'],
]);

await replace('src/motion.tsx', [
  ["'--page-bg': '#e9e9df', '--page-ink': '#24251f'", "'--page-bg': '#121d3d', '--page-ink': '#f4f3ed'"],
  ["trigger: '#playground'", "trigger: '#approach'"],
  ["'--page-bg': '#f3f1e9', '--page-ink': '#25261f'", "'--page-bg': '#0d1429', '--page-ink': '#f4f3ed'"],
]);

await replace('src/tokens.css', [
  ['--paper: #f3f1e9;', '--paper: #0d1429;'],
  ['--white: #faf9f4;', '--white: #f4f3ed;'],
  ['--ink: #25261f;', '--ink: #f4f3ed;'],
  ['--muted: #57584f;', '--muted: #aeb7cd;'],
  ['--accent: #a73e2b;', '--accent: #b8ff4f;'],
  ['--accent-paper: #e9dcd0;', '--accent-paper: #263ee5;'],
  ['--sage-paper: #e1e4d9;', '--sage-paper: #16244a;'],
  ['--sage-ink: #606b50;', '--sage-ink: #b8ff4f;'],
  ['--structure-paper: #ebe9dd;', '--structure-paper: #172447;'],
  ['--media-bg: #11121a;', '--media-bg: #080d1c;'],
  ['--grid-dot: #b5b5a7;', '--grid-dot: #405178;'],
  ['--line: #cfcec3;', '--line: #354364;'],
  ['--backdrop: rgb(27 28 24 / 60%);', '--backdrop: rgb(3 7 18 / 78%);'],
]);

await replace('tests/portfolio.spec.ts', [
  ["test('playable experiments and clipboard work'", "test('design approach and clipboard work'"],
  ["  await page.getByRole('button', { name: 'Make it a favourite' }).click();\n  await expect(page.getByRole('button', { name: 'Saved to favourites' })).toHaveAttribute('aria-pressed', 'true');\n  await page.getByRole('button', { name: 'Explore', exact: true }).click();\n  await expect(page.getByText('A little room for possibility.')).toBeVisible();\n  await page.getByRole('button', { name: 'Next step' }).click();\n  await expect(page.getByText('Give it a little shape.')).toBeVisible();\n  await page.getByRole('button', { name: 'Next step' }).click();\n  await page.getByRole('button', { name: 'Reset interaction' }).click();\n  await expect(page.getByText('Start with an idea.')).toBeVisible();", "  await expect(page.getByRole('heading', { name: 'Listen where the work actually happens.' })).toBeVisible();\n  await page.getByRole('tab', { name: '02 Systems' }).click();\n  await expect(page.getByRole('heading', { name: 'Make the whole system visible.' })).toBeVisible();\n  await expect(page.getByText('40+ responsive product views')).toBeVisible();\n  await page.getByRole('tab', { name: '03 Signals' }).click();\n  await expect(page.getByRole('heading', { name: 'Show the next useful thing.' })).toBeVisible();"],
]);
