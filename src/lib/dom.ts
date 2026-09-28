import { NAME_MAX } from '../config';

/** Escapes text for safe interpolation into HTML strings and attribute values. */
export const esc = (s: unknown): string =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );

/** Returns the first element matching the selector, throwing if the markup is missing it. */
export function $<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return el;
}

export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] => [
  ...root.querySelectorAll<T>(sel),
];

/** Sets text only when it changes, to avoid needless layout work on frequent updates. */
export function setText(el: Element, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

/** Trims, collapses whitespace and strips control characters from a display name. */
export const cleanName = (raw: string): string =>
  raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX);
