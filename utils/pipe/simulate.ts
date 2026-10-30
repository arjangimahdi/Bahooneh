import type { Intent } from "../ai/query";
import { BUDGET_CEILING, BUDGET_FLOOR } from "../wizard/options";
import type { WizardPayload } from "../wizard/schema";
import { PARTNER_IDS, type PartnerId, type Product, type ResultItem } from "./types";

type Budget = WizardPayload["budget"];

export interface Candidate {
    intent: Intent;
    product: Product;
}

export const SIMULATED_PARTNERS: PartnerId[] = PARTNER_IDS.filter((id) => id !== "mock");

const PRODUCTS_PER_PARTNER = 3;
const MAX_RESULTS = 6;
const PRICE_STEP = 10_000;
const PRICE_FACTORS = [-0.2, 0.15, 0.4, 0.65, 0.9, 1.25, 0.5];

const bounds = (budget: Budget) => ({
    min: budget.min ?? BUDGET_FLOOR,
    max: budget.max ?? BUDGET_CEILING,
});

const priceFor = (index: number, budget: Budget) => {
    const { min, max } = bounds(budget);
    const raw = min + (max - min) * PRICE_FACTORS[index % PRICE_FACTORS.length];
    return Math.max(PRICE_STEP, Math.round(raw / PRICE_STEP) * PRICE_STEP);
};

const productUrl = (partner: PartnerId, n: number) =>
    partner === "digikala" ? `https://www.digikala.com/product/dkp-sim-${n}/` : `https://snapp.shop/product/sim-${n}`;

export function simulateFetch(intents: readonly Intent[], budget: Budget): Candidate[] {
    const candidates: Candidate[] = [];
    let n = 0;

    for (const intent of intents) {
        for (const partner of SIMULATED_PARTNERS) {
            for (let k = 0; k < PRODUCTS_PER_PARTNER; k++) {
                n += 1;
                const id = `${partner}:sim-${n}`;
                candidates.push({
                    intent,
                    product: {
                        id,
                        partner,
                        title: `${intent.search_term} — مدل ${n}`,
                        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/400/400`,
                        price: priceFor(n, budget),
                        url: productUrl(partner, n),
                        available: n % 5 !== 0,
                        category: intent.category_hint,
                    },
                });
            }
        }
    }

    return candidates;
}

export function filterCandidates(candidates: readonly Candidate[], budget: Budget): Candidate[] {
    const { min, max } = bounds(budget);
    return candidates.filter(({ product }) => product.available && product.price >= min && product.price <= max);
}

export function assembleResults(
    candidates: readonly Candidate[],
    recipientLabel: string,
    budget: Budget
): ResultItem[] {
    const { min, max } = bounds(budget);
    const middle = (min + max) / 2;

    const groups = new Map<string, Candidate[]>();
    for (const candidate of candidates) {
        const key = candidate.intent.category_hint.toLowerCase();
        groups.set(key, [...(groups.get(key) ?? []), candidate]);
    }
    const queues = [...groups.values()].map((group) =>
        [...group].sort((a, b) => Math.abs(a.product.price - middle) - Math.abs(b.product.price - middle))
    );

    const picked: Candidate[] = [];
    const seen = new Set<string>();
    while (picked.length < MAX_RESULTS && queues.some((queue) => queue.length > 0)) {
        for (const queue of queues) {
            const next = queue.shift();
            if (!next || seen.has(next.product.id)) continue;
            seen.add(next.product.id);
            picked.push(next);
            if (picked.length === MAX_RESULTS) break;
        }
    }

    return picked.map(({ intent, product }) => ({
        product,
        affiliateUrl: `${product.url}?utm_source=byadet`,
        rationale: `برای ${recipientLabel}: ${intent.search_term}`,
    }));
}
