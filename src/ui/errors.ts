import { toast } from './feedback';

/*
 * Client-side error reporting. The app has no backend, so errors go to the console and the
 * user sees a recoverable message. A crash-reporting service can be plugged into report().
 */

let lastToast = 0;

export function report(err: unknown, context = 'Unexpected error'): void {
  console.error(`[cognitive-index] ${context}`, err);
  const now = Date.now();
  if (now - lastToast > 5000) {
    lastToast = now;
    try {
      toast('Something went wrong. Your answers are saved: reload the page to continue.', 6000);
    } catch {
      /* the toast element itself is unavailable; the console entry above still stands */
    }
  }
}

export function installGlobalErrorHandlers(): void {
  window.addEventListener('error', (e) => report(e.error ?? e.message, 'Uncaught error'));
  window.addEventListener('unhandledrejection', (e) => report(e.reason, 'Unhandled promise rejection'));
}

/** Replaces the page content when the app cannot start at all. Built with DOM APIs, not HTML strings. */
export function renderFatal(err: unknown): void {
  console.error('[cognitive-index] Failed to start', err);
  const main = document.getElementById('main');
  if (!main) return;
  const box = document.createElement('div');
  box.className = 'glass pad';
  box.setAttribute('role', 'alert');
  const h = document.createElement('h1');
  h.textContent = 'The test could not start';
  const p = document.createElement('p');
  p.className = 'muted';
  p.textContent =
    'Reload the page to try again. If it keeps happening, allow this site to use storage and update your browser.';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-primary';
  btn.textContent = 'Reload';
  btn.addEventListener('click', () => location.reload());
  box.append(h, p, btn);
  main.replaceChildren(box);
}
