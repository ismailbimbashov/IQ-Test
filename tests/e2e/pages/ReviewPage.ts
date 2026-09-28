import type { Locator, Page } from '@playwright/test';

export type ReviewFilterName = 'All' | 'Incorrect' | 'Unanswered' | 'Flagged';

export class ReviewPage {
  readonly heading: Locator;
  readonly items: Locator;
  readonly empty: Locator;
  readonly backButton: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Answer review' });
    this.items = page.getByRole('article', { name: /^Question \d+$/ });
    this.empty = page.getByText('No questions match this filter.');
    this.backButton = page.getByRole('button', { name: 'Back to results' });
  }

  filter(name: ReviewFilterName): Locator {
    return this.page
      .getByRole('group', { name: 'Filter questions' })
      .getByRole('button', { name, exact: true });
  }
}
