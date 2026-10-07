import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { equipmentProducts, healthProducts, honeyProducts } from "@/lib/data";

/** Where the database and uploaded photos live. Must be persistent storage. */
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const DOCS_DIR = path.join(DATA_DIR, "docs");

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
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  expires_at  INTEGER NOT NULL
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
];

/** Starter delivery zones (fees left empty for the owner to fill in). */
const STARTER_ZONES: [ar: string, en: string][] = [
  ["بيروت", "Beirut"],
  ["جبل لبنان", "Mount Lebanon"],
  ["الشمال", "North Lebanon"],
  ["الجنوب", "South Lebanon"],
  ["البقاع", "Bekaa"],
];

function migrate(db: DatabaseSync) {
  for (const [table, column, type] of ADDED_COLUMNS) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  }
}

function seed(db: DatabaseSync) {
  const insertProduct = db.prepare(
    `INSERT INTO products (id, category, name_ar, name_en, origin_ar, origin_en, desc_ar, desc_en, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertVariant = db.prepare(
    `INSERT INTO variants (id, product_id, label, sort) VALUES (?, ?, ?, ?)`,
  );
  const groups = [
    { category: "honey", products: honeyProducts, labels: ["250g", "500g", "1kg"] },
    { category: "health", products: healthProducts, labels: [""] },
    { category: "equipment", products: equipmentProducts, labels: [""] },
  ];
  let sort = 0;
  for (const g of groups) {
    for (const p of g.products) {
      insertProduct.run(
        p.id, g.category, p.name.ar, p.name.en, p.origin.ar, p.origin.en,
        p.desc.ar, p.desc.en, sort++,
      );
      g.labels.forEach((label, i) =>
        insertVariant.run(`${p.id}-${label || "std"}`, p.id, label, i),
      );
    }
  }
}

function open() {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  mkdirSync(DOCS_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "nahel.db"));
  // WAL + busy timeout: safe when several server processes share the file.
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  // Seed the starter catalog exactly once, ever: a marker (not an empty table)
  // decides, so deleting every product never brings the defaults back. The
  // IMMEDIATE lock stops two processes starting together from both seeding.
  db.exec("BEGIN IMMEDIATE");
  try {
    migrate(db);
    if (!db.prepare("SELECT 1 FROM meta WHERE key = 'seeded'").get()) {
      seed(db);
      db.prepare("INSERT INTO meta (key, value) VALUES ('seeded', datetime('now'))").run();
    }
    // Separate marker: also runs once on databases created before zones existed.
    if (!db.prepare("SELECT 1 FROM meta WHERE key = 'zones_seeded'").get()) {
      const ins = db.prepare("INSERT INTO delivery_zones (id, name_ar, name_en, sort) VALUES (?, ?, ?, ?)");
      STARTER_ZONES.forEach(([ar, en], i) => ins.run(randomUUID(), ar, en, i));
      db.prepare("INSERT INTO meta (key, value) VALUES ('zones_seeded', datetime('now'))").run();
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return db;
}

// One connection per server process (survives dev hot-reloads).
const g = globalThis as unknown as { __nahelDb?: DatabaseSync };
export function db() {
  g.__nahelDb ??= open();
  return g.__nahelDb;
}
