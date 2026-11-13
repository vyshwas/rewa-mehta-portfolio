const disciplines = ['Healthtech', 'Enterprise SaaS', 'Field research', 'Service design', 'Information architecture', 'Visual essays'];

// A slow band of disciplines between the intro and the work. Decorative: the same words appear in the content.
export default function Marquee() {
  const set = (key: string) => (
    <div className="marquee-set" key={key}>
      {disciplines.flatMap((word, index) => [<span key={word}>{word}</span>, <em key={word + index}>✳</em>])}
    </div>
  );
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{set('a')}{set('b')}</div>
    </div>
  );
}
