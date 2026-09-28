import type { AgeGroup, Difficulty, DomainKey } from './types';

export const LIMIT_MS = 15 * 60 * 1000;
export const WARN_MS = 2 * 60 * 1000;
export const ANNOUNCE_MINUTES: readonly number[] = [5, 2, 1];

/* Storage keys are unchanged from the original single-file app so existing history carries over. */
export const KEY_ACTIVE = 'cogidx.active.v1';
export const KEY_HIST = 'cogidx.history.v1';
export const MAX_HISTORY = 50;

export const WEIGHTS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
/** Finishing with the full time left adds up to this fraction of weighted accuracy. */
export const SPEED_MAX = 0.1;
export const IQ_MEAN = 100;
export const IQ_SD = 15;
export const IQ_MIN = 70;
export const IQ_MAX = 160;
export const NAME_MAX = 40;

/**
 * Illustrative age-group norms for the speed-adjusted accuracy A.
 * mu = expected A for the group, sd = spread of A in that group.
 * These are calibration values, not published population data.
 */
export const AGE_NORMS: Record<AgeGroup, { label: string; mu: number; sd: number }> = {
  u18: { label: 'Under 18', mu: 0.45, sd: 0.19 },
  a18: { label: '18–35', mu: 0.52, sd: 0.18 },
  a36: { label: '36–50', mu: 0.49, sd: 0.18 },
  a50: { label: '50+', mu: 0.44, sd: 0.19 },
};

export const DOMAINS: Record<DomainKey, { label: string }> = {
  pattern: { label: 'Pattern recognition' },
  numerical: { label: 'Numerical sequences' },
  verbal: { label: 'Verbal & spatial' },
  deductive: { label: 'Deductive reasoning' },
};

export const DOMAIN_KEYS = Object.keys(DOMAINS) as DomainKey[];

export const isAgeGroup = (v: unknown): v is AgeGroup => typeof v === 'string' && Object.hasOwn(AGE_NORMS, v);
