import { QUESTIONS } from '../../src/data/questions';
import { KEY_ACTIVE, expect, test } from './fixtures';

test.describe('Time limit', () => {
  test('counts down, warns near the end and submits automatically at 00:00', async ({
    page,
    welcome,
    quiz,
    results,
  }) => {
    // Freeze time so every reading is exact; it only moves when the test fast-forwards it.
    const t0 = new Date('2026-01-01T09:00:00Z');
    await page.clock.install({ time: t0 });
    await page.clock.pauseAt(new Date(t0.getTime() + 1000));
    await welcome.goto();
    await welcome.start('Timed');
    await quiz.option(0).click();
    await expect(quiz.timer).toContainText('15:00');

    await page.clock.fastForward('10:00');
    await expect(quiz.timer).toContainText('05:00');
    await expect(quiz.timer).not.toHaveClass(/warn/);

    await page.clock.fastForward('03:30');
    await expect(quiz.timer).toContainText('01:30');
    await expect(quiz.timer).toHaveClass(/warn/);

    await page.clock.fastForward('01:31');
    await expect(results.score).toBeVisible();
    await expect(page.getByRole('status')).toContainText("Time's up. Your answers were submitted.");
    await expect(page.getByText('15:00 (limit)')).toBeVisible();
  });

  test('submits a test whose time ran out while the page was closed', async ({ page, results }) => {
    // Seed a session that expired a minute ago, as if the tab had been closed mid-test.
    await page.addInitScript(
      ([key, total]) => {
        const now = Date.now();
        localStorage.setItem(
          key,
          JSON.stringify({
            v: 1,
            status: 'active',
            name: 'Away',
            age: 'a18',
            startedAt: now - 16 * 60_000,
            deadline: now - 60_000,
            current: 3,
            answers: Array.from({ length: total }, () => null),
            flags: Array.from({ length: total }, () => false),
          }),
        );
      },
      [KEY_ACTIVE, QUESTIONS.length] as const,
    );
    await page.goto('/');
    await expect(results.score).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Time ran out while you were away');
    await expect(page.getByText('15:00 (limit)')).toBeVisible();
  });
});
