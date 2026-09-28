import { fmtTime } from './lib/math';
import { clearHistory, loadActive, loadHistory } from './lib/storage';
import type { TestResult } from './types';
import { initModal, openModal, toast } from './ui/feedback';
import { hasActiveSession, initQuiz, newState, persist, resumeQuiz, startQuiz, tick } from './ui/quiz';
import { initResults, renderResults } from './ui/results';
import { initReview, renderReview } from './ui/review';
import { initWelcome, renderWelcome } from './ui/welcome';

/* Wires the screens together. Screens never import each other; they call back into here. */

let viewed: TestResult | null = null;

function showResult(r: TestResult): void {
  viewed = r;
  renderResults(r, loadHistory());
}

function openResult(id: string): void {
  const r = loadHistory().find((h) => h.id === id);
  if (r) showResult(r);
  else toast('That result is no longer available.');
}

const goWelcome = (): void => renderWelcome(loadHistory());

function confirmClearHistory(): void {
  openModal({
    title: 'Clear all saved results?',
    body: 'This permanently removes your score history from this browser.',
    okLabel: 'Clear history',
    cancelLabel: 'Cancel',
    onOk: () => {
      clearHistory();
      viewed = null;
      toast('History cleared');
      goWelcome();
    },
  });
}

export function boot(): void {
  initModal();
  initWelcome({ onStart: (name, age) => startQuiz(newState(name, age)), onOpenResult: openResult });
  initQuiz({
    onFinish: (res, { auto, away, saved }) => {
      showResult(res);
      if (!saved)
        toast('Your result could not be saved to history: browser storage is full or blocked.', 6000);
      else if (auto)
        toast(
          away
            ? 'Time ran out while you were away. Your answers were submitted.'
            : "Time's up. Your answers were submitted.",
        );
    },
  });
  initResults({
    onReview: () => viewed && renderReview(viewed),
    onRetake: goWelcome,
    onClearHistory: confirmClearHistory,
    onOpenResult: openResult,
  });
  initReview(() => viewed && showResult(viewed));

  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) persist();
    else if (hasActiveSession()) tick(); // catch up immediately after the tab was in the background
  });

  const saved = loadActive();
  if (saved && resumeQuiz(saved)) {
    const n = saved.answers.filter((a) => a !== null).length;
    toast(
      `Test restored: ${n} answer${n === 1 ? '' : 's'} kept, ${fmtTime(saved.deadline - Date.now())} left.`,
    );
  } else if (!saved) {
    goWelcome();
  }
}
