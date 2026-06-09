import type { Package } from '@/lib/types/wholesale';
import { getPackageCategoryLabel } from '@/lib/package-catalog';
import { getPackageItemName } from '@/lib/package-utils';
import { normalizeSearchText, tokenizeSearchText } from '@/lib/product-search';

export interface PackageSearchHit {
  pkg: Package;
  score: number;
  matchType: 'prefix' | 'word' | 'substring';
}

export interface PackageSearchIndex {
  search: (query: string, limit?: number) => PackageSearchHit[];
  count: number;
}

const FIELD_WEIGHTS = {
  namePrefix: 30,
  nameWord: 18,
  nameSubstring: 12,
  category: 10,
  tagline: 8,
  tokenExact: 14,
  tokenPrefix: 8,
  blob: 4,
} as const;

interface SearchEntry {
  pkg: Package;
  nameNorm: string;
  categoryNorm: string;
  blobNorm: string;
  tokens: Set<string>;
}

export function createPackageSearchIndex(
  packages: Package[],
  productNames: Record<string, string> = {}
): PackageSearchIndex {
  const entries: SearchEntry[] = packages
    .filter((pkg) => pkg.isActive)
    .map((pkg) => {
      const itemNames = pkg.items.map((item) => getPackageItemName(item, productNames));
      const parts = [
        pkg.name,
        pkg.description,
        pkg.tagline,
        pkg.category ? getPackageCategoryLabel(pkg.category) : '',
        ...(pkg.highlights ?? []),
        ...itemNames,
      ].filter(Boolean);

      const tokens = new Set<string>();
      for (const part of parts) {
        for (const token of tokenizeSearchText(part)) {
          tokens.add(token);
        }
      }

      return {
        pkg,
        nameNorm: normalizeSearchText(pkg.name),
        categoryNorm: normalizeSearchText(
          pkg.category ? getPackageCategoryLabel(pkg.category) : ''
        ),
        blobNorm: normalizeSearchText(parts.join(' ')),
        tokens,
      };
    });

  function search(query: string, limit = 8): PackageSearchHit[] {
    const q = normalizeSearchText(query);
    if (!q) return [];

    const queryTokens = tokenizeSearchText(q);
    const hits: PackageSearchHit[] = [];

    for (const entry of entries) {
      let score = 0;
      let matchType: PackageSearchHit['matchType'] = 'substring';

      if (entry.nameNorm.startsWith(q)) {
        score += FIELD_WEIGHTS.namePrefix;
        matchType = 'prefix';
      } else if (queryTokens.every((token) => entry.nameNorm.includes(token))) {
        score += FIELD_WEIGHTS.nameWord;
        matchType = 'word';
      } else if (entry.nameNorm.includes(q)) {
        score += FIELD_WEIGHTS.nameSubstring;
      }

      if (entry.categoryNorm === q) {
        score += FIELD_WEIGHTS.category * 1.5;
      } else if (entry.categoryNorm.includes(q)) {
        score += FIELD_WEIGHTS.category;
      }

      for (const queryToken of queryTokens) {
        if (entry.tokens.has(queryToken)) {
          score += FIELD_WEIGHTS.tokenExact;
          matchType = matchType === 'substring' ? 'word' : matchType;
          continue;
        }

        if (queryToken.length < 2) continue;

        for (const token of entry.tokens) {
          if (token.startsWith(queryToken)) {
            score += FIELD_WEIGHTS.tokenPrefix * (queryToken.length / token.length);
            matchType = 'prefix';
          }
        }
      }

      if (score === 0 && entry.blobNorm.includes(q)) {
        score += FIELD_WEIGHTS.blob;
      }

      if (score <= 0) continue;

      if (entry.pkg.isSignature) score *= 1.05;
      if (entry.pkg.savingsPercentage >= 15) score *= 1.02;

      hits.push({ pkg: entry.pkg, score, matchType });
    }

    hits.sort(
      (a, b) =>
        b.score - a.score ||
        b.pkg.savingsPercentage - a.pkg.savingsPercentage ||
        a.pkg.name.localeCompare(b.pkg.name)
    );

    return hits.slice(0, limit);
  }

  return { search, count: entries.length };
}
