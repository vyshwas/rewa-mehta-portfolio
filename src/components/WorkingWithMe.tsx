import { Opener } from './Field';

// Line drawings, one per principle, drawn in as the column arrives: ripples, a lattice, a loop, an overlap.
const glyphs: Record<string, string[]> = {
  listen: ['M32 26a6 6 0 1 1 0 12a6 6 0 1 1 0-12', 'M32 18a14 14 0 1 1 0 28a14 14 0 1 1 0-28', 'M32 10a22 22 0 1 1 0 44a22 22 0 1 1 0-44', 'M32 2a30 30 0 1 1 0 60a30 30 0 1 1 0-60'],
  system: ['M32 4 L60 32 L32 60 L4 32 Z', 'M18 18 L46 46', 'M46 18 L18 46', 'M32 4 L32 60', 'M4 32 L60 32', 'M18 18 L46 18 L46 46 L18 46 Z'],
  iterate: ['M54 32a22 22 0 1 1 -6.4 -15.6', 'M48 6 L48 17 L37 17', 'M44 32a12 12 0 1 1 -3.5 -8.5', 'M32 30a2 2 0 1 1 0 4a2 2 0 1 1 0-4'],
  together: ['M24 22a14 14 0 1 1 0 28a14 14 0 1 1 0-28', 'M40 22a14 14 0 1 1 0 28a14 14 0 1 1 0-28', 'M32 8a14 14 0 1 1 0 28a14 14 0 1 1 0-28'],
};

const values = [
  { glyph: 'listen', title: 'Listen first', desc: 'Understand the people and their unsaid frictions before drawing a screen.' },
  { glyph: 'system', title: 'Think in systems', desc: 'Every detail belongs to a wider structure of tokens, states and hierarchy.' },
  { glyph: 'iterate', title: 'Test, then refine', desc: 'Prototype early, push against edge cases, let evidence decide.' },
  { glyph: 'together', title: 'Build together', desc: 'Work closely with engineers, product managers and clinicians.' },
];

export default function WorkingWithMe() {
  return (
    <section className="section method" id="working-with-me" data-light="sweep" data-chapter="02" data-chapter-name="Approach" aria-labelledby="method-title">
      <Opener num="02" id="method-title" note="Four principles">Working <em>with me</em></Opener>
      <ol className="method-list">
        {values.map((value, index) => (
          <li className="method-col" key={value.title} data-reveal>
            <div className="method-top">
              <svg className="glyph" viewBox="0 0 64 64" aria-hidden="true">
                {glyphs[value.glyph].map(d => <path key={d} d={d} pathLength={1} />)}
              </svg>
              <span className="mono">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="title">{value.title}</h3>
            <p>{value.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
