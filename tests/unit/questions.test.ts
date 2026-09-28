import { describe, expect, it } from 'vitest';
import { DOMAIN_KEYS } from '../../src/config';
import { QUESTIONS } from '../../src/data/questions';
import { describeOption } from '../../src/lib/figures';

describe('question bank integrity', () => {
  it('has 20 questions with unique ids', () => {
    expect(QUESTIONS).toHaveLength(20);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });

  it('has five questions in each domain', () => {
    for (const d of DOMAIN_KEYS) expect(QUESTIONS.filter((q) => q.domain === d)).toHaveLength(5);
  });

  it.each(QUESTIONS.map((q) => [q.id, q] as const))('%s is well formed', (_id, q) => {
    expect(q.options).toHaveLength(4);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThan(4);
    expect(q.prompt.trim()).not.toBe('');
    expect(q.explanation.trim()).not.toBe('');
    // Options must be distinguishable, otherwise a question has two right answers.
    expect(new Set(q.options.map(describeOption)).size).toBe(4);
    if (q.visual?.type === 'matrix') {
      expect(q.visual.cells).toHaveLength(9);
      expect(q.visual.cells.filter((c) => c === null)).toHaveLength(1);
    }
    if (q.visual?.type === 'seq') expect(q.visual.items.at(-1)).toBe('?');
  });

  it('spreads correct answers across positions', () => {
    const positions = new Set(QUESTIONS.map((q) => q.answer));
    expect(positions.size).toBe(4);
  });
});
