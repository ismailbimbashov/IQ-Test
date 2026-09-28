import { describe, expect, it } from 'vitest';
import { NAME_MAX } from '../../src/config';
import { cleanName, esc } from '../../src/lib/dom';
import { describeFig, describeOption, renderFig, renderVisual } from '../../src/lib/figures';

describe('esc', () => {
  it('escapes all HTML-significant characters', () => {
    expect(esc(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });
  it('stringifies non-strings', () => {
    expect(esc(42)).toBe('42');
  });
});

describe('cleanName', () => {
  it('trims and collapses whitespace', () => {
    expect(cleanName('  Ada   Lovelace \n')).toBe('Ada Lovelace');
  });
  it('strips control characters', () => {
    expect(cleanName('A\u0000l\u0007ex')).toBe('Alex');
  });
  it('limits length', () => {
    expect(cleanName('x'.repeat(100))).toHaveLength(NAME_MAX);
  });
  it('returns empty for whitespace only', () => {
    expect(cleanName('   ')).toBe('');
  });
});

describe('figures', () => {
  it('describes each figure kind', () => {
    expect(describeFig({ k: 'shapes', shape: 'circle', n: 3, fill: 'solid' })).toBe('3 solid circles');
    expect(describeFig({ k: 'shapes', shape: 'square', n: 1, fill: 'outline' })).toBe('1 outline square');
    expect(describeFig({ k: 'arrow', a: 270, d: 1 })).toBe('arrow pointing left, 1 dot');
    expect(describeFig({ k: 'lines', l: ['h', 'd2'] })).toBe('lines: horizontal, diagonal rising');
    expect(describeFig({ k: 'dots', q: [] })).toBe('no dots');
    expect(describeFig({ k: 'dots', q: ['tl', 'br'] })).toBe('dots at top-left, bottom-right');
    expect(describeFig({ k: 'F', t: '' })).toBe('F-shaped figure');
    expect(describeFig({ k: 'F', t: '', desc: 'spine on the left' })).toBe('F-shape, spine on the left');
  });

  it('renders labelled SVG, or hides it from assistive tech when decorative', () => {
    const f = { k: 'shapes', shape: 'triangle', n: 2, fill: 'dashed' } as const;
    expect(renderFig(f)).toContain('role="img" aria-label="2 dashed triangles"');
    expect(renderFig(f)).toContain('stroke-dasharray');
    expect(renderFig(f, true)).toContain('aria-hidden="true"');
    expect(renderFig({ k: 'arrow', a: 90, d: 3 })).toContain('rotate(90 50 40)');
    expect(renderFig({ k: 'lines', l: ['v'] })).toContain('M50 14 L50 86');
    expect(renderFig({ k: 'dots', q: ['tl'] })).toMatch(/<circle/);
  });

  it('escapes figure transforms', () => {
    expect(renderFig({ k: 'F', t: '"><script>' })).not.toContain('<script>');
  });

  it('describes text and figure options', () => {
    expect(describeOption({ t: 'Eating' })).toBe('Eating');
    expect(describeOption({ fig: { k: 'dots', q: ['tr'] } })).toBe('dots at top-right');
  });
});

describe('renderVisual', () => {
  it('returns nothing for text-only questions', () => {
    expect(renderVisual({ visual: null })).toBe('');
  });

  it('labels every matrix cell by position, including the gap', () => {
    const cells = Array.from({ length: 9 }, (_, i) =>
      i === 8 ? null : ({ k: 'shapes', shape: 'circle', n: 1, fill: 'outline' } as const),
    );
    const html = renderVisual({ visual: { type: 'matrix', cells } });
    expect(html).toContain('aria-label="Row 1, column 1: 1 outline circle"');
    expect(html).toContain('aria-label="Row 3, column 3: missing tile"');
  });

  it('gives sequences a spoken label', () => {
    const html = renderVisual({ visual: { type: 'seq', items: [1, 2, '?'] } });
    expect(html).toContain('aria-label="Sequence: 1, 2, then an unknown number"');
  });

  it('renders a single figure', () => {
    expect(renderVisual({ visual: { type: 'fig', fig: { k: 'F', t: '' } } })).toContain('single-fig');
  });
});
