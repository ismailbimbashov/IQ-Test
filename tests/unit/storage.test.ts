// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KEY_ACTIVE, KEY_HIST, MAX_HISTORY } from '../../src/config';
import { QUESTIONS } from '../../src/data/questions';
import { computeResult } from '../../src/lib/scoring';
import {
  appendResult,
  clearActive,
  clearHistory,
  isValidResult,
  isValidState,
  loadActive,
  loadHistory,
  saveActive,
} from '../../src/lib/storage';
import type { TestState } from '../../src/types';

const validState = (): TestState => ({
  v: 1,
  status: 'active',
  name: 'Alex',
  age: 'a18',
  startedAt: 1,
  deadline: 2,
  current: 0,
  answers: QUESTIONS.map(() => null),
  flags: QUESTIONS.map(() => false),
});
const result = () => computeResult(validState(), 0, true, 1000);

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('active session', () => {
  it('round-trips a valid state', () => {
    expect(saveActive(validState())).toBe(true);
    expect(loadActive()).toEqual(validState());
    clearActive();
    expect(loadActive()).toBeNull();
  });

  it.each([
    ['wrong version', { v: 2 }],
    ['finished status', { status: 'done' }],
    ['empty name', { name: '' }],
    ['unknown age', { age: 'x' }],
    ['current out of range', { current: 20 }],
    ['answer out of range', { answers: [7, ...QUESTIONS.slice(1).map(() => null)] }],
    ['short answers', { answers: [null] }],
    ['non-boolean flag', { flags: ['yes', ...QUESTIONS.slice(1).map(() => false)] }],
    ['string deadline', { deadline: '9999' }],
  ])('rejects and removes a state with %s', (_label, patch) => {
    localStorage.setItem(KEY_ACTIVE, JSON.stringify({ ...validState(), ...patch }));
    expect(loadActive()).toBeNull();
    expect(localStorage.getItem(KEY_ACTIVE)).toBeNull();
  });

  it('survives malformed JSON', () => {
    localStorage.setItem(KEY_ACTIVE, '{not json');
    expect(loadActive()).toBeNull();
  });

  it('reports failure instead of throwing when storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(saveActive(validState())).toBe(false);
    expect(appendResult(result())).toBe(false);
  });

  it('returns null when storage access itself throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(loadActive()).toBeNull();
    expect(loadHistory()).toEqual([]);
  });
});

describe('history', () => {
  it('appends results and caps the list', () => {
    for (let i = 0; i < MAX_HISTORY + 5; i++) appendResult(result());
    expect(loadHistory()).toHaveLength(MAX_HISTORY);
  });

  it('drops tampered entries, including script injection attempts', () => {
    const good = result();
    const evilId = { ...result(), id: '"><img src=x onerror=alert(1)>' };
    const evilIq = { ...result(), iq: '<b>1</b>' };
    const evilDomains = { ...result(), domains: { pattern: 'x' } };
    localStorage.setItem(KEY_HIST, JSON.stringify([good, evilId, evilIq, evilDomains, null, 5]));
    const h = loadHistory();
    expect(h).toHaveLength(1);
    expect(h[0]!.id).toBe(good.id);
  });

  it('re-derives the category label from the score', () => {
    localStorage.setItem(KEY_HIST, JSON.stringify([{ ...result(), category: '<script>alert(1)</script>' }]));
    expect(loadHistory()[0]!.category).toBe('Borderline');
  });

  it('ignores a non-array history value', () => {
    localStorage.setItem(KEY_HIST, JSON.stringify({ foo: 1 }));
    expect(loadHistory()).toEqual([]);
  });

  it('clears history', () => {
    appendResult(result());
    clearHistory();
    expect(loadHistory()).toEqual([]);
  });

  it('validators reject non-objects', () => {
    expect(isValidState(null)).toBe(false);
    expect(isValidState([])).toBe(false);
    expect(isValidResult('x')).toBe(false);
    expect(isValidResult(result())).toBe(true);
  });
});
