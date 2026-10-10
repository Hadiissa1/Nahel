import "server-only";
import { equipmentProducts, healthProducts, honeyProducts } from "@/lib/data";
import { STARTER_ARTICLES } from "@/lib/starter-articles";

/**
 * Database access. Two engines behind one async API:
 * - on Cloudflare Workers: the D1 database bound as `DB` (see wrangler.jsonc);
 * - anywhere else (local dev, tests, `next build`): a SQLite file in DATA_DIR.
 * Both speak the same SQL. D1 has no open transactions, so multi-step writes
 * go through `batch()` (all or nothing) and `guard()` checks inside it.
 */

/** Local engine only: where the database and uploaded files live. */
export const DATA_DIR = process.env.DATA_DIR || `${process.cwd()}/data`;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  category    TEXT NOT NULL CHECK (category IN ('honey','health','equipment')),
  name_ar     TEXT NOT NULL DEFAULT '',
  name_en     TEXT NOT NULL DEFAULT '',
  origin_ar   TEXT NOT NULL DEFAULT '',
  origin_en   TEXT NOT NULL DEFAULT '',
  desc_ar     TEXT NOT NULL DEFAULT '',
  desc_en     TEXT NOT NULL DEFAULT '',
  photo       TEXT,
  visible     INTEGER NOT NULL DEFAULT 1,
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS variants (
  id          TEXT PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT '',
  price       INTEGER,
  stock       INTEGER,
  sort        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS variants_product ON variants(product_id);
CREATE TABLE IF NOT EXISTS meta (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS subscribers (
  id                  TEXT PRIMARY KEY,
  email               TEXT UNIQUE,
  whatsapp            TEXT UNIQUE,
  lang                TEXT NOT NULL DEFAULT 'ar' CHECK (lang IN ('ar','en')),
  token               TEXT NOT NULL UNIQUE,
  email_confirmed_at  TEXT,
  confirm_sent_at     TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS campaigns (
  id          TEXT PRIMARY KEY,
  subject_ar  TEXT NOT NULL DEFAULT '',
  subject_en  TEXT NOT NULL DEFAULT '',
  body_ar     TEXT NOT NULL DEFAULT '',
  body_en     TEXT NOT NULL DEFAULT '',
  sent        INTEGER NOT NULL DEFAULT 0,
  failed      INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  status         TEXT NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new','confirmed','delivered','cancelled')),
  name           TEXT NOT NULL,
  phone          TEXT NOT NULL,
  address        TEXT NOT NULL DEFAULT '',
  note           TEXT NOT NULL DEFAULT '',
  lang           TEXT NOT NULL DEFAULT 'ar',
  total          INTEGER,
  stock_applied  INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS orders_status ON orders(status);
CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL,
  variant_id  TEXT NOT NULL,
  name_ar     TEXT NOT NULL DEFAULT '',
  name_en     TEXT NOT NULL DEFAULT '',
  label       TEXT NOT NULL DEFAULT '',
  unit_price  INTEGER,
  qty         INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order ON order_items(order_id);
CREATE TABLE IF NOT EXISTS promo_codes (
  code        TEXT PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('percent','amount')),
  value       INTEGER NOT NULL,
  min_total   INTEGER,
  expires_on  TEXT,
  max_uses    INTEGER,
  uses        INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS delivery_zones (
  id          TEXT PRIMARY KEY,
  name_ar     TEXT NOT NULL DEFAULT '',
  name_en     TEXT NOT NULL DEFAULT '',
  fee         INTEGER,
  free_from   INTEGER,
  active      INTEGER NOT NULL DEFAULT 1,
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS stock_alerts (
  id          TEXT PRIMARY KEY,
  variant_id  TEXT NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  email       TEXT,
  whatsapp    TEXT,
  lang        TEXT NOT NULL DEFAULT 'ar' CHECK (lang IN ('ar','en')),
  sending_at  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (variant_id, email),
  UNIQUE (variant_id, whatsapp)
);
CREATE INDEX IF NOT EXISTS stock_alerts_variant ON stock_alerts(variant_id);
CREATE TABLE IF NOT EXISTS reviews (
  id           TEXT PRIMARY KEY,
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  name         TEXT NOT NULL,
  text         TEXT NOT NULL,
  lang         TEXT NOT NULL DEFAULT 'ar' CHECK (lang IN ('ar','en')),
  approved     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS reviews_product ON reviews(product_id, approved);
CREATE TABLE IF NOT EXISTS lots (
  id           TEXT PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  harvest_on   TEXT,
  region_ar    TEXT NOT NULL DEFAULT '',
  region_en    TEXT NOT NULL DEFAULT '',
  notes_ar     TEXT NOT NULL DEFAULT '',
  notes_en     TEXT NOT NULL DEFAULT '',
  certificate  TEXT,
  current      INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS lots_product ON lots(product_id);
CREATE TABLE IF NOT EXISTS articles (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  title_ar      TEXT NOT NULL DEFAULT '',
  title_en      TEXT NOT NULL DEFAULT '',
  summary_ar    TEXT NOT NULL DEFAULT '',
  summary_en    TEXT NOT NULL DEFAULT '',
  body_ar       TEXT NOT NULL DEFAULT '',
  body_en       TEXT NOT NULL DEFAULT '',
  photo         TEXT,
  products      TEXT NOT NULL DEFAULT '',
  published     INTEGER NOT NULL DEFAULT 0,
  published_on  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS staff (
  id          TEXT PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  pw_hash     TEXT NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  last_login  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT PRIMARY KEY,
  day         TEXT NOT NULL,
  label       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'other',
  amount      INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS expenses_day ON expenses(day);
CREATE TABLE IF NOT EXISTS visit_days (
  day       TEXT NOT NULL,
  visitor   TEXT NOT NULL,
  PRIMARY KEY (day, visitor)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS page_views (
  day    TEXT NOT NULL,
  path   TEXT NOT NULL,
  views  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  expires_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_hits (
  key          TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
) WITHOUT ROWID;
-- Used by the Cloudflare adapter (OpenNext) to expire cached pages.
CREATE TABLE IF NOT EXISTS revalidations (
  tag            TEXT NOT NULL,
  revalidatedAt  INTEGER NOT NULL,
  stale          INTEGER,
  expire         INTEGER DEFAULT NULL,
  UNIQUE(tag) ON CONFLICT REPLACE
);
`;

/** Columns added after the first release: added in place to existing databases. */
const ADDED_COLUMNS: [table: string, column: string, type: string][] = [
  ["variants", "sale_price", "INTEGER"],
  ["orders", "subtotal", "INTEGER"],
  ["orders", "promo_code", "TEXT"],
  ["orders", "discount", "INTEGER NOT NULL DEFAULT 0"],
  ["orders", "promo_counted", "INTEGER NOT NULL DEFAULT 0"],
  ["orders", "zone_ar", "TEXT"],
  ["orders", "zone_en", "TEXT"],
  ["orders", "delivery_fee", "INTEGER"],
  ["variants", "low_alerted", "INTEGER NOT NULL DEFAULT 0"],
  ["sessions", "user_id", "TEXT"],
  ["orders", "handled_by", "TEXT"],
  ["orders", "source", "TEXT NOT NULL DEFAULT 'web'"],
  ["orders", "payment", "TEXT"],
  ["orders", "confirmed_at", "TEXT"],
  ["orders", "delivered_at", "TEXT"],
];

/** Starter delivery zones (fees left empty for the owner to fill in). */
const STARTER_ZONES: [ar: string, en: string][] = [
  ["بيروت", "Beirut"],
  ["جبل لبنان", "Mount Lebanon"],
  ["الشمال", "North Lebanon"],
  ["الجنوب", "South Lebanon"],
  ["البقاع", "Bekaa"],
];


/** Bump when SCHEMA / ADDED_COLUMNS / seeds change, so running databases re-check them. */
const SCHEMA_VERSION = "1";

function seedStatements(): Statement[] {
  const out: Statement[] = [];
  const groups = [
    { category: "honey", products: honeyProducts, labels: ["250g", "500g", "1kg"] },
    { category: "health", products: healthProducts, labels: [""] },
    { category: "equipment", products: equipmentProducts, labels: [""] },
  ];
  let sort = 0;
  for (const g of groups) {
    for (const p of g.products) {
      out.push(
        new Statement(
          `INSERT INTO products (id, category, name_ar, name_en, origin_ar, origin_en, desc_ar, desc_en, sort)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, g.category, p.name.ar, p.name.en, p.origin.ar, p.origin.en, p.desc.ar, p.desc.en, sort++],
        ),
      );
      g.labels.forEach((label, i) =>
        out.push(
          new Statement(`INSERT INTO variants (id, product_id, label, sort) VALUES (?, ?, ?, ?)`, [
            `${p.id}-${label || "std"}`, p.id, label, i,
          ]),
        ),
      );
    }
  }
  return out;
}

/**
 * One-time starter data. Each group starts by inserting its marker into
 * `meta`: when another server already did it, that insert fails and the whole
 * batch is rolled back, so data is never seeded twice (and deleting every
 * product never brings the defaults back).
 */
const SEEDS: { marker: string; statements: () => Statement[] }[] = [
  { marker: "seeded", statements: seedStatements },
  {
    marker: "articles_seeded",
    statements: () =>
      STARTER_ARTICLES.map(
        (a) =>
          new Statement(
            `INSERT OR IGNORE INTO articles (id, slug, title_ar, title_en, summary_ar, summary_en, body_ar, body_en, products, published, published_on)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, date('now'))`,
            [crypto.randomUUID(), a.slug, a.title.ar, a.title.en, a.summary.ar, a.summary.en, a.body.ar, a.body.en, a.products.join(",")],
          ),
      ),
  },
  {
    marker: "zones_seeded",
    statements: () =>
      STARTER_ZONES.map(
        ([ar, en], i) =>
          new Statement("INSERT INTO delivery_zones (id, name_ar, name_en, sort) VALUES (?, ?, ?, ?)", [
            crypto.randomUUID(), ar, en, i,
          ]),
      ),
  },
];

// ---------------------------------------------------------------- API

export type Param = string | number | null;
export interface RunResult {
  changes: number;
  lastInsertRowid: number;
}
export interface BatchResult extends RunResult {
  /** Rows returned by a SELECT (or RETURNING) step; empty otherwise. */
  rows: unknown[];
}

interface Engine {
  all(sql: string, params: Param[]): Promise<unknown[]>;
  run(sql: string, params: Param[]): Promise<RunResult>;
  /** All statements in one transaction: every one applies, or none. */
  batch(statements: Statement[]): Promise<BatchResult[]>;
}

export class Statement {
  constructor(
    readonly sql: string,
    readonly params: Param[] = [],
  ) {}
  /** The same statement with these parameters, for batch(). */
  bind(...params: Param[]) {
    return new Statement(this.sql, params);
  }
  async get(...params: Param[]): Promise<unknown | undefined> {
    return (await (await engine()).all(this.sql, params.length ? params : this.params))[0];
  }
  async all(...params: Param[]): Promise<unknown[]> {
    return (await engine()).all(this.sql, params.length ? params : this.params);
  }
  async run(...params: Param[]): Promise<RunResult> {
    return (await engine()).run(this.sql, params.length ? params : this.params);
  }
}

export interface Db {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<BatchResult[]>;
}

const api: Db = {
  prepare: (sql) => new Statement(sql),
  batch: async (statements) => (await engine()).batch(statements),
};

/** The database. Every call is async: `await db().prepare(sql).get(...)`. */
export function db(): Db {
  return api;
}

/**
 * A batch step that cancels the whole batch unless `condition` (SQL, must
 * not evaluate to NULL) holds at that moment. Lets a batch re-check what was
 * read before it (stock, status...) atomically with its writes.
 */
export function guard(condition: string, ...params: Param[]): Statement {
  // Inserting NULL into meta.value breaks its NOT NULL constraint, which
  // aborts the batch; nothing is inserted when the condition holds.
  return new Statement(`INSERT INTO meta (key, value) SELECT 'guard', NULL WHERE NOT (${condition})`, params);
}

export function isGuardFailure(e: unknown): boolean {
  return e instanceof Error && /NOT NULL constraint failed: meta\.value/.test(`${e.message} ${String(e.cause ?? "")}`);
}

/** Runs `attempt` again (once) when one of its guards fails because of a concurrent change. */
export async function withRetry<T>(attempt: () => Promise<T>): Promise<T> {
  try {
    return await attempt();
  } catch (e) {
    if (!isGuardFailure(e)) throw e;
    return attempt();
  }
}

// ---------------------------------------------------------------- engines

const isReader = (sql: string) => /^\s*(SELECT|PRAGMA|WITH)\b/i.test(sql) || /\bRETURNING\b/i.test(sql);
const schemaStatements = () =>
  SCHEMA.split(";")
    .map((s) => s.trim())
    .filter(Boolean);

/** Minimal shape of the Cloudflare D1 binding. */
interface D1Like {
  prepare(sql: string): { bind(...v: unknown[]): D1Stmt } & D1Stmt;
  batch(stmts: D1Stmt[]): Promise<{ results?: unknown[]; meta: { changes?: number; last_row_id?: number } }[]>;
}
interface D1Stmt {
  all(): Promise<{ results?: unknown[]; meta: { changes?: number; last_row_id?: number } }>;
  run(): Promise<{ meta: { changes?: number; last_row_id?: number } }>;
}

function d1Engine(d1: D1Like): Engine {
  const stmt = (s: Statement) => d1.prepare(s.sql).bind(...s.params);
  return {
    async all(sql, params) {
      return (await d1.prepare(sql).bind(...params).all()).results ?? [];
    },
    async run(sql, params) {
      const { meta } = await d1.prepare(sql).bind(...params).run();
      return { changes: meta.changes ?? 0, lastInsertRowid: meta.last_row_id ?? 0 };
    },
    async batch(statements) {
      if (!statements.length) return [];
      const out = await d1.batch(statements.map(stmt));
      return out.map((r) => ({
        rows: r.results ?? [],
        changes: r.meta.changes ?? 0,
        lastInsertRowid: r.meta.last_row_id ?? 0,
      }));
    },
  };
}

/** Bring a database up to date: tables, new columns, starter data. Idempotent. */
async function prepareSchema(e: Engine) {
  try {
    const row = (await e.all("SELECT value FROM meta WHERE key = 'schema_version'", []))[0] as
      | { value: string }
      | undefined;
    if (row?.value === SCHEMA_VERSION) return;
  } catch {
    /* no tables yet */
  }
  await e.batch(schemaStatements().map((s) => new Statement(s)));
  const tables = [...new Set(ADDED_COLUMNS.map(([t]) => t))];
  const info = await e.batch(tables.map((t) => new Statement(`PRAGMA table_info(${t})`)));
  const have = new Set(info.flatMap((r, i) => (r.rows as { name: string }[]).map((c) => `${tables[i]}.${c.name}`)));
  const alters = ADDED_COLUMNS.filter(([t, c]) => !have.has(`${t}.${c}`)).map(
    ([t, c, type]) => new Statement(`ALTER TABLE ${t} ADD COLUMN ${c} ${type}`),
  );
  if (alters.length) await e.batch(alters);
  await e.batch([
    new Statement(
      "UPDATE orders SET delivered_at = updated_at WHERE status = 'delivered' AND delivered_at IS NULL",
    ),
    new Statement(
      "UPDATE orders SET confirmed_at = updated_at WHERE status IN ('confirmed','delivered') AND confirmed_at IS NULL",
    ),
  ]);
  for (const seed of SEEDS) {
    if ((await e.all("SELECT 1 FROM meta WHERE key = ?", [seed.marker])).length) continue;
    try {
      await e.batch([
        new Statement("INSERT INTO meta (key, value) VALUES (?, datetime('now'))", [seed.marker]),
        ...seed.statements(),
      ]);
    } catch (err) {
      // Another server seeded it at the same moment: fine.
      if (!(await e.all("SELECT 1 FROM meta WHERE key = ?", [seed.marker])).length) throw err;
    }
  }
  await e.run(
    "INSERT INTO meta (key, value) VALUES ('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [SCHEMA_VERSION],
  );
}

async function nodeEngine(): Promise<Engine> {
  // Loaded only outside Cloudflare (the module doesn't exist there).
  const { DatabaseSync } = await import(/* webpackIgnore: true */ "node:sqlite");
  const { mkdirSync } = await import(/* webpackIgnore: true */ "node:fs");
  // Uploaded photos and PDFs live next to the database (see lib/file-store.ts).
  for (const dir of ["uploads", "docs"]) mkdirSync(`${DATA_DIR}/${dir}`, { recursive: true });
  const d = new DatabaseSync(`${DATA_DIR}/nahel.db`);
  // WAL + busy timeout: safe when several server processes share the file.
  // The timeout comes first so the statements below wait for each other.
  d.exec("PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  // On a new file opened by several processes at once (e.g. `next build`
  // workers), SQLite may answer "database is locked" at once instead of
  // waiting, so the switch to WAL is retried for up to ~5 s.
  for (let attempt = 0; ; attempt++) {
    try {
      d.exec("PRAGMA journal_mode = WAL");
      break;
    } catch (e) {
      if (attempt >= 50 || !String((e as Error).message).includes("database is locked")) throw e;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  // Kept so tests can close it and start from an empty database.
  (globalThis as unknown as { __nahelSqlite?: unknown }).__nahelSqlite = d;
  const run = (sql: string, params: Param[]): BatchResult => {
    const st = d.prepare(sql);
    if (isReader(sql)) return { rows: st.all(...params), changes: 0, lastInsertRowid: 0 };
    const r = st.run(...params);
    return { rows: [], changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
  };
  return {
    all: async (sql, params) => d.prepare(sql).all(...params),
    run: async (sql, params) => {
      const { changes, lastInsertRowid } = run(sql, params);
      return { changes, lastInsertRowid };
    },
    // Synchronous inside, so nothing else runs in between; IMMEDIATE also
    // locks out other processes sharing the file.
    batch: async (statements) => {
      d.exec("BEGIN IMMEDIATE");
      try {
        const out = statements.map((s) => run(s.sql, s.params));
        d.exec("COMMIT");
        return out;
      } catch (e) {
        d.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

const CF_CONTEXT = Symbol.for("__cloudflare-context__");
const g = globalThis as unknown as {
  [CF_CONTEXT]?: { env?: { DB?: D1Like } };
  __nahelDb?: { key: unknown; ready: Promise<Engine> };
};

function engine(): Promise<Engine> {
  // Set by the Cloudflare adapter for each request; absent elsewhere.
  const d1 = g[CF_CONTEXT]?.env?.DB;
  const key = d1 ?? "node";
  if (g.__nahelDb?.key !== key) {
    const ready = (async () => {
      const e = d1 ? d1Engine(d1) : await nodeEngine();
      await prepareSchema(e);
      return e;
    })();
    // A failed start (e.g. database briefly unreachable) is retried next time.
    ready.catch(() => {
      if (g.__nahelDb?.ready === ready) g.__nahelDb = undefined;
    });
    g.__nahelDb = { key, ready };
  }
  return g.__nahelDb!.ready;
}
