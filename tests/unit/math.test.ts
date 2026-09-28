import { describe, expect, it } from 'vitest';
import { Phi, clamp, erf, fmtPct, fmtTime, iqPercentile } from '../../src/lib/math';

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('erf / Phi', () => {
  it.each([
    [0, 0],
    [0.5, 0.5204999],
    [1, 0.8427008],
    [2, 0.9953223],
    [-1, -0.8427008],
  ])('erf(%d) ≈ %d', (x, expected) => {
    expect(erf(x)).toBeCloseTo(expected, 6);
  });

  it('matches standard normal CDF reference values', () => {
    expect(Phi(0)).toBeCloseTo(0.5, 7);
    expect(Phi(1)).toBeCloseTo(0.8413447, 6);
    expect(Phi(-1.96)).toBeCloseTo(0.0249979, 6);
  });

  it('places IQ 100 at the 50th percentile and 130 near the 97.7th', () => {
    expect(iqPercentile(100)).toBeCloseTo(50, 5);
    expect(iqPercentile(130)).toBeCloseTo(97.72, 2);
    expect(iqPercentile(70)).toBeCloseTo(2.28, 2);
  });
});

describe('fmtPct', () => {
  it.each([
    [99.95, '99.9'],
    [0.05, '0.1'],
    [99.4, '99.4'],
    [0.54, '0.5'],
    [50.4, '50'],
    [84.6, '85'],
  ])('fmtPct(%d) = %s', (p, s) => {
    expect(fmtPct(p)).toBe(s);
  });
});

describe('fmtTime', () => {
  it('formats as MM:SS and rounds partial seconds up', () => {
    expect(fmtTime(15 * 60 * 1000)).toBe('15:00');
    expect(fmtTime(61_000)).toBe('01:01');
    expect(fmtTime(500)).toBe('00:01');
  });
  it('never shows negative time', () => {
    expect(fmtTime(-5000)).toBe('00:00');
  });
});
