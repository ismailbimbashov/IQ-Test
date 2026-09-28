import { ANNOUNCE_MINUTES, DOMAINS, LIMIT_MS, WARN_MS } from '../config';
import { QUESTIONS } from '../data/questions';
import { $, $$, esc, setText } from '../lib/dom';
import { describeOption, renderFig, renderVisual } from '../lib/figures';
import { fmtTime } from '../lib/math';
import { computeResult } from '../lib/scoring';
import { appendResult, clearActive, saveActive } from '../lib/storage';
import type { AgeGroup, AnswerIndex, Option, TestResult, TestState } from '../types';
import { closeModal, isModalOpen, openModal } from './feedback';
import { currentScreen, show } from './screens';

const TOTAL = QUESTIONS.length;
const KEYS = 'ABCD';

export interface FinishInfo {
  auto: boolean;
  away: boolean;
  saved: boolean;
}

interface QuizHandlers {
  onFinish: (result: TestResult, info: FinishInfo) => void;
}

let S: TestState | null = null;
let handlers: QuizHandlers | null = null;
let tickHandle: ReturnType<typeof setInterval> | null = null;
let lastAnnounce: number | null = null;

export function newState(name: string, age: AgeGroup, now = Date.now()): TestState {
  return {
    v: 1,
    status: 'active',
    name,
    age,
    startedAt: now,
    deadline: now + LIMIT_MS,
    current: 0,
    answers: Array<null>(TOTAL).fill(null),
    flags: Array<boolean>(TOTAL).fill(false),
  };
}

export const hasActiveSession = (): boolean => S?.status === 'active';

/** Saves the active session; called on every change and when the page is hidden. */
export function persist(): void {
  if (S?.status === 'active') saveActive(S);
}

/* ---------- Rendering ---------- */
const optionInner = (o: Option): string =>
  'fig' in o ? `<span class="opt-fig">${renderFig(o.fig, true)}</span>` : `<span>${esc(o.t)}</span>`;

function renderQuestion(s: TestState, animate: boolean): void {
  const i = s.current;
  const q = QUESTIONS[i]!;
  $('#q-domain').textContent = DOMAINS[q.domain].label;
  const diff = $('#q-diff');
  diff.textContent = q.difficulty[0]!.toUpperCase() + q.difficulty.slice(1);
  diff.className = 'chip ' + q.difficulty;
  $('#q-prompt').textContent = q.prompt;
  const visual = $('#q-visual');
  visual.innerHTML = renderVisual(q);
  visual.hidden = !q.visual;

  const opts = $('#q-options');
  opts.className = 'options' + (q.options.some((o) => 'fig' in o) ? '' : ' text-opts');
  opts.innerHTML = q.options
    .map(
      (o, k) =>
        `<button type="button" class="opt" role="radio" data-k="${k}" aria-checked="false" tabindex="-1"
           aria-label="${esc(`Option ${KEYS[k]}: ${describeOption(o)}`)}">
           <span class="key" aria-hidden="true">${KEYS[k]}</span>${optionInner(o)}</button>`,
    )
    .join('');
  updateOptions(s);

  $('#q-counter').textContent = `Question ${i + 1} of ${TOTAL}`;
  $('#progress-bar').style.width = `${((i + 1) / TOTAL) * 100}%`;
  const progress = $('#progress');
  progress.setAttribute('aria-valuemax', String(TOTAL));
  progress.setAttribute('aria-valuenow', String(i + 1));
  progress.setAttribute('aria-valuetext', `Question ${i + 1} of ${TOTAL}`);
  $<HTMLButtonElement>('#btn-prev').disabled = i === 0;
  $('#btn-next').textContent = i === TOTAL - 1 ? 'Finish' : 'Next';
  updateFlagBtn(s);
  renderGrid(s);

  if (animate) {
    const card = $('#q-card');
    card.classList.remove('enter');
    void card.offsetWidth; // restart the CSS animation
    card.classList.add('enter');
  }
}

function updateOptions(s: TestState): void {
  const sel = s.answers[s.current] ?? null;
  $$<HTMLButtonElement>('#q-options .opt').forEach((b) => {
    const k = Number(b.dataset.k);
    b.setAttribute('aria-checked', String(sel === k));
    b.tabIndex = (sel === null ? k === 0 : sel === k) ? 0 : -1;
  });
}

function updateFlagBtn(s: TestState): void {
  const on = s.flags[s.current] ?? false;
  const b = $('#btn-flag');
  b.classList.toggle('is-on', on);
  b.setAttribute('aria-pressed', String(on));
  b.textContent = on ? 'Flagged' : 'Flag for review';
}

function renderGrid(s: TestState): void {
  $('#qgrid').innerHTML = QUESTIONS.map((_, i) => {
    const answered = s.answers[i] !== null;
    const flagged = s.flags[i];
    const cur = i === s.current;
    const cls = [answered ? 'answered' : '', flagged ? 'flagged' : '', cur ? 'current' : '']
      .filter(Boolean)
      .join(' ');
    const lbl = `Question ${i + 1}, ${answered ? 'answered' : 'not answered'}${flagged ? ', flagged' : ''}`;
    return `<button type="button" class="${cls}" data-i="${i}" aria-label="${lbl}"${cur ? ' aria-current="step"' : ''}>${i + 1}</button>`;
  }).join('');
  const answered = s.answers.filter((a) => a !== null).length;
  $('#answered-count').textContent = `${answered} of ${TOTAL} answered`;
  $('#flag-count').textContent = `${s.flags.filter(Boolean).length} flagged`;
}

/* ---------- Actions ---------- */
function select(k: AnswerIndex): void {
  if (!S || S.status !== 'active') return;
  S.answers[S.current] = S.answers[S.current] === k ? null : k; // choosing again clears
  persist();
  updateOptions(S);
  renderGrid(S);
}

function go(i: number): void {
  if (!S || i < 0 || i >= TOTAL || i === S.current) return;
  S.current = i;
  persist();
  renderQuestion(S, true);
}

function toggleFlag(): void {
  if (!S) return;
  S.flags[S.current] = !S.flags[S.current];
  persist();
  updateFlagBtn(S);
  renderGrid(S);
}

function confirmSubmit(): void {
  if (!S) return;
  const un = S.answers.filter((a) => a === null).length;
  const fl = S.flags.filter(Boolean).length;
  let body = 'Your answers will be scored and the timer will stop.';
  if (un) body = `${un} question${un > 1 ? 's are' : ' is'} unanswered and will count as incorrect. ` + body;
  if (fl) body += ` You still have ${fl} flagged question${fl > 1 ? 's' : ''}.`;
  openModal({
    title: un ? 'Submit with unanswered questions?' : 'Submit your test?',
    body,
    okLabel: 'Submit',
    onOk: () => finishTest(false),
  });
}

/** Scores and stores the test. `auto` = time ran out; `away` = it ran out while the page was closed. */
export function finishTest(auto: boolean, away = false): void {
  if (!S || S.status !== 'active') return;
  stopTimer();
  closeModal();
  const remaining = auto ? 0 : Math.max(0, S.deadline - Date.now());
  S.status = 'done';
  const res = computeResult(S, remaining, auto);
  const saved = appendResult(res);
  clearActive();
  S = null;
  handlers?.onFinish(res, { auto, away, saved });
}

/* ---------- Timer (deadline-based, so it survives reloads and background tabs) ---------- */
function stopTimer(): void {
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = null;
}

export function tick(): void {
  if (!S || S.status !== 'active') {
    stopTimer();
    return;
  }
  const rem = S.deadline - Date.now();
  setText($('#timer-text'), fmtTime(rem));
  $('#timer').classList.toggle('warn', rem < WARN_MS);
  const mins = Math.ceil(rem / 60000);
  if (ANNOUNCE_MINUTES.includes(mins) && rem > mins * 60000 - 1000 && lastAnnounce !== mins) {
    lastAnnounce = mins;
    $('#sr-live').textContent = `${mins} minute${mins > 1 ? 's' : ''} remaining`;
  }
  if (rem <= 0) finishTest(true);
}

function startTimer(): void {
  stopTimer();
  lastAnnounce = null;
  tick();
  if (S) tickHandle = setInterval(tick, 250);
}

/* ---------- Public ---------- */
export function startQuiz(state: TestState): void {
  S = state;
  persist();
  show('quiz');
  renderQuestion(state, true);
  startTimer();
}

/**
 * Resumes a session restored from storage. If its deadline passed while the page was
 * closed, it is scored immediately. Returns true when the test continues.
 */
export function resumeQuiz(state: TestState): boolean {
  if (Date.now() >= state.deadline) {
    S = state;
    finishTest(true, true);
    return false;
  }
  startQuiz(state);
  return true;
}

export function initQuiz(h: QuizHandlers): void {
  handlers = h;
  const opts = $('#q-options');
  opts.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.opt');
    if (b) select(Number(b.dataset.k) as AnswerIndex);
  });
  opts.addEventListener('keydown', (e) => {
    // Roving focus inside the radio group. Selection stays explicit (Space/Enter/click),
    // so moving through options never silently changes an answer.
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    e.stopPropagation();
    const btns = $$<HTMLButtonElement>('#q-options .opt');
    const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
    const n = (idx + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length;
    btns[n]?.focus();
  });
  $('#qgrid').addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('button[data-i]');
    if (b) go(Number(b.dataset.i));
  });
  $('#btn-prev').addEventListener('click', () => S && go(S.current - 1));
  $('#btn-next').addEventListener('click', () => {
    if (!S) return;
    if (S.current === TOTAL - 1) confirmSubmit();
    else go(S.current + 1);
  });
  $('#btn-flag').addEventListener('click', toggleFlag);
  $('#btn-submit').addEventListener('click', confirmSubmit);

  document.addEventListener('keydown', (e) => {
    if (currentScreen() !== 'quiz' || isModalOpen() || !S) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.matches('input, textarea, select, [contenteditable]')) return;
    const k = e.key.toLowerCase();
    const map: Record<string, AnswerIndex> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
    const choice = map[k];
    if (choice !== undefined) {
      e.preventDefault();
      select(choice);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(S.current + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(S.current - 1);
    } else if (k === 'f') {
      e.preventDefault();
      toggleFlag();
    }
  });
}
