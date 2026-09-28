import { correctAnswers } from './pages/QuizPage';
import { expect, test } from './fixtures';

test.describe('Results', () => {
  test.beforeEach(async ({ welcome }) => {
    await welcome.goto();
  });

  test('a perfect, fast run scores in the top band', async ({ page, welcome, quiz, results }) => {
    test.slow(); // answers all 20 questions
    await welcome.start('Ace');
    await quiz.answerAll(correctAnswers());
    await quiz.nextButton.click(); // "Finish" on the last question
    await expect(quiz.dialog.getByRole('heading')).toHaveText('Submit your test?');
    await quiz.dialog.getByRole('button', { name: 'Submit' }).click();

    await expect(results.heading).toBeFocused();
    await expect(page).toHaveTitle(/Your results/);
    await expect(results.score).toHaveText(/^14[5-8]$/);
    await expect(results.band).toHaveText('Exceptionally gifted');
    await expect(results.correctStat).toContainText('20 / 20');
    await expect(results.domainBars).toHaveCount(4);
    for (const bar of await results.domainBars.all())
      await expect(bar).toHaveAccessibleName(/: 100% correct$/);
    await expect(results.curve).toBeVisible();
  });

  test('an empty submission is reported at the floor with an explanation', async ({
    welcome,
    quiz,
    results,
  }) => {
    await welcome.start('Blank');
    await quiz.submit();
    await expect(results.score).toHaveText('70');
    await expect(results.band).toHaveText('Borderline');
    await expect(results.percentile).toContainText('Scores below 70 are reported as 70');
    await expect(results.correctStat).toContainText('0 / 20');
  });

  test('explains the calculation', async ({ page, welcome, quiz, results }) => {
    await welcome.start('Calc');
    await quiz.submit();
    await results.formula.click();
    await expect(page.getByText('Speed-adjusted accuracy')).toBeVisible();
    await expect(page.getByText('z = (A − μ) / σ')).toBeVisible();
  });

  test('keeps a history, pre-fills the next attempt and can clear it', async ({
    page,
    welcome,
    quiz,
    results,
  }) => {
    test.slow(); // two complete test runs
    await welcome.start('Repeat', '36–50');
    await quiz.submit();
    await expect(results.historyList.getByRole('listitem')).toHaveCount(1);

    await results.retakeButton.click();
    await expect(welcome.nameInput).toHaveValue('Repeat');
    await expect(welcome.ageGroup('36–50')).toBeChecked();
    await expect(welcome.pastResults).toBeVisible();

    await welcome.startButton.click();
    await quiz.option(0).click();
    await quiz.submit();
    await expect(results.historyList.getByRole('listitem')).toHaveCount(2);
    await expect(page.getByRole('img', { name: /Trend of your last 2 scores/ })).toBeVisible();

    // Open the older attempt from history.
    await results.historyList.getByRole('button').last().click();
    await expect(results.correctStat).toContainText('0 / 20');

    await results.clearHistoryButton.click();
    await expect(page.getByRole('dialog')).toContainText('Clear all saved results?');
    await page.getByRole('dialog').getByRole('button', { name: 'Clear history' }).click();
    await expect(welcome.heading).toBeVisible();
    await expect(welcome.pastResults).toBeHidden();
    await expect(page.getByRole('status')).toHaveText('History cleared');
  });

  test('lets keyboard users explore the distribution curve', async ({ page, welcome, quiz, results }) => {
    await welcome.start('Curve');
    await quiz.submit();
    await results.curve.focus();
    await page.keyboard.press('Home');
    await expect(results.curveReadout).toHaveText('IQ 40: higher than 0.1%');
    await page.keyboard.press('Shift+ArrowRight');
    await expect(results.curveReadout).toHaveText('IQ 50: higher than 0.1%');
    await page.keyboard.press('End');
    await expect(results.curveReadout).toHaveText('IQ 160: higher than 99.9%');
  });
});
