import { IQ_MEAN, IQ_SD } from '../config';

export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

/** Error function, Abramowitz & Stegun 7.1.26 (|error| < 1.5e-7). */
export function erf(x: number): number {
  const s = Math.sign(x);
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return s * y;
}

/** Standard normal cumulative distribution function. */
export const Phi = (z: number): number => 0.5 * (1 + erf(z / Math.SQRT2));

/** Share of the population (0–100) scoring below the given IQ. */
export const iqPercentile = (iq: number): number => Phi((iq - IQ_MEAN) / IQ_SD) * 100;

export function fmtPct(p: number): string {
  if (p >= 99.9) return '99.9';
  if (p < 0.1) return '0.1';
  return p >= 99 || p < 1 ? p.toFixed(1) : String(Math.round(p));
}

/** Formats milliseconds as MM:SS, rounding up so 00:00 only shows at the deadline. */
export function fmtTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
