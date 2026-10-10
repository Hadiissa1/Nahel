import { DatabaseSync } from "node:sqlite";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { Statement, db, guard, isGuardFailure, withRetry } from "@/lib/db";
import { deleteFiles, getFile, putFile } from "@/lib/file-store";
import { sniffImage, transformImage } from "@/lib/images";
import { PhotoError, deletePhoto, readPhoto, savePhoto } from "@/lib/photo-store";
import { DocError, deleteDoc, readDoc, saveDoc } from "@/lib/doc-store";
import { getCatalog } from "@/lib/products";

// The same code runs on Cloudflare (D1, R2, Images bindings) and locally
// (SQLite file, DATA_DIR, sharp). These tests drive the Cloudflare paths with
// stand-ins for the bindings, set the way the Cloudflare adapter sets them.

const CF = Symbol.for("__cloudflare-context__");
const g = globalThis as unknown as Record<symbol, unknown> & { __nahelDb?: unknown };

/** A D1-shaped wrapper around an in-memory SQLite database. */
function fakeD1() {
  const sqlite = new DatabaseSync(":memory:");
  const reader = (sql: string) => /^\s*(SELECT|PRAGMA|WITH)\b/i.test(sql) || /\bRETURNING\b/i.test(sql);
  const stmt = (sql: string, params: unknown[] = []) => ({
    bind: (...p: unknown[]) => stmt(sql, p),
    all: async () => {
      const st = sqlite.prepare(sql);
      if (reader(sql)) return { results: st.all(...(params as never[])), meta: {} };
      const r = st.run(...(params as never[]));
      return { results: [], meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
    },
    run: async () => {
      const r = sqlite.prepare(sql).run(...(params as never[]));
      return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
    },
  });
  return {
    sqlite,
    prepare: (sql: string) => stmt(sql),
    // Like D1: all statements in one transaction.
    batch: async (stmts: ReturnType<typeof stmt>[]) => {
      sqlite.exec("BEGIN");
      try {
        const out = [];
        for (const s of stmts) out.push(await s.all());
        sqlite.exec("COMMIT");
        return out;
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

function fakeR2() {
  const objects = new Map<string, { body: Uint8Array; type?: string }>();
  return {
    objects,
    put: async (key: string, value: Uint8Array, opts?: { httpMetadata?: { contentType?: string } }) => {
      objects.set(key, { body: new Uint8Array(value), type: opts?.httpMetadata?.contentType });
    },
    get: async (key: string) => {
      const o = objects.get(key);
      return o
        ? {
            arrayBuffer: async () => o.body.buffer.slice(o.body.byteOffset, o.body.byteOffset + o.body.byteLength),
            httpMetadata: { contentType: o.type },
          }
        : null;
    },
    delete: async (keys: string | string[]) => {
      for (const k of [keys].flat()) objects.delete(k);
    },
  };
}

function onCloudflare(env: Record<string, unknown>) {
  g[CF] = { env };
  g.__nahelDb = undefined;
}

afterEach(() => {
  delete g[CF];
  g.__nahelDb = undefined;
});

const png = (w = 40, h = 30) =>
  sharp({ create: { width: w, height: h, channels: 3, background: "#d99a18" } }).png().toBuffer();
const fileOf = (bytes: Uint8Array | Buffer, name = "photo.png") => new File([new Uint8Array(bytes)], name);

describe("database on Cloudflare D1", () => {
  it("creates the tables and the starter data on first use, once", async () => {
    const d1 = fakeD1();
    onCloudflare({ DB: d1 });
    const catalog = await getCatalog();
    expect(catalog.length).toBeGreaterThan(5);
    const zones = d1.sqlite.prepare("SELECT COUNT(*) AS n FROM delivery_zones").get() as { n: number };
    expect(zones.n).toBe(5);

    // A new server (fresh isolate) on the same database: nothing seeded twice.
    g.__nahelDb = undefined;
    const again = (await db().prepare("SELECT COUNT(*) AS n FROM products").get()) as { n: number };
    expect(again.n).toBe(catalog.length);
    const articles = d1.sqlite.prepare("SELECT COUNT(*) AS n FROM articles").get() as { n: number };
    expect(articles.n).toBe(3);
  });

  it("runs a batch all or nothing", async () => {
    onCloudflare({ DB: fakeD1() });
    await db().prepare("INSERT INTO meta (key, value) VALUES ('a', '1')").run();
    await expect(
      db().batch([
        new Statement("UPDATE meta SET value = '2' WHERE key = 'a'"),
        new Statement("INSERT INTO meta (key, value) VALUES ('a', 'dup')"),
      ]),
    ).rejects.toThrow();
    expect(await db().prepare("SELECT value FROM meta WHERE key = 'a'").get()).toEqual({ value: "1" });
  });

  it("reports changes and new row ids", async () => {
    onCloudflare({ DB: fakeD1() });
    const r = await db().prepare("INSERT INTO expenses (id, day, label, amount) VALUES ('e1', '2026-10-10', 'x', 5)").run();
    expect(r.changes).toBe(1);
    expect(r.lastInsertRowid).toBeGreaterThan(0);
  });
});

describe("guard()", () => {
  it("lets the batch through when the condition holds", async () => {
    await db().prepare("INSERT INTO meta (key, value) VALUES ('stock', '3')").run();
    await db().batch([
      guard("(SELECT CAST(value AS INTEGER) FROM meta WHERE key = 'stock') >= ?", 2),
      new Statement("UPDATE meta SET value = '1' WHERE key = 'stock'"),
    ]);
    expect(await db().prepare("SELECT value FROM meta WHERE key = 'stock'").get()).toEqual({ value: "1" });
    expect(await db().prepare("SELECT 1 FROM meta WHERE key = 'guard'").get()).toBeUndefined();
  });

  it("cancels the whole batch when it doesn't", async () => {
    await db().prepare("INSERT INTO meta (key, value) VALUES ('stock', '1')").run();
    const attempt = db().batch([
      guard("(SELECT CAST(value AS INTEGER) FROM meta WHERE key = 'stock') >= ?", 2),
      new Statement("UPDATE meta SET value = '-1' WHERE key = 'stock'"),
    ]);
    const err = await attempt.catch((e) => e);
    expect(isGuardFailure(err)).toBe(true);
    expect(await db().prepare("SELECT value FROM meta WHERE key = 'stock'").get()).toEqual({ value: "1" });
  });

  it("withRetry() tries once more after a guard failure, but not after other errors", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls === 1) await db().batch([guard("0")]);
      return "done";
    });
    expect([result, calls]).toEqual(["done", 2]);
    await expect(withRetry(async () => Promise.reject(new Error("other")))).rejects.toThrow("other");
  });
});

describe("files on Cloudflare R2", () => {
  it("stores, reads and deletes files with their type", async () => {
    const r2 = fakeR2();
    onCloudflare({ FILES: r2 });
    await putFile("docs/a.pdf", new TextEncoder().encode("%PDF-1.4"), "application/pdf");
    expect(r2.objects.get("docs/a.pdf")?.type).toBe("application/pdf");
    const f = await getFile("docs/a.pdf");
    expect(f?.contentType).toBe("application/pdf");
    expect(new TextDecoder().decode(f!.body)).toBe("%PDF-1.4");
    await deleteFiles(["docs/a.pdf"]);
    expect(await getFile("docs/a.pdf")).toBeNull();
  });

  it("keeps a photo as sent when Cloudflare Images isn't available", async () => {
    const r2 = fakeR2();
    onCloudflare({ FILES: r2 });
    const id = await savePhoto(fileOf(await png()));
    expect([...r2.objects.keys()].sort()).toEqual([`uploads/${id}-1600.webp`, `uploads/${id}-800.webp`]);
    expect((await readPhoto(`${id}-800.webp`))?.contentType).toBe("image/png");
    await deletePhoto(id);
    expect(r2.objects.size).toBe(0);
  });

  it("re-encodes photos through the Images binding when it is there", async () => {
    const r2 = fakeR2();
    const asked: unknown[] = [];
    const images = {
      input: () => ({
        transform: (t: unknown) => ({
          output: async (o: { format: string }) => {
            asked.push(t);
            return { response: () => new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": o.format } }) };
          },
        }),
      }),
    };
    onCloudflare({ FILES: r2, IMAGES: images });
    const id = await savePhoto(fileOf(await png()));
    expect(asked).toEqual([
      { width: 800, height: 800, fit: "scale-down" },
      { width: 1600, height: 1600, fit: "scale-down" },
    ]);
    expect(r2.objects.get(`uploads/${id}-800.webp`)?.type).toBe("image/webp");
  });

  it("refuses a HEIC photo it can't convert (no image service)", async () => {
    onCloudflare({ FILES: fakeR2() });
    const heic = new Uint8Array(32);
    heic.set(new TextEncoder().encode("ftypheic"), 4);
    await expect(savePhoto(fileOf(heic, "x.heic"))).rejects.toBeInstanceOf(PhotoError);
  });
});

describe("photos and PDFs (local files)", () => {
  it("stores a photo in two WebP sizes and serves it", async () => {
    const id = await savePhoto(fileOf(await png(2400, 1200)));
    const big = await readPhoto(`${id}-1600.webp`);
    const small = await readPhoto(`${id}-800.webp`);
    expect(big?.contentType).toBe("image/webp");
    expect((await sharp(Buffer.from(big!.body)).metadata()).width).toBe(1600);
    expect((await sharp(Buffer.from(small!.body)).metadata()).width).toBe(800);
    await deletePhoto(id);
    expect(await readPhoto(`${id}-800.webp`)).toBeNull();
  });

  it("refuses empty, too large and non-image files", async () => {
    await expect(savePhoto(fileOf(new Uint8Array(0)))).rejects.toThrow("empty");
    await expect(savePhoto(fileOf(new Uint8Array(5 * 1024 * 1024)))).rejects.toThrow("too_large");
    await expect(savePhoto(fileOf(new TextEncoder().encode("<script>alert(1)</script>")))).rejects.toThrow("unreadable");
  });

  it("only serves our own file names", async () => {
    expect(await readPhoto("../nahel.db")).toBeNull();
    expect(await readDoc("../../etc/passwd")).toBeNull();
    await deletePhoto("not-an-id"); // ignored
    await deleteDoc("nope.pdf"); // ignored
  });

  it("stores real PDFs only", async () => {
    const name = await saveDoc(fileOf(new TextEncoder().encode("%PDF-1.7 test"), "a.pdf"));
    expect(name).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(new TextDecoder().decode((await readDoc(name))!)).toBe("%PDF-1.7 test");
    expect((await getFile(`docs/${name}`))?.contentType).toBe("application/pdf");
    await deleteDoc(name);
    expect(await readDoc(name)).toBeNull();
    await expect(saveDoc(fileOf(new TextEncoder().encode("hello"), "a.pdf"))).rejects.toBeInstanceOf(DocError);
    await expect(saveDoc(fileOf(new Uint8Array(0), "a.pdf"))).rejects.toThrow("empty");
    await expect(saveDoc(fileOf(new Uint8Array(5 * 1024 * 1024), "a.pdf"))).rejects.toThrow("too_large");
  });
});

describe("images", () => {
  it("recognises formats from their first bytes", async () => {
    expect(sniffImage(new Uint8Array(await png()))).toBe("png");
    expect(sniffImage(new Uint8Array(await sharp(await png()).jpeg().toBuffer()))).toBe("jpeg");
    expect(sniffImage(new Uint8Array(await sharp(await png()).webp().toBuffer()))).toBe("webp");
    expect(sniffImage(new TextEncoder().encode("GIF89a......"))).toBe("gif");
    const avif = new Uint8Array(16);
    avif.set(new TextEncoder().encode("ftypavif"), 4);
    expect(sniffImage(avif)).toBe("avif");
    expect(sniffImage(new TextEncoder().encode("hello world"))).toBeNull();
  });

  it("crops to a share-preview size", async () => {
    const out = await transformImage(new Uint8Array(await png(2000, 2000)), {
      width: 1200, height: 630, fit: "cover", format: "jpeg", quality: 80,
    });
    expect(out?.contentType).toBe("image/jpeg");
    const meta = await sharp(Buffer.from(out!.bytes)).metadata();
    expect([meta.width, meta.height]).toEqual([1200, 630]);
  });

  it("returns null for something that isn't an image", async () => {
    expect(
      await transformImage(new TextEncoder().encode("nope"), { width: 10, height: 10, fit: "inside", format: "webp", quality: 80 }),
    ).toBeNull();
  });
});
