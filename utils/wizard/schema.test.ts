import { describe, expect, it } from "vitest";
import { BUDGET_CEILING, BUDGET_FLOOR, FREE_TEXT_MAX } from "./options";
import { antiPrefsSchema, budgetSchema, interestsSchema, occasionSchema, targetSchema } from "./schema";
import { emptyDraft } from "./store";

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
    result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? []);

describe("targetSchema", () => {
    const empty = emptyDraft.target;

    it("fails with nothing selected or written", () => {
        expect(messages(targetSchema.safeParse(empty))).toEqual(["wizard.target.error"]);
    });

    it("fails with whitespace-only free text", () => {
        expect(messages(targetSchema.safeParse({ ...empty, freeText: "   " }))).toEqual(["wizard.target.error"]);
    });

    it.each([
        ["age range", { ageRange: "30s" }],
        ["gender", { gender: "female" }],
        ["relationships", { relationships: ["friend", "colleague"] }],
        ["free text only", { freeText: "همکار قدیمی" }],
        ["a one-word note", { freeText: "دوست" }],
    ])("passes with %s", (_, patch) => {
        expect(targetSchema.safeParse({ ...empty, ...patch }).success).toBe(true);
    });

    it("rejects an unknown relationship id", () => {
        expect(targetSchema.safeParse({ ...empty, relationships: ["stranger"] }).success).toBe(false);
    });
});

describe("occasionSchema", () => {
    const empty = emptyDraft.occasion;

    it("fails with nothing selected or written", () => {
        expect(messages(occasionSchema.safeParse(empty))).toEqual(["wizard.occasion.error"]);
    });

    it("does not count a vibe alone", () => {
        expect(messages(occasionSchema.safeParse({ ...empty, vibe: ["playful"] }))).toEqual([
            "wizard.occasion.error",
        ]);
    });

    it.each([
        ["an occasion chip", { occasion: "birthday" }],
        ["free text only", { freeText: "جشن فارغ‌التحصیلی" }],
    ])("passes with %s", (_, patch) => {
        expect(occasionSchema.safeParse({ ...empty, ...patch }).success).toBe(true);
    });
});

describe("interestsSchema", () => {
    const empty = emptyDraft.interests;

    it("fails with nothing selected or written", () => {
        expect(messages(interestsSchema.safeParse(empty))).toEqual(["wizard.interests.error"]);
    });

    it("passes with a chip or free text", () => {
        expect(interestsSchema.safeParse({ ...empty, interests: ["tech"] }).success).toBe(true);
        expect(interestsSchema.safeParse({ ...empty, freeText: "قهوه" }).success).toBe(true);
    });
});

describe("antiPrefsSchema", () => {
    it("passes when empty", () => {
        expect(antiPrefsSchema.safeParse(emptyDraft.antiPrefs).success).toBe(true);
    });

    it("rejects free text over the max length", () => {
        const freeText = "a".repeat(FREE_TEXT_MAX + 1);
        expect(antiPrefsSchema.safeParse({ ...emptyDraft.antiPrefs, freeText }).success).toBe(false);
    });
});

describe("budgetSchema", () => {
    const budget = (min: number | null, max: number | null) => ({ min, max, preset: null });

    it.each([
        ["null values", budget(null, null), "wizard.budget.errorRequired"],
        ["a missing max", budget(1_000_000, null), "wizard.budget.errorRequired"],
        ["min below the floor", budget(BUDGET_FLOOR - 1, 1_000_000), "wizard.budget.errorFloor"],
        ["max above the ceiling", budget(1_000_000, BUDGET_CEILING + 1), "wizard.budget.errorCeiling"],
        ["max below min", budget(2_000_000, 1_000_000), "wizard.budget.errorOrder"],
    ])("reports %s", (_, value, message) => {
        expect(messages(budgetSchema.safeParse(value))).toEqual([message]);
    });

    it("passes a valid range, including the bounds", () => {
        expect(budgetSchema.safeParse(budget(1_000_000, 3_000_000)).success).toBe(true);
        expect(budgetSchema.safeParse(budget(BUDGET_FLOOR, BUDGET_CEILING)).success).toBe(true);
    });
});
