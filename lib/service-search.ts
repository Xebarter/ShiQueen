import type { ServiceCategory, ServiceListing, ServiceProvider } from '@/lib/types/services';
import { normalizeSearchText, tokenizeSearchText } from '@/lib/product-search';

export interface ServiceSearchHit {
  listing: ServiceListing;
  score: number;
  matchType: 'prefix' | 'word' | 'substring';
}

export interface ServiceSearchIndex {
  search: (query: string, limit?: number) => ServiceSearchHit[];
  count: number;
}

const FIELD_WEIGHTS = {
  namePrefix: 30,
  nameWord: 18,
  nameSubstring: 12,
  category: 10,
  serviceType: 10,
  provider: 12,
  tokenExact: 14,
  tokenPrefix: 8,
  blob: 4,
} as const;

interface SearchEntry {
  listing: ServiceListing;
  nameNorm: string;
  categoryNorm: string;
  serviceTypeNorm: string;
  providerNorm: string;
  blobNorm: string;
  tokens: Set<string>;
}

export function createServiceSearchIndex(
  listings: ServiceListing[],
  providers: ServiceProvider[] = [],
  categories: ServiceCategory[] = []
): ServiceSearchIndex {
  const providerById = new Map(providers.map((p) => [p.id, p]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const entries: SearchEntry[] = listings
    .filter((listing) => listing.isActive && !listing.isArchived)
    .map((listing) => {
      const provider = providerById.get(listing.providerId);
      const category = categoryById.get(listing.categoryId);
      const parts = [
        listing.name,
        listing.description,
        listing.serviceType,
        listing.location,
        ...(listing.benefits ?? []),
        category?.name,
        provider?.name,
        provider?.businessName,
      ].filter(Boolean) as string[];

      const tokens = new Set<string>();
      for (const part of parts) {
        for (const token of tokenizeSearchText(part)) {
          tokens.add(token);
        }
      }

      return {
        listing,
        nameNorm: normalizeSearchText(listing.name),
        categoryNorm: normalizeSearchText(category?.name ?? ''),
        serviceTypeNorm: normalizeSearchText(listing.serviceType),
        providerNorm: normalizeSearchText(
          [provider?.name, provider?.businessName].filter(Boolean).join(' ')
        ),
        blobNorm: normalizeSearchText(parts.join(' ')),
        tokens,
      };
    });

  function search(query: string, limit = 8): ServiceSearchHit[] {
    const q = normalizeSearchText(query);
    if (!q) return [];

    const queryTokens = tokenizeSearchText(q);
    const hits: ServiceSearchHit[] = [];

    for (const entry of entries) {
      let score = 0;
      let matchType: ServiceSearchHit['matchType'] = 'substring';

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

      if (entry.serviceTypeNorm === q) {
        score += FIELD_WEIGHTS.serviceType * 1.5;
      } else if (entry.serviceTypeNorm.includes(q)) {
        score += FIELD_WEIGHTS.serviceType;
      }

      if (entry.providerNorm.includes(q)) {
        score += FIELD_WEIGHTS.provider;
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

      const { listing } = entry;
      if (listing.isFeatured) score *= 1.05;
      if (listing.isPopular) score *= 1.03;
      if (listing.rating >= 4.5) score *= 1.02;

      hits.push({ listing, score, matchType });
    }

    hits.sort(
      (a, b) =>
        b.score - a.score ||
        b.listing.bookingCount - a.listing.bookingCount ||
        a.listing.name.localeCompare(b.listing.name)
    );

    return hits.slice(0, limit);
  }

  return { search, count: entries.length };
}
