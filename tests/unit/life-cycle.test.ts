import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CASTES, LIFE_STAGES, SOURCES } from "@/lib/life-cycle";

describe("life cycle content", () => {
  it("tells the four stages in order", () => {
    expect(LIFE_STAGES.map((s) => s.id)).toEqual(["egg", "larva", "pupa", "adult"]);
  });

  it("has every text in English and Arabic", () => {
    for (const s of LIFE_STAGES) {
      for (const text of [s.title, s.days, s.duration, s.fact, s.photo.alt, s.photo.caption, ...s.paragraphs]) {
        expect(text.en.trim()).not.toBe("");
        expect(text.ar.trim()).not.toBe("");
      }
    }
  });

  it("credits every photo: file present, author, licence and Commons page", () => {
    for (const { photo } of LIFE_STAGES) {
      expect(existsSync(`public${photo.src}`)).toBe(true);
      expect(photo.author).not.toBe("");
      expect(photo.license).toMatch(/^CC /);
      expect(photo.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\/licenses\//);
      expect(photo.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:[^ ]+$/);
    }
    expect(new Set(LIFE_STAGES.map((s) => s.photo.src)).size).toBe(LIFE_STAGES.length);
  });

  it("gives the usual development times: queen 16, worker 21, drone 24 days", () => {
    expect(CASTES.map((c) => [c.name.en, c.days])).toEqual([["Queen", 16], ["Worker", 21], ["Drone", 24]]);
    // Each caste's stages add up to its total (½ written as ½).
    for (const c of CASTES) {
      const parts = c.split.en.match(/\d+½?/g)!.map((p) => parseInt(p) + (p.endsWith("½") ? 0.5 : 0));
      expect(parts.reduce((a, b) => a + b, 0)).toBe(c.days);
    }
  });

  it("lists its sources as https links", () => {
    expect(SOURCES.length).toBeGreaterThanOrEqual(2);
    for (const s of SOURCES) expect(s.url).toMatch(/^https:\/\//);
  });
});
