import { expect, type Locator, type Page } from '@playwright/test';
import { QUESTIONS } from '../../../src/data/questions';
import type { Answer } from '../../../src/types';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export class QuizPage {
  readonly timer: Locator;
  readonly counter: Locator;
  readonly answeredCount: Locator;
  readonly options: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly flagButton: Locator;
  readonly submitButton: Locator;
  readonly dialog: Locator;
  readonly questionNav: Locator;

  constructor(readonly page: Page) {
    this.timer = page.getByRole('timer');
    this.counter = page.getByText(/^Question \d+ of \d+$/);
    this.answeredCount = page.getByText(/^\d+ of \d+ answered$/);
    this.options = page.getByRole('radiogroup').getByRole('radio');
    this.prevButton = page.getByRole('button', { name: 'Previous' });
    this.nextButton = page.getByRole('button', { name: /^(Next|Finish)$/ });
    this.flagButton = page.getByRole('button', { name: /^(Flag for review|Flagged)$/ });
    this.submitButton = page.getByRole('button', { name: 'Submit test' });
    this.dialog = page.getByRole('dialog');
    this.questionNav = page.getByRole('navigation', { name: 'Jump to question' });
  }

  option(index: number): Locator {
    return this.page.getByRole('radio', { name: new RegExp(`^Option ${LETTERS[index]}:`) });
  }

  gridButton(n: number): Locator {
    return this.questionNav.getByRole('button', { name: new RegExp(`^Question ${n},`) });
  }

  async expectQuestion(n: number): Promise<void> {
    await expect(this.counter).toHaveText(`Question ${n} of ${QUESTIONS.length}`);
  }

  /** Answers every question in order (null = skip), ending on the last question. */
  async answerAll(answers: readonly Answer[]): Promise<void> {
    for (const [i, a] of answers.entries()) {
      await this.expectQuestion(i + 1);
      if (a !== null) {
        await this.option(a).click();
        await expect(this.option(a)).toBeChecked();
      }
      if (i < answers.length - 1) await this.nextButton.click();
    }
  }

  /** Opens the submit dialog and confirms it. */
  async submit(): Promise<void> {
    await this.submitButton.click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('button', { name: 'Submit' }).click();
  }
}

export const correctAnswers = (): Answer[] => QUESTIONS.map((q) => q.answer);
export const wrongAnswers = (): Answer[] => QUESTIONS.map((q) => ((q.answer + 1) % 4) as Answer);
export const noAnswers = (): Answer[] => QUESTIONS.map(() => null);
