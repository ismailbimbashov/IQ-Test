import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const scan = (page: Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();

test.describe('Accessibility (axe, WCAG 2.2 AA)', () => {
  test('welcome screen', async ({ page, welcome }) => {
    await welcome.goto();
    expect((await scan(page)).violations).toEqual([]);
  });

  test('quiz screens: matrix, sequence, text and figure options', async ({ page, welcome, quiz }) => {
    await welcome.goto();
    await welcome.start('Axe');
    for (const n of [1, 6, 11, 14]) {
      await quiz.gridButton(n).click();
      await quiz.expectQuestion(n);
      expect((await scan(page)).violations, `question ${n}`).toEqual([]);
    }
  });

  test('submit dialog', async ({ page, welcome, quiz }) => {
    await welcome.goto();
    await welcome.start('Axe');
    await quiz.submitButton.click();
    await expect(quiz.dialog).toBeVisible();
    expect((await scan(page)).violations).toEqual([]);
  });

  test('results and review screens', async ({ page, welcome, quiz, results, review }) => {
    await welcome.goto();
    await welcome.start('Axe');
    await quiz.option(0).click();
    await quiz.submit();
    await expect(results.score).toBeVisible();
    expect((await scan(page)).violations, 'results').toEqual([]);
    await results.reviewButton.click();
    await expect(review.heading).toBeVisible();
    expect((await scan(page)).violations, 'review').toEqual([]);
  });
});
