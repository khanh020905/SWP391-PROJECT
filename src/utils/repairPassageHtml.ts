export function repairPassageHtml(html: string): string {
  if (!html || typeof document === 'undefined') return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  // Bold single-letter paragraph labels (A-H) at the start of <p> tags FIRST
  // so the merge guard below can reliably detect them.
  // Handles both "A " and "A." formats; skips paragraphs already starting with <strong>.
  div.querySelectorAll('p').forEach(p => {
    const inner = p.innerHTML.trim();
    if (/^[A-H][.\s]/.test(inner) && !inner.startsWith('<strong>')) {
      p.innerHTML = `<strong>${inner[0]}</strong>${inner.slice(1)}`;
    }
  });
  let merged = true;
  while (merged) {
    merged = false;
    const paras = Array.from(div.querySelectorAll('p'));
    for (let i = 0; i < paras.length - 1; i++) {
      const p = paras[i];
      const next = p.nextElementSibling;
      if (!next || next.tagName !== 'P') continue;
      const text = (p.textContent || '').trim();
      // Never merge into a paragraph that starts with a paragraph label (A-H).
      // Use plain text so the check is immune to bold/italic tag variations.
      const nextText = (next.textContent || '').trim();
      const nextStartsWithLabel = /^[A-H][.\s]/.test(nextText);
      if (text && !text.match(/[.!?;:'")\]—]\s*$/) && !nextStartsWithLabel) {
        next.innerHTML = p.innerHTML.trimEnd() + ' ' + next.innerHTML.trimStart();
        p.remove();
        merged = true;
        break;
      }
    }
  }
  return div.innerHTML;
}
