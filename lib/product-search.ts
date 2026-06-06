import { Product } from '@/lib/types/database';

export interface ProductSearchHit {
  product: Product;
  score: number;
  matchType: 'prefix' | 'word' | 'substring';
}

export interface ProductSearchIndex {
  search: (query: string, limit?: number) => ProductSearchHit[];
  count: number;
}

const FIELD_WEIGHTS = {
  namePrefix: 30,
  nameWord: 18,
  nameSubstring: 12,
  skuExact: 28,
  skuPrefix: 16,
  category: 10,
  tokenExact: 14,
  tokenPrefix: 8,
  blob: 4,
} as const;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  const normalized = normalize(text);
  if (!normalized) return [];
  return normalized.split(/[\s\-_/]+/).filter((token) => token.length > 0);
}

interface SearchEntry {
  product: Product;
  nameNorm: string;
  categoryNorm: string;
  skuNorm: string;
  blobNorm: string;
  tokens: Set<string>;
}

export function createProductSearchIndex(products: Product[]): ProductSearchIndex {
  const entries: SearchEntry[] = products.map((product) => {
    const parts = [
      product.name,
      product.category,
      product.sku,
      product.description,
      ...product.colors,
      ...product.sizes,
      ...product.details,
    ].filter(Boolean);

    const tokens = new Set<string>();
    for (const part of parts) {
      for (const token of tokenize(part)) {
        tokens.add(token);
      }
    }

    return {
      product,
      nameNorm: normalize(product.name),
      categoryNorm: normalize(product.category),
      skuNorm: normalize(product.sku),
      blobNorm: normalize(parts.join(' ')),
      tokens,
    };
  });

  function search(query: string, limit = 8): ProductSearchHit[] {
    const q = normalize(query);
    if (!q) return [];

    const queryTokens = tokenize(q);
    const hits: ProductSearchHit[] = [];

    for (const entry of entries) {
      let score = 0;
      let matchType: ProductSearchHit['matchType'] = 'substring';

      if (entry.nameNorm.startsWith(q)) {
        score += FIELD_WEIGHTS.namePrefix;
        matchType = 'prefix';
      } else if (queryTokens.every((token) => entry.nameNorm.includes(token))) {
        score += FIELD_WEIGHTS.nameWord;
        matchType = 'word';
      } else if (entry.nameNorm.includes(q)) {
        score += FIELD_WEIGHTS.nameSubstring;
      }

      if (entry.skuNorm === q) {
        score += FIELD_WEIGHTS.skuExact;
        matchType = 'prefix';
      } else if (entry.skuNorm.startsWith(q)) {
        score += FIELD_WEIGHTS.skuPrefix;
        matchType = 'prefix';
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

      const { product } = entry;
      if (product.status !== 'Out of Stock') score *= 1.04;
      if (product.rating >= 4.5) score *= 1.02;
      if (product.stock > 0 && product.status === 'Low Stock') score *= 1.01;

      hits.push({ product, score, matchType });
    }

    hits.sort(
      (a, b) =>
        b.score - a.score ||
        b.product.reviews - a.product.reviews ||
        a.product.name.localeCompare(b.product.name)
    );

    return hits.slice(0, limit);
  }

  return { search, count: entries.length };
}
