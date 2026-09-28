import { describe, expect, it } from 'vitest';
import { IQ_MAX, IQ_MIN, LIMIT_MS } from '../../src/config';
import { QUESTIONS } from '../../src/data/questions';
import { classify, computeResult } from '../../src/lib/scoring';
import type { Answer, AgeGroup } from '../../src/types';

const allCorrect = (): Answer[] => QUESTIONS.map((q) => q.answer);
const allWrong = (): Answer[] => QUESTIONS.map((q) => ((q.answer + 1) % 4) as Answer);
const none = (): Answer[] => QUESTIONS.map(() => null);
const state = (answers: Answer[], age: AgeGroup = 'a18') => ({
  name: 'Test',
  age,
  answers,
  flags: QUESTIONS.map(() => false),
});

describe('computeResult', () => {
  it('scores a perfect, instant test at the top of the achievable range', () => {
    const r = computeResult(state(allCorrect()), LIMIT_MS, false, 1_000);
    expect(r.correct).toBe(20);
    expect(r.p).toBe(1);
    expect(r.r).toBe(1);
    expect(r.A).toBeCloseTo(1.1);
    // (1.1 - 0.52) / 0.18 = 3.222 → 100 + 15 × 3.222 = 148.3
    expect(r.iq).toBe(148);
    expect(r.timeUsedMs).toBe(0);
  });

  it('weights hard questions three times and medium twice', () => {
    const totalWeight = QUESTIONS.reduce((s, q) => s + { easy: 1, medium: 2, hard: 3 }[q.difficulty], 0);
    const r = computeResult(state(allCorrect()), 0, true);
    expect(r.W).toBe(totalWeight);
    expect(r.Wc).toBe(totalWeight);

    const onlyEasy = QUESTIONS.map((q) => (q.difficulty === 'easy' ? q.answer : null));
    const easy = computeResult(state(onlyEasy), 0, true);
    expect(easy.Wc).toBe(QUESTIONS.filter((q) => q.difficulty === 'easy').length);
  });

  it('clamps to the reporting floor and keeps the raw value', () => {
    const r = computeResult(state(allWrong()), 0, true);
    expect(r.correct).toBe(0);
    expect(r.iq).toBe(IQ_MIN);
    expect(r.rawIQ).toBeLessThan(IQ_MIN);
    expect(r.category).toBe('Borderline');
  });

  it('treats unanswered questions as incorrect', () => {
    expect(computeResult(state(none()), LIMIT_MS, false).correct).toBe(0);
  });

  it('adds a speed bonus proportional to time left, at most 10%', () => {
    const slow = computeResult(state(allCorrect()), 0, false);
    const half = computeResult(state(allCorrect()), LIMIT_MS / 2, false);
    expect(slow.A).toBeCloseTo(1);
    expect(half.A).toBeCloseTo(1.05);
    const overTime = computeResult(state(allCorrect()), LIMIT_MS * 3, false);
    expect(overTime.r).toBe(1);
    const negative = computeResult(state(allCorrect()), -5000, false);
    expect(negative.r).toBe(0);
    expect(negative.timeUsedMs).toBe(LIMIT_MS);
  });

  it('compares against the selected age norm', () => {
    const young = computeResult(state(allCorrect(), 'a18'), 0, true);
    const older = computeResult(state(allCorrect(), 'a50'), 0, true);
    expect(older.mu).toBe(0.44);
    expect(older.rawIQ).toBeGreaterThan(young.rawIQ);
  });

  it('never reports above the ceiling', () => {
    for (const age of ['u18', 'a18', 'a36', 'a50'] as const) {
      expect(computeResult(state(allCorrect(), age), LIMIT_MS, false).iq).toBeLessThanOrEqual(IQ_MAX);
    }
  });

  it('tallies each domain', () => {
    const r = computeResult(state(allCorrect()), 0, true);
    for (const d of Object.values(r.domains)) {
      expect(d.total).toBe(5);
      expect(d.correct).toBe(5);
      expect(d.wc).toBe(d.w);
    }
  });

  it('copies answers and flags rather than aliasing them', () => {
    const s = state(allCorrect());
    const r = computeResult(s, 0, true);
    s.answers[0] = null;
    expect(r.answers[0]).toBe(QUESTIONS[0]!.answer);
  });

  it('generates distinct ids for results in the same millisecond', () => {
    const ids = new Set(Array.from({ length: 50 }, () => computeResult(state(none()), 0, true, 42).id));
    expect(ids.size).toBeGreaterThan(45);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+$/);
  });
});

describe('classify', () => {
  it.each([
    [150, 'Exceptionally gifted'],
    [145, 'Exceptionally gifted'],
    [130, 'Very superior'],
    [120, 'Superior'],
    [110, 'High average'],
    [100, 'Average'],
    [85, 'Low average'],
    [70, 'Borderline'],
  ])('%d → %s', (iq, label) => {
    expect(classify(iq)).toBe(label);
  });
});
