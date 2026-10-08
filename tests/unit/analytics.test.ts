import { describe, expect, it } from "vitest";
import { normalizePath } from "@/lib/analytics";

describe("normalizePath", () => {
  it.each([
    ["/", "/"],
    ["/product/sidr-honey", "/product/sidr-honey"],
    ["/blog", "/blog"],
    ["/blog/raw-honey-101", "/blog/raw-honey-101"],
    ["/lot", "/lot"],
    ["/offers/confirm", "/offers/confirm"],
  ])("counts the shop page %s", (raw, expected) => {
    expect(normalizePath(raw)).toBe(expected);
  });

  it("drops the query string, the hash and a trailing slash", () => {
    expect(normalizePath("/product/sidr-honey/?utm=fb#reviews")).toBe("/product/sidr-honey");
    expect(normalizePath("/?ref=wa")).toBe("/");
  });

  it("groups lot pages, since a lot number identifies a jar", () => {
    expect(normalizePath("/lot/LB-2026-07")).toBe("/lot/*");
  });

  it.each(["/admin", "/admin/orders", "/api/visit", "/_next/static/x.js"])("never counts %s", (raw) => {
    expect(normalizePath(raw)).toBeNull();
  });

  it.each([
    ["an unknown page", "/wp-login.php"],
    ["a nested product path", "/product/a/b"],
    ["an external address", "https://evil.example/"],
    ["a protocol-relative address", "//evil.example"],
    ["a path without a leading slash", "product/x"],
    ["a very long path", "/product/" + "a".repeat(200)],
  ])("rejects %s", (_why, raw) => {
    expect(normalizePath(raw)).toBeNull();
  });

  it("rejects anything that is not a string", () => {
    expect(normalizePath(undefined)).toBeNull();
    expect(normalizePath({ path: "/" })).toBeNull();
  });
});
