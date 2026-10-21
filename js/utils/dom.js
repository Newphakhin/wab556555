// ตัวช่วย DOM: escape, toast, modal, confirm/prompt dialog
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function toast(message, type = 'info') {
  const root = document.getElementById('toastRoot');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3400);
}

export function openModal({ title, html, size = 'md', onMount }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal-${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="ปิด">✕</button></div>
      <div class="modal-body">${html}</div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');

  const onKey = (e) => e.key === 'Escape' && close();
  function close() {
    document.removeEventListener('keydown', onKey);
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.remove();
      if (!document.querySelector('.modal-overlay')) document.body.classList.remove('modal-open');
    }, 200);
  }
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay || e.target.closest('[data-close]')) close();
  });
  requestAnimationFrame(() => overlay.classList.add('show'));
  const body = overlay.querySelector('.modal-body');
  if (onMount) onMount(body, close);
  return { close, el: overlay, body };
}

/** กล่องยืนยัน -> Promise<boolean> */
export function confirmDialog({ title, message, confirmText = 'ยืนยัน', danger = false }) {
  return new Promise((resolve) => {
    const m = openModal({
      title,
      size: 'sm',
      html: `<p class="muted">${esc(message)}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>ยกเลิก</button>
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmText)}</button>
        </div>`,
      onMount: (body, close) => {
        body.querySelector('[data-ok]').onclick = () => { resolve(true); close(); };
      },
    });
    const obs = new MutationObserver(() => {
      if (!document.body.contains(m.el)) { obs.disconnect(); resolve(false); }
    });
    obs.observe(document.body, { childList: true });
  });
}

/** กล่องกรอกข้อความ (เช่น เหตุผลปฏิเสธ) -> Promise<string|null> */
export function promptDialog({ title, label, placeholder = '', required = false, confirmText = 'ยืนยัน', danger = false }) {
  return new Promise((resolve) => {
    const m = openModal({
      title,
      size: 'sm',
      html: `<div class="field"><label for="promptText">${esc(label)}${required ? ' <span class="req">*</span>' : ''}</label>
          <textarea id="promptText" placeholder="${esc(placeholder)}"></textarea>
          <small class="field-error" id="promptErr"></small></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>ยกเลิก</button>
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmText)}</button>
        </div>`,
      onMount: (body, close) => {
        const ta = body.querySelector('#promptText');
        setTimeout(() => ta.focus(), 60);
        body.querySelector('[data-ok]').onclick = () => {
          const v = ta.value.trim();
          if (required && !v) {
            body.querySelector('#promptErr').textContent = 'กรุณากรอกข้อมูล';
            ta.parentElement.classList.add('has-error');
            return;
          }
          resolve(v);
          close();
        };
      },
    });
    const obs = new MutationObserver(() => {
      if (!document.body.contains(m.el)) { obs.disconnect(); resolve(null); }
    });
    obs.observe(document.body, { childList: true });
  });
}
