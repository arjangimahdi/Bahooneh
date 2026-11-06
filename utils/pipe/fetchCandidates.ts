import type { Intent } from "../ai/query";
import { byId } from "../partners/shops";
import { PartnerAdapter, SearchQuery } from "../partners/types";
import { BudgetDraft } from "../wizard/types";
import { Candidate, OutcomeResults, Product, ResultItem } from "./types";

export const RESULTS_PER_QUERY = 6;
export const BUDGET_FLOOR = 50_000;
export const PARTNER_TIMEOUT_MS = 8_000;
export const BUDGET_CEILING = 30_000_000;

interface ShopResult {
    shop: PartnerAdapter;
    candidates: Candidate[];
    failedCounts: number;
}

interface FetchInput {
    partners: PartnerAdapter[];
    intents: Intent[];
    budget: BudgetDraft;
    signal: AbortSignal;
}

export function toSearchQuery(intent: Intent, budget: BudgetDraft): SearchQuery {
    return {
        term: intent.search_term,
        minPrice: budget.min ?? BUDGET_FLOOR,
        maxPrice: budget.max ?? BUDGET_CEILING,
        limit: RESULTS_PER_QUERY,
    };
}

export async function searchShop(shop: PartnerAdapter, input: FetchInput, signal: AbortSignal): Promise<ShopResult> {
    const searches = input.intents.map((intent) => {
        return shop.search(toSearchQuery(intent, input.budget), signal);
    });

    const results = await Promise.allSettled(searches);

    const candidates = results.flatMap((r, i) => {
        return r.status === "fulfilled" ? r.value.map((p: Product) => ({ product: p, intent: input.intents[i] })) : [];
    });
    const failedCounts = results.filter((r) => r.status === "rejected").length;

    return {
        shop,
        candidates,
        failedCounts,
    };
}

export async function fetchCandidates(input: FetchInput): Promise<OutcomeResults> {
    const shopSignal = AbortSignal.any([input.signal, AbortSignal.timeout(PARTNER_TIMEOUT_MS)]);

    const perShop = await Promise.all(
        input.partners.map(async (shop) => {
            return await searchShop(shop, input, shopSignal);
        })
    );

    input.signal.throwIfAborted();

    return {
        candidates: perShop.flatMap((shop) => shop.candidates),
        failedPartners: perShop
            .filter((shop) => {
                return shop.failedCounts > 0 && shop.failedCounts === input.intents.length;
            })
            .map((shop) => shop.shop.id),
    };
}

export function toResultItem(candidates: Candidate[]): ResultItem[] {
    const seen = new Set<string>();

    const results = candidates
        .filter(({ product }) => {
            if (seen.has(product.id)) return false;
            seen.add(product.id);
            return true;
        })
        .slice(0, 12)
        .map(({ product }) => {
            return {
                product,
                rationale: "",
                affiliateUrl: byId.get(product.partner)?.affiliateUrl(product) ?? product.url,
            };
        });

    return results;
}
