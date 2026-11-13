// Poster-style title: the last word is set in italic, as in "Know it *all*".
export default function SerifTitle({ text }: { text: string }) {
  const split = text.lastIndexOf(' ');
  if (split < 0) return <>{text}</>;
  return <>{text.slice(0, split)} <em>{text.slice(split + 1)}</em></>;
}
