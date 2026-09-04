// This app was originally built as a Claude Artifact, which provides a
// built-in `window.storage` key-value API. Outside that environment there
// is no such API, so we implement the same get/set/delete/list contract
// here, backed by the browser's localStorage. App.jsx is unmodified and
// keeps calling `window.storage.*` — this file just installs it.
//
// NOTE: localStorage is per-browser, per-device. Two friends testing on
// their own phones/laptops each get their own separate data, which is
// what you want. But the same friend switching browsers/devices, or
// clearing site data, will not see their old data. If you outgrow this,
// swap this file for calls to a real backend (e.g. a small database +
// API routes) without touching App.jsx.

const DB_KEY = "meng-chong-shi-guang:db";

function readDb() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || "{}");
  } catch (e) {
    return {};
  }
}
function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}
function ns(shared) {
  return shared ? "shared:" : "personal:";
}

window.storage = {
  async get(key, shared) {
    const db = readDb();
    const k = ns(shared) + key;
    if (!(k in db)) throw new Error("key not found: " + key);
    return { key, value: db[k], shared: !!shared };
  },
  async set(key, value, shared) {
    const db = readDb();
    db[ns(shared) + key] = value;
    writeDb(db);
    return { key, value, shared: !!shared };
  },
  async delete(key, shared) {
    const db = readDb();
    const k = ns(shared) + key;
    if (!(k in db)) throw new Error("key not found: " + key);
    delete db[k];
    writeDb(db);
    return { key, deleted: true, shared: !!shared };
  },
  async list(prefix, shared) {
    const db = readDb();
    prefix = prefix || "";
    const p = ns(shared) + prefix;
    const keys = Object.keys(db)
      .filter((k) => k.startsWith(p))
      .map((k) => k.slice(ns(shared).length));
    return { keys, prefix, shared: !!shared };
  },
};
