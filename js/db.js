/*
 * Storage layer.
 * Primary engine: IndexedDB. Fallback engine: localStorage (used only when
 * IndexedDB cannot be opened, e.g. some private-browsing modes).
 *
 * Both engines expose the same small API so the rest of the app never needs
 * to know which one is active:
 *   get, getAll, getAllBy, count, countBy, put, add, delete, batch
 * `batch` runs several writes atomically (a single IndexedDB transaction).
 */
(function (global) {
  'use strict';

  const DB_NAME = 'notes-document-manager';
  const DB_VERSION = 1;
  const LS_PREFIX = 'ndm.store.';

  // keyPath + indexes for every object store ("table").
  const SCHEMA = {
    users: { keyPath: 'id', indexes: [['email', 'email', { unique: true }]] },
    categories: { keyPath: 'id', indexes: [['nameNormalized', 'nameNormalized', { unique: true }]] },
    notes: { keyPath: 'id', indexes: [['userId', 'userId'], ['categoryId', 'categoryId']] },
    history: { keyPath: 'id', indexes: [['noteId', 'noteId'], ['userId', 'userId']] },
    attachments: { keyPath: 'id', indexes: [['noteId', 'noteId'], ['userId', 'userId']] },
    objects: { keyPath: 'objectKey', indexes: [] }, // file bytes ("bucket")
    emails: { keyPath: 'id', indexes: [['userId', 'userId']] },
    notifications: { keyPath: 'id', indexes: [['userId', 'userId']] },
    meta: { keyPath: 'key', indexes: [] }
  };

  function constraintError(message) {
    const e = new Error(message || 'A record with the same unique value already exists.');
    e.name = 'ConstraintError';
    return e;
  }

  function promisify(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /* ---------------------------------------------------------------- IndexedDB */
  class IdbEngine {
    constructor(db) {
      this.db = db;
      this.name = 'IndexedDB';
    }

    static open() {
      return new Promise((resolve, reject) => {
        if (!global.indexedDB) return reject(new Error('IndexedDB is not available'));
        let req;
        try {
          req = global.indexedDB.open(DB_NAME, DB_VERSION);
        } catch (e) {
          return reject(e);
        }
        const timer = setTimeout(() => reject(new Error('IndexedDB open timed out')), 5000);
        req.onupgradeneeded = () => {
          const db = req.result;
          for (const [name, def] of Object.entries(SCHEMA)) {
            if (db.objectStoreNames.contains(name)) continue;
            const os = db.createObjectStore(name, { keyPath: def.keyPath });
            def.indexes.forEach(([idx, key, opts]) => os.createIndex(idx, key, opts || {}));
          }
        };
        req.onsuccess = () => {
          clearTimeout(timer);
          const db = req.result;
          db.onversionchange = () => db.close();
          resolve(new IdbEngine(db));
        };
        req.onerror = () => {
          clearTimeout(timer);
          reject(req.error);
        };
      });
    }

    _os(store, mode) {
      return this.db.transaction(store, mode).objectStore(store);
    }

    async get(store, key) {
      const v = await promisify(this._os(store, 'readonly').get(key));
      return v === undefined ? null : v;
    }
    getAll(store) {
      return promisify(this._os(store, 'readonly').getAll());
    }
    getAllBy(store, index, value) {
      return promisify(this._os(store, 'readonly').index(index).getAll(value));
    }
    count(store) {
      return promisify(this._os(store, 'readonly').count());
    }
    countBy(store, index, value) {
      return promisify(this._os(store, 'readonly').index(index).count(value));
    }

    batch(ops) {
      if (!ops.length) return Promise.resolve();
      const stores = [...new Set(ops.map((o) => o.store))];
      return new Promise((resolve, reject) => {
        let tx;
        try {
          tx = this.db.transaction(stores, 'readwrite');
        } catch (e) {
          return reject(e);
        }
        let failed = null;
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => {
          failed = failed || (e.target && e.target.error) || tx.error;
        };
        tx.onabort = () => reject(failed || tx.error || new Error('Transaction aborted'));
        for (const op of ops) {
          const os = tx.objectStore(op.store);
          if (op.type === 'put') os.put(op.value);
          else if (op.type === 'add') os.add(op.value);
          else if (op.type === 'delete') os.delete(op.key);
        }
      });
    }
  }

  /* ------------------------------------------------------- localStorage fallback */
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  async function serialize(value) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = v instanceof Blob ? { __blob: await blobToDataUrl(v), type: v.type } : v;
    }
    return out;
  }

  async function revive(value) {
    if (!value) return value;
    const out = { ...value };
    for (const [k, v] of Object.entries(out)) {
      if (v && typeof v === 'object' && typeof v.__blob === 'string') {
        out[k] = await (await fetch(v.__blob)).blob();
      }
    }
    return out;
  }

  class LocalEngine {
    constructor() {
      this.name = 'localStorage';
    }
    _load(store) {
      try {
        return JSON.parse(localStorage.getItem(LS_PREFIX + store) || '{}');
      } catch (_) {
        return {};
      }
    }
    async get(store, key) {
      const v = this._load(store)[key];
      return v === undefined ? null : revive(v);
    }
    async getAll(store) {
      return Promise.all(Object.values(this._load(store)).map(revive));
    }
    async getAllBy(store, index, value) {
      const key = SCHEMA[store].indexes.find((i) => i[0] === index)[1];
      return Promise.all(Object.values(this._load(store)).filter((r) => r[key] === value).map(revive));
    }
    async count(store) {
      return Object.keys(this._load(store)).length;
    }
    async countBy(store, index, value) {
      const key = SCHEMA[store].indexes.find((i) => i[0] === index)[1];
      return Object.values(this._load(store)).filter((r) => r[key] === value).length;
    }
    async batch(ops) {
      const prepared = await Promise.all(
        ops.map(async (op) => (op.value ? { ...op, value: await serialize(op.value) } : op))
      );
      const maps = {};
      const load = (s) => maps[s] || (maps[s] = this._load(s));
      for (const op of prepared) {
        const def = SCHEMA[op.store];
        const map = load(op.store);
        if (op.type === 'delete') {
          delete map[op.key];
          continue;
        }
        const key = op.value[def.keyPath];
        if (op.type === 'add' && key in map) throw constraintError();
        for (const [, field, opts] of def.indexes) {
          if (!opts || !opts.unique) continue;
          const clash = Object.values(map).some((r) => r[def.keyPath] !== key && r[field] === op.value[field]);
          if (clash) throw constraintError();
        }
        map[key] = op.value;
      }
      // Write all stores; roll back if the quota is exceeded half way.
      const originals = {};
      try {
        for (const [s, map] of Object.entries(maps)) {
          originals[s] = localStorage.getItem(LS_PREFIX + s);
          localStorage.setItem(LS_PREFIX + s, JSON.stringify(map));
        }
      } catch (e) {
        for (const [s, raw] of Object.entries(originals)) {
          if (raw === null) localStorage.removeItem(LS_PREFIX + s);
          else localStorage.setItem(LS_PREFIX + s, raw);
        }
        throw e;
      }
    }
  }

  /* ------------------------------------------------------------------ facade */
  let engine = null;
  const ready = (async () => {
    try {
      engine = await IdbEngine.open();
    } catch (e) {
      console.warn('[ndm] IndexedDB unavailable, falling back to localStorage.', e && e.message);
      engine = new LocalEngine();
    }
    return engine;
  })();

  const Store = {
    ready,
    get engineName() {
      return engine ? engine.name : 'loading';
    },
    async get(store, key) {
      await ready;
      return engine.get(store, key);
    },
    async getAll(store) {
      await ready;
      return engine.getAll(store);
    },
    async getAllBy(store, index, value) {
      await ready;
      return engine.getAllBy(store, index, value);
    },
    async count(store) {
      await ready;
      return engine.count(store);
    },
    async countBy(store, index, value) {
      await ready;
      return engine.countBy(store, index, value);
    },
    async put(store, value) {
      await ready;
      return engine.batch([{ type: 'put', store, value }]);
    },
    async add(store, value) {
      await ready;
      return engine.batch([{ type: 'add', store, value }]);
    },
    async delete(store, key) {
      await ready;
      return engine.batch([{ type: 'delete', store, key }]);
    },
    async batch(ops) {
      await ready;
      return engine.batch(ops);
    }
  };

  global.Store = Store;
})(window);
