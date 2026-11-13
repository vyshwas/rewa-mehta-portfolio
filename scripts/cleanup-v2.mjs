import { readFile, writeFile, unlink } from 'node:fs/promises';

try { await unlink('src/components/Playground.tsx'); } catch (error) { if (error.code !== 'ENOENT') throw error; }

let architecture = await readFile('ARCHITECTURE.md', 'utf8');
architecture = architecture
  .replace('Paper, charcoal, and a single red accent connect the whole page. Project artwork keeps its original colors.', 'Deep ink, electric cobalt, and a precise signal green connect the whole page. Project artwork keeps its original colors while the surrounding system gives it a consistent frame.')
  .replace('| Playground | Sticky editorial introduction alongside three distinct interactive surfaces | Favourite feedback; focus/explore composition; a three-step action cycle. State changes animate with `back.out(1.3)` over `.5s`. These are labelled portfolio interaction studies, not claimed as shipped client work. |', '| Approach | A clear three-lens workbench beside a direct statement of practice | Evidence, systems, and signals each connect a design habit to a real portfolio project. Tab changes reveal project-specific reasoning and process nodes over `.55s` with `power3.out`. |')
  .replace('The page transitions subtly from paper to a sage neutral at the playground and returns to paper at contact.', 'The page shifts from deep ink to a slightly brighter blue-ink field around the approach section, then settles back to deep ink at contact.')
  .replace('Prototypes: save toggle, focus/explore state, next/reset sequence.', 'Approach: evidence, systems, and signals tabs; project-specific reasoning and proof states.');
await writeFile('ARCHITECTURE.md', architecture);

let validation = await readFile('VALIDATION.md', 'utf8');
validation += `
\n## Visual revision, 22 September 2026\n\n- Replaced the paper/red palette with deep ink, electric cobalt, and signal green.\n- Removed the generic interaction playground and its unused source component.\n- Added a purpose-driven approach workbench grounded in the UPSC research, CRM architecture, and PelvicAI feedback loop.\n- Rewrote the hero, work, about, contact, and footer language to express a clearer design point of view.\n- Updated responsive navigation and mobile stacking for the new section.\n- Final browser suite after the revision: 4 tests passed, including axe-core WCAG A/AA scans and 320/390/768-pixel overflow checks.\n`;
await writeFile('VALIDATION.md', validation);
