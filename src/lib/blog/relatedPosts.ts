export type RelatedCandidate = {
  id: string;
  primaryCategoryId: string | null;
  tagIds: string[];
  categoryIds: string[];
  publishedAt: Date | null;
};

export type RelatedSeed = {
  id: string;
  primaryCategoryId: string | null;
  tagIds: string[];
  categoryIds: string[];
};

const TAG_WEIGHT = 3;
const PRIMARY_CATEGORY_WEIGHT = 4;
const SECONDARY_CATEGORY_WEIGHT = 1;
const MAX_RECENCY_BOOST = 2;

/** Recency boost 0–2 based on how recent publishedAt is vs now. */
export function recencyBoost(publishedAt: Date | null, now = new Date()): number {
  if (!publishedAt) return 0;
  const ageMs = Math.max(0, now.getTime() - publishedAt.getTime());
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 30) return MAX_RECENCY_BOOST;
  if (ageDays <= 90) return 1;
  return 0;
}

export function scoreRelatedCandidate(
  seed: RelatedSeed,
  candidate: RelatedCandidate,
  now = new Date(),
): number {
  if (candidate.id === seed.id) return -Infinity;

  const seedTags = new Set(seed.tagIds);
  const sharedTags = candidate.tagIds.filter((id) => seedTags.has(id)).length;
  let score = sharedTags * TAG_WEIGHT;

  const samePrimary =
    Boolean(seed.primaryCategoryId) &&
    seed.primaryCategoryId === candidate.primaryCategoryId;
  if (samePrimary) {
    score += PRIMARY_CATEGORY_WEIGHT;
  }

  const seedCats = new Set(seed.categoryIds);
  for (const catId of candidate.categoryIds) {
    if (!seedCats.has(catId)) continue;
    // Primary match already scored; only count other shared categories as secondary.
    if (samePrimary && catId === seed.primaryCategoryId) continue;
    score += SECONDARY_CATEGORY_WEIGHT;
  }

  score += recencyBoost(candidate.publishedAt, now);
  return score;
}

/**
 * Rank candidates by relatedness score (desc), then publishedAt desc, then id.
 * Excludes the seed post. Returns up to `limit` candidates.
 */
export function pickRelatedPosts<T extends RelatedCandidate>(
  seed: RelatedSeed,
  candidates: T[],
  limit = 3,
  now = new Date(),
): T[] {
  const ranked = candidates
    .filter((c) => c.id !== seed.id)
    .map((c) => ({
      candidate: c,
      score: scoreRelatedCandidate(seed, c, now),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.candidate.publishedAt?.getTime() ?? 0;
      const bTime = b.candidate.publishedAt?.getTime() ?? 0;
      if (bTime !== aTime) return bTime - aTime;
      return a.candidate.id.localeCompare(b.candidate.id);
    });

  return ranked.slice(0, limit).map((row) => row.candidate);
}
