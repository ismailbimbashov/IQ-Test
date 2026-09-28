import type { Locator, Page } from '@playwright/test';

export class ResultsPage {
  readonly heading: Locator;
  readonly score: Locator;
  readonly band: Locator;
  readonly percentile: Locator;
  readonly correctStat: Locator;
  readonly domainBars: Locator;
  readonly historyList: Locator;
  readonly curve: Locator;
  readonly curveReadout: Locator;
  readonly formula: Locator;
  readonly reviewButton: Locator;
  readonly retakeButton: Locator;
  readonly clearHistoryButton: Locator;

  constructor(readonly page: Page) {
    const screen = page.locator('#screen-results');
    this.heading = page.getByRole('heading', { level: 1, name: 'Your results' });
    this.score = page.getByTestId('iq-score');
    this.band = page.getByTestId('iq-band');
    this.percentile = page.getByText(/You scored higher than/);
    this.correctStat = page.getByText('correct answers', { exact: true }).locator('..');
    this.domainBars = screen.getByRole('img', { name: /% correct$/ });
    this.historyList = screen.getByRole('list').last();
    this.curve = page.getByRole('img', { name: /Normal distribution of IQ scores/ });
    this.curveReadout = page.getByTestId('curve-readout');
    this.formula = page.getByText('How this score was calculated');
    this.reviewButton = page.getByRole('button', { name: 'Review answers' });
    this.retakeButton = page.getByRole('button', { name: 'Take the test again' });
    this.clearHistoryButton = page.getByRole('button', { name: 'Clear history' });
  }
}
