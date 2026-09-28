import { expect, test } from './fixtures';

test.describe('Welcome screen', () => {
  test.beforeEach(async ({ welcome }) => {
    await welcome.goto();
  });

  test('introduces the test format', async ({ page, welcome }) => {
    await expect(welcome.heading).toBeVisible();
    await expect(page).toHaveTitle('Cognitive Index — Reasoning Assessment');
    await expect(page.getByRole('listitem').filter({ hasText: 'questions' })).toHaveText(/20\s*questions/);
    await expect(page.getByRole('listitem').filter({ hasText: 'time limit' })).toHaveText(
      /15:00\s*time limit/,
    );
    await expect(welcome.ageGroup('18–35')).toBeChecked();
    await expect(welcome.pastResults).toBeHidden();
  });

  test('requires a name before starting', async ({ welcome }) => {
    await welcome.startButton.click();
    await expect(welcome.error).toHaveText('Enter a name so your results can be labelled.');
    await expect(welcome.nameInput).toBeFocused();
    await expect(welcome.nameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(welcome.heading).toBeVisible();

    await welcome.nameInput.fill('   ');
    await welcome.startButton.click();
    await expect(welcome.error).toBeVisible();

    await welcome.nameInput.fill('Sam');
    await expect(welcome.error).toBeEmpty();
    await expect(welcome.nameInput).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('starts the test with the chosen age group', async ({ page, welcome, quiz }) => {
    await welcome.start('Jordan', '50+');
    await quiz.expectQuestion(1);
    await expect(quiz.timer).toContainText(/1[45]:\d\d/);
    await expect(page).toHaveTitle(/Test in progress/);
    await expect(page.getByRole('heading', { level: 1, name: 'Test in progress' })).toBeFocused();
  });

  test('submits with the Enter key', async ({ welcome, quiz }) => {
    await welcome.nameInput.fill('Kim');
    await welcome.nameInput.press('Enter');
    await quiz.expectQuestion(1);
  });
});
