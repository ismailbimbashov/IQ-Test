# Playwright test coverage audit

**Date:** 2026-09-26 · **Scope:** `playwright.config.ts`, `tests/e2e/**`, `.github/workflows/ci.yml`

## 1. Setup & configuration

| Setting                    | Value                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Version                    | `@playwright/test` 1.63.0 (exact pin)                                                                                     |
| Projects                   | `chromium` (Desktop Chrome), `firefox`, `webkit` (Desktop Safari), `mobile-chrome` (Pixel 7), `mobile-safari` (iPhone 14) |
| Base URL                   | `http://localhost:4173` (production build via `vite preview`), overridable with `PLAYWRIGHT_BASE_URL`                     |
| Timeouts                   | test 30 s, expect 5 s, action 10 s, navigation 15 s                                                                       |
| Reporters                  | local: `list` + `html`; CI: `github` + `html` + `junit`                                                                   |
| Trace / video / screenshot | `on-first-retry` / `retain-on-failure` / `only-on-failure`                                                                |
| webServer                  | `npm run build && npm run preview` (tests exercise the real CSP and bundle)                                               |
| Parallelism                | `fullyParallel: true`; 2 workers in CI                                                                                    |
| Retries / guards           | CI: 2 retries, `forbidOnly`, `maxFailures: 10`                                                                            |

Score: **95**

## 2. Test inventory

7 spec files, **33 tests**, run across 5 projects (**165 executions**). All are UI/E2E tests; there are no API
tests (there is no API), no component tests and no visual-regression tests. No file contains `test.only`,
`test.skip` or `test.fixme`, and ESLint rules `playwright/no-focused-test` and `no-skipped-test` enforce this.

| File                    | Tests | Covers                                                                                                               |
| ----------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| `welcome.spec.ts`       | 4     | intro, name validation, start, Enter submits                                                                         |
| `quiz.spec.ts`          | 9     | select/clear, navigation, shortcuts, roving focus, flags, reload restore, submit dialog, focus trap, session cleanup |
| `timer.spec.ts`         | 2     | countdown, warning, auto-submit at 00:00 (frozen clock), expired-while-away                                          |
| `results.spec.ts`       | 5     | perfect score, floor score, formula, history lifecycle, keyboard curve                                               |
| `review.spec.ts`        | 4     | list, filters, back navigation, empty state                                                                          |
| `security.spec.ts`      | 5     | CSP present + no violations, hostile name, tampered history, corrupt session, blocked storage                        |
| `accessibility.spec.ts` | 4     | axe WCAG 2.2 AA on every screen and the dialog                                                                       |

Score: **95**

## 3. Page Object Model & architecture

Page objects live in `tests/e2e/pages/` (`WelcomePage`, `QuizPage`, `ResultsPage`, `ReviewPage`). Fixtures in
`tests/e2e/fixtures.ts` use `test.extend<>()` and inject them. An auto fixture (`pageProblems`) fails any test
that logs a console error, throws a page error or triggers a CSP violation. Locators are role/label/test-id based.
There is no XPath, no `nth-child`, and no `page.$`.

Score: **90**

```
[SEVERITY: low]
Category: Page Object Model & Architecture
File: tests/e2e/security.spec.ts:16, tests/e2e/pages/WelcomePage.ts:17
Issue: Two CSS locators remain: the CSP <meta> tag (it has no role) and the #start-err message (it holds text
       only while an error is shown).
Fix: Acceptable. Neither element has an accessible role that getByRole could target.
```

## 4. Test quality

- **Isolation:** each test gets a fresh browser context, so `localStorage` is clean. No test depends on another.
  Seeding uses `addInitScript`.
- **Assertions:** every test uses web-first assertions (`toBeChecked`, `toHaveText`, `toBeFocused`,
  `toHaveAccessibleName`, `toHaveAttribute`). ESLint `playwright/expect-expect` passes.
- **Waiting:** no `waitForTimeout` (lint rule set to error). Time-dependent behaviour uses `page.clock` frozen
  with `pauseAt`, then advanced with `fastForward`.
- **Naming:** names describe behaviour ("warns about unanswered questions and lets you keep going").
- **Data:** answer keys are imported from `src/data/questions.ts`, so tests can't drift from the bank.

Score: **90**

## 5. Critical user-flow coverage

| Flow                                   | Covered by                        |
| -------------------------------------- | --------------------------------- |
| Start a test (with validation)         | `welcome.spec.ts`                 |
| Answer, change, clear, navigate, flag  | `quiz.spec.ts`                    |
| Submit (confirm, cancel)               | `quiz.spec.ts`, `results.spec.ts` |
| Auto-submit when time runs out         | `timer.spec.ts`                   |
| Resume after reload; expired session   | `quiz.spec.ts`, `timer.spec.ts`   |
| Results and scoring extremes           | `results.spec.ts`                 |
| History: view old result, clear        | `results.spec.ts`                 |
| Review and filters                     | `review.spec.ts`                  |
| Error states (corrupt/blocked storage) | `security.spec.ts`                |
| Authentication / authorisation         | N/A: the app has none             |

Every critical flow has at least one passing E2E test on all 5 projects.

Score: **95**

## 6. CI integration

`ci.yml` job `e2e`:

- runs in `mcr.microsoft.com/playwright:v1.63.0-noble`, so browsers and system dependencies are preinstalled
  and no browser cache is needed;
- triggers on every PR and on pushes to `main`;
- shards the suite 2 ways (`--shard=N/2`);
- uploads `playwright-report/` and `test-results/` (traces, videos) unless the run was cancelled.

Score: **90**

```
[SEVERITY: medium]
Category: CI Pipeline Integration
File: .github/workflows/ci.yml (job e2e)
Issue: The workflow has not run on GitHub yet: this repository has not been pushed. The same container image and
       command were run locally (165/165 passed), but the hosted run is unverified.
Fix: Push to GitHub and confirm the first CI run is green, then make "E2E" a required status check on main.
```

## 7. Reliability & flakiness

No hard-coded waits, no `describe.serial`, and no shared mutable state between tests. Viewports are set by
device projects, animations are CSS-only and not waited on, and the app makes no network calls, so nothing
needs mocking.

Two issues were found and fixed during this audit:

- The timer test used `runFor` over 15 minutes (2,400 interval ticks) and timed out on WebKit. It now uses
  `fastForward`.
- A clock race on Firefox made the first timer reading 14:55 instead of 15:00. The clock is now frozen with
  `pauseAt`.

The fixed timer test passed 20/20 repeated runs.

Score: **90**

## 8. Missing test recommendations

The remaining gaps are low-risk:

```ts
test.describe('Visual regression', () => {
  // Run in a dedicated Linux-only job so screenshot baselines stay consistent across OSes.
  test.beforeEach(async ({ welcome }) => welcome.goto());
  test('welcome screen', async ({ page }) => {
    await expect(page).toHaveScreenshot('welcome.png', { fullPage: true });
  });
});

test.describe('Docker deployment smoke', () => {
  // Run with PLAYWRIGHT_BASE_URL=http://localhost:8080 against `docker compose up`.
  test('serves security headers', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-frame-options']).toBe('DENY');
  });
});
```

Score: **85**

## Score

| Category                         | Weight | Score | Weighted |
| -------------------------------- | ------ | ----- | -------- |
| Critical User Flow Coverage      | 25 %   | 95    | 23.75    |
| Test Quality Assessment          | 20 %   | 90    | 18.0     |
| Page Object Model & Architecture | 15 %   | 90    | 13.5     |
| CI Pipeline Integration          | 15 %   | 90    | 13.5     |
| Test Reliability                 | 10 %   | 90    | 9.0      |
| Playwright Configuration         | 5 %    | 95    | 4.75     |
| Test Inventory                   | 5 %    | 95    | 4.75     |
| Missing Test Recommendations     | 5 %    | 85    | 4.25     |

**Playwright Test Score: 91 / 100**

**Recommendation: DEPLOY.** Score ≥ 75, and every critical flow has a passing E2E test.
