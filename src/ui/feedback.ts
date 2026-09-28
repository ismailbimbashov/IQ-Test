import { $ } from '../lib/dom';

/* Toasts and the confirmation modal. */

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function toast(msg: string, ms = 3200): void {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

export interface ModalOptions {
  title: string;
  body: string;
  okLabel?: string;
  cancelLabel?: string;
  onOk: () => void;
}

let onOk: (() => void) | null = null;
let returnFocus: HTMLElement | null = null;

const backgroundEls = (): HTMLElement[] => [$('#topbar'), $('#main'), $('.footer')];

export const isModalOpen = (): boolean => !$('#modal').hidden;

export function openModal(opts: ModalOptions): void {
  $('#modal-title').textContent = opts.title;
  $('#modal-body').textContent = opts.body;
  $('#modal-ok').textContent = opts.okLabel ?? 'Submit';
  $('#modal-cancel').textContent = opts.cancelLabel ?? 'Keep going';
  onOk = opts.onOk;
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  backgroundEls().forEach((el) => (el.inert = true));
  $('#modal').hidden = false;
  $('#modal-ok').focus();
}

export function closeModal(): void {
  if (!isModalOpen()) return;
  $('#modal').hidden = true;
  onOk = null;
  backgroundEls().forEach((el) => (el.inert = false));
  if (returnFocus?.isConnected) returnFocus.focus();
  returnFocus = null;
}

export function initModal(): void {
  const modal = $('#modal');
  $('#modal-cancel').addEventListener('click', closeModal);
  $('#modal-ok').addEventListener('click', () => {
    const f = onOk;
    closeModal();
    f?.();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    } else if (e.key === 'Tab') {
      // Two focusable controls: keep focus cycling between them.
      const f = [$('#modal-cancel'), $('#modal-ok')];
      const i = f.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + 2) % 2]!.focus();
    }
  });
}
