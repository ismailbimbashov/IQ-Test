import { IQ_MAX, IQ_MIN } from '../config';
import { esc } from '../lib/dom';
import type { TestResult } from '../types';

const fmtWhen = (t: number): string =>
  `${new Date(t).toLocaleDateString()} ${new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

function sparkline(pts: TestResult[]): string {
  const W = 300;
  const H = 90;
  const px = 10;
  const py = 10;
  const x = (i: number): number => px + (i * (W - 2 * px)) / (pts.length - 1);
  const y = (v: number): number => H - py - ((v - IQ_MIN) / (IQ_MAX - IQ_MIN)) * (H - 2 * py);
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.iq).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Trend of your last ${pts.length} scores: ${pts.map((p) => p.iq).join(', ')}">
      <line x1="${px}" x2="${W - px}" y1="${y(100)}" y2="${y(100)}" stroke="rgba(148,163,184,.3)" stroke-dasharray="4 4"/>
      <polyline points="${line}" fill="none" stroke="#818cf8" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      ${pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.iq).toFixed(1)}" r="3.5" fill="#c7d2fe"/>`).join('')}</svg>
      <p class="muted small spark-note">Last ${pts.length} attempts; dashed line marks 100.</p>`;
}

/** History panel: a sparkline of recent scores plus the latest eight attempts, newest first. */
export function historyHTML(hist: TestResult[], currentId?: string): string {
  if (!hist.length) return '<p class="empty">Complete a test to start tracking your scores.</p>';
  const spark = hist.length >= 2 ? sparkline(hist.slice(-12)) : '';
  const items = hist
    .slice()
    .reverse()
    .slice(0, 8)
    .map((h) => {
      const cur = h.id === currentId;
      return `<li><button type="button" data-id="${esc(h.id)}"${cur ? ' aria-current="true" class="is-current"' : ''}>
       <span class="h-iq">${esc(h.iq)}</span>
       <span class="h-meta">${esc(h.name)}, ${esc(h.correct)}/${esc(h.total)} correct<br>${esc(fmtWhen(h.date))}</span>
       <span class="muted small">${esc(h.category)}</span></button></li>`;
    })
    .join('');
  return spark + `<ul class="hist-list">${items}</ul>`;
}

/** Delegated click handling for a history list container. Call once per container. */
export function bindHistory(root: HTMLElement, onOpen: (id: string) => void): void {
  root.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-id]');
    if (b?.dataset.id) onOpen(b.dataset.id);
  });
}
