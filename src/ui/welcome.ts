import { LIMIT_MS, isAgeGroup } from '../config';
import { QUESTIONS } from '../data/questions';
import { $, cleanName } from '../lib/dom';
import { fmtTime } from '../lib/math';
import type { AgeGroup, TestResult } from '../types';
import { bindHistory, historyHTML } from './history';
import { show } from './screens';

interface WelcomeHandlers {
  onStart: (name: string, age: AgeGroup) => void;
  onOpenResult: (id: string) => void;
}

function setError(msg: string): void {
  $('#start-err').textContent = msg;
  const input = $<HTMLInputElement>('#in-name');
  if (msg) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

export function renderWelcome(hist: TestResult[]): void {
  $('#fact-q').textContent = String(QUESTIONS.length);
  $('#fact-time').textContent = fmtTime(LIMIT_MS);
  const input = $<HTMLInputElement>('#in-name');
  const last = hist.at(-1);
  if (last && !input.value) {
    input.value = last.name;
    const radio = document.querySelector<HTMLInputElement>(`input[name="age"][value="${last.age}"]`);
    if (radio) radio.checked = true;
  }
  $('#welcome-history').hidden = !hist.length;
  $('#welcome-history-body').innerHTML = hist.length ? historyHTML(hist) : '';
  setError('');
  show('welcome', { hasHistory: hist.length > 0 });
}

export function initWelcome(h: WelcomeHandlers): void {
  $('#start-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $<HTMLInputElement>('#in-name');
    const name = cleanName(input.value);
    const age = document.querySelector<HTMLInputElement>('input[name="age"]:checked')?.value;
    if (!name) {
      setError('Enter a name so your results can be labelled.');
      input.focus();
      return;
    }
    if (!isAgeGroup(age)) {
      setError('Choose an age group.');
      return;
    }
    setError('');
    h.onStart(name, age);
  });
  $('#in-name').addEventListener('input', () => {
    if ($('#start-err').textContent) setError('');
  });
  $('#btn-history-top').addEventListener('click', () => {
    $('#welcome-history').scrollIntoView({ behavior: 'smooth' });
  });
  bindHistory($('#welcome-history-body'), h.onOpenResult);
}
