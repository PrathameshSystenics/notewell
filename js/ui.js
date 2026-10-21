/*
 * Shared UI: page shell (top bar + footer), theme toggle, live status,
 * toasts, dialogs, markdown rendering and small formatting helpers.
 */
(function (global) {
  'use strict';

  const esc = global.escapeHtml;

  /* ------------------------------------------------------------------ icons */
  const ICONS = {
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    notes: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    board: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>',
    pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
    paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    restore: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
  };

  function icon(name, cls = 'size-4') {
    return `<svg class="${cls} shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  /* --------------------------------------------------------------- format */
  function formatDate(iso, withTime = true) {
    if (!iso) return '—';
    const d = new Date(iso);
    return withTime
      ? d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function relTime(iso) {
    if (!iso) return '';
    const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 45) return 'just now';
    const m = Math.round(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.round(m / 60);
    if (h < 24) return h + 'h ago';
    const d = Math.round(h / 24);
    if (d < 7) return d + 'd ago';
    return formatDate(iso, false);
  }

  function statusBadge(status) {
    return `<span class="tag tag-${status}">${esc(STATUS_LABELS[status] || status)}</span>`;
  }

  function categoryText(cats, id) {
    const c = id && cats.find((x) => x.id === id);
    return c ? c.name : 'Uncategorized';
  }

  /* ------------------------------------------------------------- markdown */
  function renderMarkdown(md) {
    const src = String(md || '');
    if (!src.trim()) return '<p class="opacity-50">Nothing written yet.</p>';
    if (global.marked && global.DOMPurify) {
      const html = global.marked.parse(src, { gfm: true, breaks: true });
      const clean = global.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
      // Open links in a new tab, safely.
      const tpl = document.createElement('template');
      tpl.innerHTML = clean;
      tpl.content.querySelectorAll('a[href]').forEach((a) => {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      });
      const wrap = document.createElement('div');
      wrap.appendChild(tpl.content);
      return wrap.innerHTML;
    }
    // Offline fallback: show plain text.
    return `<pre class="whitespace-pre-wrap">${esc(src)}</pre>`;
  }

  /* ---------------------------------------------------------------- theme */
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('ndm.theme', t);
    } catch (_) {}
    document.querySelectorAll('[data-theme-icon]').forEach((el) => (el.innerHTML = themeIcon()));
  }
  const currentTheme = () => document.documentElement.getAttribute('data-theme') || 'light';
  const themeIcon = () => icon(currentTheme() === 'dark' ? 'sun' : 'moon');
  function themeButton() {
    return `<button type="button" class="btn btn-ghost btn-sm btn-square" data-theme-toggle title="Toggle light / dark" aria-label="Toggle theme"><span data-theme-icon>${themeIcon()}</span></button>`;
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-theme-toggle]')) setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });

  /* --------------------------------------------------------------- toasts */
  function toastHost() {
    let host = document.getElementById('toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toast-host';
      host.className = 'toast toast-end toast-bottom z-[60]';
      document.body.appendChild(host);
    }
    return host;
  }

  function toast(message, type = 'info', opts = {}) {
    const el = document.createElement('div');
    const tone = type === 'error' ? 'border-error/50' : 'hairline';
    el.className = `bg-base-100 border ${tone} shadow-sm rounded-box px-4 py-3 text-sm flex items-start gap-3 max-w-sm`;
    const mark =
      type === 'error'
        ? `<span class="text-error mt-0.5">${icon('x')}</span>`
        : type === 'success'
          ? `<span class="text-success mt-0.5">${icon('check')}</span>`
          : `<span class="opacity-60 mt-0.5">${icon(opts.icon || 'bell')}</span>`;
    el.innerHTML = `${mark}<div class="flex-1 min-w-0">${esc(message)}${opts.link ? ` <a class="link font-medium" href="${esc(opts.link)}">View</a>` : ''}</div>`;
    toastHost().appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .25s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 260);
    }, opts.duration || 3800);
  }

  // Message carried across a redirect (Post/Redirect/Get).
  function flash(message, type = 'success') {
    try {
      sessionStorage.setItem('ndm.flash', JSON.stringify({ message, type }));
    } catch (_) {}
  }
  function showFlash() {
    try {
      const f = JSON.parse(sessionStorage.getItem('ndm.flash') || 'null');
      sessionStorage.removeItem('ndm.flash');
      if (f) toast(f.message, f.type);
    } catch (_) {}
  }

  /* -------------------------------------------------------------- dialogs */
  function confirmDialog({ title, body = '', confirmText = 'Confirm', danger = false }) {
    return new Promise((resolve) => {
      const d = document.createElement('dialog');
      d.className = 'modal';
      d.innerHTML = `<div class="modal-box max-w-md border hairline">
        <h3 class="font-semibold text-base">${esc(title)}</h3>
        <div class="text-sm opacity-75 mt-2">${body}</div>
        <div class="modal-action">
          <button class="btn btn-sm btn-ghost" value="cancel">Cancel</button>
          <button class="btn btn-sm ${danger ? 'btn-error' : 'btn-primary'}" value="ok">${esc(confirmText)}</button>
        </div></div>
        <form method="dialog" class="modal-backdrop"><button value="cancel">close</button></form>`;
      document.body.appendChild(d);
      let result = false;
      d.querySelectorAll('.modal-action button').forEach((b) =>
        b.addEventListener('click', () => {
          result = b.value === 'ok';
          d.close();
        })
      );
      d.addEventListener('close', () => {
        d.remove();
        resolve(result);
      });
      d.showModal();
      d.querySelector('button[value=ok]').focus();
    });
  }

  // Simple single-field form dialog. `onSubmit` may throw AppError to show
  // field errors without closing.
  function promptDialog({ title, label, value = '', confirmText = 'Save', maxLength, onSubmit }) {
    return new Promise((resolve) => {
      const d = document.createElement('dialog');
      d.className = 'modal';
      d.innerHTML = `<div class="modal-box max-w-md border hairline">
        <form novalidate>
          <h3 class="font-semibold text-base mb-4">${esc(title)}</h3>
          <label class="block text-sm mb-1.5" for="prompt-input">${esc(label)}</label>
          <input id="prompt-input" name="name" class="input input-sm w-full" ${maxLength ? `maxlength="${maxLength}"` : ''} value="${esc(value)}" autocomplete="off">
          <p class="text-error text-xs mt-1.5" data-error-for="name"></p>
          <div class="modal-action">
            <button type="button" class="btn btn-sm btn-ghost" data-cancel>Cancel</button>
            <button type="submit" class="btn btn-sm btn-primary">${esc(confirmText)}</button>
          </div>
        </form></div>
        <form method="dialog" class="modal-backdrop"><button>close</button></form>`;
      document.body.appendChild(d);
      let result = null;
      const form = d.querySelector('form');
      const input = d.querySelector('input');
      d.querySelector('[data-cancel]').onclick = () => d.close();
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(form);
        try {
          result = await onSubmit(input.value);
          d.close();
        } catch (err) {
          if (!showErrors(form, err)) handleError(err);
        }
      });
      d.addEventListener('close', () => {
        d.remove();
        resolve(result);
      });
      d.showModal();
      input.focus();
      input.select();
    });
  }

  /* --------------------------------------------------------------- forms */
  function clearErrors(form) {
    form.querySelectorAll('[data-error-for]').forEach((el) => (el.textContent = ''));
    form.querySelectorAll('.input-error,.select-error,.textarea-error').forEach((el) =>
      el.classList.remove('input-error', 'select-error', 'textarea-error')
    );
  }

  // Returns true when the error carried field messages that were displayed.
  function showErrors(form, err) {
    if (!err || err.code !== 'validation' || !err.errors) return false;
    let shown = false;
    for (const [field, msg] of Object.entries(err.errors)) {
      const slot = form.querySelector(`[data-error-for="${field}"]`);
      if (!slot) continue;
      slot.textContent = msg;
      shown = true;
      const input = form.querySelector(`[name="${field}"]`);
      if (input) {
        const cls = input.tagName === 'SELECT' ? 'select-error' : input.tagName === 'TEXTAREA' ? 'textarea-error' : 'input-error';
        input.classList.add(cls);
      }
    }
    const first = form.querySelector('.input-error,.select-error,.textarea-error');
    if (first) first.focus();
    return shown;
  }

  function handleError(err) {
    if (err && err.code === 'unauthorized') {
      location.href = 'login.html?returnUrl=' + encodeURIComponent(currentPage());
      return;
    }
    if (err && err.code === 'forbidden') {
      location.href = 'access-denied.html';
      return;
    }
    if (err instanceof AppError) {
      toast(err.message, 'error');
      return;
    }
    Log.error('unexpected', err);
    toast(err && err.name === 'QuotaExceededError' ? 'Storage is full. Remove some attachments and try again.' : 'Something went wrong. Please try again.', 'error');
  }

  async function busy(button, fn) {
    const label = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="loading loading-spinner loading-xs"></span>${label}`;
    try {
      return await fn();
    } finally {
      button.disabled = false;
      button.innerHTML = label;
    }
  }

  /* ------------------------------------------------------------- url params */
  const params = () => Object.fromEntries(new URLSearchParams(location.search));
  function setParams(obj, defaults = {}) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v === '' || v == null || defaults[k] === v) continue;
      usp.set(k, v);
    }
    const qs = usp.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }
  const currentPage = () => (location.pathname.split('/').pop() || 'index.html') + location.search;

  function pagination(page, totalPages) {
    if (totalPages <= 1) return '';
    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
      else if (pages[pages.length - 1] !== '…') pages.push('…');
    }
    return `<div class="join">
      <button class="join-item btn btn-sm" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Previous page">${icon('left')}</button>
      ${pages
        .map((p) =>
          p === '…'
            ? '<button class="join-item btn btn-sm btn-disabled">…</button>'
            : `<button class="join-item btn btn-sm ${p === page ? 'btn-active' : ''}" data-page="${p}">${p}</button>`
        )
        .join('')}
      <button class="join-item btn btn-sm" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} aria-label="Next page">${icon('right')}</button>
    </div>`;
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* ------------------------------------------------------------------ shell */
  function brand(href, compact) {
    return `<a href="${href}" class="flex items-center gap-2.5 min-w-0" aria-label="${esc(Config.APP_NAME)} home">
      <span class="brand-mark size-8 rounded-lg grid place-items-center shrink-0">${icon('notes', 'size-4')}</span>
      <span class="font-semibold tracking-tight text-[15px] truncate ${compact ? 'max-sm:hidden' : ''}">Notes &amp; Document Manager</span>
    </a>`;
  }

  function footer({ live = false } = {}) {
    return `<footer class="border-t hairline bg-base-100">
      <div class="max-w-6xl mx-auto px-4 md:px-8 py-5 flex flex-col-reverse sm:flex-row sm:items-center gap-3 text-xs">
        <p class="opacity-75">
          Made by <span class="font-semibold">${esc(Config.AUTHOR)}</span>
          <span class="opacity-40 mx-1.5">·</span>
          <a class="inline-flex items-center gap-1 py-1.5 hover:underline underline-offset-2" href="${esc(Config.SOURCE_URL)}" target="_blank" rel="noopener noreferrer">${icon('github', 'size-3.5')}Source code on GitHub</a>
        </p>
        ${
          live
            ? `<div class="sm:ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
                <span class="tooltip tooltip-top sm:tooltip-left inline-flex items-center gap-2" id="live-status" data-tip="Connecting to the live notification hub…" role="status" aria-live="polite">
                  <span class="live-dot is-off" id="live-dot"></span><span id="live-text">Connecting…</span>
                </span>
                <span class="inline-flex items-center gap-1.5 opacity-60" title="Where your data is stored">${icon('database', 'size-3.5')}Saved in ${esc(Store.engineName)}</span>
              </div>`
            : ''
        }
      </div>
    </footer>`;
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function renderShell(user, active) {
    const page = document.getElementById('page');
    const links = [];
    if (user.isUser) links.push(['dashboard.html', 'dashboard', 'Dashboard', 'dashboard'], ['notes.html', 'notes', 'Notes', 'notes']);
    if (user.isAdmin) {
      links.push(
        ['admin-dashboard.html', 'admin', 'Admin', 'shield'],
        ['admin-users.html', 'admin-users', 'Users', 'users'],
        ['admin-categories.html', 'admin-categories', 'Categories', 'tag']
      );
    }
    const link = ([href, key, label, ic]) =>
      `<a href="${href}" class="nav-link ${key === active ? 'is-active' : ''}" ${key === active ? 'aria-current="page"' : ''}>${icon(ic)}${label}</a>`;
    const mobileLinks = [...links];
    if (user.isUser) mobileLinks.push(['note-edit.html', 'new', 'New note', 'plus']);
    mobileLinks.push(['account.html', 'account', 'Account settings', 'user']);

    const shell = document.createElement('div');
    shell.className = 'min-h-screen flex flex-col';
    shell.innerHTML = `
      <header class="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b hairline">
        <div class="max-w-6xl mx-auto h-14 md:h-16 px-4 md:px-8 flex items-center gap-2">
          <button type="button" class="btn btn-ghost btn-sm btn-square md:hidden -ml-1.5" id="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}</button>
          ${brand(Auth.homeFor(user), true)}
          <nav class="hidden md:flex items-center gap-1 ml-6" aria-label="Main">${links.map(link).join('')}</nav>
          <div class="ml-auto flex items-center gap-1 shrink-0">
            ${user.isUser ? `<a href="note-edit.html" class="btn btn-primary btn-sm gap-1.5 hidden sm:inline-flex mr-1.5">${icon('plus')}New note</a>` : ''}
            ${themeButton()}
            <div class="dropdown dropdown-end">
              <button type="button" tabindex="0" class="btn btn-ghost btn-sm btn-circle p-0" aria-label="Account menu">
                <span class="size-8 rounded-full soft-primary grid place-items-center text-[11px] font-semibold">${esc(initials(user.displayName))}</span>
              </button>
              <ul tabindex="0" class="dropdown-content menu z-40 mt-2 w-60 bg-base-100 border hairline rounded-box shadow-lg p-2">
                <li class="px-3 py-2 pointer-events-none">
                  <div class="flex flex-col items-start gap-0 p-0">
                    <span class="font-medium text-sm">${esc(user.displayName)}</span>
                    <span class="text-xs opacity-60 truncate max-w-full">${esc(user.email)}</span>
                  </div>
                </li>
                <li><a href="account.html">${icon('user')}Account settings</a></li>
                <li><button type="button" data-logout>${icon('logout')}Sign out</button></li>
              </ul>
            </div>
          </div>
        </div>
        <!-- Mobile menu floats over the page (absolute), so opening it never pushes content down -->
        <nav id="mobile-nav" class="md:hidden absolute top-full inset-x-0 z-40 bg-base-100 border-b hairline shadow-lg px-3 py-3 grid gap-1 max-h-[calc(100dvh-3.5rem)] overflow-y-auto" hidden aria-label="Main">
          ${mobileLinks.map(link).join('')}
        </nav>
      </header>
      <div id="menu-backdrop" class="md:hidden fixed inset-0 top-14 z-20 bg-black/25" hidden></div>
      <main id="main" class="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10"></main>
      ${footer({ live: true })}`;
    document.body.prepend(shell);
    const main = shell.querySelector('#main');
    while (page.firstChild) main.appendChild(page.firstChild);
    page.remove();

    const menuBtn = shell.querySelector('#menu-btn');
    const mobileNav = shell.querySelector('#mobile-nav');
    const backdrop = shell.querySelector('#menu-backdrop');
    function setMenu(open) {
      mobileNav.hidden = !open;
      backdrop.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menuBtn.innerHTML = icon(open ? 'x' : 'menu');
    }
    menuBtn.addEventListener('click', () => setMenu(mobileNav.hidden));
    backdrop.addEventListener('click', () => setMenu(false));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && !mobileNav.hidden && setMenu(false));
    // Close when rotating / resizing to the desktop layout.
    matchMedia('(min-width: 768px)').addEventListener('change', (e) => e.matches && setMenu(false));

    shell.querySelector('[data-logout]').addEventListener('click', () => {
      Auth.logout();
      flash('You have been signed out.');
      location.href = 'login.html';
    });

    // Live connection (the SignalR-style hub) and its status in the footer.
    let lastEvent = null;
    const conn = Hub.connect(user, (n) => {
      lastEvent = n.createdAt;
      renderLive();
      toast(n.message, 'info', { link: n.noteId ? 'note.html?id=' + encodeURIComponent(n.noteId) : null });
      document.dispatchEvent(new CustomEvent('ndm:notification', { detail: n }));
    });
    function renderLive() {
      const since = new Date(conn.connectedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      shell.querySelector('#live-dot').classList.remove('is-off');
      shell.querySelector('#live-text').textContent = 'Live updates connected';
      shell.querySelector('#live-status').dataset.tip =
        `NoteStatusHub · connection ${conn.id} · ${conn.transport} · since ${since}` + (lastEvent ? ` · last event ${relTime(lastEvent)}` : '');
    }
    renderLive();
    setInterval(renderLive, 30000);
    return main;
  }

  /* ------------------------------------------------------------------- boot */
  // guard: 'auth' (any signed-in account), 'user' (User role), 'admin' (Admin role)
  async function boot({ guard = 'user', active = '', title = '' } = {}) {
    await Store.ready;
    await Seed.ensure();
    const user = await Auth.currentUser();
    const here = currentPage();
    if (!user) {
      location.replace('login.html?returnUrl=' + encodeURIComponent(here));
      return new Promise(() => {});
    }
    if (user.mustChangePassword && !here.startsWith('account.html')) {
      flash('Please change your temporary password before continuing.', 'info');
      location.replace('account.html?force=1');
      return new Promise(() => {});
    }
    if ((guard === 'user' && !user.isUser) || (guard === 'admin' && !user.isAdmin)) {
      location.replace('access-denied.html');
      return new Promise(() => {});
    }
    document.title = (title ? title + ' · ' : '') + Config.APP_NAME;
    renderShell(user, active);
    showFlash();
    return user;
  }

  function publicHeader(variant) {
    const page = location.pathname.split('/').pop() || 'index.html';
    const sections =
      variant === 'landing'
        ? `<nav class="hidden md:flex items-center gap-1 ml-8" aria-label="Sections">
            <a href="#features" class="nav-link">Features</a>
            <a href="#views" class="nav-link">Views</a>
            <a href="#privacy" class="nav-link">Privacy</a>
          </nav>`
        : '';
    return `<header class="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b hairline">
      <div class="max-w-6xl mx-auto h-14 md:h-16 px-4 md:px-8 flex items-center gap-2">
        ${brand('index.html')}
        ${sections}
        <div class="ml-auto flex items-center gap-1 shrink-0">
          ${themeButton()}
          ${page !== 'login.html' ? '<a href="login.html" class="btn btn-ghost btn-sm">Sign in</a>' : ''}
          ${page !== 'register.html' ? '<a href="register.html" class="btn btn-primary btn-sm hidden min-[420px]:inline-flex">Get started</a>' : ''}
        </div>
      </div>
    </header>`;
  }

  // Public pages (home, login, register, access denied).
  async function bootPublic() {
    await Store.ready;
    await Seed.ensure();
    const page = document.getElementById('page');
    document.querySelectorAll('[data-public-header]').forEach((el) => (el.outerHTML = publicHeader(el.dataset.publicHeader)));
    document.querySelectorAll('[data-footer-slot]').forEach((el) => (el.outerHTML = footer()));
    page.hidden = false;
    showFlash();
    return Auth.currentUser();
  }

  global.UI = {
    icon,
    esc,
    formatDate,
    relTime,
    statusBadge,
    categoryText,
    renderMarkdown,
    toast,
    flash,
    confirm: confirmDialog,
    prompt: promptDialog,
    clearErrors,
    showErrors,
    handleError,
    busy,
    params,
    setParams,
    pagination,
    download,
    boot,
    bootPublic,
    setTheme
  };

  // Clear a field's validation message as soon as the user edits it.
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.name || !el.form) return;
    const slot = el.form.querySelector(`[data-error-for="${el.name}"]`);
    if (slot && slot.textContent) {
      slot.textContent = '';
      el.classList.remove('input-error', 'select-error', 'textarea-error');
    }
  });

  // Last-resort handler so unexpected failures are logged and surfaced.
  global.addEventListener('unhandledrejection', (e) => {
    if (e.reason instanceof AppError) {
      e.preventDefault();
      handleError(e.reason);
    }
  });
})(window);
