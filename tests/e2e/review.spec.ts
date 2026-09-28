import { QUESTIONS } from '../../src/data/questions';
import { expect, test } from './fixtures';

test.describe('Answer review', () => {
  test.beforeEach(async ({ welcome, quiz }) => {
    await welcome.goto();
    await welcome.start('Reviewer');
    // Q1 correct, Q2 wrong and flagged, the rest unanswered.
    await quiz.option(QUESTIONS[0]!.answer).click();
    await quiz.nextButton.click();
    await quiz.option((QUESTIONS[1]!.answer + 1) % 4).click();
    await quiz.flagButton.click();
    await quiz.submit();
  });

  test('lists every question with the correct answer and an explanation', async ({ results, review }) => {
    await results.reviewButton.click();
    await expect(review.heading).toBeFocused();
    await expect(review.items).toHaveCount(QUESTIONS.length);
    const first = review.items.first();
    await expect(first.getByText('Correct', { exact: true })).toBeVisible();
    await expect(first.getByText('Your answer, correct')).toBeVisible();
    await expect(first.getByText(QUESTIONS[0]!.explanation)).toBeVisible();
    await expect(review.filter('All')).toHaveAttribute('aria-pressed', 'true');
  });

  test('filters by outcome', async ({ results, review }) => {
    await results.reviewButton.click();

    await review.filter('Incorrect').click();
    await expect(review.filter('Incorrect')).toHaveAttribute('aria-pressed', 'true');
    await expect(review.items).toHaveCount(1);
    await expect(review.items.first()).toHaveAccessibleName('Question 2');
    await expect(review.items.first().getByText('Correct answer')).toBeVisible();
    await expect(review.items.first().getByText('Your answer', { exact: true })).toBeVisible();

    await review.filter('Unanswered').click();
    await expect(review.items).toHaveCount(QUESTIONS.length - 2);

    await review.filter('Flagged').click();
    await expect(review.items).toHaveCount(1);
    await expect(review.items.first().getByText('Flagged')).toBeVisible();
  });

  test('returns to the same result', async ({ results, review }) => {
    await expect(results.correctStat).toContainText('1 / 20');
    await results.reviewButton.click();
    await review.backButton.click();
    await expect(results.heading).toBeFocused();
    await expect(results.correctStat).toContainText('1 / 20');
  });

  test('shows an empty state when nothing matches', async ({ page, welcome, quiz, results, review }) => {
    await results.retakeButton.click();
    await welcome.startButton.click();
    await quiz.submit();
    await results.reviewButton.click();
    await review.filter('Flagged').click();
    await expect(review.empty).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
  });
});
