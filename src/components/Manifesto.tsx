// *word* marks the italic accents; each word is its own span so scroll can light it up.
const statement = 'I trained as a scientist: observe without assuming, test before believing. Now I point that rigor at *people*, so complex systems feel *calm*.';

// Hand-drawn marks, drawn in as their word lights up: a loose loop and an underline.
const scribbles: Record<string, string> = {
  people: 'M16 58 C 8 30, 70 10, 132 12 C 190 14, 204 44, 178 62 C 150 80, 50 82, 20 64 C 2 52, 22 30, 64 20',
  calm: 'M6 70 C 48 60, 108 76, 150 64 C 170 58, 186 60, 196 66',
};

export default function Manifesto() {
  const words = statement.split(' ');
  return (
    <section className="manifesto" data-light="aperture" data-chapter="00" data-chapter-name="Intro" aria-labelledby="manifesto-title">
      <div className="manifesto-inner">
        <span className="mono manifesto-label" id="manifesto-title">Why science</span>
        <p className="manifesto-text">
          {words.map((word, index) => {
            const italic = word.startsWith('*');
            const clean = word.replace(/\*/g, '');
            const bare = clean.replace(/[,.]$/, '');
            const tail = /[,.]$/.test(clean) ? clean.slice(-1) : '';
            if (!italic) return <span className="mf-word" key={index}>{clean} </span>;
            return (
              <span className="mf-word" key={index}>
                <em className="scribbled">
                  {bare}
                  <svg className="scribble" viewBox="0 0 200 84" preserveAspectRatio="none" aria-hidden="true">
                    <path d={scribbles[bare]} pathLength={1} />
                  </svg>
                </em>{tail}{' '}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
