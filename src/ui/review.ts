import { DOMAINS } from '../config';
import { QUESTIONS } from '../data/questions';
import { $, $$, esc } from '../lib/dom';
import { renderFig, renderVisual } from '../lib/figures';
import type { TestResult } from '../types';
import { show } from './screens';

export type ReviewFilter = 'all' | 'wrong' | 'skip' | 'flag';
const FILTERS: readonly ReviewFilter[] = ['all', 'wrong', 'skip', 'flag'];
const KEYS = 'ABCD';

let result: TestResult | null = null;
let filter: ReviewFilter = 'all';

function listHTML(res: TestResult): string {
  const items = QUESTIONS.map((q, i) => ({
    q,
    i,
    a: res.answers[i] ?? null,
    f: res.flags[i] ?? false,
  })).filter(({ q, a, f }) => {
    if (filter === 'wrong') return a !== null && a !== q.answer;
    if (filter === 'skip') return a === null;
    if (filter === 'flag') return f;
    return true;
  });
  if (!items.length) return '<p class="empty">No questions match this filter.</p>';

  return items
    .map(({ q, i, a, f }) => {
      const verdict =
        a === null
          ? '<span class="verdict skip">Unanswered</span>'
          : a === q.answer
            ? '<span class="verdict ok">Correct</span>'
            : '<span class="verdict no">Incorrect</span>';
      const opts = q.options
        .map((o, k) => {
          const cls = k === q.answer ? 'correct' : k === a ? 'wrong' : '';
          const tag =
            k === q.answer
              ? k === a
                ? 'Your answer, correct'
                : 'Correct answer'
              : k === a
                ? 'Your answer'
                : '';
          return `<div class="r-opt ${cls}"><b>${KEYS[k]}</b>${'fig' in o ? renderFig(o.fig) : esc(o.t)}<span class="tag">${tag}</span></div>`;
        })
        .join('');
      return `<article class="review-item" aria-label="Question ${i + 1}">
      <div class="row review-head"><b>Question ${i + 1}</b>${verdict}
        <span class="chip">${esc(DOMAINS[q.domain].label)}</span><span class="chip ${q.difficulty}">${q.difficulty}</span>
        ${f ? '<span class="chip flagged">Flagged</span>' : ''}</div>
      <p class="review-prompt">${esc(q.prompt)}</p>
      ${q.visual ? `<div class="visual">${renderVisual(q)}</div>` : ''}
      <div class="opts">${opts}</div>
      <p class="explain">${esc(q.explanation)}</p>
    </article>`;
    })
    .join('');
}

function render(): void {
  if (!result) return;
  $$('#review-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === filter)));
  $('#review-list').innerHTML = listHTML(result);
}

export function renderReview(res: TestResult): void {
  result = res;
  filter = 'all';
  render();
  show('review');
}

export function initReview(onBack: () => void): void {
  $('#review-filter').addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('button[data-f]');
    const f = b?.dataset.f as ReviewFilter | undefined;
    if (!f || !FILTERS.includes(f)) return;
    filter = f;
    render();
  });
  $('#btn-back-results').addEventListener('click', onBack);
}
