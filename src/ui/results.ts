import { AGE_NORMS, DOMAINS, DOMAIN_KEYS, IQ_MIN, LIMIT_MS, SPEED_MAX } from '../config';
import { $, $$, esc } from '../lib/dom';
import { fmtPct, fmtTime } from '../lib/math';
import type { TestResult } from '../types';
import { bellCurveSVG, bindCurve } from './curve';
import { bindHistory, historyHTML } from './history';
import { show } from './screens';

interface ResultsHandlers {
  onReview: () => void;
  onRetake: () => void;
  onClearHistory: () => void;
  onOpenResult: (id: string) => void;
}

export function renderResults(res: TestResult, hist: TestResult[]): void {
  const pct = res.percentile;
  $('#res-iq').textContent = String(res.iq);
  $('#res-title').textContent =
    `${res.name}, age group ${AGE_NORMS[res.age].label}, ${new Date(res.date).toLocaleString()}`;
  $('#res-band').textContent = res.category;
  let pctText =
    pct >= 50
      ? `Top ${fmtPct(100 - pct)}% of the population. You scored higher than ${fmtPct(pct)}% of people.`
      : `You scored higher than ${fmtPct(pct)}% of people.`;
  if (res.rawIQ < IQ_MIN) pctText += ` Scores below ${IQ_MIN} are reported as ${IQ_MIN} on this test.`;
  $('#res-pct').textContent = pctText;
  $('#st-correct').textContent = `${res.correct} / ${res.total}`;
  $('#st-acc').textContent = `${Math.round(res.p * 100)}%`;
  $('#st-time').textContent = fmtTime(res.timeUsedMs) + (res.auto ? ' (limit)' : '');
  $('#st-speed').textContent = `+${(res.p * SPEED_MAX * res.r * 100).toFixed(1)} pts`;

  $('#curve').innerHTML = bellCurveSVG(res.iq);
  bindCurve(res.iq);

  $('#domain-bars').innerHTML = DOMAIN_KEYS.map((k) => {
    const s = res.domains[k];
    const label = DOMAINS[k].label;
    const pc = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    return `<div class="bar-row"><div class="bar-top"><span>${esc(label)}</span><span>${s.correct}/${s.total} (${pc}%)</span></div>
      <div class="bar" role="img" aria-label="${esc(`${label}: ${pc}% correct`)}"><i class="d-${k}" data-w="${pc}"></i></div></div>`;
  }).join('');
  // Two frames so the bars animate from 0 after insertion. Setting .style via the CSSOM is CSP-safe.
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      $$<HTMLElement>('#domain-bars .bar>i').forEach((i) => (i.style.width = `${i.dataset.w ?? 0}%`)),
    ),
  );

  $('#history-body').innerHTML = historyHTML(hist, res.id);
  $('#btn-clear').hidden = !hist.length;

  const rows: [string, string, string | number][] = [
    ['Weighted correct', 'Σ w·correct / Σ w', `${res.Wc} / ${res.W}`],
    ['Weighted accuracy', 'p', res.p.toFixed(3)],
    ['Time remaining fraction', `r = t_left / ${LIMIT_MS / 1000} s`, res.r.toFixed(3)],
    ['Speed-adjusted accuracy', `A = p × (1 + ${SPEED_MAX} × r)`, res.A.toFixed(3)],
    [`Age norm (${AGE_NORMS[res.age].label})`, 'μ, σ', `${res.mu}, ${res.sd}`],
    ['Standard score', 'z = (A − μ) / σ', res.z.toFixed(3)],
    ['Unclamped IQ', '100 + 15z', res.rawIQ.toFixed(1)],
    ['Reported IQ', 'clamp(round, 70, 160)', res.iq],
    ['Percentile', 'Φ((IQ − 100) / 15)', `${fmtPct(res.percentile)}%`],
  ];
  $('#calc').innerHTML =
    rows
      .map(([a, f, v]) => `<div><span>${esc(a)}<br><code>${esc(f)}</code></span><b>${esc(v)}</b></div>`)
      .join('') +
    '<p class="muted small calc-note">Weights: easy 1, medium 2, hard 3. The age norms are illustrative calibration values, not published population data.</p>';

  show('results');
}

export function initResults(h: ResultsHandlers): void {
  $('#btn-review').addEventListener('click', h.onReview);
  $('#btn-retake').addEventListener('click', h.onRetake);
  $('#btn-clear').addEventListener('click', h.onClearHistory);
  bindHistory($('#history-body'), h.onOpenResult);
}
