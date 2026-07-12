export function formatExplanationText(text: string): string {
  if (!text) return text;

  // Insert \n before markers when they are NOT already at the start of a line.
  // We match any non-newline character followed by optional spaces/tabs and
  // the marker. The whitespace before the marker is consumed and replaced by
  // the newline. Existing newlines are never consumed or removed.
  return text.replace(
    /([^\n])[^\S\n]*(Bước\s+\d+:|⇒|=>|Lý do(?: nhiều người)? dễ sai:)/g,
    '$1\n$2'
  );
}
