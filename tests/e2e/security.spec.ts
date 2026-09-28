import { correctAnswers } from './pages/QuizPage';
import { KEY_ACTIVE, KEY_HIST, expect, test } from './fixtures';

const XSS = `<img src=x onerror="window.__xss=1">`;

test.describe('Security hardening', () => {
  test('ships a strict Content-Security-Policy and completes a full run without violations', async ({
    page,
    welcome,
    quiz,
    results,
    review,
  }) => {
    test.slow(); // answers all 20 questions
    await welcome.goto();
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');

    await welcome.start('CSP');
    await quiz.answerAll(correctAnswers());
    await quiz.submit();
    await expect(results.score).toBeVisible();
    await results.reviewButton.click();
    await expect(review.items.first()).toBeVisible();
    // The pageProblems fixture fails the test if any CSP violation was reported.
  });

  test('renders a hostile name as text', async ({ page, welcome, quiz, results }) => {
    await welcome.goto();
    await welcome.start(XSS.slice(0, 40));
    await quiz.submit();
    await expect(results.score).toBeVisible();
    await expect(page.getByText(XSS.slice(0, 40)).first()).toBeVisible();
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });

  test('ignores tampered history entries in storage', async ({ page, welcome }) => {
    await page.addInitScript(
      ([key, payload]) => {
        localStorage.setItem(
          key,
          JSON.stringify([{ id: payload, name: payload, iq: payload, category: payload }, 'junk', null]),
        );
      },
      [KEY_HIST, XSS] as const,
    );
    await welcome.goto();
    await expect(welcome.heading).toBeVisible();
    await expect(welcome.pastResults).toBeHidden();
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
  });

  test('discards a corrupt saved session and starts fresh', async ({ page, welcome }) => {
    await page.addInitScript(
      (key) => localStorage.setItem(key, '{"v":1,"status":"active","answers":"oops"'),
      KEY_ACTIVE,
    );
    await welcome.goto();
    await expect(welcome.heading).toBeVisible();
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY_ACTIVE)).toBeNull();
  });

  test('still works when browser storage is blocked', async ({ page, welcome, quiz, results }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });
    });
    page.on('console', () => {}); // storage warnings are expected here
    await welcome.goto();
    await welcome.start('Private');
    await quiz.option(0).click();
    await quiz.submit();
    await expect(results.score).toBeVisible();
    await expect(page.getByRole('status')).toContainText('could not be saved to history');
  });
});
