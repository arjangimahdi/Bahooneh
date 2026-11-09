import { PartnerId, Product } from "@/utils/pipe/types";
import { normaliseText } from "@/utils/text/normalise";
import { PartnerAdapter, SearchQuery } from "../types";

const DEFAULT_MAX_ENTRIES = 30;
const DEFAULT_TTL_MS = 30 * 60 * 1_000; // 30 minutes

interface CacheEntry {
    expiresAt: number;
    products: Product[];
}

interface CacheOptions {
    ttlMs?: number;
    maxEntries?: number;
}

const buildCacheKey = (q: SearchQuery, partner: PartnerId): string => {
    return `${partner}|${normaliseText(q.term)}|${q.minPrice}|${q.maxPrice}|${q.limit}`;
};

export function withCache(adapter: PartnerAdapter, options: CacheOptions): PartnerAdapter {
    const cache = new Map<string, CacheEntry>();

    return {
        ...adapter,
        async search(query: SearchQuery, signal: AbortSignal) {
            const key = buildCacheKey(query, adapter.id);

            const entry = cache.get(key);
            if (entry) {
                if (entry.expiresAt > Date.now()) {
                    return [...entry.products];
                } else {
                    cache.delete(key);
                }
            }

            const products = await adapter.search(query, signal);

            if (cache.size > (options.maxEntries ?? DEFAULT_MAX_ENTRIES)) {
                cache.delete(cache.keys().next().value as string);
            }

            cache.set(key, { products: [...products], expiresAt: Date.now() + (options.ttlMs ?? DEFAULT_TTL_MS) });

            return products;
        },
    };
}
