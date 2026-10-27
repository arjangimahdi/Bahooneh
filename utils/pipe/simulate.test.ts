import { describe, expect, it } from "vitest";
import type { Intent } from "../ai/query";
import { productSchema, resultItemSchema } from "./schema";
import { assembleResults, filterCandidates, SIMULATED_PARTNERS, simulateFetch, type Candidate } from "./simulate";

const budget = { min: 1_000_000, max: 3_000_000, preset: null };

const intents: Intent[] = [
    { search_term: "هدفون بی‌سیم", category_hint: "audio" },
    { search_term: "ست قهوه دمی", category_hint: "coffee" },
    { search_term: "کوله کوهنوردی", category_hint: "outdoor" },
    { search_term: "کتاب رمان تاریخی", category_hint: "books" },
];

const candidates = simulateFetch(intents, budget);

const withProduct = (overrides: Partial<Candidate["product"]>): Candidate => ({
    intent: intents[0],
    product: { ...candidates[0].product, ...overrides },
});

describe("simulateFetch", () => {
    it("returns 3 products per intent per partner", () => {
        expect(candidates).toHaveLength(intents.length * SIMULATED_PARTNERS.length * 3);
    });

    it("produces products that pass the product schema", () => {
        for (const { product } of candidates) expect(productSchema.safeParse(product).success).toBe(true);
    });

    it("gives every product a unique id", () => {
        expect(new Set(candidates.map(({ product }) => product.id)).size).toBe(candidates.length);
    });

    it("leaves work for the filter: some prices out of budget and some unavailable", () => {
        expect(candidates.some(({ product }) => product.price < budget.min)).toBe(true);
        expect(candidates.some(({ product }) => product.price > budget.max)).toBe(true);
        expect(candidates.some(({ product }) => !product.available)).toBe(true);
    });

    it("is deterministic", () => {
        expect(simulateFetch(intents, budget)).toEqual(candidates);
    });
});

describe("filterCandidates", () => {
    it("keeps only available products within the budget", () => {
        const kept = filterCandidates(candidates, budget);
        expect(kept.length).toBeGreaterThan(0);
        for (const { product } of kept) {
            expect(product.available).toBe(true);
            expect(product.price).toBeGreaterThanOrEqual(budget.min);
            expect(product.price).toBeLessThanOrEqual(budget.max);
        }
    });

    it("keeps prices exactly on the budget bounds", () => {
        const edges = [withProduct({ price: budget.min }), withProduct({ id: "digikala:edge", price: budget.max })];
        expect(filterCandidates(edges, budget)).toHaveLength(2);
    });

    it("drops unavailable products even inside the budget", () => {
        expect(filterCandidates([withProduct({ price: 2_000_000, available: false })], budget)).toEqual([]);
    });
});

describe("assembleResults", () => {
    const items = assembleResults(filterCandidates(candidates, budget), "دوستت", budget);

    it("returns at most 6 items with unique ids", () => {
        expect(items.length).toBeLessThanOrEqual(6);
        expect(new Set(items.map(({ product }) => product.id)).size).toBe(items.length);
    });

    it("covers different categories before repeating one", () => {
        const firstRound = items.slice(0, intents.length).map(({ product }) => product.category);
        expect(new Set(firstRound).size).toBe(intents.length);
    });

    it("produces items that pass the result item schema", () => {
        for (const item of items) expect(resultItemSchema.safeParse(item).success).toBe(true);
    });

    it("returns an empty list when nothing survived filtering", () => {
        expect(assembleResults([], "دوستت", budget)).toEqual([]);
    });
});
