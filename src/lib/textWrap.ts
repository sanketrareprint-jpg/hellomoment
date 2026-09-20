// Pure text-wrapping heuristic shared between the server-side flyer
// renderer (src/lib/flyer.ts) and the (client) TemplatePlaceholderEditor
// preview. Kept in its own dependency-free module — rather than living only
// in flyer.ts, which imports 'sharp'/'fs' and can't be pulled into a 'use
// client' component's bundle — so the editor's live preview wraps text
// using the *exact same math* the real generated flyer will, instead of
// relying on the browser's own (much more precise, and therefore
// inconsistent) text layout to decide where lines break.

/**
 * No canvas measureText available server-side (we deliberately avoid
 * node-canvas to sidestep its native cairo build requirements), so we wrap
 * using an average-character-width heuristic. It's not pixel-perfect but is
 * a safe, conservative estimate that reliably prevents text overflowing the
 * flyer — and matching it exactly in the editor preview means what a
 * business sees while placing a field is what actually gets sent, rather
 * than the browser wrapping the same text differently.
 */
export function wrapText(text: string, maxWidth: number | undefined, fontSize: number, maxLines = 2): string[] {
  if (!maxWidth) return [text];
  const avgCharWidth = fontSize * 0.58;
  const maxCharsPerLine = Math.max(1, Math.floor(maxWidth / avgCharWidth));

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;

  // Wrapping produced more lines than allowed (this is the common case once
  // maxLines is small, e.g. 1): rather than the previous behavior — which
  // silently dropped every line past maxLines with no visual cue, cutting
  // text off mid-sentence — keep the first maxLines lines and mark the cut
  // with a trailing ellipsis on the last one, trimming it back down to fit
  // maxCharsPerLine (the ellipsis glyph takes up width too).
  const visible = lines.slice(0, maxLines);
  const last = visible[maxLines - 1];
  visible[maxLines - 1] =
    last.length >= maxCharsPerLine ? last.slice(0, Math.max(0, maxCharsPerLine - 1)).trimEnd() + '…' : last + '…';
  return visible;
}
