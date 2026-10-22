/*
 * Application layer: configuration, validation, auth (identity + roles),
 * and the services used by every page (notes, categories, history,
 * attachments, email, notifications, admin).
 *
 * Pages never touch the Store directly. Every service method that works on a
 * note receives the signed-in user and enforces ownership itself, so hiding a
 * button in the UI is never the only protection.
 */
(function (global) {
  'use strict';

  const Store = global.Store;

  /* ------------------------------------------------------------ configuration */
  const Config = {
    APP_NAME: 'Notewell',
    AUTHOR: 'Prathamesh',
    // Repository link shown in the footer.
    SOURCE_URL: 'https://github.com/PrathameshSystenics/notewell',
    TITLE_MAX: 200,
    CONTENT_MAX: 100000,
    CATEGORY_MAX: 50,
    NAME_MAX: 80,
    PAGE_SIZE_DEFAULT: 12,
    PAGE_SIZE_MAX: 48,
    FILE_MAX_BYTES: 5 * 1024 * 1024,
    HISTORY_MAX: 50,
    SESSION_HOURS: 8,
    LOCKOUT_ATTEMPTS: 5,
    LOCKOUT_MINUTES: 5,
    PBKDF2_ITERATIONS: 120000,
    RESET_MINUTES: 60
  };

  const Roles = Object.freeze({ Admin: 'Admin', User: 'User' });
  const STATUSES = Object.freeze(['Draft', 'InProgress', 'Completed']);
  const STATUS_LABELS = Object.freeze({ Draft: 'Draft', InProgress: 'In progress', Completed: 'Completed' });

  /* ------------------------------------------------------------------ errors */
  // code mirrors an HTTP status: validation(400) unauthorized(401)
  // forbidden(403) notfound(404) conflict(409)
  class AppError extends Error {
    constructor(code, message, errors) {
      super(message);
      this.name = 'AppError';
      this.code = code;
      this.errors = errors || {};
    }
  }
  const fail = {
    validation: (errors, msg) => new AppError('validation', msg || 'Please correct the highlighted fields.', errors),
    unauthorized: () => new AppError('unauthorized', 'Please sign in to continue.'),
    forbidden: () => new AppError('forbidden', 'You do not have permission to do that.'),
    notFound: (what) => new AppError('notfound', (what || 'Item') + ' not found.'),
    conflict: (msg) => new AppError('conflict', msg)
  };

  /* ----------------------------------------------------------------- logging */
  const Log = {
    info: (event, data) => console.info('[ndm]', event, data || ''),
    warn: (event, data) => console.warn('[ndm]', event, data || ''),
    error: (event, data) => console.error('[ndm]', event, data || '')
  };

  /* --------------------------------------------------------------- utilities */
  const Util = {
    uid() {
      if (global.crypto && crypto.randomUUID) return crypto.randomUUID();
      const b = crypto.getRandomValues(new Uint8Array(16));
      return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    },
    now: () => new Date().toISOString(),
    normalize: (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase(),
    clean: (s) => String(s == null ? '' : s).trim(),
    isEmail: (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s),
    toB64: (bytes) => btoa(String.fromCharCode(...bytes)),
    fromB64: (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
    clampInt(value, min, max, fallback) {
      const n = parseInt(value, 10);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(max, Math.max(min, n));
    },
    // Plain-text preview of markdown for cards and lists.
    excerpt(md, len = 180) {
      const text = String(md || '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/gm, ' ') // table separators / rules
        .replace(/`([^`]*)`/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^\s{0,3}(#{1,6}|>|[-*+]\s+\[[ xX]\]|[-*+]|\d+\.)\s*/gm, '')
        .replace(/[*_~]{1,3}/g, '')
        .replace(/\|/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return text.length > len ? text.slice(0, len).trimEnd() + '…' : text;
    },
    formatBytes(n) {
      if (n < 1024) return n + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
      return (n / 1024 / 1024).toFixed(1) + ' MB';
    },
    wordCount: (s) => (String(s || '').trim().match(/\S+/g) || []).length
  };

  /* -------------------------------------------------------------- passwords */
  async function pbkdf2(password, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: Config.PBKDF2_ITERATIONS, hash: 'SHA-256' },
      key,
      256
    );
    return Util.toB64(new Uint8Array(bits));
  }

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Util.toB64(new Uint8Array(buf));
  }

  async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return { passwordHash: await pbkdf2(password, salt), passwordSalt: Util.toB64(salt) };
  }

  async function verifyPassword(password, user) {
    const hash = await pbkdf2(password, Util.fromB64(user.passwordSalt));
    if (hash.length !== user.passwordHash.length) return false;
    let diff = 0;
    for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ user.passwordHash.charCodeAt(i);
    return diff === 0;
  }

  const PASSWORD_RULES = [
    { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { id: 'upper', label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { id: 'lower', label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
    { id: 'digit', label: 'A number', test: (p) => /\d/.test(p) },
    { id: 'symbol', label: 'A symbol', test: (p) => /[^A-Za-z0-9]/.test(p) }
  ];
  const passwordProblems = (p) => PASSWORD_RULES.filter((r) => !r.test(p || '')).map((r) => r.label);

  // Public shape of a user. Never expose hashes, salts or stamps to pages.
  function userDto(u) {
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      roles: [...u.roles],
      createdAt: u.createdAt,
      mustChangePassword: !!u.mustChangePassword,
      isAdmin: u.roles.includes(Roles.Admin),
      isUser: u.roles.includes(Roles.User)
    };
  }

  /* ------------------------------------------------------------------- auth */
  const SESSION_KEY = 'ndm.session';

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }
  function writeSession(s) {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }
  function startSession(user) {
    writeSession({
      userId: user.id,
      stamp: user.securityStamp,
      expiresAt: Date.now() + Config.SESSION_HOURS * 3600 * 1000
    });
  }

  // Only allow redirects to our own pages (no open redirects).
  function safeReturnUrl(url) {
    return typeof url === 'string' && /^[a-z0-9-]+\.html(\?[^#]*)?$/i.test(url) ? url : null;
  }

  const Auth = {
    passwordRules: PASSWORD_RULES,

    // Loads the signed-in user, or null. Sessions expire, and are invalidated
    // whenever the security stamp changes (password or role change).
    async currentUser() {
      const s = readSession();
      if (!s) return null;
      if (Date.now() > s.expiresAt) {
        writeSession(null);
        return null;
      }
      const user = await Store.get('users', s.userId);
      if (!user || user.securityStamp !== s.stamp) {
        writeSession(null);
        return null;
      }
      // Sliding expiration.
      s.expiresAt = Date.now() + Config.SESSION_HOURS * 3600 * 1000;
      writeSession(s);
      return userDto(user);
    },

    async register(input) {
      const displayName = Util.clean(input.displayName);
      const email = Util.normalize(input.email);
      const password = String(input.password || '');
      const errors = {};
      if (!displayName) errors.displayName = 'Name is required.';
      else if (displayName.length > Config.NAME_MAX) errors.displayName = `Use at most ${Config.NAME_MAX} characters.`;
      if (!email) errors.email = 'Email is required.';
      else if (!Util.isEmail(email)) errors.email = 'Enter a valid email address.';
      const problems = passwordProblems(password);
      if (problems.length) errors.password = 'Password needs: ' + problems.join(', ').toLowerCase() + '.';
      if (password !== input.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
      if (Object.keys(errors).length) throw fail.validation(errors);

      const user = {
        id: Util.uid(),
        email,
        displayName,
        roles: [Roles.User], // public registration can only ever create a User
        ...(await hashPassword(password)),
        securityStamp: Util.uid(),
        mustChangePassword: false,
        accessFailedCount: 0,
        lockoutEnd: 0,
        createdAt: Util.now()
      };
      try {
        await Store.add('users', user);
      } catch (e) {
        if (e && e.name === 'ConstraintError') throw fail.validation({ email: 'An account with this email already exists.' });
        throw e;
      }
      Log.info('user.registered', { userId: user.id });
      startSession(user);
      // Welcome email: failure must not break registration.
      await Email.send(user, EmailTemplates.welcome(user));
      return userDto(user);
    },

    async login(emailInput, password) {
      const generic = new AppError('unauthorized', 'Invalid email or password.');
      const email = Util.normalize(emailInput);
      if (!email || !password) throw generic;
      const all = await Store.getAllBy('users', 'email', email);
      const user = all[0];
      if (!user) throw generic;
      if (user.lockoutEnd && user.lockoutEnd > Date.now()) {
        throw new AppError('unauthorized', 'Too many failed attempts. Try again in a few minutes.');
      }
      const ok = await verifyPassword(password, user);
      if (!ok) {
        user.accessFailedCount = (user.accessFailedCount || 0) + 1;
        if (user.accessFailedCount >= Config.LOCKOUT_ATTEMPTS) {
          user.lockoutEnd = Date.now() + Config.LOCKOUT_MINUTES * 60 * 1000;
          user.accessFailedCount = 0;
          Log.warn('user.lockedOut', { userId: user.id });
        }
        await Store.put('users', user);
        throw generic;
      }
      user.accessFailedCount = 0;
      user.lockoutEnd = 0;
      user.lastLoginAt = Util.now();
      await Store.put('users', user);
      startSession(user);
      Log.info('user.login', { userId: user.id });
      return userDto(user);
    },

    logout() {
      writeSession(null);
    },

    homeFor(user) {
      if (user.isUser) return 'dashboard.html';
      if (user.isAdmin) return 'admin-dashboard.html';
      return 'account.html';
    },

    async updateProfile(current, input) {
      const displayName = Util.clean(input.displayName);
      if (!displayName) throw fail.validation({ displayName: 'Name is required.' });
      if (displayName.length > Config.NAME_MAX) throw fail.validation({ displayName: `Use at most ${Config.NAME_MAX} characters.` });
      const user = await Store.get('users', current.id);
      if (!user) throw fail.unauthorized();
      user.displayName = displayName;
      await Store.put('users', user);
      return userDto(user);
    },

    async changePassword(current, input) {
      const user = await Store.get('users', current.id);
      if (!user) throw fail.unauthorized();
      const errors = {};
      if (!(await verifyPassword(String(input.currentPassword || ''), user))) errors.currentPassword = 'Current password is incorrect.';
      const problems = passwordProblems(input.newPassword || '');
      if (problems.length) errors.newPassword = 'Password needs: ' + problems.join(', ').toLowerCase() + '.';
      else if (input.newPassword === input.currentPassword) errors.newPassword = 'Choose a different password.';
      if (input.newPassword !== input.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
      if (Object.keys(errors).length) throw fail.validation(errors);
      Object.assign(user, await hashPassword(input.newPassword));
      user.mustChangePassword = false;
      user.securityStamp = Util.uid(); // signs out other sessions
      await Store.put('users', user);
      startSession(user);
      Log.info('user.passwordChanged', { userId: user.id });
      return userDto(user);
    },

    // Step 1 of "forgot password": create a one-time reset link (valid 1 hour).
    // Only a SHA-256 hash of the token is stored. Returns the link because this
    // browser-only demo cannot deliver real email.
    async requestPasswordReset(emailInput) {
      const email = Util.normalize(emailInput);
      if (!email) throw fail.validation({ email: 'Email is required.' });
      if (!Util.isEmail(email)) throw fail.validation({ email: 'Enter a valid email address.' });
      const user = (await Store.getAllBy('users', 'email', email))[0];
      if (!user) {
        Log.info('password.resetRequested', { known: false });
        return { link: null };
      }
      const token = Util.toB64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      user.resetTokenHash = await sha256(token);
      user.resetTokenExpires = Date.now() + Config.RESET_MINUTES * 60 * 1000;
      await Store.put('users', user);
      const link = 'reset-password.html?token=' + encodeURIComponent(token);
      await Email.send(user, EmailTemplates.passwordReset(user, link));
      Log.info('password.resetRequested', { userId: user.id });
      return { link };
    },

    // Step 2: check the token and set the new password.
    async resetPassword(token, newPassword, confirmPassword) {
      const invalid = new AppError('validation', 'This reset link is invalid or has expired. Please request a new one.');
      if (!token) throw invalid;
      const hash = await sha256(token);
      const user = (await Store.getAll('users')).find((u) => u.resetTokenHash && u.resetTokenHash === hash);
      if (!user || !user.resetTokenExpires || user.resetTokenExpires < Date.now()) throw invalid;
      const errors = {};
      const problems = passwordProblems(newPassword || '');
      if (problems.length) errors.newPassword = 'Password needs: ' + problems.join(', ').toLowerCase() + '.';
      if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
      if (Object.keys(errors).length) throw fail.validation(errors);
      Object.assign(user, await hashPassword(newPassword));
      delete user.resetTokenHash;
      delete user.resetTokenExpires;
      user.mustChangePassword = false;
      user.accessFailedCount = 0;
      user.lockoutEnd = 0;
      user.securityStamp = Util.uid(); // signs out every existing session
      await Store.put('users', user);
      Log.info('password.reset', { userId: user.id });
      return userDto(user);
    },

    async resetTokenValid(token) {
      if (!token) return false;
      const hash = await sha256(token);
      const user = (await Store.getAll('users')).find((u) => u.resetTokenHash && u.resetTokenHash === hash);
      return !!(user && user.resetTokenExpires > Date.now());
    },

    safeReturnUrl
  };

  // Role check used inside every admin-only service method.
  function requireRole(user, role) {
    if (!user) throw fail.unauthorized();
    if (!user.roles.includes(role)) throw fail.forbidden();
  }

  /* -------------------------------------------------------------- categories */
  // Category colours follow Notion's palette (see css/app.css for the shades).
  const CATEGORY_COLORS = Object.freeze(['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red']);

  // Older categories have no colour yet: derive a stable one from the name.
  function categoryColor(cat) {
    if (cat && CATEGORY_COLORS.includes(cat.color)) return cat.color;
    const name = (cat && cat.name) || '';
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return CATEGORY_COLORS[1 + (h % (CATEGORY_COLORS.length - 1))];
  }

  function validateCategoryColor(color) {
    if (!CATEGORY_COLORS.includes(color)) throw fail.validation({ color: 'Choose one of the colours.' });
    return color;
  }

  function validateCategoryName(raw) {
    const name = Util.clean(raw).replace(/\s+/g, ' ');
    if (!name) throw fail.validation({ name: 'Category name is required.' });
    if (name.length > Config.CATEGORY_MAX) throw fail.validation({ name: `Use at most ${Config.CATEGORY_MAX} characters.` });
    return name;
  }

  const Categories = {
    async list() {
      const all = await Store.getAll('categories');
      return all.sort((a, b) => a.name.localeCompare(b.name));
    },

    async listWithUsage(admin) {
      requireRole(admin, Roles.Admin);
      const all = await this.list();
      // Counts only; admins never read note content.
      return Promise.all(all.map(async (c) => ({ ...c, noteCount: await Store.countBy('notes', 'categoryId', c.id) })));
    },

    async create(admin, rawName, color = 'gray') {
      requireRole(admin, Roles.Admin);
      const name = validateCategoryName(rawName);
      const cat = { id: Util.uid(), name, nameNormalized: Util.normalize(name), color: validateCategoryColor(color), createdAt: Util.now() };
      try {
        await Store.add('categories', cat);
      } catch (e) {
        if (e && e.name === 'ConstraintError') throw fail.validation({ name: 'A category with this name already exists.' });
        throw e;
      }
      Log.info('category.created', { categoryId: cat.id });
      return cat;
    },

    // Rename and/or recolour a category.
    async update(admin, id, { name: rawName, color }) {
      requireRole(admin, Roles.Admin);
      const cat = await Store.get('categories', id);
      if (!cat) throw fail.notFound('Category');
      const name = validateCategoryName(rawName);
      cat.name = name;
      cat.nameNormalized = Util.normalize(name);
      cat.color = validateCategoryColor(color || categoryColor(cat));
      try {
        await Store.put('categories', cat);
      } catch (e) {
        if (e && e.name === 'ConstraintError') throw fail.validation({ name: 'A category with this name already exists.' });
        throw e;
      }
      return cat;
    },

    // Deletion rule: notes that used the category become "Uncategorized"
    // (CategoryId set to null) in the same transaction. Nothing breaks.
    async remove(admin, id) {
      requireRole(admin, Roles.Admin);
      const cat = await Store.get('categories', id);
      if (!cat) throw fail.notFound('Category');
      const notes = await Store.getAllBy('notes', 'categoryId', id);
      await Store.batch([
        ...notes.map((n) => ({ type: 'put', store: 'notes', value: { ...n, categoryId: null } })),
        { type: 'delete', store: 'categories', key: id }
      ]);
      Log.info('category.deleted', { categoryId: id, notesUncategorized: notes.length });
      return notes.length;
    }
  };

  /* ------------------------------------------------------------------- notes */
  async function validateNote(input) {
    const errors = {};
    const title = Util.clean(input.title);
    const content = String(input.content == null ? '' : input.content);
    const status = input.status || 'Draft';
    let categoryId = input.categoryId || null;

    if (!title) errors.title = 'Title is required.';
    else if (title.length > Config.TITLE_MAX) errors.title = `Use at most ${Config.TITLE_MAX} characters.`;
    if (content.length > Config.CONTENT_MAX) errors.content = `Content is limited to ${Config.CONTENT_MAX.toLocaleString()} characters.`;
    if (!STATUSES.includes(status)) errors.status = 'Choose a valid status.';
    if (categoryId && !(await Store.get('categories', categoryId))) errors.categoryId = 'Choose an existing category.';

    if (Object.keys(errors).length) throw fail.validation(errors);
    return { title, content, status, categoryId };
  }

  function snapshot(note, action) {
    return {
      id: Util.uid(),
      noteId: note.id,
      userId: note.userId,
      version: note.version,
      action,
      title: note.title,
      content: note.content,
      categoryId: note.categoryId,
      status: note.status,
      savedAt: note.updatedAt
    };
  }

  async function pruneHistory(noteId) {
    const entries = await Store.getAllBy('history', 'noteId', noteId);
    if (entries.length <= Config.HISTORY_MAX) return;
    entries.sort((a, b) => a.version - b.version);
    const remove = entries.slice(0, entries.length - Config.HISTORY_MAX);
    await Store.batch(remove.map((h) => ({ type: 'delete', store: 'history', key: h.id })));
  }

  // Ownership check: a note is only returned when it belongs to `user`.
  // Missing and foreign notes look identical (404) so IDs are not disclosed.
  async function getOwnedNote(user, id) {
    if (!user) throw fail.unauthorized();
    requireRole(user, Roles.User);
    const note = id ? await Store.get('notes', id) : null;
    if (!note || note.userId !== user.id) throw fail.notFound('Note');
    return note;
  }

  async function afterStatusChange(user, note, previous) {
    // Runs only after the save has committed.
    await Hub.sendToUser(user.id, {
      type: 'note.status',
      noteId: note.id,
      message: `Your note "${note.title}" is now ${STATUS_LABELS[note.status]}.`
    });
    if (note.status === 'Completed' && previous !== 'Completed') {
      await Email.send(user, EmailTemplates.noteCompleted(user, note));
    }
  }

  const SORTS = {
    updated_desc: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    updated_asc: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
    created_desc: (a, b) => b.createdAt.localeCompare(a.createdAt),
    created_asc: (a, b) => a.createdAt.localeCompare(b.createdAt),
    title_asc: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
    title_desc: (a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: 'base' })
  };

  const Notes = {
    sorts: Object.keys(SORTS),

    // Search, filter, sort and paginate the current user's notes.
    // The owner index means only this user's notes are ever loaded.
    async query(user, params = {}) {
      requireRole(user, Roles.User);
      const q = Util.normalize(params.q);
      const status = STATUSES.includes(params.status) ? params.status : '';
      const categoryId = params.categoryId || '';
      const sort = SORTS[params.sort] ? params.sort : 'updated_desc';
      const pageSize = Util.clampInt(params.pageSize, 1, Config.PAGE_SIZE_MAX, Config.PAGE_SIZE_DEFAULT);

      let items = await Store.getAllBy('notes', 'userId', user.id);
      if (q) {
        const terms = q.split(' ');
        items = items.filter((n) => {
          const hay = (n.title + '\n' + n.content).toLowerCase();
          return terms.every((t) => hay.includes(t));
        });
      }
      if (status) items = items.filter((n) => n.status === status);
      if (categoryId === 'none') items = items.filter((n) => !n.categoryId);
      else if (categoryId) items = items.filter((n) => n.categoryId === categoryId);

      items.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || SORTS[sort](a, b));

      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const page = Util.clampInt(params.page, 1, totalPages, 1);
      const all = params.all === true;
      return {
        items: all ? items : items.slice((page - 1) * pageSize, page * pageSize),
        total,
        page: all ? 1 : page,
        pageSize,
        totalPages: all ? 1 : totalPages,
        sort,
        status,
        categoryId,
        q: params.q || ''
      };
    },

    get: getOwnedNote,

    async create(user, input) {
      requireRole(user, Roles.User);
      const clean = await validateNote(input);
      const ts = Util.now();
      const note = {
        id: Util.uid(),
        userId: user.id, // owner always comes from the session, never the form
        ...clean,
        pinned: false,
        version: 1,
        createdAt: ts,
        updatedAt: ts
      };
      await Store.batch([
        { type: 'add', store: 'notes', value: note },
        { type: 'put', store: 'history', value: snapshot(note, 'Created') }
      ]);
      Log.info('note.created', { noteId: note.id });
      return note;
    },

    async update(user, id, input, action) {
      const note = await getOwnedNote(user, id);
      const clean = await validateNote(input);
      const fields = ['title', 'content', 'status', 'categoryId'];
      const changed = fields.filter((f) => (note[f] || null) !== (clean[f] || null));
      if (!changed.length) return { note, changed: false };

      const previous = note.status;
      const updated = { ...note, ...clean, updatedAt: Util.now(), version: (note.version || 1) + 1 };
      const label =
        action || (changed.length === 1 && changed[0] === 'status' ? 'Status → ' + STATUS_LABELS[updated.status] : 'Edited');
      await Store.batch([
        { type: 'put', store: 'notes', value: updated },
        { type: 'put', store: 'history', value: snapshot(updated, label) }
      ]);
      await pruneHistory(id);
      Log.info('note.updated', { noteId: id, fields: changed });
      if (previous !== updated.status) await afterStatusChange(user, updated, previous);
      return { note: updated, changed: true };
    },

    async setStatus(user, id, status) {
      if (!STATUSES.includes(status)) throw fail.validation({ status: 'Choose a valid status.' });
      const note = await getOwnedNote(user, id);
      return this.update(user, id, { ...note, status });
    },

    async togglePin(user, id) {
      const note = await getOwnedNote(user, id);
      note.pinned = !note.pinned;
      await Store.put('notes', note);
      return note;
    },

    // Deletes the note together with its history, attachment metadata and
    // stored file bytes in one transaction, so no orphaned files remain.
    async remove(user, id) {
      const note = await getOwnedNote(user, id);
      const [history, attachments] = await Promise.all([
        Store.getAllBy('history', 'noteId', id),
        Store.getAllBy('attachments', 'noteId', id)
      ]);
      await Store.batch([
        ...attachments.map((a) => ({ type: 'delete', store: 'objects', key: a.objectKey })),
        ...attachments.map((a) => ({ type: 'delete', store: 'attachments', key: a.id })),
        ...history.map((h) => ({ type: 'delete', store: 'history', key: h.id })),
        { type: 'delete', store: 'notes', key: note.id }
      ]);
      Log.info('note.deleted', { noteId: id, attachments: attachments.length });
    },

    async stats(user) {
      requireRole(user, Roles.User);
      const notes = await Store.getAllBy('notes', 'userId', user.id);
      const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
      notes.forEach((n) => byStatus[n.status]++);
      const recent = [...notes].sort(SORTS.updated_desc).slice(0, 6);
      const pinned = notes.filter((n) => n.pinned).sort(SORTS.updated_desc).slice(0, 4);
      return { total: notes.length, byStatus, recent, pinned };
    },

    async attachmentCounts(user) {
      const atts = await Store.getAllBy('attachments', 'userId', user.id);
      const map = {};
      atts.forEach((a) => (map[a.noteId] = (map[a.noteId] || 0) + 1));
      return map;
    },

    async exportAll(user) {
      requireRole(user, Roles.User);
      const [notes, cats] = await Promise.all([Store.getAllBy('notes', 'userId', user.id), Categories.list()]);
      const catName = Object.fromEntries(cats.map((c) => [c.id, c.name]));
      return {
        exportedAt: Util.now(),
        account: user.email,
        notes: notes.map((n) => ({
          title: n.title,
          content: n.content,
          status: n.status,
          category: catName[n.categoryId] || null,
          pinned: !!n.pinned,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt
        }))
      };
    }
  };

  /* ----------------------------------------------------------------- history */
  const History = {
    async list(user, noteId) {
      await getOwnedNote(user, noteId);
      const entries = await Store.getAllBy('history', 'noteId', noteId);
      return entries.sort((a, b) => b.version - a.version);
    },

    async restore(user, noteId, entryId) {
      await getOwnedNote(user, noteId);
      const entry = await Store.get('history', entryId);
      if (!entry || entry.noteId !== noteId || entry.userId !== user.id) throw fail.notFound('Version');
      const cat = entry.categoryId ? await Store.get('categories', entry.categoryId) : null;
      return Notes.update(
        user,
        noteId,
        { title: entry.title, content: entry.content, status: entry.status, categoryId: cat ? cat.id : null },
        'Restored v' + entry.version
      );
    }
  };

  /* ------------------------------------------------------------- attachments */
  // Allow-list. The file header ("magic bytes") is checked, so the
  // browser-supplied content type is never trusted on its own.
  const FILE_TYPES = [
    { ext: ['pdf'], mime: 'application/pdf', sig: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
    { ext: ['png'], mime: 'image/png', sig: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
    { ext: ['jpg', 'jpeg'], mime: 'image/jpeg', sig: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    { ext: ['gif'], mime: 'image/gif', sig: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
    {
      ext: ['webp'],
      mime: 'image/webp',
      sig: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
    }
  ];

  const Attachments = {
    accept: '.pdf,.png,.jpg,.jpeg,.gif,.webp',

    async list(user, noteId) {
      await getOwnedNote(user, noteId);
      const items = await Store.getAllBy('attachments', 'noteId', noteId);
      return items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    },

    async upload(user, noteId, file) {
      await getOwnedNote(user, noteId);
      const displayName = String(file.name || 'file').split(/[\\/]/).pop().replace(/[\u0000-\u001f]/g, '').slice(0, 200) || 'file';
      const ext = (displayName.match(/\.([a-z0-9]+)$/i) || [])[1];
      const type = ext && FILE_TYPES.find((t) => t.ext.includes(ext.toLowerCase()));
      if (!type) throw fail.validation({ file: 'Only PDF, PNG, JPG, GIF and WebP files are allowed.' }, `"${displayName}" is not an allowed file type.`);
      if (!file.size) throw fail.validation({ file: 'The file is empty.' }, `"${displayName}" is empty.`);
      if (file.size > Config.FILE_MAX_BYTES) {
        throw fail.validation({ file: 'Too large.' }, `"${displayName}" is larger than ${Util.formatBytes(Config.FILE_MAX_BYTES)}.`);
      }
      const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      if (!type.sig(head)) throw fail.validation({ file: 'Content mismatch.' }, `"${displayName}" does not look like a real ${ext.toUpperCase()} file.`);

      // Object key is generated here; the original file name is display-only.
      const objectKey = `u/${user.id}/n/${noteId}/${Util.uid()}`;
      const meta = {
        id: Util.uid(),
        noteId,
        userId: user.id,
        originalFileName: displayName,
        objectKey,
        contentType: type.mime,
        sizeInBytes: file.size,
        uploadedAt: Util.now()
      };
      const blob = file.slice(0, file.size, type.mime);
      // Bytes and metadata are written in one transaction: either both exist or neither.
      await Store.batch([
        { type: 'put', store: 'objects', value: { objectKey, blob } },
        { type: 'add', store: 'attachments', value: meta }
      ]);
      Log.info('attachment.uploaded', { attachmentId: meta.id, noteId, size: file.size });
      return meta;
    },

    async _owned(user, attachmentId) {
      const meta = await Store.get('attachments', attachmentId);
      if (!meta) throw fail.notFound('Attachment');
      await getOwnedNote(user, meta.noteId); // ownership derived from the parent note
      return meta;
    },

    async open(user, attachmentId) {
      const meta = await this._owned(user, attachmentId);
      const obj = await Store.get('objects', meta.objectKey);
      if (!obj) throw fail.notFound('File');
      return { meta, blob: obj.blob };
    },

    async remove(user, attachmentId) {
      const meta = await this._owned(user, attachmentId);
      await Store.batch([
        { type: 'delete', store: 'objects', key: meta.objectKey },
        { type: 'delete', store: 'attachments', key: meta.id }
      ]);
      Log.info('attachment.deleted', { attachmentId });
    }
  };

  /* ------------------------------------------------------------------- email */
  // IEmailService equivalent: callers use Email.send(); the provider can be
  // replaced without touching notes or auth code. In this build the provider
  // stores mail internally; it is not shown in the UI.
  const DevMailCaptureProvider = {
    name: 'Development mail capture',
    async deliver(message) {
      await Store.put('emails', message);
    }
  };

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function emailLayout(heading, bodyHtml) {
    return `<!doctype html><html><body style="margin:0;padding:32px 16px;background:#f5f5f4;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1d1d1b">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e6e5e2;border-radius:8px;padding:28px">
<div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#78716c;margin-bottom:16px">${esc(Config.APP_NAME)}</div>
<h1 style="font-size:20px;margin:0 0 12px">${esc(heading)}</h1>
<div style="font-size:14px;line-height:1.6">${bodyHtml}</div>
</div>
<p style="text-align:center;font-size:12px;color:#a8a29e;margin-top:16px">You received this because you have an account with ${esc(Config.APP_NAME)}.</p>
</body></html>`;
  }

  const EmailTemplates = {
    welcome: (user) => ({
      subject: `Welcome to ${Config.APP_NAME}`,
      html: emailLayout(
        `Welcome, ${user.displayName}`,
        `<p>Your account <strong>${esc(user.email)}</strong> is ready.</p>
<p>You can now create notes, organise them by category, track their status and attach PDFs or images.</p>
<p style="margin-top:20px"><a href="dashboard.html" style="background:#1d1d1b;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none">Open your dashboard</a></p>`
      )
    }),
    passwordReset: (user, link) => ({
      subject: `Reset your ${Config.APP_NAME} password`,
      html: emailLayout(
        'Reset your password',
        `<p>Hi ${esc(user.displayName)},</p><p>We received a request to reset your password. This link works once and expires in ${Config.RESET_MINUTES} minutes.</p>
<p style="margin-top:20px"><a href="${esc(link)}" style="background:#2383e2;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none">Choose a new password</a></p>
<p style="color:#787774">If you didn't ask for this, you can ignore this email. Your password won't change.</p>`
      )
    }),
    noteCompleted: (user, note) => ({
      subject: `Completed: ${note.title}`,
      html: emailLayout(
        'Note completed',
        `<p>Hi ${esc(user.displayName)},</p><p>Your note <strong>${esc(note.title)}</strong> was marked as completed on ${esc(new Date(note.updatedAt).toLocaleString())}.</p>`
      )
    })
  };

  const Email = {
    provider: DevMailCaptureProvider,
    async send(user, { subject, html }) {
      const message = {
        id: Util.uid(),
        userId: user.id,
        to: user.email,
        subject,
        html,
        provider: this.provider.name,
        sentAt: Util.now()
      };
      try {
        await this.provider.deliver(message);
        Log.info('email.sent', { messageId: message.id });
        return true;
      } catch (e) {
        // Never log credentials or message bodies.
        Log.warn('email.failed', { provider: this.provider.name, error: e && e.name });
        return false;
      }
    },
    async inbox(user) {
      const all = await Store.getAllBy('emails', 'userId', user.id);
      return all.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    },
    async get(user, id) {
      const m = await Store.get('emails', id);
      if (!m || m.userId !== user.id) throw fail.notFound('Message');
      return m;
    },
    async markRead(user, id) {
      const m = await this.get(user, id);
      if (!m.read) await Store.put('emails', { ...m, read: true });
    }
  };

  /* --------------------------------------------- live notifications ("hub") */
  // Plays the role of the SignalR hub: a message is persisted first, then
  // pushed only to tabs signed in as the target user (BroadcastChannel for
  // other tabs, direct call for this tab). Never broadcast to everyone.
  const channel = 'BroadcastChannel' in global ? new BroadcastChannel('ndm-hub') : null;
  let connection = null; // { userId, handler }
  if (channel) {
    channel.onmessage = (e) => {
      const d = e.data || {};
      if (connection && d.userId === connection.userId) connection.handler(d.notification);
    };
  }

  const Hub = {
    // Opens this tab's connection. Returns connection info for the status bar.
    connect(user, handler) {
      connection = {
        userId: user.id,
        handler,
        id: Util.uid().replace(/-/g, '').slice(0, 8),
        transport: channel ? 'BroadcastChannel' : 'this tab only',
        connectedAt: Util.now()
      };
      return { id: connection.id, transport: connection.transport, connectedAt: connection.connectedAt };
    },
    async sendToUser(userId, payload) {
      const n = { id: Util.uid(), userId, ...payload, createdAt: Util.now(), read: false };
      await Store.put('notifications', n);
      if (connection && connection.userId === userId) connection.handler(n);
      if (channel) channel.postMessage({ userId, notification: n });
    },
    async list(user, limit = 15) {
      const all = await Store.getAllBy('notifications', 'userId', user.id);
      return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    },
    async unreadCount(user) {
      const all = await Store.getAllBy('notifications', 'userId', user.id);
      return all.filter((n) => !n.read).length;
    },
    async markAllRead(user) {
      const all = await Store.getAllBy('notifications', 'userId', user.id);
      const unread = all.filter((n) => !n.read);
      await Store.batch(unread.map((n) => ({ type: 'put', store: 'notifications', value: { ...n, read: true } })));
    },
    async clear(user) {
      const all = await Store.getAllBy('notifications', 'userId', user.id);
      await Store.batch(all.map((n) => ({ type: 'delete', store: 'notifications', key: n.id })));
    }
  };

  /* ------------------------------------------------------------------- admin */
  const Admin = {
    async stats(admin) {
      requireRole(admin, Roles.Admin);
      const [users, notes, categories, attachments] = await Promise.all([
        Store.getAll('users'),
        Store.count('notes'),
        Store.count('categories'),
        Store.getAll('attachments')
      ]);
      return {
        users: users.length,
        admins: users.filter((u) => u.roles.includes(Roles.Admin)).length,
        withoutRole: users.filter((u) => !u.roles.length).length,
        notes,
        categories,
        attachments: attachments.length,
        storageBytes: attachments.reduce((s, a) => s + a.sizeInBytes, 0),
        newestUsers: users.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(userDto)
      };
    },

    async users(admin, params = {}) {
      requireRole(admin, Roles.Admin);
      const q = Util.normalize(params.q);
      const role = params.role || '';
      const pageSize = Util.clampInt(params.pageSize, 1, 50, 10);
      let users = (await Store.getAll('users')).map(userDto);
      if (q) users = users.filter((u) => u.email.includes(q) || u.displayName.toLowerCase().includes(q));
      if (role === 'none') users = users.filter((u) => !u.roles.length);
      else if (role) users = users.filter((u) => u.roles.includes(role));
      users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const total = users.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const page = Util.clampInt(params.page, 1, totalPages, 1);
      const items = await Promise.all(
        users.slice((page - 1) * pageSize, page * pageSize).map(async (u) => ({ ...u, noteCount: await Store.countBy('notes', 'userId', u.id) }))
      );
      return { items, total, page, pageSize, totalPages };
    },

    async user(admin, id) {
      requireRole(admin, Roles.Admin);
      const u = await Store.get('users', id);
      if (!u) throw fail.notFound('User');
      const [noteCount, attachmentCount] = await Promise.all([Store.countBy('notes', 'userId', id), Store.countBy('attachments', 'userId', id)]);
      return { ...userDto(u), lastLoginAt: u.lastLoginAt || null, locked: !!(u.lockoutEnd && u.lockoutEnd > Date.now()), noteCount, attachmentCount };
    },

    async setRole(admin, id, role, enabled) {
      requireRole(admin, Roles.Admin);
      if (!Object.values(Roles).includes(role)) throw fail.validation({ role: 'Unknown role.' });
      const u = await Store.get('users', id);
      if (!u) throw fail.notFound('User');
      const has = u.roles.includes(role);
      if (has === !!enabled) return userDto(u);
      if (role === Roles.Admin && !enabled) {
        const admins = (await Store.getAll('users')).filter((x) => x.roles.includes(Roles.Admin));
        if (admins.length <= 1) throw fail.conflict('This is the last administrator. Promote another account first.');
      }
      u.roles = enabled ? [...u.roles, role] : u.roles.filter((r) => r !== role);
      u.securityStamp = Util.uid(); // forces the user to sign in again with new roles
      await Store.put('users', u);
      Log.info('user.roleChanged', { userId: id, role, enabled: !!enabled, by: admin.id });
      return userDto(u);
    },

    async unlock(admin, id) {
      requireRole(admin, Roles.Admin);
      const u = await Store.get('users', id);
      if (!u) throw fail.notFound('User');
      u.lockoutEnd = 0;
      u.accessFailedCount = 0;
      await Store.put('users', u);
    }
  };

  /* -------------------------------------------------------------- dev seed */
  const CATEGORIES = { Home: 'green', Personal: 'blue', Work: 'purple', Travel: 'orange', Money: 'yellow', Ideas: 'pink' };

  const SAMPLE_NOTES = [
    {
      title: 'Weekly meal plan',
      cat: 'Home',
      status: 'InProgress',
      pinned: true,
      content: `## This week

| Day | Dinner |
| --- | --- |
| Monday | Vegetable pasta |
| Tuesday | Chicken curry and rice |
| Wednesday | Leftovers |
| Thursday | Tacos |
| Friday | Pizza night |

## Prep on Sunday

- [x] Chop vegetables for Monday and Tuesday
- [x] Marinate the chicken
- [ ] Bake banana bread for lunches
- [ ] Freeze the extra curry

> Tip: double the curry and freeze half for a busy day.`
    },
    {
      title: 'Grocery list',
      cat: 'Home',
      status: 'Draft',
      content: `- [ ] Milk
- [ ] Eggs
- [ ] Bread
- [ ] Tomatoes and onions
- [ ] Bananas
- [ ] Rice (5 kg)
- [ ] Washing-up liquid`
    },
    {
      title: 'Weekend trip packing list',
      cat: 'Travel',
      status: 'InProgress',
      content: `## Bag

- [x] Clothes for 3 days
- [x] Phone charger
- [x] Tickets and ID
- [ ] Sunscreen
- [ ] Medicines

## Before leaving

- [ ] Ask the neighbour to **water the plants**
- [ ] Switch off the geyser
- [ ] Lock all windows`
    },
    {
      title: 'Monthly household budget',
      cat: 'Money',
      status: 'Completed',
      content: `| Expense | Planned | Spent |
| --- | --- | --- |
| Rent | 15,000 | 15,000 |
| Groceries | 8,000 | 7,450 |
| Electricity | 1,500 | 1,320 |
| Phone and internet | 900 | 900 |
| Eating out | 2,000 | 2,600 |

**Saved this month:** 3,730

Next month: cut down on eating out.`
    },
    {
      title: "Mum's birthday party ideas",
      cat: 'Ideas',
      status: 'Draft',
      content: `A small surprise dinner at home on **Saturday evening**.

1. Invite close family and her two best friends
2. Order her favourite chocolate cake
3. Make a photo album of old family pictures
4. Fairy lights and flowers on the balcony

Gift ideas: a warm shawl, a cookbook, or a weekend getaway.`
    },
    {
      title: 'Fix the kitchen tap',
      cat: 'Home',
      status: 'Completed',
      content: `- [x] Check if it is a washer problem
- [x] Call the plumber
- [x] Plumber visited on Tuesday
- [x] Paid and kept the receipt

The tap was replaced. Ask for the **same brand** if it breaks again.`
    }
  ];

  // Technical examples from the first version of the demo data, replaced once
  // (only if the demo user never edited them).
  const OLD_SAMPLE_TITLES = [
    'Learn EF Core',
    'Weekly groceries',
    'Reading list',
    'Sprint retrospective',
    'App idea: plant watering reminders',
    'Identity checklist'
  ];

  async function ensureCategories() {
    const ids = {};
    for (const [name, color] of Object.entries(CATEGORIES)) {
      const norm = Util.normalize(name);
      const existing = (await Store.getAll('categories')).find((c) => c.nameNormalized === norm);
      if (existing) {
        ids[name] = existing.id;
        continue;
      }
      const c = { id: Util.uid(), name, nameNormalized: norm, color, createdAt: Util.now() };
      try {
        await Store.add('categories', c);
        ids[name] = c.id;
      } catch (_) {
        const again = (await Store.getAll('categories')).find((x) => x.nameNormalized === norm);
        ids[name] = again ? again.id : null;
      }
    }
    return ids;
  }

  function sampleNoteOps(userId, cats) {
    const base = Date.now();
    const ops = [];
    SAMPLE_NOTES.forEach((s, i) => {
      const ts = new Date(base - (i + 1) * 3.7 * 3600 * 1000).toISOString();
      const note = {
        id: Util.uid(),
        userId,
        title: s.title,
        content: s.content,
        categoryId: cats[s.cat] || null,
        status: s.status,
        pinned: !!s.pinned,
        version: 1,
        createdAt: ts,
        updatedAt: ts
      };
      ops.push({ type: 'put', store: 'notes', value: note }, { type: 'put', store: 'history', value: snapshot(note, 'Created') });
    });
    return ops;
  }

  const Seed = {
    async ensure() {
      if (await Store.get('meta', 'seed.v2')) return;
      // Claim the seed first so two tabs do not seed twice.
      try {
        await Store.add('meta', { key: 'seed.v2', at: Util.now() });
      } catch (_) {
        return;
      }
      const firstRun = !(await Store.get('meta', 'seed.v1'));
      if (firstRun) {
        await Store.put('meta', { key: 'seed.v1', at: Util.now() });
        const makeUser = async (email, displayName, password, roles, mustChangePassword) => ({
          id: Util.uid(),
          email,
          displayName,
          roles,
          ...(await hashPassword(password)),
          securityStamp: Util.uid(),
          mustChangePassword,
          accessFailedCount: 0,
          lockoutEnd: 0,
          createdAt: Util.now()
        });
        // Bootstrap admin: the password must be changed at first sign-in.
        const admin = await makeUser('admin@notes.local', 'Administrator', 'Admin@12345', [Roles.Admin], true);
        const demo = await makeUser('demo@notes.local', 'Demo User', 'Demo@12345', [Roles.User], false);
        await Store.batch([
          { type: 'put', store: 'users', value: admin },
          { type: 'put', store: 'users', value: demo }
        ]);
      }

      const cats = await ensureCategories();
      const demo = (await Store.getAllBy('users', 'email', 'demo@notes.local'))[0];
      if (!demo) return;

      const ops = [];
      if (!firstRun) {
        // Upgrade older demo data: swap untouched technical samples for everyday ones.
        const notes = await Store.getAllBy('notes', 'userId', demo.id);
        const old = notes.filter((n) => OLD_SAMPLE_TITLES.includes(n.title) && (n.version || 1) === 1);
        for (const n of old) {
          const [history, atts] = await Promise.all([Store.getAllBy('history', 'noteId', n.id), Store.getAllBy('attachments', 'noteId', n.id)]);
          atts.forEach((a) => ops.push({ type: 'delete', store: 'objects', key: a.objectKey }, { type: 'delete', store: 'attachments', key: a.id }));
          history.forEach((h) => ops.push({ type: 'delete', store: 'history', key: h.id }));
          ops.push({ type: 'delete', store: 'notes', key: n.id });
        }
      }
      ops.push(...sampleNoteOps(demo.id, cats));
      await Store.batch(ops);

      if (!firstRun) {
        // Remove the old technical category once nothing uses it.
        const prog = (await Store.getAll('categories')).find((c) => c.nameNormalized === 'programming');
        if (prog && !(await Store.countBy('notes', 'categoryId', prog.id))) await Store.delete('categories', prog.id);
      }
      Log.info('seed.done', { firstRun });
    },
    devAccounts: [
      { email: 'demo@notes.local', password: 'Demo@12345', role: 'User' },
      { email: 'admin@notes.local', password: 'Admin@12345', role: 'Admin' }
    ]
  };

  /* ------------------------------------------------------------- line diff */
  function lineDiff(oldText, newText) {
    const a = String(oldText || '').split('\n');
    const b = String(newText || '').split('\n');
    if (a.length * b.length > 4e6) return null;
    const n = a.length;
    const m = b.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        out.push({ t: ' ', s: a[i] });
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ t: '-', s: a[i++] });
      else out.push({ t: '+', s: b[j++] });
    }
    while (i < n) out.push({ t: '-', s: a[i++] });
    while (j < m) out.push({ t: '+', s: b[j++] });
    return out;
  }

  Object.assign(global, {
    Config,
    Roles,
    STATUSES,
    STATUS_LABELS,
    AppError,
    Log,
    Util,
    Auth,
    Categories,
    CATEGORY_COLORS,
    categoryColor,
    Notes,
    History,
    Attachments,
    Email,
    Hub,
    Admin,
    Seed,
    lineDiff,
    escapeHtml: esc
  });
})(window);
