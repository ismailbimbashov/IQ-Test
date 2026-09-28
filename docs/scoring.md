# Scoring method

Implemented in [`src/lib/scoring.ts`](../src/lib/scoring.ts) and unit-tested in `tests/unit/scoring.test.ts`.

1. **Weighted accuracy** `p = Σ(w · correct) / Σ w`, with weights easy = 1, medium = 2, hard = 3.
   Unanswered questions count as incorrect.
2. **Speed adjustment** `A = p × (1 + 0.10 × r)`, where `r` is the fraction of the 15 minutes left at submission
   (0 when the timer runs out).
3. **Standard score** `z = (A − μ) / σ` using the age-group norm:

   | Age group | μ    | σ    |
   | --------- | ---- | ---- |
   | Under 18  | 0.45 | 0.19 |
   | 18–35     | 0.52 | 0.18 |
   | 36–50     | 0.49 | 0.18 |
   | 50+       | 0.44 | 0.19 |

4. **IQ** `100 + 15z`, rounded and clamped to 70–160.
5. **Percentile** `Φ((IQ − 100) / 15)`, the standard normal CDF (Abramowitz & Stegun 7.1.26 approximation of erf).

With these norms a perfect, instant run scores 148 for the 18–35 group. 160 is the clamp ceiling, not an
achievable score.

> The norms are illustrative calibration values, not published population data. The app says so on the welcome
> and results screens. Treat scores as a practice estimate, not a clinical measurement.
