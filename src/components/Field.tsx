import type { ReactNode } from 'react';

// A line of type that rises out of its own mask when the heading scrolls in.
export function Rise({ children }: { children: ReactNode }) {
  return <span className="mask"><span className="rise">{children}</span></span>;
}

// Every chapter opens the same way: a rule drawn across the full width, a large italic numeral,
// and the chapter's name set big beside it. One cue, repeated, so a new section is never ambiguous.
export function Opener({ num, id, note, children }: { num: string; id: string; note?: string; children: ReactNode }) {
  return (
    <header className="opener" data-rise>
      <i className="opener-rule" aria-hidden="true" />
      <span className="opener-num" aria-hidden="true"><Rise>{num}</Rise></span>
      <h2 id={id} className="opener-name"><Rise>{children}</Rise></h2>
      {note && <p className="opener-note mono" data-reveal>{note}</p>}
    </header>
  );
}

// "Word ——— Word": the two halves of a title pushed to the edges, joined by a drawn rule.
export function SplitTitle({ left, right, as: Tag = 'h2', id, className = '' }: { left: ReactNode; right: ReactNode; as?: 'h1' | 'h2' | 'h3' | 'span'; id?: string; className?: string }) {
  return (
    <Tag id={id} className={('split ' + className).trim()} data-rise>
      <Rise>{left}</Rise>
      <i className="split-rule" aria-hidden="true" />
      <Rise>{right}</Rise>
    </Tag>
  );
}
