import { KEY_ACTIVE, expect, test } from './fixtures';

test.describe('Taking the test', () => {
  test.beforeEach(async ({ welcome }) => {
    await welcome.goto();
    await welcome.start('Alex');
  });

  test('selects an answer and clears it when chosen again', async ({ quiz }) => {
    await expect(quiz.options).toHaveCount(4);
    await quiz.option(2).click();
    await expect(quiz.option(2)).toBeChecked();
    await expect(quiz.option(0)).not.toBeChecked();
    await expect(quiz.answeredCount).toHaveText('1 of 20 answered');
    await expect(quiz.gridButton(1)).toHaveAccessibleName('Question 1, answered');

    await quiz.option(2).click();
    await expect(quiz.option(2)).not.toBeChecked();
    await expect(quiz.answeredCount).toHaveText('0 of 20 answered');
  });

  test('moves between questions with buttons and the overview grid', async ({ quiz }) => {
    await expect(quiz.prevButton).toBeDisabled();
    await quiz.nextButton.click();
    await quiz.expectQuestion(2);
    await expect(quiz.prevButton).toBeEnabled();

    await quiz.gridButton(20).click();
    await quiz.expectQuestion(20);
    await expect(quiz.nextButton).toHaveText('Finish');
    await expect(quiz.gridButton(20)).toHaveAttribute('aria-current', 'step');

    await quiz.prevButton.click();
    await quiz.expectQuestion(19);
  });

  test('supports keyboard shortcuts', async ({ page, quiz }) => {
    await page.keyboard.press('3');
    await expect(quiz.option(2)).toBeChecked();
    await page.keyboard.press('a');
    await expect(quiz.option(0)).toBeChecked();

    await page.keyboard.press('f');
    await expect(quiz.flagButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('1 flagged')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await quiz.expectQuestion(2);
    await page.keyboard.press('ArrowLeft');
    await quiz.expectQuestion(1);
    await expect(quiz.option(0)).toBeChecked();
  });

  test('moves focus through options with the arrow keys without changing the answer', async ({ quiz }) => {
    await quiz.option(0).focus();
    await quiz.option(0).press('ArrowDown');
    await expect(quiz.option(1)).toBeFocused();
    await quiz.option(1).press('ArrowUp');
    await quiz.option(0).press('ArrowUp');
    await expect(quiz.option(3)).toBeFocused();
    await expect(quiz.answeredCount).toHaveText('0 of 20 answered');
    await quiz.option(3).press('Space');
    await expect(quiz.option(3)).toBeChecked();
  });

  test('flags questions for review', async ({ quiz }) => {
    await quiz.flagButton.click();
    await expect(quiz.flagButton).toHaveText('Flagged');
    await expect(quiz.gridButton(1)).toHaveAccessibleName('Question 1, not answered, flagged');
    await quiz.flagButton.click();
    await expect(quiz.flagButton).toHaveText('Flag for review');
  });

  test('restores progress after a reload', async ({ page, quiz }) => {
    await quiz.option(1).click();
    await quiz.nextButton.click();
    await quiz.option(3).click();
    await quiz.flagButton.click();

    await page.reload();
    await quiz.expectQuestion(2);
    await expect(quiz.option(3)).toBeChecked();
    await expect(quiz.flagButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status')).toContainText('Test restored: 2 answers kept');
    await quiz.prevButton.click();
    await expect(quiz.option(1)).toBeChecked();
  });

  test('warns about unanswered questions and lets you keep going', async ({ page, quiz }) => {
    await quiz.option(0).click();
    await quiz.submitButton.click();
    await expect(quiz.dialog).toBeVisible();
    await expect(quiz.dialog.getByRole('heading')).toHaveText('Submit with unanswered questions?');
    await expect(quiz.dialog).toContainText('19 questions are unanswered');
    await expect(quiz.dialog.getByRole('button', { name: 'Submit' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(quiz.dialog).toBeHidden();
    await expect(quiz.submitButton).toBeFocused();
    await quiz.expectQuestion(1);

    await quiz.submitButton.click();
    await quiz.dialog.getByRole('button', { name: 'Keep going' }).click();
    await expect(quiz.dialog).toBeHidden();
  });

  test('keeps keyboard focus inside the dialog', async ({ page, quiz }) => {
    await quiz.submitButton.click();
    const ok = quiz.dialog.getByRole('button', { name: 'Submit' });
    const cancel = quiz.dialog.getByRole('button', { name: 'Keep going' });
    await expect(ok).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(ok).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(cancel).toBeFocused();
    // Shortcuts are disabled while the dialog is open.
    await page.keyboard.press('1');
    await cancel.click();
    await expect(quiz.answeredCount).toHaveText('0 of 20 answered');
  });

  test('clears the saved session once submitted', async ({ page, quiz, results }) => {
    await quiz.submit();
    await expect(results.score).toBeVisible();
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY_ACTIVE)).toBeNull();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Your past results' })).toBeVisible();
  });
});
