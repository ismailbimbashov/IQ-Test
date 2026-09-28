import type { Locator, Page } from '@playwright/test';

export type AgeLabel = 'Under 18' | '18–35' | '36–50' | '50+';

export class WelcomePage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly startButton: Locator;
  readonly error: Locator;
  readonly pastResults: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', {
      level: 1,
      name: 'Measure how you reason under time pressure',
    });
    this.nameInput = page.getByLabel('Your name');
    this.startButton = page.getByRole('button', { name: 'Start the test' });
    this.error = page.locator('#start-err');
    this.pastResults = page.getByRole('heading', { name: 'Your past results' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  ageGroup(label: AgeLabel): Locator {
    return this.page.getByRole('radio', { name: label, exact: true });
  }

  async start(name = 'Alex', age: AgeLabel = '18–35'): Promise<void> {
    await this.nameInput.fill(name);
    await this.ageGroup(age).check();
    await this.startButton.click();
  }
}
