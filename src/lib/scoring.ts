import {
  AGE_NORMS,
  DOMAIN_KEYS,
  IQ_MAX,
  IQ_MEAN,
  IQ_MIN,
  IQ_SD,
  LIMIT_MS,
  SPEED_MAX,
  WEIGHTS,
} from '../config';
import { QUESTIONS } from '../data/questions';
import type { DomainKey, DomainScore, TestResult, TestState } from '../types';
import { clamp, iqPercentile } from './math';

export function classify(iq: number): string {
  if (iq >= 145) return 'Exceptionally gifted';
  if (iq >= 130) return 'Very superior';
  if (iq >= 120) return 'Superior';
  if (iq >= 110) return 'High average';
  if (iq >= 90) return 'Average';
  if (iq >= 80) return 'Low average';
  return 'Borderline';
}

export const newResultId = (now: number): string =>
  'r' + now.toString(36) + Math.floor(Math.random() * 36 ** 4).toString(36);

/**
 * Scores a finished test. Pure apart from the id: the same state, remaining time and
 * clock produce the same numbers.
 */
export function computeResult(
  state: Pick<TestState, 'name' | 'age' | 'answers' | 'flags'>,
  remainingMs: number,
  auto: boolean,
  now: number = Date.now(),
): TestResult {
  let W = 0;
  let Wc = 0;
  let correct = 0;
  const domains = Object.fromEntries(
    DOMAIN_KEYS.map((d) => [d, { correct: 0, total: 0, w: 0, wc: 0 }]),
  ) as Record<DomainKey, DomainScore>;

  QUESTIONS.forEach((q, i) => {
    const w = WEIGHTS[q.difficulty];
    const d = domains[q.domain];
    W += w;
    d.total++;
    d.w += w;
    if (state.answers[i] === q.answer) {
      Wc += w;
      correct++;
      d.correct++;
      d.wc += w;
    }
  });

  const p = W ? Wc / W : 0; // weighted accuracy 0..1
  const r = clamp(remainingMs / LIMIT_MS, 0, 1); // fraction of time left
  const A = p * (1 + SPEED_MAX * r); // speed-adjusted accuracy 0..1.1
  const norm = AGE_NORMS[state.age];
  const z = (A - norm.mu) / norm.sd; // standard score vs age group
  const rawIQ = IQ_MEAN + IQ_SD * z;
  const iq = Math.round(clamp(rawIQ, IQ_MIN, IQ_MAX));

  return {
    id: newResultId(now),
    name: state.name,
    age: state.age,
    date: now,
    auto,
    iq,
    rawIQ,
    percentile: iqPercentile(iq),
    category: classify(iq),
    correct,
    total: QUESTIONS.length,
    W,
    Wc,
    p,
    r,
    A,
    z,
    mu: norm.mu,
    sd: norm.sd,
    timeUsedMs: LIMIT_MS - clamp(remainingMs, 0, LIMIT_MS),
    domains,
    answers: state.answers.slice(),
    flags: state.flags.slice(),
  };
}
