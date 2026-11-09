import { describe, expect, it } from "vitest";
import type { Intent } from "../ai/query";
import { toWords } from "../text/normalise";
import { ALLERGIES, BUDGET_CEILING, BUDGET_FLOOR, DISLIKES, OWNS } from "../wizard/options";
import type { WizardPayload } from "../wizard/schema";
import { ALLERGY_KEYWORDS, DISLIKE_KEYWORDS, OWNS_KEYWORDS } from "./filterKeywords";
import { applyHardFilters, titleHasKeyword, withinBudget } from "./filters";
import type { Candidate, Product } from "./types";

const intent = { search_term: "هدیه", category_hint: "gift" } as Intent;

let nextId = 0;

const candidate = (title: string, overrides: Partial<Product> = {}): Candidate => {
    nextId += 1;
    return {
        intent,
        product: {
            id: `digikala:${nextId}`,
            partner: "digikala",
            title,
            imageUrl: null,
            price: 500_000,
            url: "https://example.com/product",
            available: true,
            ...overrides,
        },
    };
};

const payloadWith = (
    antiPrefs: Partial<WizardPayload["antiPrefs"]> = {},
    budget: Partial<WizardPayload["budget"]> = {}
): WizardPayload => ({
    target: { ageRange: "30s", gender: null, relationship: "friend", freeText: "" },
    occasion: { occasion: "birthday", vibe: [], situation: null, preference: null, freeText: "" },
    interests: { interests: ["tech"], habits: [], footballTeam: "", freeText: "" },
    antiPrefs: { dislikes: [], allergies: [], alreadyOwns: [], freeText: "", ...antiPrefs },
    budget: { min: 100_000, max: 1_000_000, preset: null, ...budget },
});

const keptTitles = (titles: string[], payload: WizardPayload) =>
    applyHardFilters(
        titles.map((title) => candidate(title)),
        payload
    ).map(({ product }) => product.title);

const keptPrices = (candidates: Candidate[], payload: WizardPayload = payloadWith()) =>
    applyHardFilters(candidates, payload).map(({ product }) => product.price);

describe("titleHasKeyword", () => {
    it("matches a whole word", () => {
        expect(titleHasKeyword(toWords("کت چرمی"), "کت")).toBe(true);
    });

    it("does not match a keyword inside a longer word", () => {
        expect(titleHasKeyword(toWords("کتاب رمان"), "کت")).toBe(false);
    });

    it.each(["عطرها", "عطرهای", "عطرهایی", "عطری", "عطرای"])("matches the allowed suffix in %s", (word) => {
        expect(titleHasKeyword([word], "عطر")).toBe(true);
    });

    it("does not match other suffixes", () => {
        expect(titleHasKeyword(["عطرساز"], "عطر")).toBe(false);
    });

    it("matches a phrase only when its words are consecutive", () => {
        expect(titleHasKeyword(toWords("ساعت هوشمند شیائومی"), "ساعت هوشمند")).toBe(true);
        expect(titleHasKeyword(toWords("ساعت مچی هوشمند"), "ساعت هوشمند")).toBe(false);
    });

    it("applies suffixes to the last word of a phrase only", () => {
        expect(titleHasKeyword(toWords("ساعت هوشمندها"), "ساعت هوشمند")).toBe(true);
        expect(titleHasKeyword(toWords("ساعتها هوشمند"), "ساعت هوشمند")).toBe(false);
    });

    it("treats half-space and space spellings of a keyword as one", () => {
        expect(titleHasKeyword(toWords("مت یوگا"), "مت‌یوگا")).toBe(true);
    });

    it("never matches an empty keyword", () => {
        expect(titleHasKeyword(toWords("کتاب"), "")).toBe(false);
    });
});

describe("withinBudget", () => {
    const product = (price: number) => candidate("کتاب", { price }).product;

    it("includes both ends of the range", () => {
        const budget = { min: 100_000, max: 1_000_000, preset: null };
        expect(withinBudget(product(100_000), budget)).toBe(true);
        expect(withinBudget(product(1_000_000), budget)).toBe(true);
        expect(withinBudget(product(99_999), budget)).toBe(false);
        expect(withinBudget(product(1_000_001), budget)).toBe(false);
    });

    it("falls back to the floor and ceiling when the budget is empty", () => {
        const budget = { min: null, max: null, preset: null };
        expect(withinBudget(product(BUDGET_FLOOR), budget)).toBe(true);
        expect(withinBudget(product(BUDGET_CEILING), budget)).toBe(true);
        expect(withinBudget(product(BUDGET_FLOOR - 1), budget)).toBe(false);
        expect(withinBudget(product(BUDGET_CEILING + 1), budget)).toBe(false);
    });
});

describe("applyHardFilters", () => {
    describe("budget", () => {
        it("keeps only products inside the range", () => {
            const candidates = [40_000, 500_000, 2_000_000].map((price, index) =>
                candidate(`محصول ${index}`, { price })
            );
            expect(keptPrices(candidates)).toEqual([500_000]);
        });

        it("keeps the exact min and max", () => {
            const candidates = [100_000, 1_000_000].map((price, index) => candidate(`محصول ${index}`, { price }));
            expect(keptPrices(candidates)).toEqual([100_000, 1_000_000]);
        });
    });

    it("drops unavailable products", () => {
        expect(applyHardFilters([candidate("کتاب", { available: false })], payloadWith())).toEqual([]);
    });

    describe("keywords", () => {
        it("noClothes drops a coat but keeps a book", () => {
            const payload = payloadWith({ dislikes: ["noClothes"] });
            expect(keptTitles(["کت چرمی مردانه", "کتاب رمان تاریخی"], payload)).toEqual(["کتاب رمان تاریخی"]);
        });

        it("noClothes keeps a laptop", () => {
            expect(keptTitles(["لپ‌تاپ ایسوس"], payloadWith({ dislikes: ["noClothes"] }))).toHaveLength(1);
        });

        it("noPerfume drops perfumes, including plurals, and keeps a book", () => {
            const payload = payloadWith({ dislikes: ["noPerfume"] });
            expect(keptTitles(["عطر مردانه", "عطرهای زنانه", "کتاب رمان"], payload)).toEqual(["کتاب رمان"]);
        });

        it("fragrance uses the same list as noPerfume", () => {
            expect(ALLERGY_KEYWORDS.fragrance).toBe(DISLIKE_KEYWORDS.noPerfume);
        });

        it("nuts drops mixed nuts", () => {
            expect(keptTitles(["آجیل مخلوط"], payloadWith({ allergies: ["nuts"] }))).toEqual([]);
        });

        it("ps5 drops controllers in Persian and English", () => {
            const payload = payloadWith({ alreadyOwns: ["ps5"] });
            expect(keptTitles(["کنترلر پلی‌استیشن ۵", "کنترلر PS5"], payload)).toEqual([]);
        });

        it("a multi-word keyword drops the phrase but keeps a partial match", () => {
            const payload = payloadWith({ alreadyOwns: ["smartwatch"] });
            expect(keptTitles(["ساعت هوشمند شیائومی", "ساعت دیواری"], payload)).toEqual(["ساعت دیواری"]);
        });

        it("drops nothing when no anti-preferences are selected", () => {
            const titles = ["کت چرمی مردانه", "عطر مردانه", "آجیل مخلوط", "کنترلر PS5"];
            expect(keptTitles(titles, payloadWith())).toEqual(titles);
        });
    });

    describe("duplicates", () => {
        it("keeps the cheaper product when ids match", () => {
            const candidates = [
                candidate("کتاب الف", { id: "digikala:1", price: 600_000 }),
                candidate("کتاب الف", { id: "digikala:1", price: 400_000 }),
            ];
            expect(keptPrices(candidates)).toEqual([400_000]);
        });

        it("keeps the cheaper product when titles match across partners", () => {
            const candidates = [
                candidate("کتاب الف", { id: "digikala:1", price: 600_000 }),
                candidate("كتاب  الف", { id: "snapshop:9", partner: "snapshop", price: 400_000 }),
            ];
            const [kept, ...rest] = applyHardFilters(candidates, payloadWith());
            expect(rest).toEqual([]);
            expect(kept.product.id).toBe("snapshop:9");
        });

        it("keeps the first seen when prices are equal", () => {
            const first = candidate("کتاب الف", { id: "digikala:1" });
            const second = candidate("کتاب الف", { id: "digikala:2" });
            expect(applyHardFilters([first, second], payloadWith())).toEqual([first]);
        });

        it("keeps the whole candidate, including its intent", () => {
            const cheaper = {
                ...candidate("کتاب الف", { id: "digikala:1", price: 400_000 }),
                intent: { search_term: "رمان", category_hint: "books" } as Intent,
            };
            const candidates = [candidate("کتاب الف", { id: "digikala:1", price: 600_000 }), cheaper];
            expect(applyHardFilters(candidates, payloadWith())).toEqual([cheaper]);
        });

        it("leaves different titles untouched", () => {
            expect(keptTitles(["کتاب الف", "کتاب ب"], payloadWith())).toEqual(["کتاب الف", "کتاب ب"]);
        });

        it("preserves first-seen order when a later duplicate is cheaper", () => {
            const candidates = [
                candidate("کتاب الف", { id: "digikala:1", price: 600_000 }),
                candidate("کتاب ب", { id: "digikala:2", price: 500_000 }),
                candidate("کتاب الف", { id: "digikala:1", price: 400_000 }),
            ];
            expect(keptPrices(candidates)).toEqual([400_000, 500_000]);
        });

        it("merges two kept products when a later one shares an id with one and a title with the other", () => {
            const candidates = [
                candidate("کتاب الف", { id: "digikala:1", price: 600_000 }),
                candidate("کتاب ب", { id: "digikala:2", price: 500_000 }),
                candidate("کتاب ب", { id: "digikala:1", price: 700_000 }),
                candidate("کتاب ج", { id: "digikala:3", price: 300_000 }),
            ];
            expect(keptPrices(candidates)).toEqual([500_000, 300_000]);
        });

        it("ignores a cheaper duplicate that is out of stock", () => {
            const candidates = [
                candidate("کتاب الف", { id: "digikala:1", price: 600_000 }),
                candidate("کتاب الف", { id: "digikala:1", price: 400_000, available: false }),
            ];
            expect(keptPrices(candidates)).toEqual([600_000]);
        });
    });
});

describe("keyword tables", () => {
    const tables = [
        { ids: DISLIKES, table: DISLIKE_KEYWORDS },
        { ids: ALLERGIES, table: ALLERGY_KEYWORDS },
        { ids: OWNS, table: OWNS_KEYWORDS },
    ];

    it("gives every id at least one usable keyword", () => {
        for (const { ids, table } of tables) {
            for (const id of ids) {
                const keywords = (table as Record<string, readonly string[]>)[id];
                expect(keywords.length, id).toBeGreaterThan(0);
                for (const keyword of keywords) expect(toWords(keyword).length, id).toBeGreaterThan(0);
            }
        }
    });
});
