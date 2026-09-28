import {
  DOMAIN_KEYS,
  IQ_MAX,
  IQ_MIN,
  KEY_ACTIVE,
  KEY_HIST,
  MAX_HISTORY,
  NAME_MAX,
  isAgeGroup,
} from '../config';
import { QUESTIONS } from '../data/questions';
import type { Answer, TestResult, TestState } from '../types';
import { classify } from './scoring';

/*
 * localStorage is user-controlled input: it can be edited in devtools, left over from an
 * older version, or unavailable (private mode, blocked site data). Every read is guarded
 * and validated before anything reaches the DOM.
 */

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('Could not save to localStorage', err);
    return false;
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable: nothing to remove */
  }
}

/* ---------- Validators ---------- */
type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInt = (v: unknown, lo: number, hi: number): v is number =>
  Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
const isName = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= NAME_MAX;
const isAnswers = (v: unknown): v is Answer[] =>
  Array.isArray(v) && v.length === QUESTIONS.length && v.every((a) => a === null || isInt(a, 0, 3));
const isFlags = (v: unknown): v is boolean[] =>
  Array.isArray(v) && v.length === QUESTIONS.length && v.every((f) => typeof f === 'boolean');

export function isValidState(s: unknown): s is TestState {
  return (
    isObj(s) &&
    s.v === 1 &&
    s.status === 'active' &&
    isName(s.name) &&
    isAgeGroup(s.age) &&
    isNum(s.startedAt) &&
    isNum(s.deadline) &&
    isInt(s.current, 0, QUESTIONS.length - 1) &&
    isAnswers(s.answers) &&
    isFlags(s.flags)
  );
}

export function isValidResult(r: unknown): r is TestResult {
  if (!isObj(r)) return false;
  const numeric = ['date', 'rawIQ', 'percentile', 'W', 'Wc', 'p', 'r', 'A', 'z', 'mu', 'sd', 'timeUsedMs'];
  const d = r.domains;
  return (
    typeof r.id === 'string' &&
    /^[a-z0-9]{1,32}$/i.test(r.id) &&
    isName(r.name) &&
    isAgeGroup(r.age) &&
    typeof r.auto === 'boolean' &&
    isInt(r.iq, IQ_MIN, IQ_MAX) &&
    isInt(r.correct, 0, QUESTIONS.length) &&
    r.total === QUESTIONS.length &&
    numeric.every((k) => isNum(r[k])) &&
    isObj(d) &&
    DOMAIN_KEYS.every((k) => {
      const s = d[k];
      return isObj(s) && ['correct', 'total', 'w', 'wc'].every((f) => isInt(s[f], 0, 1000));
    }) &&
    isAnswers(r.answers) &&
    isFlags(r.flags)
  );
}

/* ---------- Public API ---------- */
export function loadActive(): TestState | null {
  const s = read(KEY_ACTIVE);
  if (isValidState(s)) return s;
  remove(KEY_ACTIVE); // absent, corrupt, or from an incompatible version
  return null;
}

export const saveActive = (s: TestState): boolean => write(KEY_ACTIVE, s);
export const clearActive = (): void => remove(KEY_ACTIVE);

/** Valid saved results, oldest first. Invalid entries are dropped; category is re-derived from iq. */
export function loadHistory(): TestResult[] {
  const h = read(KEY_HIST);
  if (!Array.isArray(h)) return [];
  return h.filter(isValidResult).map((r) => ({ ...r, category: classify(r.iq) }));
}

export function appendResult(res: TestResult): boolean {
  const hist = loadHistory();
  hist.push(res);
  return write(KEY_HIST, hist.slice(-MAX_HISTORY));
}

export const clearHistory = (): void => remove(KEY_HIST);
