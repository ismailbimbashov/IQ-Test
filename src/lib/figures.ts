import type { Figure, Option, Question, ShapeKind, FillStyle } from '../types';
import { esc } from './dom';

/* Pure string renderers for question figures. All output is inline SVG, so it works under a strict CSP. */

const COL = { stroke: '#a5b4fc', fill: '#818cf8', faint: 'rgba(148,163,184,.28)' };

const DIR: Record<number, string> = {
  0: 'up',
  45: 'up-right',
  90: 'right',
  135: 'down-right',
  180: 'down',
  225: 'down-left',
  270: 'left',
  315: 'up-left',
};
const QPOS = { tl: [30, 30], tr: [70, 30], bl: [30, 70], br: [70, 70] } as const;
const QNAME = { tl: 'top-left', tr: 'top-right', bl: 'bottom-left', br: 'bottom-right' } as const;
const LINES = { h: 'M14 50 L86 50', v: 'M50 14 L50 86', d1: 'M20 20 L80 80', d2: 'M80 20 L20 80' } as const;
const LNAME = { h: 'horizontal', v: 'vertical', d1: 'diagonal falling', d2: 'diagonal rising' } as const;

function shapeEl(shape: ShapeKind, cx: number, cy: number, s: number, fill: FillStyle): string {
  const base =
    fill === 'solid'
      ? `fill="${COL.fill}" stroke="${COL.stroke}"`
      : `fill="none" stroke="${COL.stroke}"${fill === 'dashed' ? ' stroke-dasharray="4 3"' : ''}`;
  const sw = ' stroke-width="2.6" stroke-linejoin="round"';
  if (shape === 'circle') return `<circle cx="${cx}" cy="${cy}" r="${s}" ${base}${sw}/>`;
  if (shape === 'square')
    return `<rect x="${cx - s}" y="${cy - s}" width="${2 * s}" height="${2 * s}" rx="2" ${base}${sw}/>`;
  const h = s * 1.1;
  const pts = [
    [cx, cy - h],
    [cx + s * 1.1, cy + h * 0.8],
    [cx - s * 1.1, cy + h * 0.8],
  ]
    .map(([x, y]) => `${x!.toFixed(1)},${y!.toFixed(1)}`)
    .join(' ');
  return `<polygon points="${pts}" ${base}${sw}/>`;
}

/** Plain-language description of a figure, used as its accessible name. */
export function describeFig(f: Figure): string {
  switch (f.k) {
    case 'shapes':
      return `${f.n} ${f.fill} ${f.shape}${f.n > 1 ? 's' : ''}`;
    case 'arrow':
      return `arrow pointing ${DIR[f.a % 360] ?? `${f.a} degrees`}, ${f.d} dot${f.d > 1 ? 's' : ''}`;
    case 'lines':
      return `lines: ${f.l.map((x) => LNAME[x]).join(', ')}`;
    case 'dots':
      return f.q.length ? `dots at ${f.q.map((x) => QNAME[x]).join(', ')}` : 'no dots';
    case 'F':
      return f.desc ? `F-shape, ${f.desc}` : 'F-shaped figure';
  }
}

function figBody(f: Figure): string {
  switch (f.k) {
    case 'shapes': {
      const xs = f.n === 1 ? [50] : f.n === 2 ? [32, 68] : [20, 50, 80];
      const s = f.n === 1 ? 22 : f.n === 2 ? 15 : 11;
      return xs.map((x) => shapeEl(f.shape, x, 50, s, f.fill)).join('');
    }
    case 'arrow': {
      const xs = f.d === 1 ? [50] : f.d === 2 ? [42, 58] : [34, 50, 66];
      return (
        `<path d="M50 12 L66 34 L56 34 L56 66 L44 66 L44 34 L34 34 Z" fill="${COL.fill}" stroke="${COL.stroke}" stroke-width="1.5" stroke-linejoin="round" transform="rotate(${f.a} 50 40)"/>` +
        xs.map((x) => `<circle cx="${x}" cy="88" r="4.5" fill="${COL.stroke}"/>`).join('')
      );
    }
    case 'lines':
      return (
        `<rect x="10" y="10" width="80" height="80" rx="6" fill="none" stroke="${COL.faint}" stroke-width="1.5"/>` +
        f.l
          .map(
            (x) => `<path d="${LINES[x]}" stroke="${COL.stroke}" stroke-width="4.5" stroke-linecap="round"/>`,
          )
          .join('')
      );
    case 'dots':
      return (Object.keys(QPOS) as (keyof typeof QPOS)[])
        .map((p) => {
          const [x, y] = QPOS[p];
          return f.q.includes(p)
            ? `<circle cx="${x}" cy="${y}" r="12" fill="${COL.fill}" stroke="${COL.stroke}" stroke-width="2"/>`
            : `<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="${COL.faint}" stroke-width="1.5"/>`;
        })
        .join('');
    case 'F':
      return `<g transform="${esc(f.t)}" fill="${COL.fill}" stroke="${COL.stroke}" stroke-width="1.5"><rect x="33" y="18" width="12" height="64" rx="1.5"/><rect x="33" y="18" width="38" height="12" rx="1.5"/><rect x="33" y="44" width="27" height="11" rx="1.5"/></g>`;
  }
}

/**
 * Renders a figure as SVG. By default it is an image named by its description;
 * pass `decorative` when the surrounding element already carries the accessible name.
 */
export function renderFig(f: Figure, decorative = false): string {
  const a11y = decorative
    ? 'aria-hidden="true" focusable="false"'
    : `role="img" aria-label="${esc(describeFig(f))}"`;
  return `<svg class="fig" viewBox="0 0 100 100" ${a11y}>${figBody(f)}</svg>`;
}

/** Accessible description of an answer option, e.g. "3 outline triangles". */
export const describeOption = (o: Option): string => ('fig' in o ? describeFig(o.fig) : o.t);

/** Renders the question's stimulus (matrix, number sequence or single figure). */
export function renderVisual(q: Pick<Question, 'visual'>): string {
  const v = q.visual;
  if (!v) return '';
  if (v.type === 'matrix') {
    const cells = v.cells
      .map((c, i) => {
        const pos = `Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}`;
        return c
          ? `<div class="mcell" role="img" aria-label="${esc(`${pos}: ${describeFig(c)}`)}">${renderFig(c, true)}</div>`
          : `<div class="mcell missing" role="img" aria-label="${pos}: missing tile"><span aria-hidden="true">?</span></div>`;
      })
      .join('');
    return `<div class="matrix" role="group" aria-label="3 by 3 matrix, read row by row">${cells}</div>`;
  }
  if (v.type === 'seq') {
    const spoken = v.items.map((x) => (x === '?' ? 'then an unknown number' : String(x))).join(', ');
    const tiles = v.items.map((x) => `<span class="${x === '?' ? 'q' : ''}">${esc(x)}</span>`).join('');
    return `<div class="seq" role="img" aria-label="${esc(`Sequence: ${spoken}`)}">${tiles}</div>`;
  }
  return `<div class="single-fig">${renderFig(v.fig)}</div>`;
}
