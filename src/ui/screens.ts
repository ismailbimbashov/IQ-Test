import { $ } from '../lib/dom';

export type Screen = 'welcome' | 'quiz' | 'results' | 'review';

const SCREENS: Record<Screen, { title: string; heading: string }> = {
  welcome: { title: 'Cognitive Index — Reasoning Assessment', heading: '#welcome-title' },
  quiz: { title: 'Test in progress — Cognitive Index', heading: '#quiz-title' },
  results: { title: 'Your results — Cognitive Index', heading: '#res-heading' },
  review: { title: 'Answer review — Cognitive Index', heading: '#review-title' },
};

let current: Screen | null = null;

export const currentScreen = (): Screen | null => current;

/**
 * Shows one screen and hides the rest. When moving between screens, focus goes to the
 * new screen's heading so screen-reader users hear where they are.
 */
export function show(id: Screen, { hasHistory = false, focus = true } = {}): void {
  const changed = current !== id;
  const first = current === null;
  current = id;
  (Object.keys(SCREENS) as Screen[]).forEach((s) => ($(`#screen-${s}`).hidden = s !== id));
  $('#btn-history-top').hidden = !(id === 'welcome' && hasHistory);
  document.title = SCREENS[id].title;
  if (changed) {
    window.scrollTo({ top: 0 });
    // Skip on first render: the page just loaded and focus should start at the top of the document.
    if (focus && !first) $(SCREENS[id].heading).focus({ preventScroll: true });
  }
}
