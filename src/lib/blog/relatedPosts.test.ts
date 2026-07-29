import { describe, expect, it } from "vitest";
import {
  pickRelatedPosts,
  recencyBoost,
  scoreRelatedCandidate,
  type RelatedCandidate,
  type RelatedSeed,
} from "./relatedPosts";

const now = new Date("2026-07-27T12:00:00Z");

function candidate(partial: Partial<RelatedCandidate> & { id: string }): RelatedCandidate {
  return {
    primaryCategoryId: null,
    tagIds: [],
    categoryIds: [],
    publishedAt: new Date("2026-06-01T00:00:00Z"),
    ...partial,
  };
}

describe("recencyBoost", () => {
  it("gives max boost to posts within 30 days", () => {
    expect(recencyBoost(new Date("2026-07-20T00:00:00Z"), now)).toBe(2);
  });

  it("gives mid boost within 90 days", () => {
    expect(recencyBoost(new Date("2026-05-15T00:00:00Z"), now)).toBe(1);
  });

  it("gives zero for older posts", () => {
    expect(recencyBoost(new Date("2025-01-01T00:00:00Z"), now)).toBe(0);
  });
});

describe("scoreRelatedCandidate", () => {
  const seed: RelatedSeed = {
    id: "seed",
    primaryCategoryId: "cat-a",
    tagIds: ["t1", "t2"],
    categoryIds: ["cat-a", "cat-b"],
  };

  it("scores shared tags and same primary category", () => {
    const c = candidate({
      id: "c1",
      primaryCategoryId: "cat-a",
      tagIds: ["t1", "t2"],
      categoryIds: ["cat-a"],
      publishedAt: new Date("2026-07-20T00:00:00Z"),
    });
    // 2 tags * 3 + primary 4 + recency 2 = 12 (primary cat not double-counted as secondary)
    expect(scoreRelatedCandidate(seed, c, now)).toBe(12);
  });

  it("adds secondary category weight for non-primary overlaps", () => {
    const c = candidate({
      id: "c2",
      primaryCategoryId: "cat-z",
      tagIds: [],
      categoryIds: ["cat-b"],
      publishedAt: new Date("2025-01-01T00:00:00Z"),
    });
    expect(scoreRelatedCandidate(seed, c, now)).toBe(1);
  });

  it("excludes self via -Infinity", () => {
    expect(scoreRelatedCandidate(seed, candidate({ id: "seed" }), now)).toBe(-Infinity);
  });
});

describe("pickRelatedPosts", () => {
  const seed: RelatedSeed = {
    id: "seed",
    primaryCategoryId: "cat-a",
    tagIds: ["t1"],
    categoryIds: ["cat-a"],
  };

  it("ranks shared-tag posts above recent fillers", () => {
    const tagged = candidate({
      id: "tagged",
      tagIds: ["t1"],
      publishedAt: new Date("2026-01-01T00:00:00Z"),
    });
    const recent = candidate({
      id: "recent",
      publishedAt: new Date("2026-07-25T00:00:00Z"),
    });
    const picked = pickRelatedPosts(seed, [recent, tagged], 2, now);
    expect(picked.map((p) => p.id)).toEqual(["tagged", "recent"]);
  });

  it("excludes the seed post", () => {
    const self = candidate({ id: "seed", tagIds: ["t1"] });
    const other = candidate({ id: "other", tagIds: ["t1"] });
    const picked = pickRelatedPosts(seed, [self, other], 3, now);
    expect(picked.map((p) => p.id)).toEqual(["other"]);
  });

  it("respects limit", () => {
    const pool = [
      candidate({ id: "a", tagIds: ["t1"] }),
      candidate({ id: "b", tagIds: ["t1"] }),
      candidate({ id: "c", tagIds: ["t1"] }),
      candidate({ id: "d", tagIds: ["t1"] }),
    ];
    expect(pickRelatedPosts(seed, pool, 3, now)).toHaveLength(3);
  });
});
