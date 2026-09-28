import { test as base, expect } from '@playwright/test';
import { QuizPage } from './pages/QuizPage';
import { ResultsPage } from './pages/ResultsPage';
import { ReviewPage } from './pages/ReviewPage';
import { WelcomePage } from './pages/WelcomePage';

export const KEY_ACTIVE = 'cogidx.active.v1';
export const KEY_HIST = 'cogidx.history.v1';

interface Pages {
  welcome: WelcomePage;
  quiz: QuizPage;
  results: ResultsPage;
  review: ReviewPage;
  /** Collects CSP violations and uncaught page errors; asserted empty after each test. */
  pageProblems: string[];
}

export const test = base.extend<Pages>({
  pageProblems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
      });
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) =>
          console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`),
        );
      });
      await use(problems);
      expect(problems, 'no console errors, page errors or CSP violations').toEqual([]);
    },
    { auto: true },
  ],
  welcome: async ({ page }, use) => use(new WelcomePage(page)),
  quiz: async ({ page }, use) => use(new QuizPage(page)),
  results: async ({ page }, use) => use(new ResultsPage(page)),
  review: async ({ page }, use) => use(new ReviewPage(page)),
});

export { expect };
